const fs = require('fs');
const { PDFDocument, rgb, StandardFonts  } = require('pdf-lib');

const fontSize = 10;
const fontSizeSmall = 8;
const fontColor = rgb(0, 0, 0);

const yesColumn = 470
const noColumn = 545

const sevenRow = 432

const pageTwo = 490


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

async function generateValuationForm(data, callback) {

    
    PDFDocument.create().then(async (pdfDoc) => {

      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const firstPage = pdfDoc.addPage([612, 792]);
      console.log(data)
      

      // Define some content to overlay
      firstPage.drawText(data.sellerNameAddress.replace(/\\n/g, "\n"), { x: 40, y: 720, size: 9, font: font, color: rgb(0, 0, 0), lineHeight: 13 });
      firstPage.drawText(data.buyerNameAddress.replace(/\\n/g, "\n"), { x: 40, y: 658, size: 9,font: font, color: fontColor, lineHeight: 13 });
      firstPage.drawText(data.declarantNameAddress.replace(/\\n/g, "\n"), { x: 40, y: 596, size: 9, font: font, color: fontColor, lineHeight: 13 });
      if(data.incoTerms.length > 28) {
          firstPage.drawText(data.incoTerms, { x: 450, y: 539, size: 7.5, font: font, color: fontColor });
      }
      else firstPage.drawText(data.incoTerms, { x: 450, y: 539, size: 8, color: fontColor });
      firstPage.drawText(data.invoiceNumbersDates, { x: 325, y: 513, size: 9, font: font, color: fontColor, lineHeight: 10});
      firstPage.drawText(data.numberAndDateofContract, { x: 310, y: 475, size: fontSizeSmall, color: fontColor });
      if(data.relatedParties !== undefined && data.relatedParties.length > 0) {
          if(data.relatedParties === "yes") {
              firstPage.drawText("X", { x: yesColumn, y: 422, size: fontSize, color: fontColor });
          }
          else firstPage.drawText("X", { x: noColumn, y: 422, size: fontSize, color: fontColor });
      }

      if(data.influencePrice !== undefined && data.influencePrice.length > 0) {
          if(data.influencePrice === "yes") {
              firstPage.drawText("X", { x: yesColumn, y: 400, size: fontSize, color: fontColor });
          }
          else firstPage.drawText("X", { x: noColumn, y: 400, size: fontSize, color: fontColor });
      }

      if(data.transactionValueApproximate !== undefined && data.transactionValueApproximate.length > 0) {
          if(data.transactionValueApproximate === "yes") {
              firstPage.drawText("X", { x: yesColumn, y: 378, size: fontSize, color: fontColor });
          }
          else firstPage.drawText("X", { x: noColumn, y: 378, size: fontSize, color: fontColor });
      }

      if(data.restrictions !== undefined && data.restrictions.length > 0) {
          if(data.restrictions === "yes") {
              firstPage.drawText("X", { x: yesColumn, y: 306, size: fontSize, color: fontColor });
          }
          else firstPage.drawText("X", { x: noColumn, y: 306, size: fontSize, color: fontColor });
      }

      if(data.conditions !== undefined && data.conditions.length > 0) {
          if(data.conditions === "yes") {
              firstPage.drawText("X", { x: yesColumn, y: 282, size: fontSize, color: fontColor });
          }
          else firstPage.drawText("X", { x: noColumn, y: 282, size: fontSize, color: fontColor });
      }

      if(data.royalties_boolean !== undefined && data.royalties_boolean.length > 0) {
          if(data.royalties_boolean === "yes") {
              firstPage.drawText("X", { x: yesColumn, y: 213, size: fontSize, color: fontColor });
          }
          else firstPage.drawText("X", { x: noColumn, y: 213, size: fontSize, color: fontColor });
      }

      if(data.resale_disposal_boolean !== undefined && data.resale_disposal_boolean.length > 0) {
          if(data.resale_disposal_boolean === "yes") {
              firstPage.drawText("X", { x: yesColumn, y: 184, size: fontSize, color: fontColor });
          }
          else firstPage.drawText("X", { x: noColumn, y: 184, size: fontSize, color: fontColor });
      }

      firstPage.drawText(data.signatory_name, { x: 380, y: 100, size: fontSize, font: font, color: fontColor });



      firstPage.drawText(data.date_signed, { x: 380, y: 80, size: fontSize, font: font, color: fontColor });

      firstPage.drawText(`${stringCheck(data.status_of_signatory)}`, { x: 380, y: 55, size: fontSize, font: font, color: fontColor });

      firstPage.drawText(data.signatory_phone_number, { x: 380, y: 37, size: fontSize, font: font, color: fontColor });


      firstPage.drawText(data.referenceNumber, { x: 35, y: 18, size: fontSize, font: font, color: fontColor });


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



      secondPage.drawText(`${netInvoicePrice}`, { x: pageTwo, y: 730, size: 10, font: font, color: rgb(0, 0, 0) });
      secondPage.drawText(`${indirectPayments}`, { x: pageTwo, y: 700, size: 10, font: font, color: rgb(0, 0, 0) });
      secondPage.drawText(`${data.exchange_rate}`, { x: 200, y: 690, size: 10, font: font, color: rgb(0, 0, 0) });
      secondPage.drawText(`${stringCheck(data.invoice_currency)}`, { x: 255, y: 690, size: 10, font: font, color: rgb(0, 0, 0) });
      let total_a = (parseFloat(data.net_invoice_price) + parseFloat(data.indirect_payment)) * parseFloat(data.exchange_rate);

      /*Box 12 */
      total_a = total_a.toFixed(2);
      secondPage.drawText(`$${parseFloat(total_a).toLocaleString()}`, { x: pageTwo, y: 665, size: 10, font: font, color: rgb(0, 0, 0) });

      /*Box 13 */
      secondPage.drawText(`${displayNumber(data.costs_commissions)}`, { x: pageTwo, y: 640, size: 10, font: font, color: rgb(0, 0, 0) });
      secondPage.drawText(`${displayNumber(data.costs_brokerage)}`, { x: pageTwo, y: 610, size: 10, font: font, color: rgb(0, 0, 0) });
      secondPage.drawText(`${displayNumber(data.costs_containers_packing)}`, { x: pageTwo, y: 580, size: 10, font: font, color: rgb(0, 0, 0) });

      /*Box 14 */

      secondPage.drawText(`${displayNumber(data.goods_free_of_charge_materials)}`, { x: pageTwo, y: 515, size: 10, font: font, color: rgb(0, 0, 0) });
      secondPage.drawText(`${displayNumber(data.goods_free_of_charge_tools)}`, { x: pageTwo, y: 490, size: 10, font: font, color: rgb(0, 0, 0) });
      secondPage.drawText(`${displayNumber(data.goods_free_of_charge_materials_consumed)}`, { x: pageTwo, y: 463, size: 10, font: font, color: rgb(0, 0, 0) });
      secondPage.drawText(`${displayNumber(data.goods_engineering_development)}`, { x: pageTwo, y: 440, size: 10, font: font, color: rgb(0, 0, 0) });

      /*Box 15 */
  
      secondPage.drawText(`${displayNumber(data.royalties_license_fee)}`, { x: pageTwo, y: 405, size: 10, font: font, color: rgb(0, 0, 0) });


      /*Box 16 */
      secondPage.drawText(`${displayNumber(data.procees_resale_disposal)}`, { x: pageTwo, y: 380, size: 10, font: font, color: rgb(0, 0, 0) });

      /*Box 17 */
      if(data.transportIncluded === true)
          secondPage.drawText(`INCLUDED`, { x: pageTwo, y: 350, size: 10, color: rgb(0, 0, 0) });
      else secondPage.drawText(`${displayNumber(data.cost_delivery_transport)}`, { x: pageTwo, y: 350, size: 10, font: font, color: rgb(0, 0, 0) });

      secondPage.drawText(`${displayNumber(data.cost_delivery_loading)}`, { x: pageTwo, y: 330, size: 10, font: font, color: rgb(0, 0, 0) });

      if(data.insuranceIncluded === true)
          secondPage.drawText(`INCLUDED`, { x: pageTwo, y: 310, size: 10, color: rgb(0, 0, 0) });
      else secondPage.drawText(`${displayNumber(data.cost_delivery_insurance)}`, { x: pageTwo, y: 310, size: 10, font: font, color: rgb(0, 0, 0) });

      /*Box 18 */
      let total_b = parseFloat(verifyNumbers(data.cost_delivery_transport)) + parseFloat(verifyNumbers(data.cost_delivery_loading)) + parseFloat(verifyNumbers(data.cost_delivery_insurance));


     
      secondPage.drawText(`${displayNumber(total_b)}`, { x: pageTwo, y: 290, size: 10, font: font, color: rgb(0, 0, 0) });

      /*Box 19 */
      secondPage.drawText(`${displayNumber(data.cost_transport_after_arrival)}`, { x: pageTwo, y: 270, size: 10, font: font, color: rgb(0, 0, 0) });

      /*Box 20 */
      secondPage.drawText(`${displayNumber(data.charges_construction)}`, { x: pageTwo, y: 240, size: 10, font: font, color: rgb(0, 0, 0) });

      /*Box 21 */
      secondPage.drawText(`${displayNumber(data.other_charges)}`, { x: pageTwo, y: 210, size: 10, font: font, color: rgb(0, 0, 0) });

      /*Box 22 */
      secondPage.drawText(`${displayNumber(data.customs_duties_taxes)}`, { x: pageTwo, y: 185, size: 10, font: font, color: rgb(0, 0, 0) });

      /*Box 23 */
      let total_c = parseFloat(verifyNumbers(data.customs_duties_taxes)) + parseFloat(verifyNumbers(data.other_charges)) + parseFloat(verifyNumbers(data.charges_construction)) + parseFloat(verifyNumbers(data.cost_transport_after_arrival));

      secondPage.drawText(`${displayNumber(total_c)}`, { x: pageTwo, y: 155, size: 10, font: font, color: rgb(0, 0, 0) });

      /*Box 24 */
      total_a = parseFloat(total_a);
      let valueDeclared = total_a + total_b - total_c;
      valueDeclared = valueDeclared.toFixed(2);
      secondPage.drawText(`$${parseFloat(valueDeclared).toLocaleString()}`, { x: pageTwo, y: 137, size: 10, font: font, color: rgb(0, 0, 0) });

      secondPage.drawText(`11(a)`, { x: 280, y: 65, size: 10, font: font, color: rgb(0, 0, 0) });

      secondPage.drawText(`$${parseFloat(data.net_invoice_price).toLocaleString()}`, { x: 465, y: 65, size: fontSize, font: font, color: fontColor });
      secondPage.drawText(`${data.exchange_rate}`, { x: 525, y: 65, size: fontSize, font: font, color: fontColor });

      secondPage.drawText(data.referenceNumber, { x: 520, y: 5, size: fontSize, font: font, color: fontColor });

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

module.exports = {generateValuationForm};