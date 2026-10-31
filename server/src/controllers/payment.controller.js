import Payment from '../models/Payment.js';
import Invoice from '../models/Invoice.js';
import { recordPayment, paymentsForInvoice } from '../services/payment.service.js';

export async function create(req, res, next) {
  try {
    const { invoiceId, method, amount, date, note } = req.body;
    const { payment, invoice } = await recordPayment({
      invoiceId,
      method,
      amount,
      date,
      note,
      recordedBy: req.user.id
    });
    res.status(201).json({ payment, invoice });
  } catch (e) {
    next(e);
  }
}

export async function list(req, res, next) {
  try {
    const filter = {};
    if (req.query.invoiceId) filter.invoiceId = req.query.invoiceId;
    let payments = await Payment.find(filter)
      .populate('recordedBy', 'name')
      .populate('invoiceId', 'number customerId total status')
      .sort({ date: -1 })
      .lean();
    // Customers see only payments on their own invoices
    if (req.user.role === 'customer') {
      payments = payments.filter((p) => p.invoiceId?.customerId?.toString() === req.user.id);
    }
    res.json({ payments });
  } catch (e) {
    next(e);
  }
}

export async function historyForInvoice(req, res, next) {
  try {
    const inv = await Invoice.findOne({ _id: req.params.invoiceId, ...req.customerFilter }).lean();
    if (!inv) return res.status(404).json({ message: 'Invoice not found' });
    res.json({ invoice: inv, payments: await paymentsForInvoice(req.params.invoiceId) });
  } catch (e) {
    next(e);
  }
}
