// Shift Registration System
class ShiftRegistrationManager {
    constructor() {
        this.currentWeekStart = this.getMonday(new Date());
        this.staffData = [];
        this.scheduleData = [];
        this.selectedStaffId = null;
        this.selectedStaffName = null;
        this.shifts = ['Sáng', 'Chiều', 'Tối'];
        this.daysOfWeek = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
        
        // Change tracking system
        this.pendingChanges = {
            additions: [],      // New schedules to add
            deletions: []       // Schedule IDs to delete
        };
        this.originalScheduleData = [];
        this.hasUnsavedChanges = false;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadData();
        this.renderWeekDisplay();
        this.renderScheduleTable();
        this.renderStaffDropdown();
    }

    setupEventListeners() {
        // Week navigation
        document.getElementById('prevWeek').addEventListener('click', () => this.navigateWeek(-1));
        document.getElementById('nextWeek').addEventListener('click', () => this.navigateWeek(1));
        
        // Staff selection
        document.getElementById('staffDropdown').addEventListener('change', (e) => this.handleStaffSelection(e));
        
        // Save/Cancel buttons
        document.getElementById('saveChanges')?.addEventListener('click', () => this.saveAllChanges());
        document.getElementById('cancelChanges')?.addEventListener('click', () => this.cancelAllChanges());
    }

