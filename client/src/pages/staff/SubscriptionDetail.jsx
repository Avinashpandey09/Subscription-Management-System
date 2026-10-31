import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { rs } from '../../api.js';
import { Pipeline } from './SubscriptionsPage.jsx';

// Also serves as the "new subscription" form at /staff/subscriptions/new
// with a real-time line item calculator.
export default function SubscriptionDetail() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const [sub, setSub] = useState(null);
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ customerId: '', planId: '', startDate: '', paymentTermsDays: 15, lines: [] });

  useEffect(() => {
    api.get('/catalog/plans').then((r) => setPlans(r.data.plans));
    api.get('/catalog/products').then((r) => setProducts(r.data.products));
    if (!isNew) api.get(`/subscriptions/${id}`).then((r) => setSub(r.data.subscription));
  }, [id, isNew]);

  const lineTotal = (l) => {
    const p = products.find((x) => x._id === l.productId);
    if (!p) return 0;
    const extra = l.variantIndex >= 0 ? p.variants?.[l.variantIndex]?.extraPrice || 0 : 0;
    return (l.qty || 0) * (p.salesPrice + extra);
  };
  const grandTotal = form.lines.reduce((s, l) => s + lineTotal(l), 0);

  const move = async (status) => {
    setError('');
    try {
      const r = await api.patch(`/subscriptions/${id}/status`, { status });
      setSub(r.data.subscription);
    } catch (e) {
      setError(e.response?.data?.message || 'Transition failed');
    }
  };

  if (isNew) {
    return (
      <div>
        <h1>New subscription</h1>
        <div className="card">
          <div className="row">
            <div style={{ flex: 1 }}><label>Customer ID</label><input value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} placeholder="User _id" /></div>
            <div style={{ flex: 1 }}>
              <label>Plan</label>
              <select value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })}>
                <option value="">Select plan</option>
                {plans.map((p) => <option key={p._id} value={p._id}>{p.name} — {rs(p.price)}/{p.billingPeriod}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}><label>Start date</label><input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
          </div>
          <h4>Lines <span className="hint">(total updates live: {rs(grandTotal)})</span></h4>
          {form.lines.map((l, i) => (
            <div className="row" key={i}>
              <select value={l.productId} onChange={(e) => { const ls = [...form.lines]; ls[i] = { ...ls[i], productId: e.target.value, variantIndex: -1 }; setForm({ ...form, lines: ls }); }}>
                <option value="">Product</option>
                {products.map((p) => <option key={p._id} value={p._id}>{p.name} — {rs(p.salesPrice)}</option>)}
              </select>
              <select value={l.variantIndex} onChange={(e) => { const ls = [...form.lines]; ls[i].variantIndex = Number(e.target.value); setForm({ ...form, lines: ls }); }}>
                <option value={-1}>Base</option>
                {(products.find((p) => p._id === l.productId)?.variants || []).map((v, vi) => (
                  <option key={vi} value={vi}>{v.attribute}: {v.value} (+{rs(v.extraPrice)})</option>
                ))}
              </select>
              <input type="number" min="1" style={{ maxWidth: 90 }} value={l.qty} onChange={(e) => { const ls = [...form.lines]; ls[i].qty = Number(e.target.value); setForm({ ...form, lines: ls }); }} />
              <span style={{ minWidth: 110 }}>{rs(lineTotal(l))}</span>
              <button type="button" className="secondary" onClick={() => setForm({ ...form, lines: form.lines.filter((_, j) => j !== i) })}>Remove</button>
            </div>
          ))}
          <div className="row mt">
            <button type="button" className="secondary" onClick={() => setForm({ ...form, lines: [...form.lines, { productId: '', qty: 1, variantIndex: -1 }] })}>Add line</button>
          </div>
          <div className="row mt">
            <button
              disabled={!form.customerId || !form.planId}
              onClick={async () => {
                const r = await api.post('/subscriptions', { ...form, startDate: form.startDate || undefined });
                navigate(`/staff/subscriptions/${r.data.subscription._id}`);
              }}
            >
              Create draft ({rs(grandTotal)})
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!sub) return <div className="center">Loading...</div>;

  const nexts = { Draft: ['Quotation'], Quotation: ['Confirmed'], Confirmed: ['Active'], Active: ['Paused', 'Closed'], Paused: ['Active', 'Closed'], Closed: [] }[sub.status] || [];

  return (
    <div>
      <Link to="/staff/subscriptions">← Back</Link>
      <h1>{sub.number}</h1>
      <Pipeline status={sub.status} />
      <div className="card">
        <p><b>Customer:</b> {sub.customerId?.name} ({sub.customerId?.email})</p>
        <p><b>Plan:</b> {sub.planId?.name} — {rs(sub.planId?.price)}/{sub.planId?.billingPeriod}</p>
        <p><b>Start:</b> {sub.startDate?.slice(0, 10)} · <b>Next invoice:</b> {sub.nextInvoiceDate?.slice(0, 10) || '-'}</p>
        <p><b>Terms:</b> {sub.paymentTerms} ({sub.paymentTermsDays} days)</p>
        <table className="grid">
          <thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Amount</th></tr></thead>
          <tbody>
            {(sub.lines || []).map((l, i) => (
              <tr key={i}><td>{l.name}</td><td>{l.qty}</td><td>{rs(l.unitPrice)}</td><td>{rs(l.amount)}</td></tr>
            ))}
          </tbody>
        </table>
        <div className="row mt">
          {nexts.map((s) => (
            <button key={s} onClick={() => move(s)} disabled={s === 'Paused' && !sub.planId?.pausable}>
              Move to {s}
            </button>
          ))}
        </div>
        {error && <div className="error">{error}</div>}
      </div>
    </div>
  );
}
