document.addEventListener('DOMContentLoaded', function() {
    const productNameSelect = document.getElementById('productName');
    const productColorSelect = document.getElementById('productColor');
    const productSizeSelect = document.getElementById('productSize');
    const displayTypeSelect = document.getElementById('displayType');
    const showWarningCheckbox = document.getElementById('showWarning');
    const chartContainer = document.getElementById('chartContainer');
    const tableContainer = document.getElementById('tableContainer');
    const inventoryTableBody = document.getElementById('inventoryTableBody');
    const inventoryChart = document.getElementById('inventoryChart');

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
            inventoryData = responseData.data || [];
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
        inventoryTableBody.innerHTML = '';
        data.forEach(item => {
            const isWarning = checkWarningStatus(item.inventory, item.warning);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.product_name}</td>
                <td>${item.product_color}</td>
                <td>${item.product_size}</td>
                <td class="${isWarning ? 'inventory-warning' : ''}">${item.inventory || 0}</td>
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

        let filteredData = inventoryData.filter(item => {
            const matchesProduct = !selectedProduct || item.product_name === selectedProduct;
            const matchesColor = selectedColors.length === 0 || selectedColors.includes(item.product_color);
            const matchesSize = selectedSizes.length === 0 || selectedSizes.includes(item.product_size);
            const matchesWarning = !showWarningOnly || checkWarningStatus(item.inventory, item.warning);
            return matchesProduct && matchesColor && matchesSize && matchesWarning;
        });

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

    // Lấy dữ liệu ban đầu khi trang được tải
    fetchInventoryData();
}); 