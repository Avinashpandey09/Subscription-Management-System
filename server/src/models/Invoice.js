import mongoose from 'mongoose';

export const INVOICE_STATUSES = ['Draft', 'Confirmed', 'Paid', 'Cancelled'];

const lineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 }, // paise
    amount: { type: Number, required: true, min: 0 } // paise
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true }, // INV-0001 (auto)
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription', required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    customer: {
      name: String,
      email: String
    },
    lines: { type: [lineSchema], default: [] },
    subtotal: { type: Number, required: true, default: 0 }, // paise
    tax: {
      breakdown: [{ name: String, rate: Number, amount: Number }],
      total: { type: Number, default: 0 }
    },
    discount: {
      name: String,
      code: String,
      type: String,
      amount: { type: Number, default: 0 }
    },
    total: { type: Number, required: true, default: 0 }, // paise
    amountPaid: { type: Number, default: 0 }, // paise, maintained by payment.service
    amountDue: { type: Number, default: 0 }, // paise
    dueDate: { type: Date, required: true },
    status: { type: String, enum: INVOICE_STATUSES, default: 'Draft' }
  },
  { timestamps: true }
);

// Strictly prevents double billing on reruns
invoiceSchema.index({ subscriptionId: 1, periodStart: 1 }, { unique: true });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ customerId: 1 });
invoiceSchema.index({ dueDate: 1 });

export default mongoose.model('Invoice', invoiceSchema);
