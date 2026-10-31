import PDFDocument from 'pdfkit';

export const paise = (n) => `Rs ${(Number(n || 0) / 100).toFixed(2)}`;

// Returns a Buffer with a printable invoice PDF.
export function invoicePdfBuffer(invoice) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).text('INVOICE', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Invoice: ${invoice.number}`);
    doc.text(`Status: ${invoice.status}`);
    doc.text(`Period: ${fmt(invoice.periodStart)} - ${fmt(invoice.periodEnd)}`);
    doc.text(`Due: ${fmt(invoice.dueDate)}`);
    doc.moveDown(0.5);
    doc.text(`Bill to: ${invoice.customer?.name || ''}`);
    if (invoice.customer?.email) doc.text(invoice.customer.email);
    doc.moveDown();

    // Lines
    const x = 50;
    let y = doc.y;
    doc.fontSize(10).text('Item', x, y, { width: 260 });
    doc.text('Qty', x + 270, y, { width: 50 });
    doc.text('Unit', x + 320, y, { width: 80 });
    doc.text('Amount', x + 400, y, { width: 90, align: 'right' });
    y += 16;
    doc.moveTo(x, y).lineTo(540, y).stroke();
    y += 8;
    for (const l of invoice.lines || []) {
      doc.text(l.name, x, y, { width: 260 });
      doc.text(String(l.qty), x + 270, y);
      doc.text(paise(l.unitPrice), x + 320, y);
      doc.text(paise(l.amount), x + 400, y, { width: 90, align: 'right' });
      y += 16;
    }
    doc.moveTo(x, y).lineTo(540, y).stroke();
    y += 10;
    doc.text(`Subtotal: ${paise(invoice.subtotal)}`, x, y, { align: 'right' });
    y += 16;
    if (invoice.discount?.amount > 0) {
      doc.text(`Discount${invoice.discount.code ? ` (${invoice.discount.code})` : ''}: -${paise(invoice.discount.amount)}`, x, y, { align: 'right' });
      y += 16;
    }
    for (const t of invoice.tax?.breakdown || []) {
      doc.text(`Tax ${t.name} (${t.rate}%): ${paise(t.amount)}`, x, y, { align: 'right' });
      y += 16;
    }
    doc.fontSize(13).text(`Total: ${paise(invoice.total)}`, x, y, { align: 'right' });
    y += 20;
    doc.fontSize(10).text(`Paid: ${paise(invoice.amountPaid)}   Due: ${paise(invoice.amountDue)}`, x, y, { align: 'right' });

    doc.end();
  });
}

function fmt(d) {
  if (!d) return '-';
  return new Date(d).toISOString().slice(0, 10);
}
