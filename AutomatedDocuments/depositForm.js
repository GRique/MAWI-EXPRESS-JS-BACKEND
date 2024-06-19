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

async function createDepositForm(blankPDFPath, data, callback) {

    
    // Read the blank PDF
    fs.readFile(blankPDFPath, (err, pdfBytes) => {
      if (err) {
        return callback(err);
      }
  
      PDFDocument.load(pdfBytes).then(async (pdfDoc) => {
        // Get the first page of the document
        const pages = pdfDoc.getPages();
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const firstPage = pages[0];
        console.log(data)

        firstPage.drawText(data.regimeType, { x: 30, y: 675, size: 10,font: font, color: fontColor });
        firstPage.drawText(data.waybillNumber, { x: 80, y: 675, size: 10,font: font, color: fontColor });
        firstPage.drawText(data.waybillDate, { x: 200, y: 675, size: 10,font: font, color: fontColor });
        firstPage.drawText(verifyString(data.incoTerms), { x: 340, y: 675, size: 10,font: font, color: fontColor });
        firstPage.drawText(data.termsOfPayment, { x: 480, y: 675, size: 10,font: font, color: fontColor });

        firstPage.drawText(data.importer, { x: 25, y: 642, size: 10,font: font, color: fontColor });
        firstPage.drawText(data.imorterNo, { x: 220, y: 658, size: 10,font: font, color: fontColor });
        firstPage.drawText(data.declarant, { x: 320, y: 642, size: 10,font: font, color: fontColor });
        firstPage.drawText(data.declarantNo, { x: 465, y: 642, size: 10,font: font, color: fontColor });
        firstPage.drawText(data.reference, { x: 515, y: 642, size: 10,font: font, color: fontColor });


        firstPage.drawText(data.consignor, { x: 25, y: 609, size: 10,font: font, color: fontColor });
        firstPage.drawText(data.countryOfConsignment, { x: 320, y: 609, size: 10,font: font, color: fontColor });
        firstPage.drawText(data.countryOfConsignmentCode, { x: 550, y: 609, size: 10, font: font,color: fontColor });

        firstPage.drawText(data.meansOfTransportation, { x: 25, y: 576, size: 10,font: font, color: fontColor });
        firstPage.drawText(data.rotation, { x: 200, y: 576, size: 10,font: font, color: fontColor });
        firstPage.drawText(data.mode, { x: 270, y: 576, size: 10, font: font,color: fontColor });
        firstPage.drawText(data.portOfImportation, { x: 320, y: 576, size: 10,font: font, color: fontColor });
        firstPage.drawText(data.portCode, { x: 475, y: 576, size: 10,font: font, color: fontColor });

        const dateObject = parseDateString(data.dateOfImportation);
        firstPage.drawText(dateObject.day.toString(), { x: 500, y: 576, size: 10,font: font, color: fontColor });
        firstPage.drawText(dateObject.month.toString(), { x: 522, y: 576, size: 10,font: font, color: fontColor });
        firstPage.drawText(dateObject.year.toString(), { x: 545, y: 576, size: 10, font: font,color: fontColor });


        firstPage.drawText(data.depositAmount.toString(), { x: 235, y: 528, size: 10,font: font, color: fontColor });
        firstPage.drawText(data.reason, { x: 125, y: 488, size: 10,font: font, color: fontColor });




  

        pdfDoc.save().then(pdfBytesOut => {
            
            callback(null, pdfBytesOut);
        }).catch(err => {
            callback(err);
        });
      }).catch(err => {
        callback(err);
      });
    });
  }


module.exports = {createDepositForm};