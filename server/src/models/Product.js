import mongoose from 'mongoose';

// Money is stored as integer paise everywhere (e.g. Rs 560 = 56000).
const variantSchema = new mongoose.Schema(
  {
    attribute: { type: String, required: true, trim: true }, // e.g. "Brand"
    value: { type: String, required: true, trim: true }, // e.g. "Odoo"
    extraPrice: { type: Number, required: true, default: 0, min: 0 } // paise
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    type: { type: String, required: true, trim: true, default: 'goods' },
    salesPrice: { type: Number, required: true, min: 0 }, // paise
    costPrice: { type: Number, default: 0, min: 0 }, // paise
    notes: { type: String, default: '' },
    variants: { type: [variantSchema], default: [] }
  },
  { timestamps: true }
);

export default mongoose.model('Product', productSchema);
