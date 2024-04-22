function sanitizeInvoiceData(invoiceList){
    invoiceList.forEach(invoice => {
        if(!invoice.hasOwnProperty('total_tax') || invoice.total_tax === null || invoice.total_tax === undefined || isNaN(invoice.total_tax)){
            invoice['total_tax'] = 0.0;
        }
        if(!invoice.hasOwnProperty('subtotal') || invoice.subtotal === null || invoice.subtotal === undefined || isNaN(invoice.subtotal)){
            invoice['subtotal'] = 0.0;
        }
        invoiceList.invoice_items = sanitizeInvoiceLine(invoice.invoice_items);
    });
    return invoiceList;
}

function sanitizeInvoiceLine(invoiceLineList){
    invoiceLineList.forEach(invoiceLine => {
        if(!invoiceLine.hasOwnProperty('quantity') || invoiceLine.quantity === null || invoiceLine.quantity === undefined || isNaN(invoiceLine.quantity)){
            invoiceLine['quantity'] = 0;
        }
        if(!invoiceLine.hasOwnProperty('unit_price') || invoiceLine.unit_price === null || invoiceLine.unit_price === undefined || isNaN(invoiceLine.unit_price)){
            invoiceLine['unit_price'] = 0.0;
        }
        if(!invoiceLine.hasOwnProperty('amount') || invoiceLine.amount === null || invoiceLine.amount === undefined || isNaN(invoiceLine.amount)){
            invoiceLine['amount'] = 0.0;
        }

    });
    return invoiceLineList;

}

module.exports = { sanitizeInvoiceData };