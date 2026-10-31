import mongoose from 'mongoose';

const templateLineSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    qty: { type: Number, required: true, min: 1, default: 1 },
    variantIndex: { type: Number, default: -1 } // -1 = base product, else index into product.variants
  },
  { _id: false }
);

const quotationTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
    productLines: { type: [templateLineSchema], default: [] },
    validityDays: { type: Number, default: 30, min: 1 }
  },
  { timestamps: true }
);

export default mongoose.model('QuotationTemplate', quotationTemplateSchema);
