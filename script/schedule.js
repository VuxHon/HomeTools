// Schedule Management System
class ScheduleManager {
    constructor() {
        this.currentWeekStart = this.getMonday(new Date());
        this.staffData = [];
        this.scheduleData = [];
        this.shifts = ['Sáng', 'Chiều', 'Tối'];
        this.daysOfWeek = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
        
        // Change tracking system
        this.pendingChanges = {
            additions: [],      // New schedules to add
            updates: [],        // Existing schedules to update  
            deletions: []       // Schedule IDs to delete
        };
        this.originalScheduleData = []; // Backup for cancel operation
        this.hasUnsavedChanges = false;
        
        // Undo system
        this.undoStack = [];
        this.maxUndoSteps = 20; // Maximum number of undo steps
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadData();
        this.renderWeekDisplay();
        this.renderScheduleTable();
        this.renderStaffList();
    }

    setupEventListeners() {
        document.getElementById('prevWeek').addEventListener('click', () => this.navigateWeek(-1));
        document.getElementById('nextWeek').addEventListener('click', () => this.navigateWeek(1));
        
        // Save/Cancel buttons
        document.getElementById('saveChanges')?.addEventListener('click', () => this.saveAllChanges());
        document.getElementById('cancelChanges')?.addEventListener('click', () => this.cancelAllChanges());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    // Handle keyboard shortcuts
    handleKeyboardShortcuts(e) {
        // Ctrl+Z for undo
        if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            this.undo();
        }
        // Ctrl+Shift+Z or Ctrl+Y for redo (future enhancement)
        else if ((e.ctrlKey && e.key === 'z' && e.shiftKey) || (e.ctrlKey && e.key === 'y')) {
            e.preventDefault();
            // this.redo(); // Not implemented yet
            this.showError('Chức năng Redo chưa được hỗ trợ');
        }
    }

    // Save current state to undo stack
    saveStateToUndo(actionType, actionData = null) {
        const state = {
            timestamp: Date.now(),
            actionType: actionType,
            actionData: actionData,
            scheduleData: JSON.parse(JSON.stringify(this.scheduleData)),
            pendingChanges: JSON.parse(JSON.stringify(this.pendingChanges)),
            hasUnsavedChanges: this.hasUnsavedChanges
        };

        this.undoStack.push(state);

        // Limit undo stack size
        if (this.undoStack.length > this.maxUndoSteps) {
            this.undoStack.shift(); // Remove oldest state
        }

        console.log(`🔄 [Undo] Saved state: ${actionType}, Stack size: ${this.undoStack.length}`);
    }

    // Undo last action
    undo() {
        if (this.undoStack.length === 0) {
            this.showError('Không có thao tác nào để hoàn tác');
            return;
        }

        try {
            const previousState = this.undoStack.pop();
            
            // Restore previous state
            this.scheduleData = JSON.parse(JSON.stringify(previousState.scheduleData));
            this.pendingChanges = JSON.parse(JSON.stringify(previousState.pendingChanges));
            this.hasUnsavedChanges = previousState.hasUnsavedChanges;

            // Re-render UI
            this.renderScheduleTable();
            this.updateSaveButtonState();

            this.showSuccess(`✅ Đã hoàn tác: ${this.getActionTypeDisplayName(previousState.actionType)}`);
            console.log(`🔄 [Undo] Restored state: ${previousState.actionType}, Stack size: ${this.undoStack.length}`);
        } catch (error) {
            console.error('❌ [Undo] Error during undo operation:', error);
            this.showError('Không thể hoàn tác thao tác. Vui lòng thử lại.');
        }
    }

    // Get display name for action type
    getActionTypeDisplayName(actionType) {
        const displayNames = {
            'ADD_ASSIGNMENT': 'Thêm lịch làm việc',
            'REMOVE_ASSIGNMENT': 'Xóa lịch làm việc',
            'DRAG_DROP': 'Kéo thả nhân viên',
            'AI_SCHEDULE': 'Xử lý lịch AI',
            'BULK_OPERATION': 'Thao tác hàng loạt'
        };
        return displayNames[actionType] || actionType;
    }

    // Clear undo stack (called when data is saved or refreshed)
    clearUndoStack() {
        this.undoStack = [];
        console.log('🔄 [Undo] Cleared undo stack');
    }

