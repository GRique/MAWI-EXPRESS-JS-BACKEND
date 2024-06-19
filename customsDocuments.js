const fs = require('fs');
const { PDFDocument, rgb, StandardFonts  } = require('pdf-lib');

const fontSize = 10;
const fontSizeSmall = 8;
const fontColor = rgb(0, 0, 0);

const yesColumn = 470
const noColumn = 525

const sevenRow = 432

function optimizeAddress(address, maxLineLength) {
    const splitLines = address.split('\n');
    let optimizedLines = [];
    let currentLine = '';
  
    // First pass: Split lines that exceed maxLineLength
    splitLines.forEach(line => {
      const words = line.split(' ');
      words.forEach(word => {
        if ((currentLine.length + word.length + 1) > maxLineLength) {
          optimizedLines.push(currentLine.trim());
          currentLine = word + ' ';
        } else {
          currentLine += word + ' ';
        }
      });
  
      if (currentLine.trim().length > 0) {
        optimizedLines.push(currentLine.trim());
        currentLine = '';
      }
    });
  
    // Second pass: Merge consecutive lines if they fit within maxLineLength
    let finalLines = [];
    for (let i = 0; i < optimizedLines.length; i++) {
      let line = optimizedLines[i];
  
      while (i < optimizedLines.length - 1 && (line.length + optimizedLines[i + 1].length + 1) <= maxLineLength) {
        line += ' ' + optimizedLines[i + 1];
        i++;
      }
  
      finalLines.push(line);
    }
  
    return finalLines.join('\n');
}


function displayNumber(data){
    return data && data !== "0.00" && data !== "0" ? `$${parseFloat(data).toLocaleString()}` : "NIL";
}

function verifyNumbers(data){
    if(data === undefined || data === null || data === '' || data === '0.0'){
        return 0.0
    }
    return data
}

function stringCheck(data){
    if(data === undefined || data === null || data === ''){
        return ""
    }
    return data
}

