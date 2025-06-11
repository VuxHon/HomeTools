// BigQuery Client for Direct Frontend Connection
class BigQueryClient {
    constructor() {
        console.log('🔧 [BigQueryClient] Constructor called');
        this.projectId = 'tools-451916';
        this.datasetId = 'part_time_schedule';
        this.accessToken = null;
        this.tokenExpiry = null;
        
        console.log('🔧 [BigQueryClient] Configuration:', {
            projectId: this.projectId,
            datasetId: this.datasetId
        });
        
        // Service account info from the provided key
        this.serviceAccount = {
            type: "service_account",
            project_id: "tools-451916",
            private_key_id: "8679a1ca81e0eaaf73aba58c052adce3df72d0a1",
            private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDE4SWDXYYmFfaa\nVi0gzLbsOgZw8e6WFXabhgAzvnHu1wl2QE+QyAVNs4pyYCGf0WY97hM+qVM8Q+85\nD0VZ2rO1kOKe23n94fqia5Dddiv5MHimPv5sXM5GttgUKDkSPo46St917B2DLHg2\n0mdDodmWNYJDwt63uF38cjkkh945EdTMpnMefZlFNk5lh3PQF8lWMmqc76AZYWn9\nWY4Y/xwmgeczN5uNK9PYo3cnsrXniVwIHCvUn+KIG90ZISBjIdzC/l0QlOdV/GUd\nMuuVoeRO/p1+AeSBiD6SC/NFSo82gPazl0Q7jAguWN64jnzooXL1uVsqIW0ZGofn\nDs0KxijBAgMBAAECggEAW/BaEM0BYtK53Nvmah0/RPRZ4q+P/6VZRIpgmMlUMjlY\nMVEZ9t35YA46Vmwe95+VU9FUSlxPQuLkmWxQsgPIDT9yHMYYY19+qA98UHcpVM52\nYQgkztzN9UbYhB0+fY8Z4w3o6YwQQhvnrY426+Xuks89HECpufjOZx++IJmURGiF\nv0dsjv8cCidFPZJDniAHqtRvSXPQCB25lWdqqhRc3V1r2C2AhQXlzsQ4kruHJnY9\nnueKd7MX98s2qX67tJEeHhLzacEo3ncEwPplpusl+UmwCFOAznC6eRkf7T1J5iDK\nDBjsASBpv65aRQ9/doYWboKbWgq5UV7MtU6+wRjW2wKBgQDuParY+m/ssFUCQ9d9\nm+RX6yV27wCRtIUU2wR32Oaonxm6sYd4sYRKlhAeMRK5oQaS0ByDY+q0iGlb6NFb\nRaiPOzTyMgeM7YsTs5eCPqTb5BB1Rg00uVlnatjhfQAofG6IyyJUw9NQqCHZ91K2\n7lXZj5vBRNAbTGocv5Ks5gTiAwKBgQDTji67s3U1fW1DEuggH/x4rySsZUwhnNgR\nq8p08JNScb5yTB334jz7mM7ReriDEM0wqAw6JPfiHDpg3HwcKjgUwt7wrdbYWNwo\n2Pho+SmNGKLfEpcLxRvOnknAF9I5KQ78WlXPKIUx7wh9aL+itiwOVWPSCwrNKI3r\n6qgT6mOQ6wKBgQCzJ3aJslJmd/eFO4UZ9RgSsUa8GGCiMVD+bPEAOwDBfts3VHce\nYMet2wkF2ztMknXCA3Pdrk56MjagogSFkW1/QDPBibO524wBZcUicX9ByFBEEEiw\nBE3iAixT7M8oouHwRmlrutL2zWifY2g1Hic68s5a2Sdxz9XgBoQDNvonBwKBgQCo\nKTbgoM+kSyUU0eyNzJ8lVyLxnjub5E6kDUgLGEgimqNluzd/GOicnWSYgtIz7KEN\n8iZ1+XjI1ONapyhIQw79AcGw0p4arteh6IXc+2GZ9GFSrDZAdteZr5y0ArtqEEcH\nNM9MscreXEEFXsQllGUEp7+G8JwPZBMb2hTsb73hLQKBgQCzi/OloB2DzDMf6AmZ\nMK79TcI/gyGEQG0R7nO2yLyS4A7cHmJjYrQMHDLLjZtnzafnDGdL3xRZqDKYkRpx\nVWGoxSsv8Qsozmsfw2a13jbjzqGPXT9q1vyrY18qk6ZwvlBO9aT/A4QPcXt0ztys\n+TxAxtvfYKQKAhyDlEHEvLhW1A==\n-----END PRIVATE KEY-----\n",
            client_email: "vuxhon@tools-451916.iam.gserviceaccount.com",
            client_id: "109367842521130712926",
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
            client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/vuxhon%40tools-451916.iam.gserviceaccount.com",
            universe_domain: "googleapis.com"
        };
    }

