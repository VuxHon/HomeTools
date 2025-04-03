// Shop data
const shops = [
    { shortName: "DN", fullName: "BY.DUNI", phone: "0345.060.007"},
    { shortName: "ZB", fullName: "ZIBUU", phone: "079.471.702"}
];

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    populateShopDropdown();
    updateShopInfo();
    addProductRow(); // Add first row by default
});

// Populate shop dropdown
function populateShopDropdown() {
    const shopDropdown = document.getElementById('shop-name');
    shops.forEach(shop => {
        const option = document.createElement('option');
        option.value = shop.shortName;
        option.textContent = shop.fullName;
        shopDropdown.appendChild(option);
    });
}

// Update shop information
function updateShopInfo() {
    const shopDropdown = document.getElementById('shop-name');
    const shop = shops.find(s => s.shortName === shopDropdown.value);
    if (shop) {
        document.getElementById('shop-phone').value = shop.phone;
        document.getElementById('invoice-id').value = shop.shortName + Date.now();
        document.getElementById('invoice-date').value = new Date().toLocaleString('vi-VN');
    }
}

// Add a product row to the table
function addProductRow() {
    const table = document.getElementById('order-table').getElementsByTagName('tbody')[0];
    const row = table.insertRow();
    row.innerHTML = `
        <td><input type="text" placeholder="Tên sản phẩm"></td>
        <td><input type="text" placeholder="Đơn giá" oninput="formatAndCalculateRowTotal(this, 'price')"></td>
        <td><input type="text" placeholder="Số lượng" oninput="formatAndCalculateRowTotal(this, 'quantity')"></td>
        <td><input type="text" readonly></td>
        <td><button class="action-btn remove-btn" onclick="removeProductRow(this)"><i class="fas fa-trash"></i></button></td>`;
}

// Remove a product row
function removeProductRow(button) {
    button.closest('tr').remove();
    calculateTotal();
}

// Format number with thousands separators
function formatNumber(num) {
    return num.toLocaleString('vi-VN');
}

// Parse a formatted number string
function parseNumber(numStr) {
    return parseInt(numStr.replace(/\D/g, '')) || 0;
}

// Format and calculate row total
function formatAndCalculateRowTotal(input, type) {
    const row = input.closest('tr');
    if (type === 'price' || type === 'quantity') {
        input.value = formatNumber(parseNumber(input.value));
    }
    const price = parseNumber(row.cells[1].querySelector('input').value);
    const quantity = parseNumber(row.cells[2].querySelector('input').value);
    const total = price * quantity;
    row.cells[3].querySelector('input').value = formatNumber(total);
    calculateTotal();
}

// Format and calculate total
function formatAndCalculateTotal(input, type) {
    if (type === 'discount' || type === 'shipping' || type === 'deposit') {
        const value = parseNumber(input.value);
        input.value = formatNumber(value);
    }
    calculateTotal();
}

// Calculate order total
function calculateTotal() {
    const table = document.getElementById('order-table').getElementsByTagName('tbody')[0];
    let totalQuantity = 0, totalPrice = 0;

    Array.from(table.rows).forEach(row => {
        const quantity = parseNumber(row.cells[2].querySelector('input').value);
        const rowTotal = parseNumber(row.cells[3].querySelector('input').value);
        totalQuantity += quantity;
        totalPrice += rowTotal;
    });

    const discount = parseNumber(document.getElementById('discount').value);
    const shippingFee = parseNumber(document.getElementById('shipping-fee').value);
    const finalTotal = totalPrice - discount + shippingFee;

    document.getElementById('total-quantity').value = formatNumber(totalQuantity);
    document.getElementById('total-price').value = formatNumber(totalPrice);
    document.getElementById('final-total').value = formatNumber(finalTotal);
}

