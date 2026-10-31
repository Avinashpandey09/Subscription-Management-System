import Tax from '../models/Tax.js';

// Returns [{ taxId, name, rate, amount }] for every active tax whose rules
// match the given subtotal (paise). Amounts rounded to whole paise.
export async function calculateTaxes(subtotalPaise, appliesTo = 'subscription') {
  const taxes = await Tax.find({ active: true }).lean();
  return taxes
    .filter((t) => {
      const scope = t.rules?.appliesTo || 'all';
      if (scope !== 'all' && scope !== appliesTo) return false;
      return subtotalPaise >= (t.rules?.minAmount || 0);
    })
    .map((t) => ({
      taxId: t._id,
      name: t.name,
      rate: t.rate,
      amount: Math.round((subtotalPaise * t.rate) / 100)
    }));
}

export function sumTax(amounts) {
  return amounts.reduce((s, t) => s + t.amount, 0);
}
