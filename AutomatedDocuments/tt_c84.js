const fs = require('fs');
const { PDFDocument, rgb, StandardFonts  } = require('pdf-lib');

const fontSize = 10;
const fontSizeSmall = 8;
const fontColor = rgb(0, 0, 0);

function verifyString(data){
  if(data === undefined || data === null || data === ''){
      return ""
  }
  return data
}

function parseDateString(dateString) {
    // Split the date string by the slash character
    const parts = dateString.split('/');
    
    // Extract the day, month, and year from the parts array
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
  
    // Create an object with the extracted values as strings
    const dateObject = {
      day: day,
      month: month,
      year: year
    };
  
    return dateObject;
  }

async function createTTC84(blankPDFPath, data, useBlankDocument, callback) {

    
  try {
    let pdfDoc;

    if (useBlankDocument) {
      // Create a new blank PDF document
      pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([612, 792]);
      overlayText(page, data, pdfDoc);
    } else {
      // Read the existing PDF document
      const pdfBytes = fs.readFileSync(blankPDFPath);
      pdfDoc = await PDFDocument.load(pdfBytes);
      const page = pdfDoc.getPages()[0];
      overlayText(page, data, pdfDoc);
    }

    const pdfBytesOut = await pdfDoc.save();
    callback(null, pdfBytesOut);
  } catch (err) {
    callback(err);
  }
}

async function overlayText(page, data, pdfDoc) {
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontColor = rgb(0, 0, 0); // Black color
  
    // page.drawText(verifyString(data.declarationNumber), { x: 200, y: 720, size: 10, font: font, color: fontColor });
    // page.drawText(verifyString(data.declarationDate), { x: 270, y: 720, size: 10, font: font, color: fontColor });
    page.drawText(verifyString(data.regimeCode), { x: 545, y: 720, size: 10, font: font, color: fontColor });
  
    page.drawText(verifyString(data.declarantName), { x: 145, y: 695, size: 10, font: font, color: fontColor });
    page.drawText(verifyString(data.declarantNumber), { x: 400, y: 695, size: 10, font: font, color: fontColor });
    page.drawText(verifyString(data.referenceNumber), { x: 500, y: 695, size: 10, font: font, color: fontColor });
  
    page.drawText(verifyString(data.importer), { x: 145, y: 665, size: 10, font: font, color: fontColor });
    page.drawText(verifyString(data.importNumber), { x: 500, y: 665, size: 10, font: font, color: fontColor });
  
    page.drawText(verifyString(data.declarationContent), { x: 95, y: 615, size: 8, color: fontColor, lineHeight: 11 });
  
    page.drawText(`${verifyString(data.CPCCode)}`, { x: 50, y: 600, size: 10, font: font, color: fontColor });
    page.drawText(verifyString(data.extensionCode), { x: 50, y: 585, size: 10, font: font, color: fontColor });
  
    page.drawText(verifyString(data.signatoryName), { x: 95, y: 505, size: 8, color: fontColor });
    page.drawText(verifyString(data.signatoryStatus), { x: 95, y: 495, size: 8, color: fontColor });
}


module.exports = {createTTC84};