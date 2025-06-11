# Hướng Dẫn Cài Đặt BigQuery cho Hệ Thống Quản Lý Lịch Làm Việc

Hệ thống đã được cập nhật để sử dụng dữ liệu thật từ Google BigQuery với tính năng change tracking để cải thiện UX.

## 🆕 Tính Năng Mới: Change Tracking

### ✨ Cải Thiện UX:
- **Kéo thả nhiều lần**: Người dùng có thể thực hiện nhiều thay đổi liên tiếp
- **Ghi nhận thay đổi**: Tất cả thay đổi được track locally trước khi lưu
- **Batch save**: Chỉ khi nhấn "Lưu thay đổi" mới gửi requests đến database
- **Visual feedback**: Các ca chưa lưu được highlight với màu cam và icon pending
- **Hủy thay đổi**: Có thể revert về trạng thái ban đầu

### 🎯 Cách Hoạt Động:
1. **Kéo thả staff** → Thêm vào pending changes + hiển thị ngay trên UI
2. **Xóa assignment** → Thêm vào pending deletions + ẩn khỏi UI
3. **Nhấn "Lưu thay đổi"** → Batch execute tất cả changes lên BigQuery
4. **Nhấn "Hủy thay đổi"** → Restore về original data

## 1. Tạo Dataset trong BigQuery

1. Đăng nhập vào Google Cloud Console
2. Chọn project `tools-451916`
3. Mở BigQuery
4. Tạo dataset mới với tên `part_time_schedule`

## 2. Tạo Bảng `staff`

```sql
CREATE TABLE `tools-451916.part_time_schedule.staff` (
  id STRING NOT NULL,
  name STRING NOT NULL,
  status STRING NOT NULL
);
```

### Thêm dữ liệu mẫu cho bảng staff:

```sql
INSERT INTO `tools-451916.part_time_schedule.staff` (id, name, status) VALUES
('staff-001', 'Nguyễn Văn An', 'Đang làm'),
('staff-002', 'Trần Thị Bình', 'Đang làm'),
('staff-003', 'Lê Văn Cường', 'Đang làm'),
('staff-004', 'Phạm Thị Dung', 'Đang làm'),
('staff-005', 'Hoàng Văn Em', 'Đã nghỉ');
```

## 3. Tạo Bảng `schedule`

```sql
CREATE TABLE `tools-451916.part_time_schedule.schedule` (
  id STRING NOT NULL,
  staff_id STRING NOT NULL,
  work_date DATE NOT NULL,
  shift STRING NOT NULL
);
```

### Thêm dữ liệu mẫu cho bảng schedule:

```sql
INSERT INTO `tools-451916.part_time_schedule.schedule` (id, staff_id, work_date, shift) VALUES
('schedule-001', 'staff-001', CURRENT_DATE(), 'Sáng'),
('schedule-002', 'staff-002', CURRENT_DATE(), 'Chiều'),
('schedule-003', 'staff-003', DATE_ADD(CURRENT_DATE(), INTERVAL 1 DAY), 'Sáng'),
('schedule-004', 'staff-004', DATE_ADD(CURRENT_DATE(), INTERVAL 1 DAY), 'Tối');
```

## 4. Thiết Lập Quyền Truy Cập

Service account `vuxhon@tools-451916.iam.gserviceaccount.com` cần có các quyền sau:
- BigQuery Data Editor
- BigQuery Job User

## 5. Các Thay Đổi Chính

### ✅ Change Tracking System:
- **Pending Changes**: Theo dõi additions, updates, deletions
- **Original Data Backup**: Backup data ban đầu để cancel
- **Batch Operations**: Thực hiện tất cả thay đổi cùng lúc
- **Visual Indicators**: Hiển thị trạng thái pending với màu sắc và icons

### ✅ UI/UX Improvements:
- **Save/Cancel Buttons**: Nút lưu và hủy thay đổi trong header
- **Change Counter**: Hiển thị số lượng thay đổi chưa lưu
- **Pending Animations**: Animation pulse cho các thay đổi chưa lưu
- **Button States**: Enable/disable buttons dựa trên trạng thái changes

### ✅ Database Operations:
- `saveAllChanges()` - Batch save tất cả pending changes
- `cancelAllChanges()` - Restore về original data
- `updateSaveButtonState()` - Cập nhật UI state
- `resetPendingChanges()` - Reset change tracking

### 🔧 Authentication:
- Sử dụng service account key từ `API_key/bigquery.json`
- JWT token được tạo và ký tự động
- Access token được cache và refresh khi cần

## 6. Cách Sử Dụng

### 📝 Thực Hiện Thay Đổi:
1. **Kéo thả staff** từ danh sách vào ô ca làm việc
2. **Xóa assignment** bằng cách click nút X
3. **Quan sát visual feedback**: Các thay đổi sẽ có màu cam và icon clock
4. **Check số lượng thay đổi** trên nút "Lưu thay đổi (X)"

### 💾 Lưu Thay Đổi:
1. **Nhấn "Lưu thay đổi"** - Confirm dialog sẽ hiển thị
2. **Confirm** để batch save tất cả changes lên BigQuery
3. **Refresh data** từ server và update UI

### ↩️ Hủy Thay Đổi:
1. **Nhấn "Hủy thay đổi"** - Confirm dialog sẽ hiển thị  
2. **Confirm** để restore về trạng thái ban đầu
3. **UI reset** về original data

## 7. Kiểm Tra Hoạt Động

1. Mở browser console (F12)
2. Load trang web
3. Kiểm tra logs:
   - `🔧 [BigQueryClient] Constructor called`
   - `🔑 [BigQueryClient] Requesting new access token...`
   - `✅ [BigQueryClient] Access token obtained successfully`
   - `📝 [HandleDrop] Adding to pending changes...`
   - `💾 [SaveChanges] Starting to save all changes...`

## 8. Performance Benefits

### 🚀 Reduced API Calls:
- **Before**: Mỗi drag & drop = 1 API call
- **After**: Batch save = N changes in 1 transaction

### 💡 Better UX:
- **Immediate feedback**: UI update ngay lập tức
- **No network delays**: Không chờ API response cho mỗi action
- **Undo capability**: Có thể hủy trước khi save

## 9. Files Đã Cập Nhật

- `script/schedule.js` - Added change tracking system
- `script/bigquery-client.js` - BigQuery client với real API calls  
- `page/schedule.html` - Added save/cancel buttons và pending styles
- `schedule-standalone.html` - Updated standalone version
- `BigQuery_Setup.md` - Updated documentation

## 10. Security Note

⚠️ **Lưu ý bảo mật**: Service account key được embed trực tiếp trong frontend code. Điều này chỉ phù hợp cho môi trường development. Trong production, nên sử dụng:
- OAuth2 flow cho user authentication
- Backend API proxy để ẩn service account key
- Cloud Functions hoặc App Engine để xử lý BigQuery queries 