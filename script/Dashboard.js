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
    defaultDate: new Date().setDate(new Date().getDate() - 30),
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
    width: '100%'
});

// Global variables
let salesData = [];
let salesChart = null;
let topProductsChart = null;

// Fetch data from API
async function fetchData(startDate, endDate) {
    try {
        const response = await fetch('https://n8n.nhtan.app/webhook/get_dashboard_inventories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                time_start: startDate.toISOString(),
                time_end: endDate.toISOString()
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
    updateOverviewCards();
    updateSalesChart();
    updateTopProductsChart();
    updateSalesTable();
    updateFilters();
}

// Update overview cards
function updateOverviewCards() {
    // Filter out items with null product_name (these seem to be invalid entries)
    const validItems = salesData.filter(item => item.product_name !== null);
    
    const totalQuantity = validItems.reduce((sum, item) => sum + parseInt(item.total_quantity_sold || 0), 0);
    const totalOrders = validItems.reduce((sum, item) => sum + parseInt(item.total_orders_per_day || 0), 0);

    document.getElementById('totalQuantity').textContent = totalQuantity;
    document.getElementById('totalOrders').textContent = totalOrders;
}

// Update sales chart
function updateSalesChart() {
    // Filter out items with null product_name
    const validItems = salesData.filter(item => item.product_name !== null);
    
    const salesByDate = {};
    validItems.forEach(item => {
        const date = item.transaction_date;
        if (!salesByDate[date]) {
            salesByDate[date] = 0;
        }
        salesByDate[date] += parseInt(item.total_quantity_sold || 0);
    });

    const dates = Object.keys(salesByDate).sort();
    const quantities = dates.map(date => salesByDate[date]);

    if (salesChart) {
        salesChart.destroy();
    }

    const ctx = document.getElementById('salesChart').getContext('2d');
    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Số lượng bán',
                data: quantities,
                borderColor: '#4a6bff',
                tension: 0.1,
                fill: false
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Update top products chart
function updateTopProductsChart() {
    // Filter out items with null product_name
    const validItems = salesData.filter(item => item.product_name !== null);
    
    const productSales = {};
    validItems.forEach(item => {
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
    // Filter out items with null product_name
    const validItems = salesData.filter(item => item.product_name !== null);
    
    const salesByDate = {};
    validItems.forEach(item => {
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
            let sortedItems = [...items].sort((a, b) => parseInt(b.total_quantity_sold || 0) - parseInt(a.total_quantity_sold || 0));
            
            const renderTable = () => {
                return `
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Sản phẩm</th>
                                <th>Màu sắc</th>
                                <th>Kích thước</th>
                                <th style="cursor:pointer" id="sortQty">Số lượng <i class="fas fa-sort"></i></th>
                                <th>Số đơn</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sortedItems.map(item => `
                                <tr>
                                    <td>${item.product_name}</td>
                                    <td>${item.product_color}</td>
                                    <td>${item.product_size}</td>
                                    <td>${parseInt(item.total_quantity_sold || 0)}</td>
                                    <td>${parseInt(item.total_orders_per_day || 0)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            };

            const totalQuantity = items.reduce((sum, item) => sum + parseInt(item.total_quantity_sold || 0), 0);
            const totalOrders = items.reduce((sum, item) => sum + parseInt(item.total_orders_per_day || 0), 0);

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
                sortedItems = [...items].sort((a, b) => sortDesc
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
    
    const products = [...new Set(validItems.map(item => item.product_name))];
    const colors = [...new Set(validItems.map(item => item.product_color))];
    const sizes = [...new Set(validItems.map(item => item.product_size))];

    const productFilter = $('#productFilter');
    const colorFilter = $('#colorFilter');
    const sizeFilter = $('#sizeFilter');

    productFilter.empty().append('<option value="">Tất cả sản phẩm</option>');
    colorFilter.empty().append('<option value="">Tất cả màu</option>');
    sizeFilter.empty().append('<option value="">Tất cả size</option>');

    products.forEach(product => {
        productFilter.append(`<option value="${product}">${product}</option>`);
    });

    colors.forEach(color => {
        colorFilter.append(`<option value="${color}">${color}</option>`);
    });

    sizes.forEach(size => {
        sizeFilter.append(`<option value="${size}">${size}</option>`);
    });
}

// Export to Excel
document.getElementById('exportButton').addEventListener('click', () => {
    const wb = XLSX.utils.book_new();
    
    // Filter out items with null product_name
    const validItems = salesData.filter(item => item.product_name !== null);
    
    // Prepare data for export
    const exportData = validItems.map(item => ({
        'Ngày': item.transaction_date,
        'Sản phẩm': item.product_name,
        'Màu sắc': item.product_color,
        'Kích thước': item.product_size,
        'Số lượng bán': parseInt(item.total_quantity_sold || 0),
        'Số đơn': parseInt(item.total_orders_per_day || 0)
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Báo cáo bán hàng");
    XLSX.writeFile(wb, "bao_cao_ban_hang.xlsx");
});

// Initialize dashboard with last 30 days data
const endDate = new Date();
const startDate = new Date();
startDate.setDate(startDate.getDate() - 30);
fetchData(startDate, endDate); 