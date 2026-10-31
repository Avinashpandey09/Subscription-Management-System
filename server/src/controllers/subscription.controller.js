import Subscription from '../models/Subscription.js';
import QuotationTemplate from '../models/QuotationTemplate.js';
import Product from '../models/Product.js';
import Plan from '../models/Plan.js';
import User from '../models/User.js';
import { getNextNumber } from '../utils/numbering.js';

// Valid state transitions. Paused is only reachable when plan.pausable.
const TRANSITIONS = {
  Draft: ['Quotation'],
  Quotation: ['Confirmed'],
  Confirmed: ['Active'],
  Active: ['Paused', 'Closed'],
  Paused: ['Active', 'Closed'],
  Closed: []
};

export function canTransition(from, to, plan) {
  if (!TRANSITIONS[from]?.includes(to)) return false;
  if (to === 'Paused' && !plan?.pausable) return false;
  return true;
}

function buildLine(product, qty, variantIndex = -1) {
  const variant = variantIndex >= 0 ? product.variants?.[variantIndex] : null;
  const unitPrice = product.salesPrice + (variant?.extraPrice || 0);
  return {
    productId: product._id,
    name: variant ? `${product.name} (${variant.attribute}: ${variant.value})` : product.name,
    qty,
    unitPrice,
    variant: variant
      ? { attribute: variant.attribute, value: variant.value, extraPrice: variant.extraPrice }
      : undefined,
    amount: qty * unitPrice
  };
}

export async function list(req, res, next) {
  try {
    const filter = { ...req.customerFilter };
    if (req.user.role !== 'customer' && req.query.customerId) filter.customerId = req.query.customerId;
    if (req.query.status) filter.status = req.query.status;
    const subs = await Subscription.find(filter)
      .populate('planId', 'name billingPeriod price pausable closable renewable autoClose')
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ subscriptions: subs });
  } catch (e) {
    next(e);
  }
}

export async function get(req, res, next) {
  try {
    const sub = await Subscription.findOne({ _id: req.params.id, ...req.customerFilter })
      .populate('planId')
      .populate('customerId', 'name email')
      .lean();
    if (!sub) return res.status(404).json({ message: 'Subscription not found' });
    res.json({ subscription: sub });
  } catch (e) {
    next(e);
  }
}

export async function create(req, res, next) {
  try {
    const { customerId, planId, startDate, expiryDate, paymentTerms, paymentTermsDays, lines } = req.body;
    const plan = await Plan.findById(planId);
    if (!plan) return res.status(400).json({ message: 'Invalid plan' });

    // Customers can only create subscriptions for themselves
    const ownerId = req.user.role === 'customer' ? req.user.id : customerId;
    if (!ownerId) return res.status(400).json({ message: 'customerId is required' });
    const customer = await User.findById(ownerId);
    if (!customer) return res.status(400).json({ message: 'Invalid customer' });

    const resolvedLines = [];
    for (const l of lines || []) {
      const product = await Product.findById(l.productId);
      if (!product) return res.status(400).json({ message: `Invalid product: ${l.productId}` });
      resolvedLines.push(buildLine(product, l.qty || 1, l.variantIndex ?? -1));
    }

    const sub = await Subscription.create({
      number: await getNextNumber('subscription', 'SUB'),
      customerId: ownerId,
      planId,
      startDate: startDate || new Date(),
      expiryDate,
      paymentTerms,
      paymentTermsDays,
      lines: resolvedLines,
      status: 'Draft'
    });
    res.status(201).json({ subscription: sub });
  } catch (e) {
    next(e);
  }
}

// 1-click quote creation from a template
export async function fromTemplate(req, res, next) {
  try {
    const template = await QuotationTemplate.findById(req.params.templateId).populate('plan');
    if (!template) return res.status(404).json({ message: 'Template not found' });

    const ownerId = req.user.role === 'customer' ? req.user.id : req.body.customerId;
    if (!ownerId) return res.status(400).json({ message: 'customerId is required' });

    const resolvedLines = [];
    for (const l of template.productLines) {
      const product = await Product.findById(l.productId);
      if (!product) continue;
      resolvedLines.push(buildLine(product, l.qty, l.variantIndex));
    }

    const startDate = req.body.startDate ? new Date(req.body.startDate) : new Date();
    const sub = await Subscription.create({
      number: await getNextNumber('subscription', 'SUB'),
      customerId: ownerId,
      planId: template.plan._id,
      startDate,
      expiryDate: req.body.expiryDate,
      paymentTerms: req.body.paymentTerms,
      paymentTermsDays: req.body.paymentTermsDays,
      lines: resolvedLines,
      status: 'Quotation'
    });
    res.status(201).json({ subscription: sub });
  } catch (e) {
    next(e);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    const sub = await Subscription.findOne({ _id: req.params.id, ...req.customerFilter }).populate('planId');
    if (!sub) return res.status(404).json({ message: 'Subscription not found' });
    if (!canTransition(sub.status, status, sub.planId)) {
      return res.status(400).json({ message: `Invalid transition: ${sub.status} -> ${status}` });
    }
    // Customer-initiated early close honours the plan flag
    if (req.user.role === 'customer' && status === 'Closed' && !sub.planId.closable) {
      return res.status(403).json({ message: 'This plan cannot be closed early' });
    }
    sub.status = status;
    if (status === 'Active' && !sub.nextInvoiceDate) sub.nextInvoiceDate = sub.startDate;
    await sub.save();
    res.json({ subscription: sub });
  } catch (e) {
    next(e);
  }
}

// Renew: creates a fresh Draft subscription from a Closed/pausable one (plan must be renewable)
export async function renew(req, res, next) {
  try {
    const sub = await Subscription.findOne({ _id: req.params.id, ...req.customerFilter }).populate('planId');
    if (!sub) return res.status(404).json({ message: 'Subscription not found' });
    if (!sub.planId.renewable) return res.status(403).json({ message: 'This plan is not renewable' });
    if (!['Closed', 'Active', 'Paused'].includes(sub.status)) {
      return res.status(400).json({ message: 'Only Active, Paused or Closed subscriptions can be renewed' });
    }
    const copy = await Subscription.create({
      number: await getNextNumber('subscription', 'SUB'),
      customerId: sub.customerId,
      planId: sub.planId._id,
      startDate: new Date(),
      lines: sub.lines,
      paymentTerms: sub.paymentTerms,
      paymentTermsDays: sub.paymentTermsDays,
      status: 'Draft'
    });
    res.status(201).json({ subscription: copy });
  } catch (e) {
    next(e);
  }
}

// --- Quotation templates ---

export async function listTemplates(req, res, next) {
  try {
    const templates = await QuotationTemplate.find()
      .populate('plan', 'name billingPeriod price')
      .populate('productLines.productId', 'name salesPrice')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ templates });
  } catch (e) {
    next(e);
  }
}

export async function createTemplate(req, res, next) {
  try {
    const t = await QuotationTemplate.create(req.body);
    res.status(201).json({ template: t });
  } catch (e) {
    next(e);
  }
}

export async function deleteTemplate(req, res, next) {
  try {
    const t = await QuotationTemplate.findByIdAndDelete(req.params.id);
    if (!t) return res.status(404).json({ message: 'Template not found' });
    res.json({ message: 'Deleted' });
  } catch (e) {
    next(e);
  }
}
