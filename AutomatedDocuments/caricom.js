
const path = require('path');
const { readFileSync } = require('fs');

const getValue = (value, defaultValue = '') => (value === undefined || value === null ? defaultValue : value);


function generateCaricomHTML(data) {

    const signatureImagePath = path.join(__dirname, 'images', 'signature.png');
    console.log(signatureImagePath);
    console.log(`Signature Image Path: file://${signatureImagePath}`);

    const htmlTemplateUpdated = `
    <!DOCTYPE html>
    <html>
        <head>
            <meta charset="UTF-8">
            <title>CARICOM Invoice</title>
            <style>
                @media print {
                    .page-break {
                        display: block;
                        page-break-before: always;
                        margin-top: 40px;
                    }
                }
                body {
                    font-family: Arial, sans-serif;
                    font-size: 8px;
                    margin: 0;
                    padding: 20px;
                    overflow-x: hidden;
                }
                .container {
                    width: 100%;
                    margin: auto;
                    border: 1px solid #000;
                    padding: 20px;
                    box-sizing: border-box;
                }
                .header {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .invoice-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 10px;
                }
                .invoice-table th, .invoice-table td {
                    border: 1px solid #000;
                    padding: 8px;
                    text-align: left;
                    box-sizing: border-box;
                }
                .invoice-table th {
                    background-color: #f2f2f2;
                }
                .horizontal-break {
                    height: 10px;
                    background-color: #ddd;
                    border: none;
                }
                .address {
                    white-space: pre-line; /* Preserve newlines and whitespace */
                    line-height: 2;
                }
                .signature-container {
                    margin-top: 50px;
                }
                .signature-line {
                    width: 300px;
                    border-bottom: 1px solid black;
                    margin-top: 20px;
                }
                .signature-label {
                    margin-top: 5px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h3>CARICOM (CARIBBEAN COMMON MARKET)</h3>
                </div>
                <table class="invoice-table">
                    <tr>
                        <th colspan="6">SELLER (Name, full address, country)</th>
                        <th colspan="6">INVOICE DATE AND NO.</th>
                        <th colspan="6">${getValue(data.invoiceNumber)}</th>
                    </tr>
                    <tr>
                        <td colspan="6" rowspan="3" class="address">
                            ${getValue(data.sellerNameAddress)}
                        </td>
                        <th colspan="6">CUSTOMER ORDER NUMBER</th>
                        <td colspan="6">${getValue(data.customerOrderNumber)}</td>
                    </tr>
                    <tr>
                        <th colspan="6">OTHER REFERENCES</th>
                        <td colspan="6">${getValue(data.otherReferences)}</td>
                    </tr>
                    <tr>
                        <th colspan="6">BUYER (if other than consignee)</th>
                        <td colspan="6">${getValue(data.buyer)}</td>
                    </tr>

                    <tr>
                    <th colspan="6">CONSIGNEE (Name, full address, country)</th>
                    <th colspan="6">PRESENTING BANK</th>
                    <th colspan="6">${getValue(data.presentingBank)}</th>
                </tr>
                <tr>
                    <td colspan="6" rowspan="3" class="address">
                        ${getValue(data.consigneeNameAddress)}
                    </td>
                    <th colspan="6">COUNTRY OF ORIGIN</th>
                    <td colspan="6">${getValue(data.countryOfOrigin)}</td>
                </tr>
                <tr>
                    <th colspan="6">INCOTERMS</th>
                    <td colspan="6">${getValue(data.incoterms)}</td>
                </tr>
                <tr>
                    <th colspan="6"></th>
                    <td colspan="6"></td>
                </tr>
                    
                    <tr>
                        <th colspan="4">PORT OF LOADING</th>
                        <th colspan="5">COUNTRY OF FINAL DESTINATION</th>
                        <th colspan="5">SHIP/ AIR/ ETC</th>
                        <th colspan="4">CURRENCY OF SALE</th>
                    </tr>
                    <tr>
                        <td colspan="4">${getValue(data.portOfLoading)}</td>
                        <td colspan="5">${getValue(data.countryOfFinalDestination)}</td>
                        <td colspan="5">${getValue(data.modeOfTransport)}</td>
                        <td colspan="4">${getValue(data.currencyOfSale)}</td>
                    </tr>
                    <tr>
                        <th colspan="4">OTHER TRANSPORT INFO.</th>
                        <th colspan="5">MARKS AND NUMBERS</th>
                        <th colspan="5">DESCRIPTION OF GOODS</th>
                        <th colspan="4">GROSS WEIGHT (Kg.)</th>
                    </tr>
                    <tr>
                        <td colspan="4">${getValue(data.otherTransportInformation)}</td>
                        <td colspan="5">${getValue(data.marksAndNumbers)}</td>
                        <td colspan="5">${getValue(data.descriptionOfGoods)}</td>
                        <td colspan="4">${getValue(data.grossWeight)}</td>
                    </tr>
                    <tr>
                        <th colspan="3">NO. & KIND OF PACKAGES</th>
                        <th colspan="7">SPECIFICATIONS OF COMMODITY</th>
                        <th colspan="2">NET WEIGHT</th>
                        <th colspan="2">QUANTITY</th>
                        <th colspan="2">UNIT PRICE</th>
                        <th colspan="2">AMOUNT</th>
                    </tr>
                    ${(() => {
                        let rows = '';
                        let rowCount = 0;
                        const firstPageLimit = 18;
                        const subsequentPageLimit = 35;
                        const generateTableHeader = () => `
                            <tr class="page-break"></tr>
                            <tr>
                                <th colspan="3">NO. & KIND OF PACKAGES</th>
                                <th colspan="7">SPECIFICATIONS OF COMMODITY</th>
                                <th colspan="2">NET WEIGHT</th>
                                <th colspan="2">QUANTITY</th>
                                <th colspan="2">UNIT PRICE</th>
                                <th colspan="2">AMOUNT</th>
                            </tr>
                        `;
                        data.packages.forEach((item, index) => {
                            if (rowCount >= firstPageLimit && (rowCount - firstPageLimit) % subsequentPageLimit === 0) {
                                rows += generateTableHeader();
                            }
                            rows += `
                                <tr>
                                    <td colspan="3">${item.numberAndKindOfPackages}</td>
                                    <td colspan="7">${item.specificationOfCommodities}</td>
                                    <td colspan="2">${item.netWeight}</td>
                                    <td colspan="2">${item.quantity}</td>
                                    <td colspan="2">${item.unitPrice}</td>
                                    <td colspan="2">${item.amount}</td>
                                </tr>
                            `;
                            rowCount++;
                        });
                        return rows;
                    })()}
                    <tr>
                        <td colspan="10" rowspan="8">
                        IT IS HEREBY CERTIFIED THAT THIS INVOICE SHOWS
                        THE ACTUAL PRICE OF THE GOODS DESCRIBED THAT NO
                        OTHER INVOICE HAS BEEN OR WILL BE ISSUED AND THAT
                        ALL PARTICULARS ARE TRUE AND CORRECT
                        <div class="signature-container">
                        <!-- <img src="data:image/png;base64,${readFileSync(signatureImagePath).toString('base64')}" alt="Digital Signature" width="200" height="50">-->
                            <div class="signature-line"></div>
                            <div class="signature-label">SIGNATURE AND STATUS OF AUTHORIZED PERSON</div>
                            <div class="signature-label">EXPORT CLERK</div>
                        </div>
                        </td>
                        <td colspan="6">FOB</td>
                        <td colspan="2">${getValue(data.fob)}</td>
                    </tr>
                    <tr>
                        <td colspan="6">PACKAGING</td>
                        <td colspan="2">${getValue(data.packaging)}</td>
                    </tr>
                    <tr>
                        <td colspan="6">FREIGHT</td>
                        <td colspan="2">${getValue(data.freight)}</td>
                    </tr>
                    <tr>
                        <td colspan="6">INSURANCE</td>
                        <td colspan="2">${getValue(data.insurance)}</td>
                    </tr>
                    <tr>
                        <td colspan="6">OTHER CHARGES</td>
                        <td colspan="2">${getValue(data.otherCharges)}</td>
                    </tr>
                    <tr>
                        <td colspan="6">INVOICE TOTAL</td>
                        <td colspan="2">${getValue(data.invoiceTotal)}</td>
                    </tr>
                </table>
            </div>
        </body>
    </html>
    `
    console.log("HTML generated. Returning...");

    return htmlTemplateUpdated;
}

module.exports = { generateCaricomHTML };