    // Generate consistent color for each staff member
    getStaffColor(staffId, staffName) {
        // Simple RGB color palette - clear and professional
        const colorPalette = [
            { bg: '#3498db', text: '#ffffff' }, // Blue
            { bg: '#e74c3c', text: '#ffffff' }, // Red
            { bg: '#2ecc71', text: '#ffffff' }, // Green
            { bg: '#f39c12', text: '#ffffff' }, // Orange
            { bg: '#9b59b6', text: '#ffffff' }, // Purple
            { bg: '#1abc9c', text: '#ffffff' }, // Turquoise
            { bg: '#e67e22', text: '#ffffff' }, // Carrot
            { bg: '#34495e', text: '#ffffff' }, // Wet Asphalt
            { bg: '#f1c40f', text: '#333333' }, // Yellow
            { bg: '#e91e63', text: '#ffffff' }, // Pink
            { bg: '#795548', text: '#ffffff' }, // Brown
            { bg: '#607d8b', text: '#ffffff' }, // Blue Grey
            { bg: '#ff5722', text: '#ffffff' }, // Deep Orange
            { bg: '#009688', text: '#ffffff' }, // Teal
            { bg: '#673ab7', text: '#ffffff' }, // Deep Purple
            { bg: '#ff9800', text: '#ffffff' }, // Amber
            { bg: '#4caf50', text: '#ffffff' }, // Light Green
            { bg: '#2196f3', text: '#ffffff' }, // Light Blue
            { bg: '#ff6b6b', text: '#ffffff' }, // Light Red
            { bg: '#6c5ce7', text: '#ffffff' }  // Purple Blue
        ];

        // Create a hash from staffId to ensure consistency
        let hash = 0;
        const str = staffId || staffName || 'default';
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        // Use absolute value and modulo to get consistent index
        const colorIndex = Math.abs(hash) % colorPalette.length;
        return colorPalette[colorIndex];
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
            
            // Show section loading for staff and schedule
            this.showSectionLoading('staffList', 'Đang tải danh sách nhân viên...');
            this.showSectionLoading('scheduleBody', 'Đang tải lịch làm việc...');
            
            // Load staff data
            this.staffData = await this.bqClient.getActiveStaff();
            
            // Load schedule data for current week
            const weekEnd = new Date(this.currentWeekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            
            const startDateStr = this.formatDate(this.currentWeekStart);
            const endDateStr = this.formatDate(weekEnd);
            
            this.scheduleData = await this.bqClient.getWeekSchedule(startDateStr, endDateStr);
            
            // Backup original data for cancel operation
            this.originalScheduleData = JSON.parse(JSON.stringify(this.scheduleData));
            this.resetPendingChanges();
            
            // Clear undo stack since we have fresh data
            this.clearUndoStack();
            
            // Render the UI components
            this.renderStaffList();
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
                errorMessage = 'Mạng không ổn định. Hệ thống đã thử lại nhiều lần. Vui lòng reload trang.';
            }
            
            this.showError(errorMessage);
        }
    }

    // Week navigation
    async navigateWeek(direction) {
        try {
            // Add loading to navigation buttons
            const prevBtn = document.getElementById('prevWeek');
            const nextBtn = document.getElementById('nextWeek');
            prevBtn.disabled = true;
            nextBtn.disabled = true;
            
            this.currentWeekStart.setDate(this.currentWeekStart.getDate() + (direction * 7));
            await this.loadData();
            this.renderWeekDisplay();
            
            // Re-enable navigation buttons
            prevBtn.disabled = false;
            nextBtn.disabled = false;
        } catch (error) {
            console.error('❌ [NavigateWeek] Error navigating week:', error);
            this.showError('Không thể chuyển tuần. Vui lòng thử lại.');
            
            // Re-enable navigation buttons on error
            document.getElementById('prevWeek').disabled = false;
            document.getElementById('nextWeek').disabled = false;
        }
    }

    renderWeekDisplay() {
        const weekEnd = new Date(this.currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const weekDisplay = `${this.formatDisplayDate(this.currentWeekStart)} - ${this.formatDisplayDate(weekEnd)}`;
        document.getElementById('currentWeek').textContent = weekDisplay;
        
        // Update AI form week info
        const weekRangeElement = document.getElementById('weekRange');
        if (weekRangeElement) {
            weekRangeElement.textContent = weekDisplay;
        }
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
                cell.className = 'shift-cell drop-zone';
                cell.dataset.date = dateStr;
                cell.dataset.shift = shift;

                // Add assigned staff for this date and shift
                const assignments = this.scheduleData.filter(s => {
                    const scheduleDate = s.work_date.value || s.work_date;
                    return scheduleDate === dateStr && s.shift === shift;
                });

                // Sort assignments by staff name alphabetically
                assignments.sort((a, b) => {
                    const nameA = a.staff_name || '';
                    const nameB = b.staff_name || '';
                    return nameA.localeCompare(nameB, 'vi', { sensitivity: 'base' });
                });

                assignments.forEach(assignment => {
                    const staffDiv = this.createStaffAssignment(assignment);
                    cell.appendChild(staffDiv);
                });

                this.setupDropZone(cell);
                row.appendChild(cell);
            }

            tbody.appendChild(row);
        });

        document.getElementById('scheduleLoading').style.display = 'none';
        document.getElementById('scheduleTable').style.display = 'table';
    }

    createStaffAssignment(assignment) {
        const div = document.createElement('div');
        div.className = 'staff-assignment';
        div.dataset.scheduleId = assignment.id;
        div.dataset.staffId = assignment.staff_id;
        
        // Get consistent color for this staff member
        const staffColor = this.getStaffColor(assignment.staff_id, assignment.staff_name);
        
        // Apply staff-specific colors
        div.style.background = staffColor.bg;
        div.style.color = staffColor.text;
        
        // Add pending indicator for temporary assignments
        const isPending = assignment.isPending || assignment.id.startsWith('temp_');
        if (isPending) {
            div.classList.add('pending-change');
            // For pending items, add a subtle border to indicate unsaved status
            div.style.border = '2px solid #ff9500';
            div.style.boxShadow = '0 0 0 1px rgba(255, 149, 0, 0.3)';
        }
        
        const pendingIcon = isPending ? '<i class="fas fa-clock pending-icon" title="Chưa lưu"></i>' : '';
        
        div.innerHTML = `
            <span>${assignment.staff_name}</span>
            ${pendingIcon}
            <button class="remove-btn" onclick="scheduleManager.removeAssignment('${assignment.id}')" style="color: ${staffColor.text}; background: rgba(255,255,255,0.2);">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        return div;
    }

    // Render staff list
    renderStaffList() {
        const staffList = document.getElementById('staffList');
        if (!staffList) {
            console.error('❌ [RenderStaff] staffList element not found!');
            return;
        }
        
        staffList.innerHTML = '';

        this.staffData.forEach((staff, index) => {
            const staffItem = document.createElement('div');
            staffItem.className = 'staff-item';
            staffItem.draggable = true;
            staffItem.dataset.staffId = staff.id;
            staffItem.dataset.staffName = staff.name;
            
            const statusClass = staff.status === 'Đang làm' ? 'status-active' : 'status-inactive';
            
            // Get staff color for preview
            const staffColor = this.getStaffColor(staff.id, staff.name);
            
            staffItem.innerHTML = `
                <div class="staff-info">
                    <div class="staff-color-preview" style="background: ${staffColor.bg}; width: 16px; height: 16px; border-radius: 50%; display: inline-block; margin-right: 8px; border: 2px solid #ddd;"></div>
                    <div class="staff-name">${staff.name}</div>
                </div>
                <div class="staff-item-actions">
                    <button class="edit-staff-btn" onclick="scheduleManager.openEditStaffModal('${staff.id}', '${staff.name.replace(/'/g, "\\'")}', '${staff.status}')" title="Chỉnh sửa">
                        <i class="fas fa-edit"></i>
                    </button>
                    <div class="staff-status ${statusClass}" onclick="scheduleManager.toggleStaffStatus('${staff.id}')">${staff.status}</div>
                </div>
            `;

            this.setupDragEvents(staffItem);
            staffList.appendChild(staffItem);
        });
    }

    // Drag and drop functionality
    setupDragEvents(staffItem) {
        staffItem.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify({
                staffId: staffItem.dataset.staffId,
                staffName: staffItem.dataset.staffName
            }));
            staffItem.classList.add('dragging');
        });

        staffItem.addEventListener('dragend', () => {
            staffItem.classList.remove('dragging');
        });
    }

    setupDropZone(dropZone) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('drag-over');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('drag-over');
            }, false);
        });

        dropZone.addEventListener('drop', (e) => {
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            this.handleDrop(data, dropZone);
        }, false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    async handleDrop(staffData, dropZone) {
        const staffId = staffData.staffId;
        const staffName = staffData.staffName;
        const workDate = dropZone.dataset.date;
        const shift = dropZone.dataset.shift;
        
        try {
            // Check if this staff already has assignment for this date/shift
            const existingAssignment = this.scheduleData.find(s => {
                const scheduleDate = s.work_date.value || s.work_date;
                return scheduleDate === workDate && s.shift === shift && s.staff_id === staffId;
            });

            if (existingAssignment) {
                this.showError(`${staffName} đã có lịch làm ca ${shift} ngày này!`);
                return;
            }
            
            // Save state for undo before making changes
            this.saveStateToUndo('DRAG_DROP', {
                staffId: staffId,
                staffName: staffName,
                workDate: workDate,
                shift: shift
            });
            
            // Generate temporary ID for UI
            const tempId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            // Add to pending additions
            this.pendingChanges.additions.push({
                tempId: tempId,
                staff_id: staffId,
                work_date: workDate,
                shift: shift
            });

            // Add to current schedule data for immediate UI update
            const staff = this.staffData.find(s => s.id === staffId);
            this.scheduleData.push({
                id: tempId,
                staff_id: staffId,
                work_date: { value: workDate },
                shift: shift,
                staff_name: staffName,
                staff_status: staff?.status || 'Đang làm',
                isPending: true
            });

            this.hasUnsavedChanges = true;
            this.updateSaveButtonState();
            this.renderScheduleTable();
            
            this.showSuccess(`Đã thêm lịch làm việc cho ${staffName} (chưa lưu)`);
        } catch (error) {
            console.error('❌ [HandleDrop] Error processing drop:', error);
            this.showError('Không thể thêm lịch làm việc. Vui lòng thử lại.');
        }
    }

    // Remove assignment
    async removeAssignment(scheduleId) {
        try {
            // Find the assignment being removed for undo data
            const assignmentToRemove = this.scheduleData.find(s => s.id === scheduleId);
            
            // Save state for undo before making changes
            this.saveStateToUndo('REMOVE_ASSIGNMENT', {
                scheduleId: scheduleId,
                assignment: assignmentToRemove
            });
            
            // Check if this is a pending addition (temporary)
            if (scheduleId.startsWith('temp_')) {
                // Remove from pending additions
                this.pendingChanges.additions = this.pendingChanges.additions.filter(
                    change => change.tempId !== scheduleId
                );
                
                // Remove from current schedule data
                this.scheduleData = this.scheduleData.filter(s => s.id !== scheduleId);
            } else {
                // Add to pending deletions
                this.pendingChanges.deletions.push(scheduleId);
                
                // Remove from current schedule data for immediate UI update
                this.scheduleData = this.scheduleData.filter(s => s.id !== scheduleId);
            }

            this.hasUnsavedChanges = true;
            this.updateSaveButtonState();
            this.renderScheduleTable();
            this.showSuccess('Đã xóa lịch làm việc (chưa lưu)');
        } catch (error) {
            console.error('❌ [RemoveAssignment] Error removing assignment:', error);
            this.showError('Không thể xóa lịch làm việc. Vui lòng thử lại.');
        }
    }

    // Toggle staff status
    async toggleStaffStatus(staffId) {
        const staff = this.staffData.find(s => s.id === staffId);
        if (!staff) return;

        const newStatus = staff.status === 'Đang làm' ? 'Đã nghỉ' : 'Đang làm';
        
        try {
            this.showLoading(`Đang cập nhật trạng thái ${staff.name}...`);
            await this.bqClient.updateStaffStatus(staffId, newStatus);

            await this.loadData();
            this.renderStaffList();
            this.showSuccess(`Đã cập nhật trạng thái của ${staff.name}`);
        } catch (error) {
            this.showError('Không thể cập nhật trạng thái nhân viên. Vui lòng thử lại.');
            console.error('Error updating staff status:', error);
        }
    }

    // Edit staff functionality
    openEditStaffModal(staffId, staffName, staffStatus) {
        const modal = document.getElementById('editStaffModal');
        const nameInput = document.getElementById('editStaffName');
        const statusSelect = document.getElementById('editStaffStatus');
        
        // Store current staff ID and name for later use
        modal.dataset.staffId = staffId;
        modal.dataset.staffName = staffName;
        
        // Populate form with current values
        nameInput.value = staffName;
        statusSelect.value = staffStatus;
        
        // Show modal
        modal.style.display = 'flex';
        nameInput.focus();
        
        console.log('📝 [EditStaff] Opened edit modal for:', staffName);
    }

    // Delete staff functionality
    async deleteStaff(staffId, staffName) {
        try {
            this.showLoading(`Đang xóa nhân viên ${staffName}...`);
            
            // Call BigQuery service to delete staff and their schedules
            await this.bqClient.query(`
                DELETE FROM \`${this.bqClient.projectId}.${this.bqClient.datasetId}.schedule\`
                WHERE staff_id = '${staffId}'
            `);
            
            await this.bqClient.query(`
                DELETE FROM \`${this.bqClient.projectId}.${this.bqClient.datasetId}.staff\`
                WHERE id = '${staffId}'
            `);
            
            // Reload data to refresh the UI
            await this.loadData();
            this.renderStaffList();
            this.renderScheduleTable();
            
            this.showSuccess(`Đã xóa nhân viên ${staffName} và tất cả lịch làm việc của họ`);
            
        } catch (error) {
            console.error('❌ [DeleteStaff] Error deleting staff:', error);
            this.showError('Không thể xóa nhân viên. Vui lòng thử lại.');
            throw error;
        }
    }

    async updateStaff(staffId, name, status) {
        try {
            this.showLoading(`Đang cập nhật thông tin nhân viên...`);
            
            await this.bqClient.updateStaff(staffId, name, status);
            
            // Reload data to show updated information
            await this.loadData();
            
            this.showSuccess(`Đã cập nhật thông tin nhân viên thành công!`);
            console.log('✅ [UpdateStaff] Staff updated successfully');
        } catch (error) {
            console.error('❌ [UpdateStaff] Error updating staff:', error);
            
            let errorMessage = 'Không thể cập nhật thông tin nhân viên.';
            if (error.message.includes('timed out')) {
                errorMessage = 'Kết nối mạng chậm. Vui lòng kiểm tra internet và thử lại.';
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Lỗi kết nối. Vui lòng kiểm tra internet và thử lại.';
            } else if (error.message.includes('Network request failed')) {
                errorMessage = 'Mạng không ổn định. Hệ thống đã thử lại nhiều lần.';
            }
            
            this.showError(errorMessage);
        }
    }

    // Change tracking methods
    resetPendingChanges() {
        this.pendingChanges = {
            additions: [],
            updates: [],
            deletions: []
        };
        this.hasUnsavedChanges = false;
        this.updateSaveButtonState();
    }

    updateSaveButtonState() {
        const saveBtn = document.getElementById('saveChanges');
        const cancelBtn = document.getElementById('cancelChanges');
        const changeCount = document.getElementById('changeCount');
        
        if (saveBtn && cancelBtn) {
            saveBtn.disabled = !this.hasUnsavedChanges;
            cancelBtn.disabled = !this.hasUnsavedChanges;
            
            if (this.hasUnsavedChanges) {
                saveBtn.classList.add('has-changes');
                cancelBtn.classList.add('has-changes');
            } else {
                saveBtn.classList.remove('has-changes');
                cancelBtn.classList.remove('has-changes');
            }
        }

        if (changeCount) {
            const totalChanges = this.pendingChanges.additions.length + 
                               this.pendingChanges.updates.length + 
                               this.pendingChanges.deletions.length;
            
            if (totalChanges > 0) {
                changeCount.textContent = `(${totalChanges})`;
                changeCount.style.display = 'inline';
            } else {
                changeCount.style.display = 'none';
            }
        }
    }

    async saveAllChanges() {
        if (!this.hasUnsavedChanges) return;

        const totalChanges = this.pendingChanges.additions.length + 
                           this.pendingChanges.updates.length + 
                           this.pendingChanges.deletions.length;

        if (!confirm(`Bạn có chắc chắn muốn lưu ${totalChanges} thay đổi?`)) return;

        try {
            this.setButtonLoading('saveChanges', true);
            this.showLoading('Đang lưu thay đổi...');

            let currentStep = 0;
            const totalSteps = (this.pendingChanges.deletions.length > 0 ? 1 : 0) + 
                             (this.pendingChanges.additions.length > 0 ? 1 : 0) + 
                             (this.pendingChanges.updates.length > 0 ? 1 : 0);

            // Batch process deletions first
            if (this.pendingChanges.deletions.length > 0) {
                currentStep++;
                this.showLoading(`Bước ${currentStep}/${totalSteps}: Xóa ${this.pendingChanges.deletions.length} ca...`);
                
                // Extract schedule IDs from pending deletions
                const scheduleIds = this.pendingChanges.deletions.map(deletion => 
                    typeof deletion === 'string' ? deletion : deletion.id
                );
                await this.bqClient.batchDeleteSchedules(scheduleIds);
            }

            // Batch process additions
            if (this.pendingChanges.additions.length > 0) {
                currentStep++;
                this.showLoading(`Bước ${currentStep}/${totalSteps}: Thêm ${this.pendingChanges.additions.length} ca mới...`);
                
                await this.bqClient.batchAddSchedules(this.pendingChanges.additions);
            }

            // Process updates individually (each has different data)
            if (this.pendingChanges.updates.length > 0) {
                currentStep++;
                this.showLoading(`Bước ${currentStep}/${totalSteps}: Cập nhật ${this.pendingChanges.updates.length} ca...`);
                
                for (let i = 0; i < this.pendingChanges.updates.length; i++) {
                    const update = this.pendingChanges.updates[i];
                    this.showLoading(`Bước ${currentStep}/${totalSteps}: Cập nhật ca (${i + 1}/${this.pendingChanges.updates.length})...`);
                    await this.bqClient.updateSchedule(
                        update.id,
                        update.staff_id,
                        update.work_date,
                        update.shift
                    );
                }
            }

            this.showLoading('Hoàn tất! Đang tải lại dữ liệu...');

            // Reload data from server
            await this.loadData();

            this.setButtonLoading('saveChanges', false);
            this.showSuccess(`Đã lưu ${totalChanges} thay đổi thành công với ${totalSteps} lần query!`);
        } catch (error) {
            this.setButtonLoading('saveChanges', false);
            console.error('❌ [SaveChanges] Error saving changes:', error);
            this.showError('Không thể lưu thay đổi. Vui lòng thử lại.');
        }
    }

    cancelAllChanges() {
        if (!this.hasUnsavedChanges) return;

        const totalChanges = this.pendingChanges.additions.length + 
                           this.pendingChanges.updates.length + 
                           this.pendingChanges.deletions.length;

        if (!confirm(`Bạn có chắc chắn muốn hủy ${totalChanges} thay đổi?`)) return;

        try {
            // Restore original data
            this.scheduleData = JSON.parse(JSON.stringify(this.originalScheduleData));
            
            // Reset pending changes
            this.resetPendingChanges();
            
            // Clear undo stack since we've reset to original state
            this.clearUndoStack();
            
            // Re-render table
            this.renderScheduleTable();

            this.showSuccess('Đã hủy tất cả thay đổi');
        } catch (error) {
            console.error('❌ [CancelChanges] Error cancelling changes:', error);
            this.showError('Không thể hủy thay đổi. Vui lòng thử lại.');
        }
    }

    // Loading management
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
        if (button) {
            if (loading) {
                button.classList.add('btn-loading');
                button.disabled = true;
            } else {
                button.classList.remove('btn-loading');
                button.disabled = false;
            }
        }
    }

    showSectionLoading(containerId, message = 'Đang tải...') {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="section-loading">
                    <div class="loading-spinner"></div>
                    <div>${message}</div>
                </div>
            `;
        }
    }

    // Utility functions
    showError(message) {
        this.hideLoading(); // Hide loading when showing error
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    showSuccess(message) {
        this.hideLoading(); // Hide loading when showing success
        const successDiv = document.getElementById('successMessage');
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 3000);
    }

    // Network status monitoring
    updateNetworkStatus(status, message) {
        const networkStatus = document.getElementById('networkStatus');
        const networkStatusText = document.getElementById('networkStatusText');
        
        if (networkStatus && networkStatusText) {
            networkStatus.className = `network-status ${status}`;
            networkStatusText.textContent = message;
            networkStatus.style.display = 'block';
            
            // Auto-hide after 5 seconds if online
            if (status === 'online') {
                setTimeout(() => {
                    networkStatus.style.display = 'none';
                }, 5000);
            }
        }
    }
}

// Global functions
async function addNewStaff() {
    const name = document.getElementById('staffName').value.trim();
    const status = document.getElementById('staffStatus').value;

    if (!name) {
        scheduleManager.showError('Vui lòng nhập tên nhân viên');
        return;
    }

    try {
        // Add loading state to button
        const addButton = document.querySelector('.btn');
        const originalText = addButton.innerHTML;
        addButton.innerHTML = '<div class="inline-loading"></div> Đang thêm...';
        addButton.disabled = true;

        scheduleManager.showLoading(`Đang thêm nhân viên ${name}...`);
        await scheduleManager.bqClient.addStaff(name, status);

        document.getElementById('staffName').value = '';
        await scheduleManager.loadData();
        scheduleManager.renderStaffList();

        // Restore button
        addButton.innerHTML = originalText;
        addButton.disabled = false;

        scheduleManager.showSuccess(`Đã thêm nhân viên ${name}`);
    } catch (error) {
        // Restore button on error
        const addButton = document.querySelector('.btn');
        addButton.innerHTML = '<i class="fas fa-plus"></i> Thêm Nhân Viên';
        addButton.disabled = false;

        scheduleManager.showError('Không thể thêm nhân viên. Vui lòng thử lại.');
        console.error('Error adding staff:', error);
    }
}



// Global functions for AI schedule parsing
async function parseScheduleWithAI() {
    const chatInput = document.getElementById('chatInput').value.trim();
    
    if (!chatInput) {
        scheduleManager.showError('Vui lòng nhập tin nhắn lịch làm việc');
        return;
    }
    
    try {
        // Get AI button for loading state
        const aiButton = document.querySelector('.ai-btn');
        const originalText = aiButton.innerHTML;
        aiButton.innerHTML = '<div class="inline-loading"></div> AI đang phân tích...';
        aiButton.disabled = true;
        
        scheduleManager.showLoading('AI đang phân tích tin nhắn lịch làm việc...');
        
        // Get weekStartDate from current week displayed on the schedule table
        const weekStartDate = scheduleManager.formatDate(scheduleManager.currentWeekStart);
        
        // Call Gemini AI to parse the messages
        const aiResult = await window.geminiAI.parseScheduleMessage(
            chatInput,
            scheduleManager.staffData,
            weekStartDate
        );
        
        if (!aiResult.schedules || aiResult.schedules.length === 0) {
            scheduleManager.showError('AI không tìm thấy lịch làm việc nào trong tin nhắn');
            return;
        }
        
        // Save state for undo before making changes
        scheduleManager.saveStateToUndo('AI_SCHEDULE', {
            inputText: chatInput,
            aiResult: aiResult
        });
        
        // Add schedules to pending changes
        let addedCount = 0;
        for (const schedule of aiResult.schedules) {
            // Check if staff exists
            const staff = scheduleManager.staffData.find(s => s.id === schedule.staff_id);
            if (!staff) {
                continue;
            }
            
            // Check for existing assignment
            const existingAssignment = scheduleManager.scheduleData.find(s => {
                const scheduleDate = s.work_date.value || s.work_date;
                return scheduleDate === schedule.work_date && 
                       s.shift === schedule.shift && 
                       s.staff_id === schedule.staff_id;
            });
            
            if (existingAssignment) {
                continue;
            }
            
            // Add to pending changes
            const tempId = 'temp_ai_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            scheduleManager.pendingChanges.additions.push({
                tempId: tempId,
                staff_id: schedule.staff_id,
                work_date: schedule.work_date,
                shift: schedule.shift
            });
            
            // Add to current schedule data for immediate UI update
            scheduleManager.scheduleData.push({
                id: tempId,
                staff_id: schedule.staff_id,
                work_date: { value: schedule.work_date },
                shift: schedule.shift,
                staff_name: schedule.staff_name,
                staff_status: staff.status,
                isPending: true
            });
            
            addedCount++;
        }
        
        if (addedCount > 0) {
            scheduleManager.hasUnsavedChanges = true;
            scheduleManager.updateSaveButtonState();
            scheduleManager.renderScheduleTable();
            
            // Clear input
            document.getElementById('chatInput').value = '';
            
            scheduleManager.showSuccess(`🤖 AI đã phân tích và thêm ${addedCount} ca làm việc!\n${aiResult.summary || ''}`);
        } else {
            scheduleManager.showError('Không có ca làm việc nào được thêm (có thể đã tồn tại hoặc không tìm thấy nhân viên)');
        }
        
        // Restore button
        aiButton.innerHTML = originalText;
        aiButton.disabled = false;
        
    } catch (error) {
        // Restore button on error
        const aiButton = document.querySelector('.ai-btn');
        aiButton.innerHTML = '<i class="fas fa-robot"></i> Phân Tích Bằng AI';
        aiButton.disabled = false;
        
        console.error('❌ [ParseAI] Error:', error);
        
        let errorMessage = 'Lỗi khi phân tích bằng AI. Vui lòng thử lại.';
        if (error.message.includes('API error')) {
            errorMessage = 'Lỗi API Gemini. Vui lòng kiểm tra kết nối internet.';
        } else if (error.message.includes('parse')) {
            errorMessage = 'AI không hiểu được định dạng tin nhắn. Vui lòng kiểm tra lại.';
        }
        
        scheduleManager.showError(errorMessage);
    }
}

// Global functions for edit staff modal
function closeEditStaffModal() {
    const modal = document.getElementById('editStaffModal');
    modal.style.display = 'none';
    modal.dataset.staffId = '';
    modal.dataset.staffName = '';
    
    // Reset form
    document.getElementById('editStaffForm').reset();
}

async function handleDeleteStaff() {
    const modal = document.getElementById('editStaffModal');
    const staffId = modal.dataset.staffId;
    const staffName = modal.dataset.staffName;
    
    if (!staffId || !staffName) {
        scheduleManager.showError('Không tìm thấy thông tin nhân viên');
        return;
    }
    
    // Confirm deletion
    const confirmMessage = `Bạn có chắc chắn muốn xóa nhân viên "${staffName}"?\n\nVIệc này sẽ xóa tất cả lịch làm việc của nhân viên này và không thể khôi phục.`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        // Add loading to delete button
        const deleteBtn = document.getElementById('deleteStaffBtn');
        const originalText = deleteBtn.innerHTML;
        deleteBtn.innerHTML = '<div class="inline-loading"></div> Đang xóa...';
        deleteBtn.disabled = true;
        
        // Call delete function
        await scheduleManager.deleteStaff(staffId, staffName);
        
        // Close modal on success
        closeEditStaffModal();
        
        // Restore button (though modal will be closed)
        deleteBtn.innerHTML = originalText;
        deleteBtn.disabled = false;
        
    } catch (error) {
        // Restore button on error
        const deleteBtn = document.getElementById('deleteStaffBtn');
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Xóa nhân viên';
        deleteBtn.disabled = false;
        
        console.error('Error in handleDeleteStaff:', error);
    }
}

async function handleEditStaffSubmit(event) {
    event.preventDefault();
    
    const modal = document.getElementById('editStaffModal');
    const staffId = modal.dataset.staffId;
    const name = document.getElementById('editStaffName').value.trim();
    const status = document.getElementById('editStaffStatus').value;
    
    if (!staffId || !name) {
        scheduleManager.showError('Vui lòng nhập đầy đủ thông tin');
        return;
    }
    
    try {
        // Add loading to save button
        const saveBtn = document.getElementById('saveStaffBtn');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<div class="inline-loading"></div> Đang lưu...';
        saveBtn.disabled = true;
        
        await scheduleManager.updateStaff(staffId, name, status);
        
        // Close modal on success
        closeEditStaffModal();
        
        // Restore button (though modal will be closed)
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
        
    } catch (error) {
        // Restore button on error
        const saveBtn = document.getElementById('saveStaffBtn');
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Lưu thay đổi';
        saveBtn.disabled = false;
        
        console.error('Error in handleEditStaffSubmit:', error);
    }
}

// Initialize the schedule manager when the page loads
let scheduleManager;

document.addEventListener('DOMContentLoaded', () => {
    // Check if BigQuery client is available
    if (typeof window.bigqueryClient === 'undefined') {
        console.error('❌ [DOM] BigQuery client not found! Make sure bigquery-client.js is loaded first.');
        return;
    }
    
    try {
        scheduleManager = new ScheduleManager();
        window.scheduleManager = scheduleManager; // Make it globally accessible
        
        // Setup edit staff form event listener
        const editStaffForm = document.getElementById('editStaffForm');
        if (editStaffForm) {
            editStaffForm.addEventListener('submit', handleEditStaffSubmit);
        }
        
        // Setup modal close on overlay click
        const editStaffModal = document.getElementById('editStaffModal');
        if (editStaffModal) {
            editStaffModal.addEventListener('click', (e) => {
                if (e.target === editStaffModal) {
                    closeEditStaffModal();
                }
            });
        }
        
    } catch (error) {
        console.error('❌ [DOM] Failed to create Schedule Manager:', error);
    }
}); 