    // Get access token using service account JWT
    async getAccessToken() {
        try {
            // Check if token is still valid
            if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
                console.log('🔑 [BigQueryClient] Using cached access token');
                return this.accessToken;
            }

            console.log('🔑 [BigQueryClient] Requesting new access token...');
            
            // Show authentication loading if first time
            if (!this.accessToken) {
                this.showAuthLoading();
            }
            
            // Create JWT for service account
            const jwt = await this.createJWT();
            
            // Exchange JWT for access token
            const response = await this.fetchWithRetry('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                    'assertion': jwt
                })
            });

            if (!response.ok) {
                throw new Error(`Token request failed: ${response.status}`);
            }

            const tokenData = await response.json();
            this.accessToken = tokenData.access_token;
            this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000) - 60000; // 1 minute buffer
            
            console.log('✅ [BigQueryClient] Access token obtained successfully');
            this.hideAuthLoading();
            return this.accessToken;
        } catch (error) {
            console.error('❌ [BigQueryClient] Failed to get access token:', error);
            this.hideAuthLoading();
            throw error;
        }
    }

    showAuthLoading() {
        // Add loading indicator to page
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'authLoading';
        loadingDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(76, 99, 210, 0.9);
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            font-size: 0.9rem;
            z-index: 1000;
        `;
        loadingDiv.innerHTML = '<div class="inline-loading"></div> Đang xác thực...';
        document.body.appendChild(loadingDiv);
    }

    hideAuthLoading() {
        const loadingDiv = document.getElementById('authLoading');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }

    // Create JWT token for service account authentication
    async createJWT() {
        const header = {
            alg: 'RS256',
            typ: 'JWT'
        };

        const now = Math.floor(Date.now() / 1000);
        const payload = {
            iss: this.serviceAccount.client_email,
            scope: 'https://www.googleapis.com/auth/bigquery https://www.googleapis.com/auth/cloud-platform',
            aud: this.serviceAccount.token_uri,
            exp: now + 3600, // 1 hour
            iat: now
        };

        const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
        const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
        const unsignedToken = `${encodedHeader}.${encodedPayload}`;
        
        // Sign the token with the private key
        const signature = await this.signJWT(unsignedToken, this.serviceAccount.private_key);
        return `${unsignedToken}.${signature}`;
    }

    // Base64 URL encode
    base64UrlEncode(str) {
        return btoa(str)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    // Sign JWT with private key (simplified version)
    async signJWT(data, privateKey) {
        try {
            // Import the private key
            const key = await window.crypto.subtle.importKey(
                'pkcs8',
                this.pemToArrayBuffer(privateKey),
                {
                    name: 'RSASSA-PKCS1-v1_5',
                    hash: 'SHA-256'
                },
                false,
                ['sign']
            );

            // Sign the data
            const signature = await window.crypto.subtle.sign(
                'RSASSA-PKCS1-v1_5',
                key,
                new TextEncoder().encode(data)
            );

            return this.base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
        } catch (error) {
            console.error('❌ [BigQueryClient] JWT signing failed:', error);
            throw error;
        }
    }

    // Convert PEM to ArrayBuffer
    pemToArrayBuffer(pem) {
        const b64Lines = pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
        const b64Prefix = b64Lines;
        const binaryString = atob(b64Prefix);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    // Fetch with retry mechanism
    async fetchWithRetry(url, options, maxRetries = 3) {
        let lastError;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                console.log(`🔄 [FetchRetry] Attempt ${i + 1}/${maxRetries} for ${url}`);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
                
                const response = await fetch(url, {
                    ...options,
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    console.log(`✅ [FetchRetry] Success on attempt ${i + 1}`);
                    
                    // Report network status
                    if (window.scheduleManager && i > 0) {
                        window.scheduleManager.updateNetworkStatus('online', 'Kết nối ổn định');
                    }
                    
                    return response;
                }
                
                // If it's a server error (5xx), retry
                if (response.status >= 500) {
                    throw new Error(`Server error: ${response.status}`);
                }
                
                // For client errors (4xx), don't retry
                return response;
                
            } catch (error) {
                lastError = error;
                console.warn(`⚠️ [FetchRetry] Attempt ${i + 1} failed:`, error.message);
                
                // Don't retry on abort (timeout)
                if (error.name === 'AbortError') {
                    console.error('❌ [FetchRetry] Request timed out after 30 seconds');
                    throw new Error('Request timed out. Please check your internet connection.');
                }
                
                // Wait before retry (exponential backoff)
                if (i < maxRetries - 1) {
                    const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
                    console.log(`⏳ [FetchRetry] Retrying in ${delay}ms...`);
                    
                    // Report slow network
                    if (window.scheduleManager) {
                        window.scheduleManager.updateNetworkStatus('slow', `Mạng chậm - Thử lại ${i + 2}/${maxRetries}`);
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        console.error(`❌ [FetchRetry] All ${maxRetries} attempts failed`);
        
        // Report network failure
        if (window.scheduleManager) {
            window.scheduleManager.updateNetworkStatus('offline', 'Mất kết nối');
        }
        
        throw new Error(`Network request failed after ${maxRetries} attempts: ${lastError.message}`);
    }

    // Execute BigQuery query
    async query(sql, params = {}) {
        try {
            console.log('🔍 [BigQuery] Executing query:', sql);
            console.log('📊 [BigQuery] Parameters:', params);
            
            // Get access token
            const accessToken = await this.getAccessToken();
            
            // Replace parameters in SQL query
            let processedSql = sql;
            for (const [key, value] of Object.entries(params)) {
                const paramName = `@${key}`;
                const paramValue = typeof value === 'string' ? `'${value}'` : value;
                processedSql = processedSql.replace(new RegExp(paramName, 'g'), paramValue);
            }
            
            console.log('🔍 [BigQuery] Processed SQL:', processedSql);
            
            // Prepare request body
            const requestBody = {
                query: processedSql,
                useLegacySql: false,
                location: 'US'
            };
            
            // Make request to BigQuery API with retry
            const response = await this.fetchWithRetry(`https://bigquery.googleapis.com/bigquery/v2/projects/${this.projectId}/queries`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`BigQuery API error: ${response.status} - ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            console.log('✅ [BigQuery] Raw response:', data);
            
            if (data.rows && data.schema) {
                // Process SELECT query results
                const schema = data.schema.fields;
                const rows = data.rows.map(row => {
                    const processedRow = {};
                    schema.forEach((field, index) => {
                        processedRow[field.name] = row.f[index].v;
                    });
                    return processedRow;
                });
                
                console.log('✅ [BigQuery] Processed rows:', rows);
                console.log('📏 [BigQuery] Result length:', rows.length);
                return rows;
            }
            
            // For INSERT/UPDATE/DELETE operations
            if (data.numDmlAffectedRows !== undefined) {
                console.log('✅ [BigQuery] DML operation completed, affected rows:', data.numDmlAffectedRows);
                return { success: true, affectedRows: parseInt(data.numDmlAffectedRows) };
            }
            
            console.log('✅ [BigQuery] Query completed with empty result');
            return [];
            
        } catch (error) {
            console.error('❌ [BigQuery] Query execution failed:', error);
            throw new Error(`BigQuery query failed: ${error.message}`);
        }
    }

    // Schedule service methods
    async getWeekSchedule(startDate, endDate) {
        const query = `
            SELECT 
                s.id,
                s.staff_id,
                s.work_date,
                s.shift,
                st.name as staff_name,
                st.status as staff_status
            FROM \`${this.projectId}.${this.datasetId}.schedule\` s
            LEFT JOIN \`${this.projectId}.${this.datasetId}.staff\` st ON s.staff_id = st.id
            WHERE s.work_date BETWEEN @startDate AND @endDate
            ORDER BY s.work_date, s.shift
        `;
        
        return await this.query(query, { startDate, endDate });
    }

    async getActiveStaff() {
        const query = `
            SELECT id, name, status
            FROM \`${this.projectId}.${this.datasetId}.staff\`
            ORDER BY name
        `;
        
        return await this.query(query);
    }

    async addSchedule(staffId, workDate, shift) {
        const scheduleId = this.generateUUID();
        console.log('🆕 [BigQuery] Adding schedule with UUID:', scheduleId);
        
        const query = `
            INSERT INTO \`${this.projectId}.${this.datasetId}.schedule\` (id, staff_id, work_date, shift)
            VALUES (@id, @staffId, @workDate, @shift)
        `;
        
        await this.query(query, {
            id: scheduleId,
            staffId: staffId,
            workDate: workDate,
            shift: shift
        });
        
        return scheduleId;
    }

    // Batch operations - More efficient for multiple records
    async batchAddSchedules(schedules) {
        if (!schedules || schedules.length === 0) return;
        
        console.log('🚀 [BigQuery] Batch adding schedules:', schedules.length);
        
        // Generate UUIDs for all schedules
        const schedulesWithIds = schedules.map(schedule => ({
            id: this.generateUUID(),
            staff_id: schedule.staff_id,
            work_date: schedule.work_date,
            shift: schedule.shift
        }));
        
        // Build VALUES clause for batch insert
        const values = schedulesWithIds.map(s => 
            `('${s.id}', '${s.staff_id}', '${s.work_date}', '${s.shift}')`
        ).join(',\n  ');
        
        const query = `
            INSERT INTO \`${this.projectId}.${this.datasetId}.schedule\` (id, staff_id, work_date, shift)
            VALUES ${values}
        `;
        
        await this.query(query);
        return schedulesWithIds.map(s => s.id);
    }

    async batchDeleteSchedules(scheduleIds) {
        if (!scheduleIds || scheduleIds.length === 0) return;
        
        console.log('🗑️ [BigQuery] Batch deleting schedules:', scheduleIds.length);
        
        // Build IN clause for batch delete
        const idList = scheduleIds.map(id => `'${id}'`).join(', ');
        
        const query = `
            DELETE FROM \`${this.projectId}.${this.datasetId}.schedule\`
            WHERE id IN (${idList})
        `;
        
        return await this.query(query);
    }

    async updateSchedule(scheduleId, staffId, workDate, shift) {
        const query = `
            UPDATE \`${this.projectId}.${this.datasetId}.schedule\`
            SET staff_id = @staffId, work_date = @workDate, shift = @shift
            WHERE id = @id
        `;
        
        return await this.query(query, {
            id: scheduleId,
            staffId: staffId,
            workDate: workDate,
            shift: shift
        });
    }

    async deleteSchedule(scheduleId) {
        const query = `
            DELETE FROM \`${this.projectId}.${this.datasetId}.schedule\`
            WHERE id = @id
        `;
        
        return await this.query(query, { id: scheduleId });
    }

    async updateStaffStatus(staffId, status) {
        const query = `
            UPDATE \`${this.projectId}.${this.datasetId}.staff\`
            SET status = @status
            WHERE id = @id
        `;
        
        return await this.query(query, { id: staffId, status: status });
    }

    async updateStaff(staffId, name, status) {
        const query = `
            UPDATE \`${this.projectId}.${this.datasetId}.staff\`
            SET name = @name, status = @status
            WHERE id = @id
        `;
        
        return await this.query(query, { 
            id: staffId, 
            name: name, 
            status: status 
        });
    }

    async addStaff(name, status = 'Đang làm') {
        const staffId = this.generateUUID();
        console.log('🆕 [BigQuery] Adding staff with UUID:', staffId);
        
        const query = `
            INSERT INTO \`${this.projectId}.${this.datasetId}.staff\` (id, name, status)
            VALUES (@id, @name, @status)
        `;
        
        await this.query(query, {
            id: staffId,
            name: name,
            status: status
        });
        
        return staffId;
    }

    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}

// Create global instance
console.log('🔧 [BigQueryClient] Creating BigQuery client instance...');
try {
    window.bigqueryClient = new BigQueryClient();
    console.log('✅ [BigQueryClient] BigQuery client created successfully:', window.bigqueryClient);
} catch (error) {
    console.error('❌ [BigQueryClient] Failed to create BigQuery client:', error);
} 