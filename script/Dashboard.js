// Initialize date pickers
const startDatePicker = flatpickr("#startDate", {
    dateFormat: "d/m/Y",
    locale: {
        firstDayOfWeek: 1,
        weekdays: {
            shorthand: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
            longhand: ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"]
        },
        months: {
            shorthand: ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"],
            longhand: ["Tháng một", "Tháng hai", "Tháng ba", "Tháng tư", "Tháng năm", "Tháng sáu", "Tháng bảy", "Tháng tám", "Tháng chín", "Tháng mười", "Tháng mười một", "Tháng mười hai"]
        }
    },
    defaultDate: new Date().setDate(new Date().getDate() - 7),
    onChange: function(selectedDates) {
        if (selectedDates[0] && endDatePicker.selectedDates[0]) {
            fetchData(selectedDates[0], endDatePicker.selectedDates[0]);
        }
    }
});

const endDatePicker = flatpickr("#endDate", {
    dateFormat: "d/m/Y",
    locale: {
        firstDayOfWeek: 1,
        weekdays: {
            shorthand: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
            longhand: ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"]
        },
        months: {
            shorthand: ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"],
            longhand: ["Tháng một", "Tháng hai", "Tháng ba", "Tháng tư", "Tháng năm", "Tháng sáu", "Tháng bảy", "Tháng tám", "Tháng chín", "Tháng mười", "Tháng mười một", "Tháng mười hai"]
        }
    },
    defaultDate: new Date(),
    onChange: function(selectedDates) {
        if (startDatePicker.selectedDates[0] && selectedDates[0]) {
            fetchData(startDatePicker.selectedDates[0], selectedDates[0]);
        }
    }
});

// Initialize select2 dropdowns
$('.select2').select2({
    width: '100%',
    closeOnSelect: true, // Close dropdown when selecting an option
    placeholder: function() {
        return $(this).data('placeholder') || 'Chọn...';
    }
});

// Add "Select All" functionality for multi-select dropdowns
function addSelectAllOption(selectElement, label = 'Chọn tất cả') {
    const $select = $(selectElement);
    
    // Only add for multi-select
    if (!$select.prop('multiple')) return;
    
    $select.on('select2:open', function() {
        const $dropdown = $('.select2-dropdown');
        const $results = $dropdown.find('.select2-results__options');
        
        // Remove existing select-all option
        $results.find('.select-all-option').remove();
        
        // Add select-all option at the top
        const $selectAllOption = $(`
            <li class="select2-results__option select-all-option" role="option">
                <span>${label}</span>
            </li>
        `);
        
        $results.prepend($selectAllOption);
        
        // Handle select-all click
        $selectAllOption.on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const allValues = [];
            $select.find('option').each(function() {
                const value = $(this).val();
                if (value && value !== '') {
                    allValues.push(value);
                }
            });
            
            const currentValues = $select.val() || [];
            
            // If all are selected, deselect all. Otherwise, select all
            if (currentValues.length === allValues.length) {
                $select.val([]).trigger('change');
            } else {
                $select.val(allValues).trigger('change');
            }
        });
        
        // Update select-all appearance based on current selection
        updateSelectAllAppearance($select, $selectAllOption);
    });
    
    // Update select-all appearance when selection changes
    $select.on('change', function() {
        const $selectAllOption = $('.select2-dropdown .select-all-option');
        if ($selectAllOption.length) {
            updateSelectAllAppearance($select, $selectAllOption);
        }
    });
}

// Update select-all option appearance
function updateSelectAllAppearance($select, $selectAllOption) {
    const allValues = [];
    $select.find('option').each(function() {
        const value = $(this).val();
        if (value && value !== '') {
            allValues.push(value);
        }
    });
    
    const currentValues = $select.val() || [];
    const isAllSelected = currentValues.length === allValues.length && allValues.length > 0;
    
    if (isAllSelected) {
        $selectAllOption.attr('aria-selected', 'true');
        $selectAllOption.find('span').text('Bỏ chọn tất cả');
    } else {
        $selectAllOption.attr('aria-selected', 'false');
        $selectAllOption.find('span').text('Chọn tất cả');
    }
}

