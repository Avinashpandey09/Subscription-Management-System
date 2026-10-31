import mongoose from 'mongoose';

export const SUB_STATUSES = ['Draft', 'Quotation', 'Confirmed', 'Active', 'Paused', 'Closed'];

const lineSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 }, // paise, variant extra included
    variant: {
      attribute: String,
      value: String,
      extraPrice: { type: Number, default: 0 }
    },
    amount: { type: Number, required: true, min: 0 } // paise = qty * unitPrice
  },
  { _id: false }
);

const subscriptionSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true }, // SUB-0001 (auto)
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
    startDate: { type: Date, required: true },
    expiryDate: { type: Date },
    paymentTerms: { type: String, default: 'Net 15' },
    paymentTermsDays: { type: Number, default: 15, min: 0 },
    lines: { type: [lineSchema], default: [] },
    status: { type: String, enum: SUB_STATUSES, default: 'Draft' },
    nextInvoiceDate: { type: Date }
  },
  { timestamps: true }
);

subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ customerId: 1 });
subscriptionSchema.index({ nextInvoiceDate: 1 });

export default mongoose.model('Subscription', subscriptionSchema);
