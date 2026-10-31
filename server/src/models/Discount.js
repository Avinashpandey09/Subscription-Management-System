import mongoose from 'mongoose';

const discountSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, uppercase: true },
    type: { type: String, required: true, enum: ['fixed', 'percent'] },
    // paise when fixed, percentage number when percent
    value: { type: Number, required: true, min: 0 },
    minPurchase: { type: Number, default: 0, min: 0 }, // paise
    minQty: { type: Number, default: 0, min: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    usageLimit: { type: Number, default: 0, min: 0 }, // 0 = unlimited
    usedCount: { type: Number, default: 0, min: 0 },
    appliesTo: { type: String, enum: ['product', 'subscription'], default: 'subscription' }
  },
  { timestamps: true }
);

discountSchema.index({ code: 1 }, { unique: true, sparse: true });

export default mongoose.model('Discount', discountSchema);
