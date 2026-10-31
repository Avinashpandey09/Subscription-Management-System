import mongoose from 'mongoose';

const planSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 }, // paise per billingPeriod
    billingPeriod: {
      type: String,
      required: true,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      index: true
    },
    minQty: { type: Number, default: 1, min: 1 },
    startDate: { type: Date },
    endDate: { type: Date },
    autoClose: { type: Boolean, default: false },
    closable: { type: Boolean, default: true },
    pausable: { type: Boolean, default: false },
    renewable: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model('Plan', planSchema);