async function generateCustomsDeclaration(blankPDFPath, data, outputPath, callback) {

    
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
  
        // Define some content to overlay
        const buyerNameAddress = optimizeAddress(data.buyerNameAddress.replace(/\\n/g, "\n"), 50);
        const sellerNameAddress = optimizeAddress(data.sellerNameAddress.replace(/\\n/g, "\n"), 50);
        const declarantNameAddress = optimizeAddress(data.declarantNameAddress.replace(/\\n/g, "\n"), 50);
        console.log("Origin", data.declarantNameAddress)
        console.log("Origin", optimizeAddress(data.declarantNameAddress.replace(/\\n/g, "\n"), 50))
        firstPage.drawText(sellerNameAddress, { x: 40, y: 720, size: 9, font: font, color: rgb(0, 0, 0), lineHeight: 13 });
        firstPage.drawText(buyerNameAddress, { x: 40, y: 660, size: 9,font: font, color: fontColor, lineHeight: 13 });
        firstPage.drawText(data.declarantNameAddress.replace(/\\n/g, "\n"), { x: 40, y: 600, size: 9, font: font, color: fontColor, lineHeight: 13 });
        if(data.incoTerms.length > 28) {
            firstPage.drawText(data.incoTerms, { x: 430, y: 545, size: 7.5, font: font, color: fontColor });
        }
        else firstPage.drawText(data.incoTerms, { x: 430, y: 545, size: 8, color: fontColor });
        const numberOfLines = data.invoiceNumbersDates?.split('\n').length ?? 0;
        if(numberOfLines > 3)
            firstPage.drawText(data.invoiceNumbersDates, { x: 320, y: 522, size: 7.5, font: font, color: fontColor, lineHeight: 8});
        else firstPage.drawText(data.invoiceNumbersDates, { x: 320, y: 520, size: 9, font: font, color: fontColor, lineHeight: 10});
        firstPage.drawText(data.numberAndDateofContract, { x: 310, y: 475, size: fontSizeSmall, color: fontColor });
        if(data.relatedParties !== undefined && data.relatedParties.length > 0) {
            if(data.relatedParties === "yes") {
                firstPage.drawText("X", { x: yesColumn, y: 432, size: fontSize, color: fontColor });
            }
            else firstPage.drawText("X", { x: noColumn, y: 432, size: fontSize, color: fontColor });
        }

        if(data.influencePrice !== undefined && data.influencePrice.length > 0) {
            if(data.influencePrice === "yes") {
                firstPage.drawText("X", { x: yesColumn, y: 410, size: fontSize, color: fontColor });
            }
            else firstPage.drawText("X", { x: noColumn, y: 410, size: fontSize, color: fontColor });
        }

        if(data.transactionValueApproximate !== undefined && data.transactionValueApproximate.length > 0) {
            if(data.transactionValueApproximate === "yes") {
                firstPage.drawText("X", { x: yesColumn, y: 388, size: fontSize, color: fontColor });
            }
            else firstPage.drawText("X", { x: noColumn, y: 388, size: fontSize, color: fontColor });
        }

        if(data.restrictions !== undefined && data.restrictions.length > 0) {
            if(data.restrictions === "yes") {
                firstPage.drawText("X", { x: yesColumn, y: 322, size: fontSize, color: fontColor });
            }
            else firstPage.drawText("X", { x: noColumn, y: 322, size: fontSize, color: fontColor });
        }

        if(data.conditions !== undefined && data.conditions.length > 0) {
            if(data.conditions === "yes") {
                firstPage.drawText("X", { x: yesColumn, y: 298, size: fontSize, color: fontColor });
            }
            else firstPage.drawText("X", { x: noColumn, y: 298, size: fontSize, color: fontColor });
        }

        if(data.royalties_boolean !== undefined && data.royalties_boolean.length > 0) {
            if(data.royalties_boolean === "yes") {
                firstPage.drawText("X", { x: yesColumn, y: 231, size: fontSize, color: fontColor });
            }
            else firstPage.drawText("X", { x: noColumn, y: 231, size: fontSize, color: fontColor });
        }

        if(data.resale_disposal_boolean !== undefined && data.resale_disposal_boolean.length > 0) {
            if(data.resale_disposal_boolean === "yes") {
                firstPage.drawText("X", { x: yesColumn, y: 202, size: fontSize, color: fontColor });
            }
            else firstPage.drawText("X", { x: noColumn, y: 202, size: fontSize, color: fontColor });
        }

        firstPage.drawText(data.signatory_name, { x: 375, y: 120, size: fontSize, font: font, color: fontColor });



        firstPage.drawText(data.date_signed, { x: 375, y: 100, size: fontSize, font: font, color: fontColor });

        firstPage.drawText(`${stringCheck(data.status_of_signatory)}`, { x: 375, y: 75, size: fontSize, font: font, color: fontColor });

        firstPage.drawText(data.signatory_phone_number, { x: 375, y: 57, size: fontSize, font: font, color: fontColor });


        /*PAGE 2 */

        const secondPage = pages[1];

        /*Box 11 */

        let netInvoicePrice = data.net_invoice_price
        let indirectPayments = data.indirect_payment
        netInvoicePrice = netInvoicePrice && netInvoicePrice !== "0.00" ? `$${parseFloat(netInvoicePrice).toFixed(2).toLocaleString()}` : "NIL";
        indirectPayments = indirectPayments && indirectPayments !== "0.00" ? `$${indirectPayments}` : "NIL";

        if(data.indirectPayments == "0.00" || data.indirectPayments == "0" || data.indirectPayments == "" || data.indirectPayments == null) {
            data.indirect_payment = "0.00";
        }



        secondPage.drawText(`${netInvoicePrice}`, { x: 485, y: 730, size: 10, font: font, color: rgb(0, 0, 0) });
        secondPage.drawText(`${indirectPayments}`, { x: 485, y: 700, size: 10, font: font, color: rgb(0, 0, 0) });
        secondPage.drawText(`${data.exchange_rate}`, { x: 200, y: 690, size: 10, font: font, color: rgb(0, 0, 0) });
        secondPage.drawText(`${stringCheck(data.invoice_currency)}`, { x: 255, y: 690, size: 10, font: font, color: rgb(0, 0, 0) });
        let total_a = (parseFloat(data.net_invoice_price) + parseFloat(data.indirect_payment)) * parseFloat(data.exchange_rate);

        /*Box 12 */
        total_a = total_a.toFixed(2);
        secondPage.drawText(`$${parseFloat(total_a).toLocaleString()}`, { x: 485, y: 665, size: 10, font: font, color: rgb(0, 0, 0) });

        /*Box 13 */
        secondPage.drawText(`${displayNumber(data.costs_commissions)}`, { x: 485, y: 640, size: 10, font: font, color: rgb(0, 0, 0) });
        secondPage.drawText(`${displayNumber(data.costs_brokerage)}`, { x: 485, y: 610, size: 10, font: font, color: rgb(0, 0, 0) });
        secondPage.drawText(`${displayNumber(data.costs_containers_packing)}`, { x: 485, y: 580, size: 10, font: font, color: rgb(0, 0, 0) });

        /*Box 14 */

        secondPage.drawText(`${displayNumber(data.goods_free_of_charge_materials)}`, { x: 485, y: 515, size: 10, font: font, color: rgb(0, 0, 0) });
        secondPage.drawText(`${displayNumber(data.goods_free_of_charge_tools)}`, { x: 485, y: 495, size: 10, font: font, color: rgb(0, 0, 0) });
        secondPage.drawText(`${displayNumber(data.goods_free_of_charge_materials_consumed)}`, { x: 485, y: 475, size: 10, font: font, color: rgb(0, 0, 0) });
        secondPage.drawText(`${displayNumber(data.goods_engineering_development)}`, { x: 485, y: 445, size: 10, font: font, color: rgb(0, 0, 0) });

        /*Box 15 */
    
        secondPage.drawText(`${displayNumber(data.royalties_license_fee)}`, { x: 485, y: 415, size: 10, font: font, color: rgb(0, 0, 0) });


        /*Box 16 */
        secondPage.drawText(`${displayNumber(data.procees_resale_disposal)}`, { x: 485, y: 390, size: 10, font: font, color: rgb(0, 0, 0) });

        /*Box 17 */
        if(data.transportIncluded === true)
            secondPage.drawText(`INCLUDED`, { x: 485, y: 365, size: 10, color: rgb(0, 0, 0) });
        else secondPage.drawText(`${displayNumber(data.cost_delivery_transport)}`, { x: 485, y: 365, size: 10, font: font, color: rgb(0, 0, 0) });

        secondPage.drawText(`${displayNumber(data.cost_delivery_loading)}`, { x: 485, y: 345, size: 10, font: font, color: rgb(0, 0, 0) });

        if(data.insuranceIncluded === true)
            secondPage.drawText(`INCLUDED`, { x: 485, y: 325, size: 10, color: rgb(0, 0, 0) });
        else secondPage.drawText(`${displayNumber(data.cost_delivery_insurance)}`, { x: 485, y: 325, size: 10, font: font, color: rgb(0, 0, 0) });

        /*Box 18 */
        let total_b = parseFloat(verifyNumbers(data.cost_delivery_transport)) + parseFloat(verifyNumbers(data.cost_delivery_loading)) + parseFloat(verifyNumbers(data.cost_delivery_insurance));


       
        secondPage.drawText(`${displayNumber(total_b)}`, { x: 485, y: 305, size: 10, font: font, color: rgb(0, 0, 0) });

        /*Box 19 */
        secondPage.drawText(`${displayNumber(data.cost_transport_after_arrival)}`, { x: 485, y: 285, size: 10, font: font, color: rgb(0, 0, 0) });

        /*Box 20 */
        secondPage.drawText(`${displayNumber(data.charges_construction)}`, { x: 485, y: 255, size: 10, font: font, color: rgb(0, 0, 0) });

        /*Box 21 */
        secondPage.drawText(`${displayNumber(data.other_charges)}`, { x: 485, y: 230, size: 10, font: font, color: rgb(0, 0, 0) });

        /*Box 22 */
        secondPage.drawText(`${displayNumber(data.customs_duties_taxes)}`, { x: 485, y: 205, size: 10, font: font, color: rgb(0, 0, 0) });

        /*Box 23 */
        let total_c = parseFloat(verifyNumbers(data.customs_duties_taxes)) + parseFloat(verifyNumbers(data.other_charges)) + parseFloat(verifyNumbers(data.charges_construction)) + parseFloat(verifyNumbers(data.cost_transport_after_arrival));

        secondPage.drawText(`${displayNumber(total_c)}`, { x: 485, y: 180, size: 10, font: font, color: rgb(0, 0, 0) });

        /*Box 24 */
        total_a = parseFloat(total_a);
        let valueDeclared = total_a + total_b - total_c;
        valueDeclared = valueDeclared.toFixed(2);
        secondPage.drawText(`$${parseFloat(valueDeclared).toLocaleString()}`, { x: 485, y: 155, size: 10, font: font, color: rgb(0, 0, 0) });

        secondPage.drawText(`$${parseFloat(data.net_invoice_price).toLocaleString()}`, { x: 450, y: 90, size: fontSize, font: font, color: fontColor });
        secondPage.drawText(`${data.exchange_rate}`, { x: 510, y: 90, size: fontSize, font: font, color: fontColor });

        pdfDoc.save().then(pdfBytesOut => {
            // console.log(`PDF file generated successfully.`);
            // fs.writeFile(outputPath, pdfBytesOut, (err) => {
            //     if (err) {
            //         return callback(err);
            //     }
            //     console.log(`PDF saved to ${outputPath}`);
            // });
            callback(null, pdfBytesOut);
        }).catch(err => {
            callback(err);
        });
      }).catch(err => {
        callback(err);
      });
    });
  }

  async function testPDFLoadAndSave(inputPath, callback) {
    try {
        const originalPdfBytes = await fs.promises.readFile(filePath);
        const pdfDoc = await PDFDocument.load(originalPdfBytes);
        const pdfBytes = await pdfDoc.save();
        return pdfBytes;
      } catch (error) {
        console.error("Error processing PDF:", error);
        throw error;
      }
}

