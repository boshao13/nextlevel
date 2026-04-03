const PDFDocument = require('pdfkit');
const path = require('path');

const COMPANY = {
  name: 'Next Level Epoxy Flooring',
  phone: '505-352-4674',
  location: 'Albuquerque & Santa Fe, NM',
  website: 'www.nextlevelepoxynm.com',
};

function drawHeader(doc) {
  const logoPath = path.join(__dirname, '../../public/nextlevellogo.png');
  try { doc.image(logoPath, 50, 30, { width: 150 }); } catch { /* logo optional */ }
  doc.fontSize(10).fillColor('#666')
    .text(COMPANY.phone, 400, 40, { align: 'right' })
    .text(COMPANY.location, 400, 55, { align: 'right' })
    .text(COMPANY.website, 400, 70, { align: 'right' });
  doc.moveDown(4);
}

function drawLineItems(doc, items) {
  const tableTop = doc.y + 10;
  const col = { item: 50, qty: 320, price: 390, total: 470 };

  doc.fontSize(9).fillColor('#999');
  doc.text('ITEM', col.item, tableTop);
  doc.text('QTY', col.qty, tableTop);
  doc.text('PRICE', col.price, tableTop);
  doc.text('TOTAL', col.total, tableTop);

  doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke('#ddd');

  let y = tableTop + 25;
  doc.fillColor('#333').fontSize(10);
  const parsed = typeof items === 'string' ? JSON.parse(items) : items;

  (parsed || []).forEach(item => {
    const lineTotal = (item.qty * item.unit_price).toFixed(2);
    doc.text(item.item || item.description || '', col.item, y, { width: 260 });
    doc.text(String(item.qty), col.qty, y);
    doc.text(`$${Number(item.unit_price).toFixed(2)}`, col.price, y);
    doc.text(`$${lineTotal}`, col.total, y);
    y += 20;
  });

  doc.moveTo(50, y).lineTo(550, y).stroke('#ddd');
  return y + 10;
}

function drawTotals(doc, y, subtotal, tax_rate, tax_amount, total) {
  doc.fontSize(10).fillColor('#333');
  doc.text('Subtotal:', 390, y).text(`$${Number(subtotal).toFixed(2)}`, 470, y);
  y += 18;
  doc.text(`Tax (${(tax_rate * 100).toFixed(2)}%):`, 390, y).text(`$${Number(tax_amount).toFixed(2)}`, 470, y);
  y += 18;
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#0f4c81');
  doc.text('Total:', 390, y).text(`$${Number(total).toFixed(2)}`, 470, y);
  doc.font('Helvetica');
  return y + 30;
}

function generateQuotePDF(quote, stream) {
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(stream);
  drawHeader(doc);
  doc.fontSize(20).fillColor('#0f4c81').text('QUOTE', 50);
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor('#333');
  doc.text(`Client: ${quote.lead_name || ''}`);
  if (quote.lead_email) doc.text(`Email: ${quote.lead_email}`);
  if (quote.lead_phone) doc.text(`Phone: ${quote.lead_phone}`);
  doc.moveDown(0.5);
  if (quote.description) doc.text(quote.description);
  doc.moveDown(0.5);
  const y = drawLineItems(doc, quote.line_items);
  drawTotals(doc, y, quote.subtotal, quote.tax_rate, quote.tax_amount, quote.total);
  doc.end();
}

function generateInvoicePDF(invoice, stream) {
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(stream);
  drawHeader(doc);
  if (invoice.status === 'paid') {
    doc.save().rotate(45, { origin: [300, 400] })
      .fontSize(80).fillColor('#4ade8040').text('PAID', 150, 300)
      .restore();
  }
  doc.fontSize(20).fillColor('#0f4c81').text('INVOICE', 50);
  doc.moveDown(0.3);
  doc.fontSize(10).fillColor('#333');
  doc.text(`Invoice #: ${invoice.invoice_number}`);
  doc.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`);
  doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`);
  doc.moveDown(0.5);
  doc.text(`Bill To: ${invoice.lead_name || ''}`);
  if (invoice.lead_email) doc.text(`Email: ${invoice.lead_email}`);
  if (invoice.lead_phone) doc.text(`Phone: ${invoice.lead_phone}`);
  doc.moveDown(0.5);
  const y = drawLineItems(doc, invoice.line_items);
  const totalsEnd = drawTotals(doc, y, invoice.subtotal, invoice.tax_rate, invoice.tax_amount, invoice.total);
  doc.fontSize(10).fillColor('#666');
  doc.text('Payment Instructions:', 50, totalsEnd + 10);
  doc.text('Make checks payable to: Next Level Epoxy Flooring');
  doc.text(`Questions? Call ${COMPANY.phone}`);
  doc.end();
}

module.exports = { generateQuotePDF, generateInvoicePDF };
