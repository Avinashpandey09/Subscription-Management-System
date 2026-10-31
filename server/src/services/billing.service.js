import Subscription from '../models/Subscription.js';
import Invoice from '../models/Invoice.js';
import { calculateTaxes, sumTax } from './tax.service.js';
import { bestDiscount, consumeUsage } from './discount.service.js';
import { getNextNumber } from '../utils/numbering.js';

export function advanceDate(date, period) {
  const d = new Date(date);
  switch (period) {
    case 'daily':
      d.setUTCDate(d.getUTCDate() + 1);
      break;
    case 'weekly':
      d.setUTCDate(d.getUTCDate() + 7);
      break;
    case 'monthly':
      d.setUTCMonth(d.getUTCMonth() + 1);
      break;
    case 'yearly':
      d.setUTCFullYear(d.getUTCFullYear() + 1);
      break;
    default:
      d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return d;
}

// One billing run: bills every Active subscription due on/before `today`.
// Idempotent — reruns never double-bill thanks to the unique
// { subscriptionId, periodStart } index.
export async function runBilling(today = new Date()) {
  const due = await Subscription.find({
    status: 'Active',
    nextInvoiceDate: { $lte: today }
  })
    .populate('planId')
    .populate('customerId', 'name email');

  const result = { billed: 0, skipped: 0, errors: [] };

  for (const sub of due) {
    try {
      // Auto-close expired subscriptions instead of billing them
      if (sub.planId?.autoClose && sub.expiryDate && new Date(sub.expiryDate) < today) {
        sub.status = 'Closed';
        await sub.save();
        result.skipped += 1;
        continue;
      }

      const periodStart = new Date(sub.nextInvoiceDate);
      const periodEnd = advanceDate(periodStart, sub.planId?.billingPeriod);

      // 1. Build invoice lines: recurring plan fee + subscription product lines
      const lines = [];
      if (sub.planId) {
        lines.push({
          name: `Plan: ${sub.planId.name} (${sub.planId.billingPeriod})`,
          qty: 1,
          unitPrice: sub.planId.price,
          amount: sub.planId.price
        });
      }
      for (const l of sub.lines || []) {
        lines.push({ name: l.name, qty: l.qty, unitPrice: l.unitPrice, amount: l.amount });
      }
      const subtotal = lines.reduce((s, l) => s + l.amount, 0);
      const totalQty = lines.reduce((s, l) => s + l.qty, 0);

      // 2. Taxes + 3. Discounts (all integer paise)
      const taxBreakdown = await calculateTaxes(subtotal, 'subscription');
      const taxTotal = sumTax(taxBreakdown);
      const { discount, amount: discountAmount } = await bestDiscount({
        subtotalPaise: subtotal,
        qty: totalQty,
        appliesTo: 'subscription',
        today
      });
      const total = subtotal - discountAmount + taxTotal;

      const dueDate = new Date(periodStart);
      dueDate.setUTCDate(dueDate.getUTCDate() + (sub.paymentTermsDays ?? 15));

      // 4. Insert Draft invoice (unique index => rerun-safe)
      try {
        await Invoice.create({
          number: await getNextNumber('invoice', 'INV'),
          subscriptionId: sub._id,
          periodStart,
          periodEnd,
          customerId: sub.customerId?._id || sub.customerId,
          customer: { name: sub.customerId?.name, email: sub.customerId?.email },
          lines,
          subtotal,
          tax: { breakdown: taxBreakdown, total: taxTotal },
          discount: discount
            ? { name: discount.name, code: discount.code, type: discount.type, amount: discountAmount }
            : { amount: 0 },
          total,
          amountPaid: 0,
          amountDue: total,
          dueDate,
          status: 'Draft'
        });
      } catch (e) {
        if (e?.code === 11000) {
          result.skipped += 1; // already billed for this period
          continue;
        }
        throw e;
      }

      // 5. Consume discount usage atomically
      if (discount) await consumeUsage(discount._id);

      // 6. Advance the subscription to the next period
      sub.nextInvoiceDate = periodEnd;
      await sub.save();
      result.billed += 1;
    } catch (e) {
      result.errors.push({ subscription: sub.number, message: e.message });
    }
  }

  return result;
}
