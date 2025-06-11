class GeminiAI {
    constructor() {
        this.apiKey = 'AIzaSyChS0XC5cLAf1wMk5EMZGqMq9bTvkJA8Sw';
        this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    }

    async parseScheduleMessage(chatMessages, staffList, weekStartDate) {
        try {
            console.log('🤖 [GeminiAI] Starting to parse schedule messages...');
            console.log('📝 [GeminiAI] Chat messages:', chatMessages);
            console.log('👥 [GeminiAI] Staff list:', staffList);
            console.log('📅 [GeminiAI] Week start:', weekStartDate);

            const prompt = this.buildPrompt(chatMessages, staffList, weekStartDate);
            console.log('📋 [GeminiAI] Generated prompt:', prompt);

            const response = await this.callGeminiAPI(prompt);
            const scheduleData = this.parseGeminiResponse(response);
            
            console.log('✅ [GeminiAI] Parsed schedule data:', scheduleData);
            return scheduleData;

        } catch (error) {
            console.error('❌ [GeminiAI] Error parsing schedule:', error);
            throw error;
        }
    }

    buildPrompt(chatMessages, staffList, weekStartDate) {
        const staffListText = staffList.map(staff => `ID: ${staff.id}, Tên: ${staff.name}`).join('\n');
        
        const weekDays = [
            { day: 'T2', date: this.addDays(weekStartDate, 0) },
            { day: 'T3', date: this.addDays(weekStartDate, 1) },
            { day: 'T4', date: this.addDays(weekStartDate, 2) },
            { day: 'T5', date: this.addDays(weekStartDate, 3) },
            { day: 'T6', date: this.addDays(weekStartDate, 4) },
            { day: 'T7', date: this.addDays(weekStartDate, 5) },
            { day: 'CN', date: this.addDays(weekStartDate, 6) }
        ];

        const weekDaysText = weekDays.map(w => `${w.day}: ${w.date}`).join('\n');

        return `Bạn là một AI chuyên phân tích tin nhắn lịch làm việc.

DANH SÁCH NHÂN VIÊN:
${staffListText}

TUẦN LÀM VIỆC (${weekStartDate}):
${weekDaysText}

TIN NHẮN LỊCH LÀM VIỆC:
${chatMessages}

YÊU CẦU:
1. Phân tích tin nhắn để tìm ra lịch làm việc của từng nhân viên
2. Mapping tên trong tin nhắn với danh sách nhân viên (có thể có sai lệch chính tả)
3. Chuyển đổi ký hiệu ngày (T2=Thứ 2, T3=Thứ 3, ..., CN=Chủ nhật)
4. Chuyển đổi ca làm việc:
   - "ca sáng" hoặc "sáng" → "Sáng"
   - "ca chiều" hoặc "chiều" → "Chiều"  
   - "ca tối" hoặc "tối" → "Tối"

OUTPUT JSON (chỉ trả về JSON, không có text khác):
{
  "schedules": [
    {
      "staff_id": "id_nhân_viên",
      "staff_name": "tên_nhân_viên", 
      "work_date": "YYYY-MM-DD",
      "shift": "Sáng|Chiều|Tối"
    }
  ],
  "summary": "Tóm tắt ngắn gọn những gì đã phân tích"
}

Ví dụ output:
{
  "schedules": [
    {
      "staff_id": "abc123",
      "staff_name": "Trâm Kha",
      "work_date": "2025-06-09", 
      "shift": "Chiều"
    }
  ],
  "summary": "Đã phân tích được lịch làm của 2 nhân viên trong tuần"
}`;
    }

    async callGeminiAPI(prompt) {
        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.1,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 8192,
            }
        };

        const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            let errorMessage = `Gemini API error: ${response.status}`;
            try {
                const errorData = await response.json();
                console.error('❌ [GeminiAI] API Error Details:', errorData);
                
                if (errorData.error && errorData.error.message) {
                    errorMessage += ` - ${errorData.error.message}`;
                }
                
                // Specific error handling
                if (response.status === 400 && errorData.error.message.includes('not found')) {
                    errorMessage = 'Model Gemini không khả dụng. Vui lòng thử lại sau.';
                } else if (response.status === 403) {
                    errorMessage = 'API key không hợp lệ hoặc đã hết quota.';
                } else if (response.status === 429) {
                    errorMessage = 'Đã vượt quá giới hạn API. Vui lòng thử lại sau.';
                }
            } catch (parseError) {
                console.error('❌ [GeminiAI] Error parsing error response:', parseError);
            }
            
            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('🤖 [GeminiAI] Raw API response:', data);
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('Invalid response from Gemini API');
        }

        return data.candidates[0].content.parts[0].text;
    }

    parseGeminiResponse(responseText) {
        try {
            // Remove any markdown formatting if present
            let cleanText = responseText.trim();
            if (cleanText.startsWith('```json')) {
                cleanText = cleanText.replace(/```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleanText.startsWith('```')) {
                cleanText = cleanText.replace(/```\s*/, '').replace(/\s*```$/, '');
            }

            const parsedData = JSON.parse(cleanText);
            
            // Validate the structure
            if (!parsedData.schedules || !Array.isArray(parsedData.schedules)) {
                throw new Error('Invalid response structure: missing schedules array');
            }

            // Validate each schedule item
            parsedData.schedules.forEach((schedule, index) => {
                if (!schedule.staff_id || !schedule.work_date || !schedule.shift) {
                    throw new Error(`Invalid schedule item at index ${index}: missing required fields`);
                }
                
                // Validate date format
                if (!/^\d{4}-\d{2}-\d{2}$/.test(schedule.work_date)) {
                    throw new Error(`Invalid date format at index ${index}: ${schedule.work_date}`);
                }
                
                // Validate shift
                if (!['Sáng', 'Chiều', 'Tối'].includes(schedule.shift)) {
                    throw new Error(`Invalid shift at index ${index}: ${schedule.shift}`);
                }
            });

            return parsedData;

        } catch (error) {
            console.error('❌ [GeminiAI] Error parsing response:', error);
            console.error('❌ [GeminiAI] Raw response:', responseText);
            throw new Error(`Failed to parse Gemini response: ${error.message}`);
        }
    }

    addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result.toISOString().split('T')[0]; // YYYY-MM-DD format
    }

    getMonday(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        return new Date(d.setDate(diff));
    }

    // Debug functions
    async testAPI() {
        try {
            console.log('🧪 [GeminiAI] Testing API connection...');
            
            const testPrompt = 'Trả lời ngắn gọn: Bạn có hoạt động không?';
            const response = await this.callGeminiAPI(testPrompt);
            
            console.log('✅ [GeminiAI] API test successful:', response);
            return { success: true, response };
        } catch (error) {
            console.error('❌ [GeminiAI] API test failed:', error);
            return { success: false, error: error.message };
        }
    }

    async listModels() {
        try {
            console.log('📋 [GeminiAI] Listing available models...');
            
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`);
            
            if (!response.ok) {
                throw new Error(`Failed to list models: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('📋 [GeminiAI] Available models:', data.models);
            
            return data.models;
        } catch (error) {
            console.error('❌ [GeminiAI] Error listing models:', error);
            throw error;
        }
    }
}

// Create global instance
try {
    window.geminiAI = new GeminiAI();
} catch (error) {
    console.error('❌ [GeminiAI] Failed to create Gemini AI:', error);
} 