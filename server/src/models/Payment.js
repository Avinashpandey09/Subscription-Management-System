import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
    method: {
      type: String,
      required: true,
      enum: ['Card', 'UPI', 'Bank Transfer', 'Cash']
    },
    amount: { type: Number, required: true, min: 1 }, // paise
    date: { type: Date, default: Date.now },
    note: { type: String, default: '' },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

export default mongoose.model('Payment', paymentSchema);
