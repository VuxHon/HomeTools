function generatePDF() {
    const jsPDF = window.jspdf.jsPDF;
    // Base64 font TIMES.TTF
    const base64Font = `
        data:font/truetype;charset=utf-8;base64,<Base64 của bạn>`;
    
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [105, 148] // Khổ A6
    });

    // Nhúng font
    pdf.addFileToVFS('Times.ttf', base64Font);
    pdf.addFont('Times.ttf', 'Times', 'normal');
    pdf.setFont('Times', 'normal');

    // A. Thông tin shop
    const shopName = document.getElementById('shop-name').options[document.getElementById('shop-name').selectedIndex].text;
    const shopPhone = document.getElementById('shop-phone').value;
    const invoiceId = document.getElementById('invoice-id').value;
    const invoiceDate = document.getElementById('invoice-date').value;

    // B. Thông tin khách hàng
    const customerName = document.getElementById('customer-name').value;
    const customerPhone = document.getElementById('customer-phone').value;
    const customerAddress = document.getElementById('customer-address').value;

    // C. Thông tin đơn hàng
    const tableRows = Array.from(document.getElementById('order-table').getElementsByTagName('tbody')[0].rows);
    const totalQuantity = document.getElementById('total-quantity').value;
    const totalPrice = document.getElementById('total-price').value;
    const discount = document.getElementById('discount').value;
    const shippingFee = document.getElementById('shipping-fee').value;
    const finalTotal = document.getElementById('final-total').value;

    // Nội dung PDF
    pdf.setFontSize(10);
    pdf.text('HÓA ĐƠN BÁN HÀNG', 52.5, 10, { align: 'center' });

    // Thông tin shop
    pdf.setFontSize(9);
    pdf.text(`Tên Shop: ${shopName}`, 5, 20);
    pdf.text(`Số điện thoại: ${shopPhone}`, 5, 25);
    pdf.text(`Mã hóa đơn: ${invoiceId}`, 5, 30);
    pdf.text(`Ngày giờ: ${invoiceDate}`, 5, 35);

    // Thông tin khách hàng
    pdf.text('Thông tin khách hàng:', 5, 45);
    pdf.text(`Tên: ${customerName}`, 5, 50);
    pdf.text(`SĐT: ${customerPhone}`, 5, 55);
    pdf.text(`Địa chỉ: ${customerAddress}`, 5, 60);

    // Thông tin đơn hàng
    pdf.text('Thông tin đơn hàng:', 5, 70);
    let currentY = 75;

    // Header bảng
    pdf.setFontSize(8);
    pdf.text('Tên sản phẩm', 5, currentY);
    pdf.text('Đơn giá', 45, currentY);
    pdf.text('Số lượng', 75, currentY);
    pdf.text('Thành tiền', 90, currentY);
    currentY += 5;

    // Dữ liệu sản phẩm
    tableRows.forEach(row => {
        const productName = row.cells[0].getElementsByTagName('input')[0].value;
        const unitPrice = row.cells[1].getElementsByTagName('input')[0].value;
        const quantity = row.cells[2].getElementsByTagName('input')[0].value;
        const total = row.cells[3].getElementsByTagName('input')[0].value;

        pdf.text(productName, 5, currentY);
        pdf.text(unitPrice, 45, currentY);
        pdf.text(quantity, 75, currentY);
        pdf.text(total, 90, currentY);
        currentY += 5;
    });

    // Tổng số lượng, thành tiền và phí
    currentY += 5;
    pdf.text(`Tổng số lượng: ${totalQuantity}`, 5, currentY);
    currentY += 5;
    pdf.text(`Tổng thành tiền: ${totalPrice}`, 5, currentY);
    currentY += 5;
    pdf.text(`Giảm giá: ${discount}`, 5, currentY);
    currentY += 5;
    pdf.text(`Phí ship: ${shippingFee}`, 5, currentY);
    currentY += 5;
    pdf.text(`Tổng thanh toán: ${finalTotal}`, 5, currentY);

    // Lời cảm ơn
    currentY += 10;
    pdf.setFontSize(10);
    pdf.text('Cảm ơn quý khách. Hẹn gặp lại!', 35, currentY, { align: 'center' });

    // Xuất PDF
    pdf.save('HoaDon.pdf');
}