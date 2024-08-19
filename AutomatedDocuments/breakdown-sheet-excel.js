const ExcelJS = require('exceljs');

// Function to generate Excel document
async function generateInvoiceBreakdownSheet(customerName, referenceNumber, invoices) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Invoices');

    // Add customer name and reference number at the top
    worksheet.getCell('A1').value = `Customer Name: ${customerName}`;
    worksheet.getCell('A2').value = `Reference Number: ${referenceNumber}`;
    
    // Set font sizes
    worksheet.getCell('A1').font = { bold: true, size: 18 };
    worksheet.getCell('A2').font = { bold: true, size: 12 };

    // Add headers to the worksheet starting from row 4
    worksheet.getRow(4).values = [
        'Invoice Number', 
        'Other Charges', 
        'Insurance', 
        'Inland Freight', 
        'Base Amount', 
        'Total'
    ];
    worksheet.getRow(4).font = { bold: true, size: 12 };

    // Ensure there are no merged cells that may cause data to not be visible
    worksheet.unMergeCells('A1:A2');

    // Add data rows for each invoice starting from row 5
    invoices.forEach((invoice, index) => {
        worksheet.getRow(5 + index).values = [
            invoice.invoiceNumber,
            invoice.otherCharges,
            invoice.insurance,
            invoice.inlandFreight,
            invoice.baseAmount,
            invoice.total
        ];
        // Set font size for data rows
        worksheet.getRow(5 + index).font = { size: 12 };
    });

    // Apply currency formatting to the relevant columns
    worksheet.getColumn(2).numFmt = '"$"#,##0.00';
    worksheet.getColumn(3).numFmt = '"$"#,##0.00';
    worksheet.getColumn(4).numFmt = '"$"#,##0.00';
    worksheet.getColumn(5).numFmt = '"$"#,##0.00';
    worksheet.getColumn(6).numFmt = '"$"#,##0.00';

    // Define the border style
    const borderStyle = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
    };

    // Apply borders to cells B1 to E3
    for (let row = 1; row <= 3; row++) {
        for (let col = 2; col <= 6; col++) {
            worksheet.getCell(row, col).border = borderStyle;
        }
    }

    // Apply borders to header row (row 4)
    worksheet.getRow(4).eachCell({ includeEmpty: true }, cell => {
        cell.border = borderStyle;
    });

    // Apply borders to all data rows
    invoices.forEach((_, index) => {
        worksheet.getRow(5 + index).eachCell({ includeEmpty: true }, cell => {
            cell.border = borderStyle;
        });
    });

    const totalRowNum = invoices.length + 5;

    // Add the totals row
    worksheet.getRow(totalRowNum).values = [
        'Total', 
        { formula: `SUM(B5:B${totalRowNum - 1})` }, 
        { formula: `SUM(C5:C${totalRowNum - 1})` }, 
        { formula: `SUM(D5:D${totalRowNum - 1})` }, 
        { formula: `SUM(E5:E${totalRowNum - 1})` }, 
        { formula: `SUM(F5:F${totalRowNum - 1})` }
    ];
    worksheet.getRow(totalRowNum).font = { bold: true, size: 12 };

    // Apply borders to the totals row
    worksheet.getRow(totalRowNum).eachCell(cell => {
        cell.border = borderStyle;
    });

    // Apply borders to the first and last column
    const firstColumn = worksheet.getColumn(1);
    const lastColumn = worksheet.getColumn(6);

    worksheet.eachRow({ includeEmpty: true }, row => {
        row.getCell(1).border = borderStyle;
        row.getCell(6).border = borderStyle;
    });

    // Apply borders to the range of cells containing data
    const startRow = 4;
    const endRow = 4 + invoices.length;
    const startColumn = 1;
    const endColumn = 6;

    for (let row = startRow; row <= endRow; row++) {
        for (let col = startColumn; col <= endColumn; col++) {
            worksheet.getCell(row, col).border = borderStyle;
        }
    }

    // Adjust column widths based on the content
    worksheet.columns.forEach(column => {
        let maxColumnWidth = 10; // Default width
        if (column.header) {
            maxColumnWidth = column.header.toString().length;
        }
        column.eachCell({ includeEmpty: true }, cell => {
            const cellLength = cell.value ? cell.value.toString().length : 0;
            maxColumnWidth = Math.max(maxColumnWidth, cellLength);
        });
        // Set column width to a slightly larger value than the maximum content length
        column.width = maxColumnWidth + 2; // Adding some padding
    });

    // Generate the Excel buffer
    return workbook.xlsx.writeBuffer();
}

module.exports = { generateInvoiceBreakdownSheet };