// Get all form data
function getData() {
    return {
        shopName: document.getElementById('shop-name').options[document.getElementById('shop-name').selectedIndex].text,
        shopPhone: document.getElementById('shop-phone').value,
        invoiceId: document.getElementById('invoice-id').value,
        invoiceDate: document.getElementById('invoice-date').value,
        customerName: document.getElementById('customer-name').value,
        customerPhone: document.getElementById('customer-phone').value,
        customerAddress: document.getElementById('customer-address').value,
        orderItems: Array.from(document.getElementById('order-table').getElementsByTagName('tbody')[0].rows).map(row => ({
            productName: row.cells[0].querySelector('input').value,
            unitPrice: row.cells[1].querySelector('input').value,
            quantity: row.cells[2].querySelector('input').value,
            total: row.cells[3].querySelector('input').value,
        })),
        totalQuantity: document.getElementById('total-quantity').value,
        totalPrice: document.getElementById('total-price').value,
        discount: document.getElementById('discount').value,
        shippingFee: document.getElementById('shipping-fee').value,
        finalTotal: document.getElementById('final-total').value,
        depositAmount: document.getElementById('deposit-amount').value,
        depositNote: document.getElementById('deposit-note').value
    };
}

// Render HTML for bill
function renderHTML(data) {
    const htmlContent = `
        <div id="invoice" style="width: 105mm; height: 148mm; padding: 10mm; font-family: Arial, sans-serif; font-size: 12px; border: 1px solid #000; box-sizing: border-box; margin: 0 auto; background-color: white; color: black;">
            <div class="shop-info" style="display: inline-block">
                <h2 style="text-align: center; font-size: 16px; font-weight: bold;"><img src="../logo/${data.shopName}.png" style="width:20%; height: auto"></img></h2>
                <p style="text-align: left; font-size: 10px;"><strong>SĐT: </strong> ${data.shopPhone}</p>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 5px;">
                <p><strong>Mã hóa đơn:</strong> ${data.invoiceId}</p>
                <p><strong>Ngày tạo:</strong> ${data.invoiceDate}</p>
            </div>
            <hr style="border: 1px solid #000; margin: 8px 0;">
            
            <h4 style="font-size: 13px; font-weight: bold; margin-bottom: 5px;">Gửi đến:</h4>
            <p style="font-size: 11px;"><strong>Tên khách hàng: </strong>${data.customerName} <br> <strong>Địa chỉ: </strong>${data.customerAddress} <br><strong>SĐT: </strong> ${data.customerPhone}</p>
            
            <hr style="border: 1px solid #000; margin: 8px 0;">
            
            <table style="width: 100%; border-collapse: collapse; font-size: 11px; color: black; background-color: white;">
                <thead>
                    <tr style="font-weight: bold; text-align: left; background-color: white; color: black;">
                        <th style="border: 1.2px solid #000; padding: 6px; background-color: white; color: black; font-weight: bold;">Tên sản phẩm</th>
                        <th style="border: 1.2px solid #000; padding: 6px; background-color: white; color: black; font-weight: bold;">Đơn giá</th>
                        <th style="border: 1.2px solid #000; padding: 6px; background-color: white; color: black; font-weight: bold;">Số lượng</th>
                        <th style="border: 1.2px solid #000; padding: 6px; background-color: white; color: black; font-weight: bold;">Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.orderItems.map(item => `
                        <tr style="background-color: white; color: black;">
                            <td style="border: 1.2px solid #000; padding: 6px; background-color: white; color: black;">${item.productName}</td>
                            <td style="border: 1.2px solid #000; padding: 6px; background-color: white; color: black;">${item.unitPrice}₫</td>
                            <td style="border: 1.2px solid #000; padding: 6px; text-align: center; background-color: white; color: black;">${item.quantity}</td>
                            <td style="border: 1.2px solid #000; padding: 6px; background-color: white; color: black;">${item.total}₫</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <hr style="border: 1px solid #000; margin: 8px 0;">

            <p style="font-size: 11px; text-align: right; color: black;"><strong>Tạm tính:</strong> ${data.totalPrice}₫</p>
            <p style="font-size: 11px; text-align: right; color: black;"><strong>Khuyến mãi:</strong> ${data.discount}₫</p>
            <p style="font-size: 11px; text-align: right; color: black;"><strong>Phí ship:</strong> ${data.shippingFee}₫</p>
            <p style="font-size: 14px; font-weight: bold; text-align: right; color: black;">Tổng cộng: ${data.finalTotal}₫</p>
            <p style="font-size: 11px; margin-top: 20px; color: black;">Thanh toán cho ${data.shopName}</p>
            <p style="font-size: 11px; margin-top: 5px; color: black;">Nếu có bất kỳ thắc mắc nào về đơn hàng, bạn vui lòng liên hệ ${data.shopName}, ${data.shopPhone} nhé!</p>
            <p style="text-align: center; font-size: 11px; margin-top: 20px; font-weight: bold; color: black;">Cảm ơn bạn đã mua hàng!</p>
        </div>
    `;
    return htmlContent;
}

// Convert HTML to PDF
function convertHTMLToPDF(htmlContent, invoiceId) {
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    document.body.appendChild(element);
    
    // Format filename with invoice ID
    const filename = `HoaDon_${invoiceId}.pdf`;
    
    const opt = {
        margin: [0, 0],
        filename: filename,
        html2canvas: { 
            scale: 3,  // Tăng scale để có chất lượng cao hơn
            useCORS: true,
            removeContainer: true,
            letterRendering: true
        },
        jsPDF: { 
            unit: 'mm', 
            format: [105, 148], 
            orientation: 'portrait', 
            compress: false,  // Tắt nén để chất lượng tốt hơn
            precision: 16,
            background: '#FFFFFF'
        }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        document.body.removeChild(element);
    });
}

// Create QR Code page
function createQRCodePage(qrCodeUrl, amount) {
    return `
        <div id="qr-page" style="width: 105mm; height: 148mm; padding: 10mm; font-family: Arial, sans-serif; font-size: 10px; border: 1px solid #000; box-sizing: border-box; margin: 0 auto; background-color: white; color: black;">
            <h2 style="text-align: center; font-size: 14px; font-weight: bold; margin-bottom: 10px; color: black;">Mã QR Thanh Toán</h2>
            <div style="text-align: center; margin-bottom: 10px;">
                <img src="${qrCodeUrl}" style="max-width: 90%; height: auto;">
            </div>
            <p style="text-align: center; font-size: 11px; margin-top: 10px; color: black; font-weight: bold;">Số tiền: ${amount}₫</p>
            <p style="text-align: center; font-size: 11px; margin-top: 5px; color: black;">Vui lòng quét mã QR để thanh toán</p>
        </div>
    `;
}

// Fetch QR Code
async function fetchQRCode(amount, note) {
    const amountWithoutCommas = amount.replace(/\D/g, '');
    const noteToUse = note || `${document.getElementById('invoice-id').value}`;
    const url = `https://img.vietqr.io/image/ACB-35041687-print.png?amount=${amountWithoutCommas}&accountName=NGUYEN%20HUU%20TAN&addInfo=${encodeURIComponent(noteToUse)}`;
    
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error('Error fetching QR code:', error);
        return null;
    }
}

// Generate PDF
async function generatePDF() {
    const data = getData();
    const invoiceContent = renderHTML(data);
    
    const amountToUse = parseNumber(data.depositAmount) > 0 ? data.depositAmount : data.finalTotal;
    const noteToUse = data.depositNote || "";
    
    const qrCodeUrl = await fetchQRCode(amountToUse, noteToUse);
    if (qrCodeUrl) {
        const qrCodePage = createQRCodePage(qrCodeUrl, amountToUse);
        const combinedContent = invoiceContent + qrCodePage;
        convertHTMLToPDF(combinedContent, data.invoiceId);
    } else {
        convertHTMLToPDF(invoiceContent, data.invoiceId);
    }
}

// Show popup
function showPopup() {
    document.getElementById('overlay').style.display = 'block';
    document.getElementById('popup').style.display = 'block';
}

// Hide popup
function hidePopup() {
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('popup').style.display = 'none';
}

// Download PDF
function downloadPDF() {
    const element = document.getElementById('popup-content');
    const invoiceId = document.getElementById('invoice-id').value;
    const filename = `HoaDon_${invoiceId}.pdf`;
    
    const options = {
        margin: 10,
        filename: filename,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(options).from(element).save();
} 