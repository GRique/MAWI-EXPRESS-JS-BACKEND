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

function sanitizeText(text) {
    return text.replace(/\n/g, ' '); // Replace newline characters with a space
}

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

async function generateScoonerBL(blankPDFPath, data, callback) {

    
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

        firstPage.drawText(data.exporter, { x: 75, y: 745, size: 10,font: font, color: fontColor });
        firstPage.drawText(data.referenceNumber, { x: 490, y: 770, size: 10,font: font, color: fontColor });

        firstPage.drawText(data.marksAndNumbers, { x: 430, y: 735, size: 10,font: font, color: fontColor });

        firstPage.drawText(data.vesselName, { x: 200, y: 680, size: 10,font: font, color: fontColor });

        firstPage.drawText(data.countryOfDestination, { x: 270, y: 643, size: 10,font: font, color: fontColor });

        firstPage.drawText(data.grossWeight, { x: 430, y: 610, size: 10,font: font, color: fontColor });

        const invoiceLines = data.invoiceLines;
        let startYPoition = 610;
        let maxQuantityWidth = 0;
        let maxPackageTypeWidth = 0;
        let maxDescriptionWidth = 0;

        invoiceLines.forEach((line) => {
            const quantityText = sanitizeText(`${line.quantity}`);
            const packageTypeText = sanitizeText(line.packageType);
            const descriptionText = sanitizeText(line.description);
    
            const quantityWidth = font.widthOfTextAtSize(quantityText, 10);
            const packageTypeWidth = font.widthOfTextAtSize(packageTypeText, 10);
            const descriptionWidth = font.widthOfTextAtSize(descriptionText, 10);
    
            if (quantityWidth > maxQuantityWidth) maxQuantityWidth = quantityWidth;
            if (packageTypeWidth > maxPackageTypeWidth) maxPackageTypeWidth = packageTypeWidth;
            if (descriptionWidth > maxDescriptionWidth) maxDescriptionWidth = descriptionWidth;
        });
    
        // Define X positions based on maximum widths with some padding
        const quantityXPosition = 75;
        const packageTypeXPosition = quantityXPosition + maxQuantityWidth + 10;
        const descriptionXPosition = packageTypeXPosition + maxPackageTypeWidth + 10;
    
        // Draw the text for each line
        invoiceLines.forEach((line) => {
            const quantityText = sanitizeText(`${line.quantity}`);
            const packageTypeText = sanitizeText(line.packageType);
            const descriptionText = sanitizeText(line.description);
    
            // Draw the quantity at fixed position
            firstPage.drawText(quantityText, { x: quantityXPosition, y: startYPoition, size: 10, font, color: fontColor });
    
            // Draw the package type at fixed position
            firstPage.drawText(packageTypeText, { x: packageTypeXPosition, y: startYPoition, size: 10, font, color: fontColor });
    
            // Draw the description at fixed position
            firstPage.drawText(descriptionText, { x: descriptionXPosition, y: startYPoition, size: 10, font, color: fontColor });
    
            // Move to the next line
            startYPoition -= 20;
        });

        // firstPage.drawText("0", { x: 75, y: startYPoition, size: 10,font: font, color: fontColor });
        // firstPage.drawText(".", { x: 95, y: startYPoition, size: 10,font: font, color: fontColor });
        firstPage.drawText("EXPRESS RELEASE", { x: 75, y: startYPoition, size: 10,font: font, color: fontColor });

        startYPoition -= 20;

        // firstPage.drawText("0", { x: 75, y: startYPoition, size: 10,font: font, color: fontColor });
        // firstPage.drawText(".", { x: 95, y: startYPoition, size: 10,font: font, color: fontColor });
        firstPage.drawText(data.freightPayableAt, { x: 75, y: startYPoition, size: 10,font: font, color: fontColor });


        firstPage.drawText(data.countryOfDestination, { x: 235, y: 235, size: 10,font: font, color: fontColor });

        firstPage.drawText(data.importer, { x: 240, y: 203, size: 10,font: font, color: fontColor });

        firstPage.drawText(data.portOfDischarge, { x: 50, y: 182, size: 10,font: font, color: fontColor });

        const formattedDate = convertDate(data.date);

        firstPage.drawText(formattedDate, { x: 240, y: 63, size: 10,font: font, color: fontColor });

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

module.exports = { generateScoonerBL };