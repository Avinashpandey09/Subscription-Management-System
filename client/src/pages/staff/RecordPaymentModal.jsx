import { useState } from 'react';
import api, { rs, toPaise } from '../../api.js';

export default function RecordPaymentModal({ invoice, onClose, onSaved }) {
  const [form, setForm] = useState({ method: 'UPI', amount: (invoice.amountDue / 100).toFixed(2), date: '', note: '' });
  const [error, setError] = useState('');

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Record payment — {invoice.number}</h2>
        <p className="hint">Total {rs(invoice.total)} · Paid {rs(invoice.amountPaid)} · Due {rs(invoice.amountDue)}</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            try {
              await api.post('/payments', {
                invoiceId: invoice._id,
                method: form.method,
                amount: toPaise(form.amount),
                date: form.date || undefined,
                note: form.note
              });
              onSaved();
            } catch (err) {
              setError(err.response?.data?.message || 'Failed');
            }
          }}
        >
          <label>Method</label>
          <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
            {['Card', 'UPI', 'Bank Transfer', 'Cash'].map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <label>Amount (Rs)</label>
          <input type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <label>Date (optional)</label>
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <label>Note</label>
          <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <div className="row mt">
            <button type="submit">Save payment</button>
            <button type="button" className="secondary" onClick={onClose}>Cancel</button>
          </div>
          {error && <div className="error">{error}</div>}
        </form>
      </div>
    </div>
  );
}
