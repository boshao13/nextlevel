function generateQuotePDF(quote, stream) { stream.end(); }
function generateInvoicePDF(invoice, stream) { stream.end(); }
module.exports = { generateQuotePDF, generateInvoicePDF };
