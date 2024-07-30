const fs = require('fs');
const { PDFDocument, rgb, StandardFonts  } = require('pdf-lib');

const fontSize = 10;
const fontSizeSmall = 8;
const fontColor = rgb(0, 0, 0);

function convertDate(dateStr) {
    // Split the input date string
    const [day, month, year] = dateStr.split('/').map(Number);

    // Array of month names
    const monthNames = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
    ];

    // Function to get ordinal suffix
    function getOrdinalSuffix(n) {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }

    // Construct the date string
    const formattedDate = `${getOrdinalSuffix(day)} ${monthNames[month - 1]} ${year}`;
    return formattedDate;
}

async function createOvertimeForm(blankPDFPath, secondPDFPath, data, callback) {
  try {
    // Read the blank PDF
    const blankPdfBytes = fs.readFileSync(blankPDFPath);
    const secondPdfBytes = fs.readFileSync(secondPDFPath);

    // Load both PDFs
    const pdfDoc = await PDFDocument.load(blankPdfBytes);
    const secondPdfDoc = await PDFDocument.load(secondPdfBytes);

    // Get the first page of the blank PDF
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const firstPage = pages[0];

    const fontColor = rgb(0, 0, 0);

    const formattedDate = convertDate(data.date);
    firstPage.drawText(data.referenceNumber, { x: 440, y: 707, size: 10, font: font, color: fontColor });
    firstPage.drawText(data.port, { x: 410, y: 665, size: 10, font: font, color: fontColor });
    firstPage.drawText(formattedDate, { x: 410, y: 635, size: 10, font: font, color: fontColor });
    firstPage.drawText(data.request, { x: 40, y: 520, size: 10, font: font, color: fontColor });
    firstPage.drawText(data.details, { x: 40, y: 480, size: 10, font: font, color: fontColor });
    firstPage.drawText(`SHIPPER: ${data.shipper}`, { x: 40, y: 455, size: 10, font: font, color: fontColor });
    firstPage.drawText(`IMPORTER: ${data.importer}`, { x: 40, y: 430, size: 10, font: font, color: fontColor });
    firstPage.drawText(`REF #: ${data.referenceNumber}`, { x: 40, y: 405, size: 10, font: font, color: fontColor });

    firstPage.drawText(data.startTime, { x: 190, y: 280, size: 10, font: font, color: fontColor });
    firstPage.drawText(`COMPLETION`, { x: 430, y: 280, size: 10, font: font, color: fontColor });

    firstPage.drawText(data.importerAddress.replace(/\\n/g, "\n"), { x: 40, y: 240, size: 9, font: font, color: fontColor, lineHeight: 13 });
    firstPage.drawText(`${data.declarantNumber} ${data.declarantName}`, { x: 360, y: 110, size: 10, font: font, color: fontColor });

    // Copy the pages from the second PDF into the original PDF
    const [secondPage] = await pdfDoc.copyPages(secondPdfDoc, [0]);
    pdfDoc.addPage(secondPage);

    // Save the merged PDF
    const pdfBytesOut = await pdfDoc.save();
    callback(null, pdfBytesOut);
  } catch (err) {
    callback(err);
  }
}


module.exports = {createOvertimeForm};