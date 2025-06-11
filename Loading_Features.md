# Hệ Thống Loading Indicators

Đã thêm các biểu tượng loading toàn diện để cải thiện UX khi thực hiện các thao tác.

## 🔄 Các Loại Loading Được Triển Khai

### 1. **Overlay Loading (Full Screen)**
- **Khi nào**: Các operations quan trọng như load data, save changes
- **Hiển thị**: Overlay đen mờ với spinner và text động
- **Vị trí**: Che toàn màn hình
- **API**: `showLoading(message)`, `hideLoading()`

### 2. **Button Loading States**
- **Khi nào**: Khi nhấn Save/Cancel buttons
- **Hiển thị**: Spinner thay thế text, disable button
- **Vị trí**: Trong button
- **API**: `setButtonLoading(buttonId, loading)`

### 3. **Section Loading**
- **Khi nào**: Load specific sections (staff list, schedule table)
- **Hiển thị**: Spinner với message trong container
- **Vị trí**: Trong từng section
- **API**: `showSectionLoading(containerId, message)`

### 4. **Inline Loading**
- **Khi nào**: Add staff button, small actions
- **Hiển thị**: Small spinner inline with text
- **Vị trí**: Trong text/button
- **Class**: `.inline-loading`

### 5. **Authentication Loading**
- **Khi nào**: First time authentication với BigQuery
- **Hiển thị**: Small notification ở góc phải
- **Vị trí**: Fixed position top-right
- **API**: `showAuthLoading()`, `hideAuthLoading()`

## 🎯 Loading Cho Từng Thao Tác

### 📊 **Data Loading**
```javascript
// Load initial data
this.showLoading('Đang tải dữ liệu...');
this.showSectionLoading('staffList', 'Đang tải danh sách nhân viên...');
this.showSectionLoading('scheduleBody', 'Đang tải lịch làm việc...');
```

### 💾 **Save Changes**
```javascript
// Save all changes with progress
this.setButtonLoading('saveChanges', true);
this.showLoading('Đang lưu thay đổi...');
this.showLoading(`Đang xóa (${processedCount}/${totalChanges})...`);
this.showLoading(`Đang thêm (${processedCount}/${totalChanges})...`);
this.showLoading('Đang tải lại dữ liệu...');
```

### 👥 **Staff Management**
```javascript
// Add new staff
addButton.innerHTML = '<div class="inline-loading"></div> Đang thêm...';
this.showLoading(`Đang thêm nhân viên ${name}...`);

// Toggle staff status  
this.showLoading(`Đang cập nhật trạng thái ${staff.name}...`);
```

### 📅 **Week Navigation**
```javascript
// Disable navigation buttons during load
prevBtn.disabled = true;
nextBtn.disabled = true;
// Loading handled by main loadData() method
```

### 🔐 **Authentication**
```javascript
// Show auth indicator for first time
this.showAuthLoading(); // Top-right notification
this.hideAuthLoading(); // Remove when done
```

## 🎨 Visual Design

### **Loading Spinner Animation**
```css
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
```

### **Overlay Styling**
- Background: `rgba(0, 0, 0, 0.5)` - Semi-transparent black
- Spinner: Blue (`#4c63d2`) on white background
- Text: White, bold, below spinner

### **Button Loading**
- Text becomes transparent
- Spinner appears in center
- Button disabled and unclickable

### **Pending Changes Animation**
```css
@keyframes pulse-pending {
    0% { box-shadow: 0 0 0 0 rgba(255, 149, 0, 0.7); }
    70% { box-shadow: 0 0 0 10px rgba(255, 149, 0, 0); }
    100% { box-shadow: 0 0 0 0 rgba(255, 149, 0, 0); }
}
```

## 📱 Responsive Behavior

- **Mobile**: Loading elements scale appropriately
- **Small Screens**: Overlay text size adjusts
- **Touch Devices**: Disabled states prevent accidental taps

## ⚡ Performance Benefits

### **User Perception**
- **Immediate Feedback**: Users know action was registered
- **Progress Indication**: Show what's happening and how much left
- **Error Prevention**: Disabled states prevent double-clicks

### **Technical Benefits**
- **Prevents Double Actions**: Buttons disabled during operations
- **Visual Hierarchy**: Important operations get full overlay
- **Graceful Degradation**: Still works if loading fails

## 🔧 Implementation Details

### **Auto Hide on Success/Error**
```javascript
showError(message) {
    this.hideLoading(); // Auto hide loading
    // Show error message
}

showSuccess(message) {
    this.hideLoading(); // Auto hide loading  
    // Show success message
}
```

### **Button State Management**
```javascript
try {
    this.setButtonLoading('saveChanges', true);
    // ... do work ...
    this.setButtonLoading('saveChanges', false);
} catch (error) {
    this.setButtonLoading('saveChanges', false); // Always restore
}
```

### **Progress Tracking**
```javascript
let processedCount = 0;
for (const item of items) {
    processedCount++;
    this.showLoading(`Processing (${processedCount}/${totalItems})...`);
    await processItem(item);
}
```

## 🚀 Files Updated

- **`page/schedule.html`**: Added loading CSS và overlay HTML
- **`script/schedule.js`**: Added loading management methods
- **`script/bigquery-client.js`**: Added auth loading indicators
- **`Loading_Features.md`**: Documentation này

## 💡 Future Enhancements

1. **Progress Bars**: For long operations
2. **Skeleton Loading**: For content placeholders  
3. **Toast Notifications**: Non-blocking success/error messages
4. **Background Sync**: Continue working while saving in background
5. **Offline Indicators**: Show when connection is lost 