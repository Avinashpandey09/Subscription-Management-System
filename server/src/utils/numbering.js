import Counter from '../models/Counter.js';

// Generates sequential numbers like SUB-0001, INV-0001 (atomic via $inc).
export async function getNextNumber(key, prefix) {
  const doc = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `${prefix}-${String(doc.seq).padStart(4, '0')}`;
}
