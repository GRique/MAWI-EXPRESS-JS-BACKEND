const { PDFDocument } = require('pdf-lib');
const axios = require('axios');

async function mergePDFs(pdfUrls, callback) {
  try {
    // Fetch and load PDF files
    const pdfDocs = await Promise.all(
      pdfUrls.map(async url => {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return PDFDocument.load(response.data);
      })
    );

    // Create a new PDFDocument
    const mergedPdf = await PDFDocument.create();

    // Copy pages from each PDF into the merged PDF
    for (const pdfDoc of pdfDocs) {
      const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
      copiedPages.forEach(page => mergedPdf.addPage(page));
    }

    // Serialize the merged PDF to bytes
    const mergedPdfBytes = await mergedPdf.save();
    
    // Call the callback with the merged PDF bytes
    callback(null, mergedPdfBytes);
  } catch (error) {
    // Call the callback with the error
    callback(error);
  }
}

module.exports = { mergePDFs };
