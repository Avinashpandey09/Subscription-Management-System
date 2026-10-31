import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';

// Records a payment and reconciles the invoice:
//   amountDue = invoice.total - sum(payments)
// Invoice flips to Paid automatically when amountDue <= 0.
export async function recordPayment({ invoiceId, method, amount, date, note, recordedBy }) {
  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) {
    const err = new Error('Invoice not found');
    err.status = 404;
    throw err;
  }
  if (['Paid', 'Cancelled'].includes(invoice.status)) {
    const err = new Error(`Cannot pay a ${invoice.status} invoice`);
    err.status = 400;
    throw err;
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    const err = new Error('Amount must be a positive integer (paise)');
    err.status = 400;
    throw err;
  }

  const payment = await Payment.create({ invoiceId, method, amount, date, note, recordedBy });

  const agg = await Payment.aggregate([
    { $match: { invoiceId: invoice._id } },
    { $group: { _id: null, paid: { $sum: '$amount' } } }
  ]);
  const paid = agg[0]?.paid || 0;
  invoice.amountPaid = paid;
  invoice.amountDue = Math.max(0, invoice.total - paid);
  if (invoice.amountDue <= 0) invoice.status = 'Paid';
  await invoice.save();

  return { payment, invoice };
}

export async function paymentsForInvoice(invoiceId) {
  return Payment.find({ invoiceId }).populate('recordedBy', 'name').sort({ date: -1 }).lean();
}
