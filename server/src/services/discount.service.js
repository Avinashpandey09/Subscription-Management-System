import Discount from '../models/Discount.js';

// Eligibility: startDate <= today <= endDate, usedCount < usageLimit
// (0 = unlimited), subtotal >= minPurchase, qty >= minQty.
export function isEligible(discount, { subtotalPaise, qty, today = new Date() }) {
  if (!discount) return false;
  if (discount.startDate && new Date(discount.startDate) > today) return false;
  if (discount.endDate && new Date(discount.endDate) < today) return false;
  if (discount.usageLimit > 0 && discount.usedCount >= discount.usageLimit) return false;
  if (subtotalPaise < (discount.minPurchase || 0)) return false;
  if (qty < (discount.minQty || 0)) return false;
  return true;
}

export function discountAmount(discount, subtotalPaise) {
  if (!discount) return 0;
  if (discount.type === 'percent') {
    return Math.min(subtotalPaise, Math.round((subtotalPaise * discount.value) / 100));
  }
  return Math.min(subtotalPaise, discount.value);
}

// Picks the best (largest) eligible discount for an invoice/bill run.
export async function bestDiscount({ subtotalPaise, qty, appliesTo = 'subscription', today = new Date() }) {
  const candidates = await Discount.find({ appliesTo }).lean();
  let best = null;
  let bestAmount = 0;
  for (const d of candidates) {
    if (!isEligible(d, { subtotalPaise, qty, today })) continue;
    const amount = discountAmount(d, subtotalPaise);
    if (amount > bestAmount) {
      best = d;
      bestAmount = amount;
    }
  }
  return best ? { discount: best, amount: bestAmount } : { discount: null, amount: 0 };
}

// Atomically consumes one usage; returns true if the increment happened.
export async function consumeUsage(discountId) {
  const res = await Discount.updateOne(
    {
      _id: discountId,
      $or: [{ usageLimit: 0 }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }]
    },
    { $inc: { usedCount: 1 } }
  );
  return res.modifiedCount === 1;
}
