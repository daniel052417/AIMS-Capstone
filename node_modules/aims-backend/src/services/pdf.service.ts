import PDFDocument from 'pdfkit';

export class PDFService {
  // Generate transaction PDF
  static async generateTransactionPDF(transaction: any) {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];
      
      doc.on('data', buffers.push.bind(buffers));
      
      // Header
      doc.fontSize(20).text('Sales Transaction Receipt', 50, 50);
      doc.fontSize(12).text(`Transaction #: ${transaction.transaction_number}`, 50, 80);
      doc.text(`Date: ${new Date(transaction.transaction_date).toLocaleDateString()}`, 50, 100);
      
      // Customer Information
      doc.fontSize(14).text('Customer Information', 50, 130);
      doc.fontSize(10).text(`Name: ${transaction.customer?.first_name} ${transaction.customer?.last_name}`, 50, 150);
      doc.text(`Email: ${transaction.customer?.email}`, 50, 165);
      doc.text(`Phone: ${transaction.customer?.phone}`, 50, 180);
      
      // Transaction Details
      doc.fontSize(14).text('Transaction Details', 50, 210);
      doc.fontSize(10).text(`Total Amount: $${transaction.total_amount}`, 50, 230);
      doc.text(`Payment Method: ${transaction.payment_method}`, 50, 245);
      doc.text(`Status: ${transaction.status}`, 50, 260);
      
      // Items
      if (transaction.order_items && transaction.order_items.length > 0) {
        doc.fontSize(14).text('Items', 50, 290);
        let yPosition = 310;
        
        transaction.order_items.forEach((item: any) => {
          doc.text(`${item.product?.name} - Qty: ${item.quantity} - $${item.unit_price}`, 50, yPosition);
          yPosition += 15;
        });
      }
      
      doc.end();
      
      return new Promise<Buffer>((resolve, reject) => {
        doc.on('end', () => {
          resolve(Buffer.concat(buffers));
        });
        doc.on('error', reject);
      });
    } catch (error) {
      throw new Error(`Failed to generate PDF: ${error}`);
    }
  }
}