    // Date utilities
    getMonday(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    formatDisplayDate(date) {
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    // BigQuery client methods
    get bqClient() {
        return window.bigqueryClient;
    }

    async loadData() {
        try {
            this.showLoading('Đang tải dữ liệu...');
            
            // Show section loading
            this.showSectionLoading('scheduleBody', 'Đang tải lịch làm việc...');
            
            // Load staff data - only active staff
            this.staffData = await this.bqClient.getActiveStaff();
            this.staffData = this.staffData.filter(staff => staff.status === 'Đang làm');
            
            // Load schedule data for current week
            const weekEnd = new Date(this.currentWeekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            
            const startDateStr = this.formatDate(this.currentWeekStart);
            const endDateStr = this.formatDate(weekEnd);
            
            this.scheduleData = await this.bqClient.getWeekSchedule(startDateStr, endDateStr);
            
            // Backup original data for cancel operation
            this.originalScheduleData = JSON.parse(JSON.stringify(this.scheduleData));
            this.resetPendingChanges();
            
            // Render the UI components
            this.renderStaffDropdown();
            this.renderScheduleTable();
            
            this.hideLoading();
        } catch (error) {
            console.error('❌ [LoadData] Error loading data:', error);
            
            let errorMessage = 'Không thể tải dữ liệu.';
            if (error.message.includes('timed out')) {
                errorMessage = 'Kết nối mạng chậm. Vui lòng kiểm tra internet và thử lại.';
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Lỗi kết nối. Vui lòng kiểm tra internet và reload trang.';
            } else if (error.message.includes('Network request failed')) {
                errorMessage = 'Mạng không ổn định. Vui lòng thử lại.';
            }
            
            this.showError(errorMessage);
        }
    }

    // Week navigation
    async navigateWeek(direction) {
        try {
            const prevBtn = document.getElementById('prevWeek');
            const nextBtn = document.getElementById('nextWeek');
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            
            this.currentWeekStart.setDate(this.currentWeekStart.getDate() + (direction * 7));
            await this.loadData();
            this.renderWeekDisplay();
            
            prevBtn.disabled = false;
            nextBtn.disabled = false;
        } catch (error) {
            console.error('❌ [NavigateWeek] Error navigating week:', error);
            this.showError('Không thể chuyển tuần. Vui lòng thử lại.');
            
            document.getElementById('prevWeek').disabled = false;
            document.getElementById('nextWeek').disabled = false;
        }
    }

    renderWeekDisplay() {
        const weekEnd = new Date(this.currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const weekDisplay = `${this.formatDisplayDate(this.currentWeekStart)} - ${this.formatDisplayDate(weekEnd)}`;
        document.getElementById('currentWeek').textContent = weekDisplay;
    }

    // Render staff dropdown
    renderStaffDropdown() {
        const dropdown = document.getElementById('staffDropdown');
        if (!dropdown) {
            console.error('❌ [RenderDropdown] staffDropdown element not found!');
            return;
        }
        
        dropdown.innerHTML = '<option value="">-- Chọn nhân viên để đăng ký ca --</option>';

        this.staffData.forEach(staff => {
            const option = document.createElement('option');
            option.value = staff.id;
            option.textContent = staff.name;
            option.dataset.staffName = staff.name;
            dropdown.appendChild(option);
        });
    }

    // Handle staff selection
    handleStaffSelection(event) {
        const selectedValue = event.target.value;
        const selectedOption = event.target.selectedOptions[0];
        
        if (selectedValue) {
            this.selectedStaffId = selectedValue;
            this.selectedStaffName = selectedOption.dataset.staffName;
            
            // Show selected staff info
            const staffInfo = document.getElementById('selectedStaffInfo');
            const staffNameDisplay = document.getElementById('staffNameDisplay');
            
            staffInfo.classList.add('show');
            staffNameDisplay.textContent = `Đã chọn: ${this.selectedStaffName}`;
            
            // Update cells to show clickable state
            this.updateCellsClickableState(true);
        } else {
            this.selectedStaffId = null;
            this.selectedStaffName = null;
            
            // Hide selected staff info
            document.getElementById('selectedStaffInfo').classList.remove('show');
            
            // Remove clickable state from cells
            this.updateCellsClickableState(false);
        }
    }

    // Update cells clickable state
    updateCellsClickableState(isClickable) {
        const cells = document.querySelectorAll('.shift-cell');
        cells.forEach(cell => {
            if (isClickable) {
                cell.classList.add('selected-staff-ready');
                cell.style.cursor = 'pointer';
            } else {
                cell.classList.remove('selected-staff-ready');
                cell.style.cursor = 'default';
            }
        });
    }

    // Render schedule table
    renderScheduleTable() {
        const tbody = document.getElementById('scheduleBody');
        if (!tbody) {
            console.error('❌ [RenderTable] scheduleBody element not found!');
            return;
        }
        
        tbody.innerHTML = '';

        this.shifts.forEach((shift, shiftIndex) => {
            const row = document.createElement('tr');
            
            // Shift header cell
            const shiftCell = document.createElement('td');
            shiftCell.className = 'shift-header';
            shiftCell.textContent = shift;
            row.appendChild(shiftCell);

            // Day cells
            for (let i = 0; i < 7; i++) {
                const date = new Date(this.currentWeekStart);
                date.setDate(date.getDate() + i);
                const dateStr = this.formatDate(date);

                const cell = document.createElement('td');
                cell.className = 'shift-cell';
                cell.dataset.date = dateStr;
                cell.dataset.shift = shift;

                // Add assigned staff for this date and shift
                const assignments = this.scheduleData.filter(s => {
                    const scheduleDate = s.work_date.value || s.work_date;
                    return scheduleDate === dateStr && s.shift === shift;
                });

                assignments.forEach(assignment => {
                    const staffDiv = this.createStaffAssignment(assignment);
                    cell.appendChild(staffDiv);
                });

                // Setup click events for registration
                this.setupCellClickEvents(cell);
                row.appendChild(cell);
            }

            tbody.appendChild(row);
        });

        // Update clickable state based on current selection
        this.updateCellsClickableState(!!this.selectedStaffId);

        document.getElementById('scheduleLoading').style.display = 'none';
        document.getElementById('scheduleTable').style.display = 'table';
    }

    createStaffAssignment(assignment) {
        const div = document.createElement('div');
        div.className = 'staff-assignment';
        div.dataset.scheduleId = assignment.id;
        div.dataset.staffId = assignment.staff_id;
        
        // Add styling for pending/new assignments
        const isPending = assignment.isPending || assignment.id.startsWith('temp_');
        const isNew = assignment.isNew;
        const isExisting = !assignment.id.startsWith('temp_');
        
        if (isPending) {
            div.classList.add('pending-change');
        }
        if (isNew) {
            div.classList.add('new-assignment');
        }
        
        const pendingIcon = isPending ? '<i class="fas fa-clock pending-icon" title="Chưa lưu"></i>' : '';
        
        // Only show remove button for temporary/new assignments (not existing ones)
        const removeButton = !isExisting ? 
            `<button class="remove-btn" onclick="shiftRegistrationManager.removeAssignment('${assignment.id}')" title="Xóa ca này">
                <i class="fas fa-times"></i>
            </button>` : '';
        
        div.innerHTML = `
            <span>${assignment.staff_name}</span>
            ${pendingIcon}
            ${removeButton}
        `;
        
        return div;
    }

    // Setup cell click events
    setupCellClickEvents(cell) {
        cell.addEventListener('click', (e) => {
            // Only register if staff is selected and not clicking on existing assignment
            if (!this.selectedStaffId || e.target.closest('.staff-assignment')) {
                return;
            }
            
            this.registerShift(cell);
        });
    }

    // Register shift for selected staff
    async registerShift(cell) {
        if (!this.selectedStaffId || !this.selectedStaffName) {
            this.showError('Vui lòng chọn nhân viên trước khi đăng ký ca!');
            return;
        }

        const workDate = cell.dataset.date;
        const shift = cell.dataset.shift;
        
        try {
            // Check if this staff already has assignment for this date/shift
            const existingAssignment = this.scheduleData.find(s => {
                const scheduleDate = s.work_date.value || s.work_date;
                return scheduleDate === workDate && s.shift === shift && s.staff_id === this.selectedStaffId;
            });

            if (existingAssignment) {
                this.showError(`${this.selectedStaffName} đã có lịch làm ca ${shift} ngày này!`);
                return;
            }
            
            // Generate temporary ID for UI
            const tempId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            // Add to pending additions
            this.pendingChanges.additions.push({
                tempId: tempId,
                staff_id: this.selectedStaffId,
                work_date: workDate,
                shift: shift
            });

            // Add to current schedule data for immediate UI update
            this.scheduleData.push({
                id: tempId,
                staff_id: this.selectedStaffId,
                work_date: { value: workDate },
                shift: shift,
                staff_name: this.selectedStaffName,
                staff_status: 'Đang làm',
                isPending: true,
                isNew: true
            });

            this.hasUnsavedChanges = true;
            this.updateSaveButtonState();
            this.renderScheduleTable();
            
            this.showSuccess(`Đã đăng ký ca ${shift} cho ${this.selectedStaffName} (chưa lưu)`);
        } catch (error) {
            console.error('❌ [RegisterShift] Error registering shift:', error);
            this.showError('Không thể đăng ký ca làm việc. Vui lòng thử lại.');
        }
    }

    // Remove assignment - only allow removing temporary/new assignments
    async removeAssignment(scheduleId) {
        try {
            // Only allow removing temporary assignments (new registrations not yet saved)
            if (!scheduleId.startsWith('temp_')) {
                this.showError('Không thể xóa ca đã tồn tại. Chỉ có thể xóa ca mới đăng ký chưa lưu.');
                return;
            }

            // Remove from pending additions
            this.pendingChanges.additions = this.pendingChanges.additions.filter(
                change => change.tempId !== scheduleId
            );
            
            // Remove from current schedule data
            this.scheduleData = this.scheduleData.filter(s => s.id !== scheduleId);

            this.hasUnsavedChanges = this.pendingChanges.additions.length > 0 || this.pendingChanges.deletions.length > 0;
            this.updateSaveButtonState();
            this.renderScheduleTable();
            this.showSuccess('Đã xóa ca mới đăng ký (chưa lưu)');
        } catch (error) {
            console.error('❌ [RemoveAssignment] Error removing assignment:', error);
            this.showError('Không thể xóa lịch làm việc. Vui lòng thử lại.');
        }
    }

    // Reset pending changes
    resetPendingChanges() {
        this.pendingChanges = {
            additions: [],
            deletions: []
        };
        this.hasUnsavedChanges = false;
        this.updateSaveButtonState();
    }

    // Update save button state
    updateSaveButtonState() {
        const saveBtn = document.getElementById('saveChanges');
        const cancelBtn = document.getElementById('cancelChanges');
        const changeCount = document.getElementById('changeCount');
        
        if (!saveBtn || !cancelBtn) return;

        const totalChanges = this.pendingChanges.additions.length + this.pendingChanges.deletions.length;
        
        if (this.hasUnsavedChanges && totalChanges > 0) {
            saveBtn.classList.add('has-changes');
            cancelBtn.classList.add('has-changes');
            saveBtn.disabled = false;
            cancelBtn.disabled = false;
            
            if (changeCount) {
                changeCount.textContent = `(${totalChanges})`;
                changeCount.style.display = 'inline';
            }
        } else {
            saveBtn.classList.remove('has-changes');
            cancelBtn.classList.remove('has-changes');
            saveBtn.disabled = true;
            cancelBtn.disabled = true;
            
            if (changeCount) {
                changeCount.style.display = 'none';
            }
        }
    }

    // Save all changes
    async saveAllChanges() {
        if (!this.hasUnsavedChanges) {
            this.showError('Không có thay đổi nào để lưu!');
            return;
        }

        try {
            this.showLoading('Đang lưu thay đổi...');
            
            const saveBtn = document.getElementById('saveChanges');
            const cancelBtn = document.getElementById('cancelChanges');
            
            this.setButtonLoading('saveChanges', true);
            saveBtn.disabled = true;
            cancelBtn.disabled = true;

            let successCount = 0;
            let errorCount = 0;
            const errors = [];

            // Process additions
            for (const addition of this.pendingChanges.additions) {
                try {
                    await this.bqClient.addSchedule(
                        addition.staff_id,
                        addition.work_date,
                        addition.shift
                    );
                    successCount++;
                } catch (error) {
                    errorCount++;
                    errors.push(`Lỗi thêm lịch: ${error.message}`);
                }
            }

            // Process deletions
            for (const scheduleId of this.pendingChanges.deletions) {
                try {
                    await this.bqClient.deleteSchedule(scheduleId);
                    successCount++;
                } catch (error) {
                    errorCount++;
                    errors.push(`Lỗi xóa lịch: ${error.message}`);
                }
            }

            // Show results and reload data
            if (errorCount === 0) {
                this.showSuccess(`✅ Đã lưu thành công ${successCount} thay đổi!`);
            } else {
                this.showError(`⚠️ Lưu thành công ${successCount}, thất bại ${errorCount} thay đổi. ${errors.join('; ')}`);
            }

            // Reload data to sync with database
            await this.loadData();
            this.renderScheduleTable();

        } catch (error) {
            console.error('❌ [SaveAllChanges] Error saving changes:', error);
            this.showError('Lỗi không xác định khi lưu thay đổi. Vui lòng thử lại.');
        } finally {
            this.setButtonLoading('saveChanges', false);
            this.hideLoading();
        }
    }

    // Cancel all changes
    cancelAllChanges() {
        if (!this.hasUnsavedChanges) {
            this.showError('Không có thay đổi nào để hủy!');
            return;
        }

        if (confirm('Bạn có chắc chắn muốn hủy tất cả thay đổi chưa lưu?')) {
            // Restore original data
            this.scheduleData = JSON.parse(JSON.stringify(this.originalScheduleData));
            
            // Reset pending changes
            this.resetPendingChanges();
            
            // Re-render schedule
            this.renderScheduleTable();
            
            this.showSuccess('Đã hủy tất cả thay đổi chưa lưu!');
        }
    }

    // Loading and UI methods
    showLoading(message = 'Đang xử lý...') {
        const overlay = document.getElementById('loadingOverlay');
        const text = document.getElementById('loadingText');
        if (overlay && text) {
            text.textContent = message;
            overlay.style.display = 'flex';
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    setButtonLoading(buttonId, loading = true) {
        const button = document.getElementById(buttonId);
        if (!button) return;

        if (loading) {
            button.classList.add('btn-loading');
            button.disabled = true;
        } else {
            button.classList.remove('btn-loading');
        }
    }

    showSectionLoading(containerId, message = 'Đang tải...') {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="section-loading">
                <div class="loading-spinner"></div>
                <div>${message}</div>
            </div>
        `;
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }
    }

    showSuccess(message) {
        const successDiv = document.getElementById('successMessage');
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.style.display = 'block';
            setTimeout(() => {
                successDiv.style.display = 'none';
            }, 3000);
        }
    }
}

// Initialize the system when DOM is loaded
let shiftRegistrationManager;

document.addEventListener('DOMContentLoaded', () => {
    shiftRegistrationManager = new ShiftRegistrationManager();
});

// Expose to global scope for onclick handlers
window.shiftRegistrationManager = shiftRegistrationManager; 