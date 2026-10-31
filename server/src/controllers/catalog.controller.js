import Product from '../models/Product.js';
import Plan from '../models/Plan.js';
import Tax from '../models/Tax.js';
import Discount from '../models/Discount.js';

function crud(Model, name) {
  return {
    async list(req, res, next) {
      try {
        res.json({ [name]: await Model.find().sort({ createdAt: -1 }).lean() });
      } catch (e) {
        next(e);
      }
    },
    async get(req, res, next) {
      try {
        const doc = await Model.findById(req.params.id).lean();
        if (!doc) return res.status(404).json({ message: `${name} not found` });
        res.json({ [name.slice(0, -1)]: doc });
      } catch (e) {
        next(e);
      }
    },
    async create(req, res, next) {
      try {
        const doc = await Model.create(req.body);
        res.status(201).json(doc);
      } catch (e) {
        next(e);
      }
    },
    async update(req, res, next) {
      try {
        const doc = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!doc) return res.status(404).json({ message: `${name} not found` });
        res.json(doc);
      } catch (e) {
        next(e);
      }
    },
    async remove(req, res, next) {
      try {
        const doc = await Model.findByIdAndDelete(req.params.id);
        if (!doc) return res.status(404).json({ message: `${name} not found` });
        res.json({ message: 'Deleted' });
      } catch (e) {
        next(e);
      }
    }
  };
}

export const products = crud(Product, 'products');
export const plans = crud(Plan, 'plans');
export const taxes = crud(Tax, 'taxes');
export const discounts = crud(Discount, 'discounts');