// Global variables
let salesData = [];
let filteredData = [];
let salesChart = null;
let topProductsChart = null;
let chartVisibility = {
    quantity: true,
    orders: true
};

// Fetch data from API
async function fetchData(startDate, endDate) {
    try {
        // Format dates as YYYY-MM-DD
        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        
        const timeStart = formatDate(startDate);
        const timeEnd = formatDate(endDate);
        
        const response = await fetch('https://n8n.nhtan.app/webhook/get_dashboard_inventories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                time_start: timeStart,
                time_end: timeEnd
            })
        });

        const data = await response.json();
        if (data.message === "success") {
            salesData = data.data;
            updateDashboard();
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Update dashboard with new data
function updateDashboard() {
    updateFilters();
    applyFilters(); // This will update all components with filtered data
}

// Apply filters to data
function applyFilters() {
    let filtered = salesData.filter(item => item.product_name !== null);
    
    // Shop filter
    const selectedShops = $('#shopFilter').val();
    if (selectedShops && selectedShops.length > 0 && !selectedShops.includes('')) {
        filtered = filtered.filter(item => selectedShops.includes(item.shop_name));
    }
    
    // Product filter
    const selectedProducts = $('#productFilter').val();
    if (selectedProducts && selectedProducts.length > 0 && !selectedProducts.includes('')) {
        filtered = filtered.filter(item => selectedProducts.includes(item.product_name));
    }
    
    // Color filter
    const selectedColors = $('#colorFilter').val();
    if (selectedColors && selectedColors.length > 0 && !selectedColors.includes('')) {
        filtered = filtered.filter(item => selectedColors.includes(item.product_color));
    }
    
    // Size filter
    const selectedSizes = $('#sizeFilter').val();
    if (selectedSizes && selectedSizes.length > 0 && !selectedSizes.includes('')) {
        filtered = filtered.filter(item => selectedSizes.includes(item.product_size));
    }
    
    filteredData = filtered;
    updateFilterStatus();
    updateFilterGroupStyles();
    updateDashboardWithFilteredData();
}

// Update filter status display
function updateFilterStatus() {
    const filterStatusSection = document.getElementById('filterStatusSection');
    const resultsCount = document.getElementById('resultsCount');
    
    // Update results count
    resultsCount.textContent = `${filteredData.length} kết quả`;
    
    // Clear existing filter tags
    const shopFiltersContainer = document.querySelector('#shopFilters .category-filters');
    const productFiltersContainer = document.querySelector('#productFilters .category-filters');
    const colorFiltersContainer = document.querySelector('#colorFilters .category-filters');
    const sizeFiltersContainer = document.querySelector('#sizeFilters .category-filters');
    
    shopFiltersContainer.innerHTML = '';
    productFiltersContainer.innerHTML = '';
    colorFiltersContainer.innerHTML = '';
    sizeFiltersContainer.innerHTML = '';
    
    let hasActiveFilters = false;
    
    // Shop filters
    const selectedShops = $('#shopFilter').val();
    if (selectedShops && selectedShops.length > 0 && !selectedShops.includes('')) {
        hasActiveFilters = true;
        document.getElementById('shopFilters').style.display = 'flex';
        selectedShops.forEach(shop => {
            const tag = createFilterTag('shop', shop, () => {
                const currentValues = $('#shopFilter').val().filter(v => v !== shop);
                $('#shopFilter').val(currentValues).trigger('change');
            });
            shopFiltersContainer.appendChild(tag);
        });
    } else {
        document.getElementById('shopFilters').style.display = 'none';
    }
    
    // Product filter
    const selectedProducts = $('#productFilter').val();
    if (selectedProducts && selectedProducts.length > 0 && !selectedProducts.includes('')) {
        hasActiveFilters = true;
        document.getElementById('productFilters').style.display = 'flex';
        selectedProducts.forEach(product => {
            const tag = createFilterTag('product', product, () => {
                const currentValues = $('#productFilter').val().filter(v => v !== product);
                $('#productFilter').val(currentValues).trigger('change');
            });
            productFiltersContainer.appendChild(tag);
        });
    } else {
        document.getElementById('productFilters').style.display = 'none';
    }
    
    // Color filters
    const selectedColors = $('#colorFilter').val();
    if (selectedColors && selectedColors.length > 0 && !selectedColors.includes('')) {
        hasActiveFilters = true;
        document.getElementById('colorFilters').style.display = 'flex';
        selectedColors.forEach(color => {
            const tag = createFilterTag('color', color, () => {
                const currentValues = $('#colorFilter').val().filter(v => v !== color);
                $('#colorFilter').val(currentValues).trigger('change');
            });
            colorFiltersContainer.appendChild(tag);
        });
    } else {
        document.getElementById('colorFilters').style.display = 'none';
    }
    
    // Size filters
    const selectedSizes = $('#sizeFilter').val();
    if (selectedSizes && selectedSizes.length > 0 && !selectedSizes.includes('')) {
        hasActiveFilters = true;
        document.getElementById('sizeFilters').style.display = 'flex';
        selectedSizes.forEach(size => {
            const tag = createFilterTag('size', size, () => {
                const currentValues = $('#sizeFilter').val().filter(v => v !== size);
                $('#sizeFilter').val(currentValues).trigger('change');
            });
            sizeFiltersContainer.appendChild(tag);
        });
    } else {
        document.getElementById('sizeFilters').style.display = 'none';
    }
    
    // Show/hide filter status section
    filterStatusSection.style.display = hasActiveFilters ? 'block' : 'none';
}

// Create filter tag element (simplified - no label prefix)
function createFilterTag(type, value, onRemove) {
    const tag = document.createElement('div');
    tag.className = `filter-tag ${type}`;
    tag.innerHTML = `
        <span>${value}</span>
        <span class="remove-tag" title="Xóa filter này">×</span>
    `;
    
    tag.querySelector('.remove-tag').addEventListener('click', onRemove);
    return tag;
}

// Update filter group styles to show which have selections
function updateFilterGroupStyles() {
    // Remove existing has-selection class
    document.querySelectorAll('.filter-group').forEach(group => {
        group.classList.remove('has-selection');
    });
    
    // Add has-selection class to groups with active filters
    const selectedShops = $('#shopFilter').val();
    if (selectedShops && selectedShops.length > 0 && !selectedShops.includes('')) {
        $('#shopFilter').closest('.filter-group').addClass('has-selection');
    }
    
    const selectedProducts = $('#productFilter').val();
    if (selectedProducts && selectedProducts.length > 0 && !selectedProducts.includes('')) {
        $('#productFilter').closest('.filter-group').addClass('has-selection');
    }
    
    const selectedColors = $('#colorFilter').val();
    if (selectedColors && selectedColors.length > 0 && !selectedColors.includes('')) {
        $('#colorFilter').closest('.filter-group').addClass('has-selection');
    }
    
    const selectedSizes = $('#sizeFilter').val();
    if (selectedSizes && selectedSizes.length > 0 && !selectedSizes.includes('')) {
        $('#sizeFilter').closest('.filter-group').addClass('has-selection');
    }
}

// Clear all filters
function clearAllFilters() {
    $('#shopFilter').val([]).trigger('change');
    $('#productFilter').val('').trigger('change');
    $('#colorFilter').val([]).trigger('change');
    $('#sizeFilter').val([]).trigger('change');
}

// Add clear filters button event listener
document.getElementById('clearFiltersButton').addEventListener('click', clearAllFilters);

// Update dashboard with filtered data
function updateDashboardWithFilteredData() {
    updateOverviewCards();
    updateSalesChart();
    updateTopProductsChart();
    updateSalesTable();
}

// Update overview cards
function updateOverviewCards() {
    const totalQuantity = filteredData.reduce((sum, item) => sum + parseInt(item.total_quantity_sold || 0), 0);
    
    // Count distinct order_ids for total orders
    const uniqueOrderIds = new Set(filteredData.map(item => item.order_id).filter(id => id && id !== 'None'));
    const totalOrders = uniqueOrderIds.size;

    document.getElementById('totalQuantity').textContent = totalQuantity;
    document.getElementById('totalOrders').textContent = totalOrders;
}

// Update sales chart
function updateSalesChart() {
    const salesByDate = {};
    const ordersByDate = {};
    
    filteredData.forEach(item => {
        const date = item.transaction_date;
        if (!salesByDate[date]) {
            salesByDate[date] = 0;
            ordersByDate[date] = new Set();
        }
        salesByDate[date] += parseInt(item.total_quantity_sold || 0);
        
        // Count unique orders per date
        if (item.order_id && item.order_id !== 'None') {
            ordersByDate[date].add(item.order_id);
        }
    });

    const dates = Object.keys(salesByDate).sort();
    const quantities = dates.map(date => salesByDate[date]);
    const orders = dates.map(date => ordersByDate[date] ? ordersByDate[date].size : 0);

    if (salesChart) {
        salesChart.destroy();
    }

    // Create datasets based on visibility
    const datasets = [];
    
    if (chartVisibility.quantity) {
        datasets.push({
            label: 'Số lượng bán',
            data: quantities,
            borderColor: '#4a6bff',
            backgroundColor: '#4a6bff',
            tension: 0.1,
            fill: false,
            yAxisID: 'y'
        });
    }
    
    if (chartVisibility.orders) {
        datasets.push({
            label: 'Số đơn hàng',
            data: orders,
            borderColor: '#ff6b6b',
            backgroundColor: '#ff6b6b',
            tension: 0.1,
            fill: false,
            yAxisID: 'y1'
        });
    }

    const ctx = document.getElementById('salesChart').getContext('2d');
    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: datasets
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Ngày'
                    }
                },
                y: {
                    type: 'linear',
                    display: chartVisibility.quantity,
                    position: 'left',
                    title: {
                        display: chartVisibility.quantity,
                        text: 'Số lượng bán',
                        color: '#4a6bff'
                    },
                    beginAtZero: true,
                    ticks: {
                        color: '#4a6bff'
                    }
                },
                y1: {
                    type: 'linear',
                    display: chartVisibility.orders,
                    position: 'right',
                    title: {
                        display: chartVisibility.orders,
                        text: 'Số đơn hàng',
                        color: '#ff6b6b'
                    },
                    beginAtZero: true,
                    ticks: {
                        color: '#ff6b6b'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            }
        }
    });
}

