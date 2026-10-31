import Invoice from '../models/Invoice.js';
import { runBilling } from '../services/billing.service.js';
import { invoicePdfBuffer, paise } from '../utils/pdf.js';
import { sendMail } from '../utils/mailer.js';

const INVOICE_TRANSITIONS = {
  Draft: ['Confirmed', 'Cancelled'],
  Confirmed: ['Cancelled'], // -> Paid happens only via payments
  Paid: [],
  Cancelled: []
};

export async function list(req, res, next) {
  try {
    const filter = { ...req.customerFilter };
    if (req.user.role !== 'customer' && req.query.customerId) filter.customerId = req.query.customerId;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.subscriptionId) filter.subscriptionId = req.query.subscriptionId;
    const invoices = await Invoice.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ invoices });
  } catch (e) {
    next(e);
  }
}

export async function get(req, res, next) {
  try {
    const inv = await Invoice.findOne({ _id: req.params.id, ...req.customerFilter })
      .populate('subscriptionId', 'number status')
      .lean();
    if (!inv) return res.status(404).json({ message: 'Invoice not found' });
    res.json({ invoice: inv });
  } catch (e) {
    next(e);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    const inv = await Invoice.findById(req.params.id);
    if (!inv) return res.status(404).json({ message: 'Invoice not found' });
    if (!INVOICE_TRANSITIONS[inv.status]?.includes(status)) {
      return res.status(400).json({ message: `Invalid transition: ${inv.status} -> ${status}` });
    }
    inv.status = status;
    await inv.save();
    res.json({ invoice: inv });
  } catch (e) {
    next(e);
  }
}

// Manual trigger for live demos (the cron runs this automatically too)
export async function runBillingNow(req, res, next) {
  try {
    const result = await runBilling(new Date());
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function downloadPdf(req, res, next) {
  try {
    const inv = await Invoice.findOne({ _id: req.params.id, ...req.customerFilter }).lean();
    if (!inv) return res.status(404).json({ message: 'Invoice not found' });
    const buf = await invoicePdfBuffer(inv);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${inv.number}.pdf"`);
    res.send(buf);
  } catch (e) {
    next(e);
  }
}

export async function sendEmail(req, res, next) {
  try {
    const inv = await Invoice.findById(req.params.id).lean();
    if (!inv) return res.status(404).json({ message: 'Invoice not found' });
    if (!inv.customer?.email) return res.status(400).json({ message: 'Invoice has no customer email' });
    const pdf = await invoicePdfBuffer(inv);
    await sendMail({
      to: inv.customer.email,
      subject: `Invoice ${inv.number} — ${paise(inv.total)} due ${new Date(inv.dueDate).toISOString().slice(0, 10)}`,
      text: `Hi ${inv.customer.name || ''},\n\nPlease find invoice ${inv.number} attached. Total ${paise(inv.total)}, due ${new Date(inv.dueDate).toISOString().slice(0, 10)}.\n\nThank you!`,
      attachments: [{ filename: `${inv.number}.pdf`, content: pdf }]
    });
    res.json({ message: `Invoice sent to ${inv.customer.email}` });
  } catch (e) {
    next(e);
  }
}
