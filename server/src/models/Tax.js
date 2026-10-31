import mongoose from 'mongoose';

const taxSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    rate: { type: Number, required: true, min: 0, max: 100 }, // percent, e.g. 18 = 18%
    rules: {
      minAmount: { type: Number, default: 0, min: 0 }, // paise: tax applies only above this subtotal
      appliesTo: { type: String, enum: ['all', 'product', 'subscription'], default: 'all' }
    },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model('Tax', taxSchema);
