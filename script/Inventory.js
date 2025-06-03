document.addEventListener('DOMContentLoaded', function() {
    const productNameSelect = document.getElementById('productName');
    const productColorSelect = document.getElementById('productColor');
    const productSizeSelect = document.getElementById('productSize');
    const displayTypeSelect = document.getElementById('displayType');
    const showWarningCheckbox = document.getElementById('showWarning');
    const minQuantityInput = document.getElementById('minQuantity');
    const sortColumnSelect = document.getElementById('sortColumn');
    const sortDirectionSelect = document.getElementById('sortDirection');
    const chartContainer = document.getElementById('chartContainer');
    const tableContainer = document.getElementById('tableContainer');
    const inventoryTableBody = document.getElementById('inventoryTableBody');
    const inventoryChart = document.getElementById('inventoryChart');
    const bulkUpdateButton = document.getElementById('bulkUpdateButton');
    const MAX_INVENTORY = 1000000000;
    let inventoryData = [];
    let chart = null;

    // Khởi tạo Select2
    $('.select2').select2({
        placeholder: 'Chọn...',
        allowClear: true,
        width: '100%'
    });

    // Hàm gọi API để lấy dữ liệu tồn kho
    async function fetchInventoryData() {
        try {
            const response = await fetch('https://n8n.nhtan.app/webhook/get_inventories');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const responseData = await response.json();
            console.log('Fetched inventory data:', responseData);
            inventoryData = responseData.data || [];
            
            // Kiểm tra dữ liệu tồn kho
            if (inventoryData.length > 0) {
                console.log('First item inventory:', inventoryData[0].inventory, 'Type:', typeof inventoryData[0].inventory);
            }
            
            updateFilterOptions();
            // Chọn sản phẩm đầu tiên mặc định
            if (inventoryData.length > 0) {
                const firstProduct = inventoryData[0].product_name;
                $(productNameSelect).val(firstProduct).trigger('change');
            }
        } catch (error) {
            console.error('Error fetching inventory data:', error);
            alert('Có lỗi xảy ra khi lấy dữ liệu tồn kho. Vui lòng thử lại sau.');
        }
    }
    
    // Hàm gửi cập nhật hàng loạt tồn kho
    async function updateBulkInventory(updateData) {
        try {
            const response = await fetch('https://n8n.nhtan.app/webhook-test/update_inventories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            const result = await response.json();
            console.log('Update result:', result);
            
            // Refresh data after update
            await fetchInventoryData();
            alert('Cập nhật tồn kho thành công!');
            
        } catch (error) {
            console.error('Error updating inventory:', error);
            alert('Có lỗi xảy ra khi cập nhật tồn kho. Vui lòng thử lại sau.');
        }
    }

    // Hàm cập nhật các tùy chọn lọc
    function updateFilterOptions() {
        // Lấy danh sách tên sản phẩm, màu sắc và kích thước duy nhất
        const productNames = [...new Set(inventoryData.map(item => item.product_name))];
        const productColors = [...new Set(inventoryData.map(item => item.product_color))];
        const productSizes = [...new Set(inventoryData.map(item => item.product_size))];

        // Cập nhật select tên sản phẩm
        productNameSelect.innerHTML = '<option value="">Chọn sản phẩm</option>';
        productNames.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            productNameSelect.appendChild(option);
        });

        // Cập nhật select màu sắc
        productColorSelect.innerHTML = '<option value="">Tất cả</option>';
        productColors.forEach(color => {
            const option = document.createElement('option');
            option.value = color;
            option.textContent = color;
            productColorSelect.appendChild(option);
        });

        // Cập nhật select kích thước
        productSizeSelect.innerHTML = '<option value="">Tất cả</option>';
        productSizes.forEach(size => {
            const option = document.createElement('option');
            option.value = size;
            option.textContent = size;
            productSizeSelect.appendChild(option);
        });

        // Cập nhật lại Select2
        $('.select2').trigger('change');
    }

    // Hàm kiểm tra trạng thái warning
    function checkWarningStatus(inventory, warning) {
        return warning && inventory <= warning;
    }

    // Hàm hiển thị dữ liệu lên bảng
    function displayInventoryData(data) {
        console.log('Displaying inventory data:', data.slice(0, 3)); // Log first 3 items
        inventoryTableBody.innerHTML = '';
        data.forEach(item => {
            const inventory = parseInt(item.inventory) || 0;
            const isWarning = checkWarningStatus(inventory, item.warning);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.product_name}</td>
                <td>${item.product_color}</td>
                <td>${item.product_size}</td>
                <td class="${isWarning ? 'inventory-warning' : ''}">${inventory}</td>
                <td>${item.warning || 'Chưa thiết lập'}</td>
                <td>
                    <div class="status-cell">
                        <span class="status-indicator ${isWarning ? 'status-warning' : 'status-normal'}"></span>
                        ${isWarning ? 'Cần nhập hàng' : 'Bình thường'}
                    </div>
                </td>
            `;
            inventoryTableBody.appendChild(row);
        });
    }

    // Hàm cập nhật biểu đồ
    function updateChart(data) {
        // Tạo dữ liệu cho biểu đồ
        const productGroups = {};
        const warningGroups = {};
        
        data.forEach(item => {
            const key = `${item.product_color} - ${item.product_size}`;
            if (!productGroups[key]) {
                productGroups[key] = 0;
                warningGroups[key] = item.warning || 0;
            }
            productGroups[key] += parseInt(item.inventory || 0);
        });

        const labels = Object.keys(productGroups);
        const values = Object.values(productGroups);
        const warnings = Object.values(warningGroups);

        // Xóa biểu đồ cũ nếu tồn tại
        if (chart) {
            chart.destroy();
        }

        // Tạo biểu đồ mới
        const ctx = inventoryChart.getContext('2d');
        chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Số lượng tồn kho',
                        data: values,
                        backgroundColor: values.map((value, index) => 
                            value <= warnings[index] ? 'rgba(220, 53, 69, 0.5)' : 'rgba(74, 107, 255, 0.5)'
                        ),
                        borderColor: values.map((value, index) => 
                            value <= warnings[index] ? 'rgba(220, 53, 69, 1)' : 'rgba(74, 107, 255, 1)'
                        ),
                        borderWidth: 1
                    },
                    {
                        label: 'Mức cảnh báo',
                        data: warnings,
                        type: 'line',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderDash: [5, 5],
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (context.dataset.label === 'Số lượng tồn kho') {
                                    const warning = warnings[context.dataIndex];
                                    const value = context.raw;
                                    return [
                                        `Số lượng: ${value}`,
                                        `Mức cảnh báo: ${warning}`,
                                        value <= warning ? 'Trạng thái: Cần nhập hàng' : 'Trạng thái: Bình thường'
                                    ];
                                }
                                return `${context.dataset.label}: ${context.raw}`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Hàm lọc dữ liệu
    function filterInventoryData() {
        const selectedProduct = $(productNameSelect).val();
        const selectedColors = $(productColorSelect).val() || [];
        const selectedSizes = $(productSizeSelect).val() || [];
        const showWarningOnly = showWarningCheckbox.checked;
        const minQuantity = parseInt(minQuantityInput.value) || MAX_INVENTORY;
        const sortColumn = $(sortColumnSelect).val();
        const sortDirection = $(sortDirectionSelect).val();

        let filteredData = inventoryData.filter(item => {
            const matchesProduct = !selectedProduct || item.product_name === selectedProduct;
            const matchesColor = selectedColors.length === 0 || selectedColors.includes(item.product_color);
            const matchesSize = selectedSizes.length === 0 || selectedSizes.includes(item.product_size);
            const matchesWarning = !showWarningOnly || checkWarningStatus(item.inventory, item.warning);
            const matchesQuantity = parseInt(item.inventory) <= minQuantity;
            return matchesProduct && matchesColor && matchesSize && matchesWarning && matchesQuantity;
        });

        // Sắp xếp dữ liệu nếu có chọn cột sắp xếp
        if (sortColumn) {
            filteredData.sort((a, b) => {
                let valueA = a[sortColumn];
                let valueB = b[sortColumn];

                // Chuyển đổi số lượng tồn và mức cảnh báo thành số
                if (sortColumn === 'inventory' || sortColumn === 'warning') {
                    console.log(`valueA: ${valueA} - valueB: ${valueB}`);
                    valueA = parseInt(valueA) || 0;
                    valueB = parseInt(valueB) || 0;
                }

                if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
                if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        displayInventoryData(filteredData);
        updateChart(filteredData);
    }

    // Hàm chuyển đổi hiển thị
    function toggleDisplay() {
        const displayType = $(displayTypeSelect).val();
        if (displayType === 'chart') {
            chartContainer.style.display = 'block';
            tableContainer.style.display = 'none';
        } else {
            chartContainer.style.display = 'none';
            tableContainer.style.display = 'block';
        }
    }

    // Sự kiện thay đổi cho các select và checkbox
    $(productNameSelect).on('change', filterInventoryData);
    $(productColorSelect).on('change', filterInventoryData);
    $(productSizeSelect).on('change', filterInventoryData);
    $(displayTypeSelect).on('change', toggleDisplay);
    showWarningCheckbox.addEventListener('change', filterInventoryData);
    minQuantityInput.addEventListener('input', filterInventoryData);
    $(sortColumnSelect).on('change', filterInventoryData);
    $(sortDirectionSelect).on('change', filterInventoryData);
    
    // Thêm nút cập nhật hàng loạt
    function addBulkUpdateButton() {
        const filterContainer = document.querySelector('.card-body');
        if (filterContainer) {
            const bulkUpdateBtn = document.createElement('button');
            bulkUpdateBtn.className = 'btn btn-primary mt-3';
            bulkUpdateBtn.textContent = 'Cập Nhật Hàng Loạt';
            bulkUpdateBtn.addEventListener('click', navigateToBulkUpdatePage);
            filterContainer.appendChild(bulkUpdateBtn);
        }
    }
    
    // Hàm chuyển hướng đến trang cập nhật hàng loạt
    function navigateToBulkUpdatePage() {
        // Lưu dữ liệu hiện tại vào localStorage để có thể sử dụng ở trang khác
        localStorage.setItem('inventoryData', JSON.stringify(inventoryData));
        
        // Chuyển hướng đến trang cập nhật hàng loạt
        window.location.href = 'bulk-update.html';
    }
    
    // Thêm nút cập nhật hàng loạt
    addBulkUpdateButton();

    // Thêm sự kiện cho nút bulkUpdateButton trong HTML
    if (bulkUpdateButton) {
        bulkUpdateButton.addEventListener('click', navigateToBulkUpdatePage);
    }

    // Sync inventory function
    async function syncInventory() {
        const button = document.getElementById('syncInventoryButton');
        const originalText = button.innerHTML;
        
        try {
            // Disable button and show loading state
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang đồng bộ...';
            
            const response = await fetch('https://n8n.nhtan.app/webhook/sync_inventory', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert('Đồng bộ kho thành công!');
                
                // Refresh inventory data after successful sync
                await fetchInventoryData();
            } else {
                throw new Error(data.message || 'Có lỗi xảy ra khi đồng bộ kho');
            }
        } catch (error) {
            console.error('Error syncing inventory:', error);
            alert('Lỗi khi đồng bộ kho: ' + error.message);
        } finally {
            // Re-enable button and restore original text
            button.disabled = false;
            button.innerHTML = originalText;
        }
    }

    // Sync inventory button event listener
    const syncInventoryButton = document.getElementById('syncInventoryButton');
    if (syncInventoryButton) {
        syncInventoryButton.addEventListener('click', () => {
            // Show confirmation dialog
            const confirmSync = confirm('Bạn có chắc chắn muốn đồng bộ kho không? Quá trình này có thể mất vài phút.');
            
            if (confirmSync) {
                syncInventory();
            }
        });
    }

    // Lấy dữ liệu ban đầu khi trang được tải
    fetchInventoryData();
}); 