async function generatePreSignedCustomsDeclaration(data, callback) {

    
      PDFDocument.create().then(async (pdfDoc) => {

        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const firstPage = pdfDoc.addPage([612, 792]);
        console.log(data)
        
  
        // Define some content to overlay
        firstPage.drawText(data.sellerNameAddress.replace(/\\n/g, "\n"), { x: 40, y: 720, size: 9, font: font, color: rgb(0, 0, 0), lineHeight: 13 });
        firstPage.drawText(data.buyerNameAddress.replace(/\\n/g, "\n"), { x: 40, y: 660, size: 9,font: font, color: fontColor, lineHeight: 13 });
        firstPage.drawText(data.declarantNameAddress.replace(/\\n/g, "\n"), { x: 40, y: 600, size: 9, font: font, color: fontColor, lineHeight: 13 });
        if(data.incoTerms.length > 28) {
            firstPage.drawText(data.incoTerms, { x: 430, y: 545, size: 7.5, font: font, color: fontColor });
        }
        else firstPage.drawText(data.incoTerms, { x: 430, y: 545, size: 8, color: fontColor });
        firstPage.drawText(data.invoiceNumbersDates, { x: 320, y: 520, size: 9, font: font, color: fontColor, lineHeight: 10});
        firstPage.drawText(data.numberAndDateofContract, { x: 310, y: 475, size: fontSizeSmall, color: fontColor });
        if(data.relatedParties !== undefined && data.relatedParties.length > 0) {
            if(data.relatedParties === "yes") {
                firstPage.drawText("X", { x: yesColumn, y: 432, size: fontSize, color: fontColor });
            }
            else firstPage.drawText("X", { x: noColumn, y: 432, size: fontSize, color: fontColor });
        }

        if(data.influencePrice !== undefined && data.influencePrice.length > 0) {
            if(data.influencePrice === "yes") {
                firstPage.drawText("X", { x: yesColumn, y: 410, size: fontSize, color: fontColor });
            }
            else firstPage.drawText("X", { x: noColumn, y: 410, size: fontSize, color: fontColor });
        }

        if(data.transactionValueApproximate !== undefined && data.transactionValueApproximate.length > 0) {
            if(data.transactionValueApproximate === "yes") {
                firstPage.drawText("X", { x: yesColumn, y: 388, size: fontSize, color: fontColor });
            }
            else firstPage.drawText("X", { x: noColumn, y: 388, size: fontSize, color: fontColor });
        }

        if(data.restrictions !== undefined && data.restrictions.length > 0) {
            if(data.restrictions === "yes") {
                firstPage.drawText("X", { x: yesColumn, y: 322, size: fontSize, color: fontColor });
            }
            else firstPage.drawText("X", { x: noColumn, y: 322, size: fontSize, color: fontColor });
        }

        if(data.conditions !== undefined && data.conditions.length > 0) {
            if(data.conditions === "yes") {
                firstPage.drawText("X", { x: yesColumn, y: 298, size: fontSize, color: fontColor });
            }
            else firstPage.drawText("X", { x: noColumn, y: 298, size: fontSize, color: fontColor });
        }

        if(data.royalties_boolean !== undefined && data.royalties_boolean.length > 0) {
            if(data.royalties_boolean === "yes") {
                firstPage.drawText("X", { x: yesColumn, y: 231, size: fontSize, color: fontColor });
            }
            else firstPage.drawText("X", { x: noColumn, y: 231, size: fontSize, color: fontColor });
        }

        if(data.resale_disposal_boolean !== undefined && data.resale_disposal_boolean.length > 0) {
            if(data.resale_disposal_boolean === "yes") {
                firstPage.drawText("X", { x: yesColumn, y: 202, size: fontSize, color: fontColor });
            }
            else firstPage.drawText("X", { x: noColumn, y: 202, size: fontSize, color: fontColor });
        }

        firstPage.drawText(data.signatory_name, { x: 375, y: 120, size: fontSize, font: font, color: fontColor });



        firstPage.drawText(data.date_signed, { x: 375, y: 100, size: fontSize, font: font, color: fontColor });

        firstPage.drawText(`${stringCheck(data.status_of_signatory)}`, { x: 375, y: 75, size: fontSize, font: font, color: fontColor });

        firstPage.drawText(data.signatory_phone_number, { x: 375, y: 57, size: fontSize, font: font, color: fontColor });


        /*PAGE 2 */

        const secondPage = pdfDoc.addPage([612, 792]);

        /*Box 11 */

        let netInvoicePrice = data.net_invoice_price
        let indirectPayments = data.indirect_payment
        netInvoicePrice = netInvoicePrice && netInvoicePrice !== "0.00" ? `$${parseFloat(netInvoicePrice).toFixed(2).toLocaleString()}` : "NIL";
        indirectPayments = indirectPayments && indirectPayments !== "0.00" ? `$${indirectPayments}` : "NIL";

        if(data.indirectPayments == "0.00" || data.indirectPayments == "0" || data.indirectPayments == "" || data.indirectPayments == null) {
            data.indirect_payment = "0.00";
        }



        secondPage.drawText(`${netInvoicePrice}`, { x: 485, y: 730, size: 10, font: font, color: rgb(0, 0, 0) });
        secondPage.drawText(`${indirectPayments}`, { x: 485, y: 700, size: 10, font: font, color: rgb(0, 0, 0) });
        secondPage.drawText(`${data.exchange_rate}`, { x: 200, y: 690, size: 10, font: font, color: rgb(0, 0, 0) });
        secondPage.drawText(`${stringCheck(data.invoice_currency)}`, { x: 255, y: 690, size: 10, font: font, color: rgb(0, 0, 0) });
        let total_a = (parseFloat(data.net_invoice_price) + parseFloat(data.indirect_payment)) * parseFloat(data.exchange_rate);

        /*Box 12 */
        total_a = total_a.toFixed(2);
        secondPage.drawText(`$${parseFloat(total_a).toLocaleString()}`, { x: 485, y: 665, size: 10, font: font, color: rgb(0, 0, 0) });

        /*Box 13 */
        secondPage.drawText(`${displayNumber(data.costs_commissions)}`, { x: 485, y: 640, size: 10, font: font, color: rgb(0, 0, 0) });
        secondPage.drawText(`${displayNumber(data.costs_brokerage)}`, { x: 485, y: 610, size: 10, font: font, color: rgb(0, 0, 0) });
        secondPage.drawText(`${displayNumber(data.costs_containers_packing)}`, { x: 485, y: 580, size: 10, font: font, color: rgb(0, 0, 0) });

        /*Box 14 */

        secondPage.drawText(`${displayNumber(data.goods_free_of_charge_materials)}`, { x: 485, y: 515, size: 10, font: font, color: rgb(0, 0, 0) });
        secondPage.drawText(`${displayNumber(data.goods_free_of_charge_tools)}`, { x: 485, y: 495, size: 10, font: font, color: rgb(0, 0, 0) });
        secondPage.drawText(`${displayNumber(data.goods_free_of_charge_materials_consumed)}`, { x: 485, y: 475, size: 10, font: font, color: rgb(0, 0, 0) });
        secondPage.drawText(`${displayNumber(data.goods_engineering_development)}`, { x: 485, y: 445, size: 10, font: font, color: rgb(0, 0, 0) });

        /*Box 15 */
    
        secondPage.drawText(`${displayNumber(data.royalties_license_fee)}`, { x: 485, y: 415, size: 10, font: font, color: rgb(0, 0, 0) });


        /*Box 16 */
        secondPage.drawText(`${displayNumber(data.procees_resale_disposal)}`, { x: 485, y: 390, size: 10, font: font, color: rgb(0, 0, 0) });

        /*Box 17 */
        if(data.transportIncluded === true)
            secondPage.drawText(`INCLUDED`, { x: 485, y: 365, size: 10, color: rgb(0, 0, 0) });
        else secondPage.drawText(`${displayNumber(data.cost_delivery_transport)}`, { x: 485, y: 365, size: 10, font: font, color: rgb(0, 0, 0) });

        secondPage.drawText(`${displayNumber(data.cost_delivery_loading)}`, { x: 485, y: 345, size: 10, font: font, color: rgb(0, 0, 0) });

        if(data.insuranceIncluded === true)
            secondPage.drawText(`INCLUDED`, { x: 485, y: 325, size: 10, color: rgb(0, 0, 0) });
        else secondPage.drawText(`${displayNumber(data.cost_delivery_insurance)}`, { x: 485, y: 325, size: 10, font: font, color: rgb(0, 0, 0) });

        /*Box 18 */
        let total_b = parseFloat(verifyNumbers(data.cost_delivery_transport)) + parseFloat(verifyNumbers(data.cost_delivery_loading)) + parseFloat(verifyNumbers(data.cost_delivery_insurance));


       
        secondPage.drawText(`${displayNumber(total_b)}`, { x: 485, y: 305, size: 10, font: font, color: rgb(0, 0, 0) });

        /*Box 19 */
        secondPage.drawText(`${displayNumber(data.cost_transport_after_arrival)}`, { x: 485, y: 285, size: 10, font: font, color: rgb(0, 0, 0) });

        /*Box 20 */
        secondPage.drawText(`${displayNumber(data.charges_construction)}`, { x: 485, y: 255, size: 10, font: font, color: rgb(0, 0, 0) });

        /*Box 21 */
        secondPage.drawText(`${displayNumber(data.other_charges)}`, { x: 485, y: 230, size: 10, font: font, color: rgb(0, 0, 0) });

        /*Box 22 */
        secondPage.drawText(`${displayNumber(data.customs_duties_taxes)}`, { x: 485, y: 205, size: 10, font: font, color: rgb(0, 0, 0) });

        /*Box 23 */
        let total_c = parseFloat(verifyNumbers(data.customs_duties_taxes)) + parseFloat(verifyNumbers(data.other_charges)) + parseFloat(verifyNumbers(data.charges_construction)) + parseFloat(verifyNumbers(data.cost_transport_after_arrival));

        secondPage.drawText(`${displayNumber(total_c)}`, { x: 485, y: 180, size: 10, font: font, color: rgb(0, 0, 0) });

        /*Box 24 */
        total_a = parseFloat(total_a);
        let valueDeclared = total_a + total_b - total_c;
        valueDeclared = valueDeclared.toFixed(2);
        secondPage.drawText(`$${parseFloat(valueDeclared).toLocaleString()}`, { x: 485, y: 155, size: 10, font: font, color: rgb(0, 0, 0) });

        secondPage.drawText(`$${parseFloat(data.net_invoice_price).toLocaleString()}`, { x: 450, y: 90, size: fontSize, font: font, color: fontColor });
        secondPage.drawText(`${data.exchange_rate}`, { x: 510, y: 90, size: fontSize, font: font, color: fontColor });

        pdfDoc.save().then(pdfBytesOut => {
            // console.log(`PDF file generated successfully.`);
            // fs.writeFile(outputPath, pdfBytesOut, (err) => {
            //     if (err) {
            //         return callback(err);
            //     }
            //     console.log(`PDF saved to ${outputPath}`);
            // });
            callback(null, pdfBytesOut);
        }).catch(err => {
            callback(err);
        });
      }).catch(err => {
        callback(err);
      });
  }

module.exports = {generateCustomsDeclaration, testPDFLoadAndSave, generatePreSignedCustomsDeclaration};