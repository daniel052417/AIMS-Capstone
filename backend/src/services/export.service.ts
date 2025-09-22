import * as XLSX from 'xlsx';
import { createObjectCsvWriter } from 'csv-writer';

export class ExportService {
  // Generate CSV export
  static async generateCSV(data: any[], filename: string) {
    try {
      const csvWriter = createObjectCsvWriter({
        path: `/tmp/${filename}_${Date.now()}.csv`,
        header: [
          { id: 'transaction_number', title: 'Transaction Number' },
          { id: 'customer_name', title: 'Customer Name' },
          { id: 'customer_email', title: 'Customer Email' },
          { id: 'staff_name', title: 'Staff Name' },
          { id: 'branch_name', title: 'Branch' },
          { id: 'transaction_date', title: 'Transaction Date' },
          { id: 'total_amount', title: 'Total Amount' },
          { id: 'payment_method', title: 'Payment Method' },
          { id: 'payment_status', title: 'Payment Status' },
          { id: 'status', title: 'Status' },
          { id: 'items_count', title: 'Items Count' },
          { id: 'total_quantity', title: 'Total Quantity' }
        ]
      });

      await csvWriter.writeRecords(data);
      
      // Read the file and return as buffer
      const fs = require('fs');
      const filePath = `/tmp/${filename}_${Date.now()}.csv`;
      const fileContent = fs.readFileSync(filePath);
      
      // Clean up
      fs.unlinkSync(filePath);
      
      return fileContent;
    } catch (error) {
      throw new Error(`Failed to generate CSV: ${error}`);
    }
  }

  // Generate Excel export
  static async generateExcel(data: any[], filename: string) {
    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Transactions');
      
      return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    } catch (error) {
      throw new Error(`Failed to generate Excel: ${error}`);
    }
  }
}