// Update top products chart
function updateTopProductsChart() {
    const productSales = {};
    filteredData.forEach(item => {
        const key = `${item.product_name} - ${item.product_color} - ${item.product_size}`;
        if (!productSales[key]) {
            productSales[key] = 0;
        }
        productSales[key] += parseInt(item.total_quantity_sold || 0);
    });

    const sortedProducts = Object.entries(productSales)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);

    if (topProductsChart) {
        topProductsChart.destroy();
    }

    const ctx = document.getElementById('topProductsChart').getContext('2d');
    topProductsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedProducts.map(([key]) => key),
            datasets: [{
                label: 'Số lượng bán',
                data: sortedProducts.map(([,value]) => value),
                backgroundColor: '#4a6bff'
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                x: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Update sales table
function updateSalesTable() {
    const salesByDate = {};
    filteredData.forEach(item => {
        const date = item.transaction_date;
        if (!salesByDate[date]) {
            salesByDate[date] = [];
        }
        salesByDate[date].push(item);
    });

    const tableContainer = document.getElementById('salesTable');
    tableContainer.innerHTML = '';

    Object.entries(salesByDate)
        .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
        .forEach(([date, items]) => {
            const accordion = document.createElement('div');
            accordion.className = 'accordion';
            
            let sortDesc = true;
            
            // Group items by product details and sum quantities
            const groupedItems = {};
            items.forEach(item => {
                const key = `${item.shop_name || 'N/A'}_${item.product_name}_${item.product_color}_${item.product_size}`;
                if (!groupedItems[key]) {
                    groupedItems[key] = {
                        shop_name: item.shop_name || 'N/A',
                        product_name: item.product_name,
                        product_color: item.product_color,
                        product_size: item.product_size,
                        total_quantity_sold: 0
                    };
                }
                groupedItems[key].total_quantity_sold += parseInt(item.total_quantity_sold || 0);
            });
            
            let sortedItems = Object.values(groupedItems).sort((a, b) => parseInt(b.total_quantity_sold || 0) - parseInt(a.total_quantity_sold || 0));
            
            const renderTable = () => {
                return `
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Cửa hàng</th>
                                <th>Sản phẩm</th>
                                <th>Màu sắc</th>
                                <th>Kích thước</th>
                                <th style="cursor:pointer" id="sortQty">Số lượng <i class="fas fa-sort"></i></th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sortedItems.map(item => `
                                <tr>
                                    <td>${item.shop_name}</td>
                                    <td>${item.product_name}</td>
                                    <td>${item.product_color}</td>
                                    <td>${item.product_size}</td>
                                    <td>${parseInt(item.total_quantity_sold || 0)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            };

            const totalQuantity = items.reduce((sum, item) => sum + parseInt(item.total_quantity_sold || 0), 0);
            const uniqueOrderIds = new Set(items.map(item => item.order_id).filter(id => id && id !== 'None'));
            const totalOrders = uniqueOrderIds.size;

            accordion.innerHTML = `
                <div class="accordion-header">
                    <span>${date} - Tổng số lượng: ${totalQuantity} | Tổng đơn: ${totalOrders}</span>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="accordion-content">
                    ${renderTable()}
                </div>
            `;

            accordion.querySelector('.accordion-header').addEventListener('click', () => {
                accordion.classList.toggle('active');
            });

            // Add sort event
            accordion.querySelector('#sortQty').addEventListener('click', function(e) {
                sortDesc = !sortDesc;
                sortedItems = Object.values(groupedItems).sort((a, b) => sortDesc
                    ? parseInt(b.total_quantity_sold || 0) - parseInt(a.total_quantity_sold || 0)
                    : parseInt(a.total_quantity_sold || 0) - parseInt(b.total_quantity_sold || 0)
                );
                accordion.querySelector('.accordion-content').innerHTML = renderTable();
                // Re-attach sort event after re-render
                accordion.querySelector('#sortQty').addEventListener('click', arguments.callee);
            });

            tableContainer.appendChild(accordion);
        });
}

// Update filters
function updateFilters() {
    // Filter out items with null product_name
    const validItems = salesData.filter(item => item.product_name !== null);
    
    const shops = [...new Set(validItems.map(item => item.shop_name).filter(shop => shop))];
    const products = [...new Set(validItems.map(item => item.product_name))];
    const colors = [...new Set(validItems.map(item => item.product_color))];
    const sizes = [...new Set(validItems.map(item => item.product_size))];

    const shopFilter = $('#shopFilter');
    const productFilter = $('#productFilter');
    const colorFilter = $('#colorFilter');
    const sizeFilter = $('#sizeFilter');

    shopFilter.empty().append('<option value="">Tất cả cửa hàng</option>');
    productFilter.empty().append('<option value="">Tất cả sản phẩm</option>');
    colorFilter.empty().append('<option value="">Tất cả màu</option>');
    sizeFilter.empty().append('<option value="">Tất cả size</option>');

    shops.forEach(shop => {
        shopFilter.append(`<option value="${shop}">${shop}</option>`);
    });

    products.forEach(product => {
        productFilter.append(`<option value="${product}">${product}</option>`);
    });

    colors.forEach(color => {
        colorFilter.append(`<option value="${color}">${color}</option>`);
    });

    sizes.forEach(size => {
        sizeFilter.append(`<option value="${size}">${size}</option>`);
    });

    // Reinitialize Select2 with updated options
    shopFilter.select2({
        width: '100%',
        closeOnSelect: true,
        placeholder: `Chọn cửa hàng (${shops.length} có sẵn)`,
        allowClear: true
    });
    
    productFilter.select2({
        width: '100%',
        closeOnSelect: true,
        placeholder: `Chọn sản phẩm (${products.length} có sẵn)`,
        allowClear: true
    });
    
    colorFilter.select2({
        width: '100%',
        closeOnSelect: true,
        placeholder: `Chọn màu (${colors.length} có sẵn)`,
        allowClear: true
    });
    
    sizeFilter.select2({
        width: '100%',
        closeOnSelect: true,
        placeholder: `Chọn size (${sizes.length} có sẵn)`,
        allowClear: true
    });

    // Add "Select All" functionality to multi-select dropdowns
    addSelectAllOption('#shopFilter', 'Chọn tất cả cửa hàng');
    addSelectAllOption('#productFilter', 'Chọn tất cả sản phẩm');
    addSelectAllOption('#colorFilter', 'Chọn tất cả màu');
    addSelectAllOption('#sizeFilter', 'Chọn tất cả size');

    // Add event listeners for filters
    shopFilter.off('change').on('change', applyFilters);
    productFilter.off('change').on('change', applyFilters);
    colorFilter.off('change').on('change', applyFilters);
    sizeFilter.off('change').on('change', applyFilters);
    
    // Initialize filtered data
    filteredData = validItems;
}

// Export to Excel
document.getElementById('exportButton').addEventListener('click', () => {
    const wb = XLSX.utils.book_new();
    
    // Group and prepare data for export using filtered data
    const groupedExportData = {};
    filteredData.forEach(item => {
        const key = `${item.transaction_date}_${item.shop_name || 'N/A'}_${item.product_name}_${item.product_color}_${item.product_size}`;
        if (!groupedExportData[key]) {
            groupedExportData[key] = {
        'Ngày': item.transaction_date,
        'Cửa hàng': item.shop_name || 'N/A',
        'Sản phẩm': item.product_name,
        'Màu sắc': item.product_color,
        'Kích thước': item.product_size,
                'Số lượng bán': 0
            };
        }
        groupedExportData[key]['Số lượng bán'] += parseInt(item.total_quantity_sold || 0);
    });
    
    const exportData = Object.values(groupedExportData);

    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Báo cáo bán hàng");
    XLSX.writeFile(wb, "bao_cao_ban_hang.xlsx");
});

// Toggle line visibility functions
function toggleLineVisibility(lineType) {
    chartVisibility[lineType] = !chartVisibility[lineType];
    
    // Update button appearance
    const button = document.querySelector(`[data-line="${lineType}"]`);
    const icon = button.querySelector('i');
    
    if (chartVisibility[lineType]) {
        button.classList.remove('inactive');
        button.classList.add('active');
        icon.className = 'fas fa-eye';
    } else {
        button.classList.remove('active');
        button.classList.add('inactive');
        icon.className = 'fas fa-eye-slash';
    }
    
    // Update chart
    updateSalesChart();
}

// Add event listeners for toggle buttons
document.getElementById('toggleQuantityLine').addEventListener('click', () => {
    toggleLineVisibility('quantity');
});

document.getElementById('toggleOrdersLine').addEventListener('click', () => {
    toggleLineVisibility('orders');
});

// Initialize dashboard with last 30 days data
const endDate = new Date();
const startDate = new Date();
startDate.setDate(startDate.getDate() - 30);
fetchData(startDate, endDate); 