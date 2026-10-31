import { useEffect, useState } from 'react';
import api, { rs, toPaise, toRupees } from '../../api.js';

const emptyTax = { name: '', rate: '', minAmount: '', appliesTo: 'all', active: true };
const emptyDisc = { name: '', code: '', type: 'percent', value: '', minPurchase: '', minQty: '', startDate: '', endDate: '', usageLimit: '', appliesTo: 'subscription' };

export default function TaxesDiscountsPage() {
  const [taxes, setTaxes] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [tax, setTax] = useState(emptyTax);
  const [disc, setDisc] = useState(emptyDisc);

  const load = async () => {
    const [t, d] = await Promise.all([api.get('/catalog/taxes'), api.get('/catalog/discounts')]);
    setTaxes(t.data.taxes);
    setDiscounts(d.data.discounts);
  };
  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1>Taxes & Discounts</h1>

      <div className="card">
        <h3>New tax rule</h3>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await api.post('/catalog/taxes', {
              name: tax.name,
              rate: Number(tax.rate),
              rules: { minAmount: toPaise(tax.minAmount || 0), appliesTo: tax.appliesTo },
              active: tax.active
            });
            setTax(emptyTax);
            load();
          }}
        >
          <div className="row">
            <div style={{ flex: 2 }}><label>Name</label><input value={tax.name} onChange={(e) => setTax({ ...tax, name: e.target.value })} required /></div>
            <div style={{ flex: 1 }}><label>Rate %</label><input type="number" step="0.01" min="0" max="100" value={tax.rate} onChange={(e) => setTax({ ...tax, rate: e.target.value })} required /></div>
            <div style={{ flex: 1 }}><label>Min subtotal (Rs)</label><input type="number" step="0.01" min="0" value={tax.minAmount} onChange={(e) => setTax({ ...tax, minAmount: e.target.value })} /></div>
            <div style={{ flex: 1 }}>
              <label>Applies to</label>
              <select value={tax.appliesTo} onChange={(e) => setTax({ ...tax, appliesTo: e.target.value })}>
                <option value="all">All</option>
                <option value="product">Product</option>
                <option value="subscription">Subscription</option>
              </select>
            </div>
          </div>
          <div className="row mt">
            <label className="inline"><input type="checkbox" checked={tax.active} onChange={(e) => setTax({ ...tax, active: e.target.checked })} /> Active</label>
            <button type="submit">Add tax</button>
          </div>
        </form>
      </div>

      <div className="card">
        <table className="grid">
          <thead><tr><th>Name</th><th>Rate</th><th>Min subtotal</th><th>Scope</th><th>Active</th><th></th></tr></thead>
          <tbody>
            {taxes.map((t) => (
              <tr key={t._id}>
                <td>{t.name}</td>
                <td>{t.rate}%</td>
                <td>{rs(t.rules?.minAmount)}</td>
                <td>{t.rules?.appliesTo}</td>
                <td>{t.active ? 'yes' : 'no'}</td>
                <td><button className="danger" onClick={async () => { if (window.confirm('Delete?')) { await api.delete(`/catalog/taxes/${t._id}`); load(); } }}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>New discount</h3>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await api.post('/catalog/discounts', {
              name: disc.name,
              code: disc.code || undefined,
              type: disc.type,
              value: disc.type === 'percent' ? Number(disc.value) : toPaise(disc.value),
              minPurchase: toPaise(disc.minPurchase || 0),
              minQty: Number(disc.minQty) || 0,
              startDate: disc.startDate,
              endDate: disc.endDate,
              usageLimit: Number(disc.usageLimit) || 0,
              appliesTo: disc.appliesTo
            });
            setDisc(emptyDisc);
            load();
          }}
        >
          <div className="row">
            <div style={{ flex: 2 }}><label>Name</label><input value={disc.name} onChange={(e) => setDisc({ ...disc, name: e.target.value })} required /></div>
            <div style={{ flex: 1 }}><label>Code</label><input value={disc.code} onChange={(e) => setDisc({ ...disc, code: e.target.value })} /></div>
            <div style={{ flex: 1 }}>
              <label>Type</label>
              <select value={disc.type} onChange={(e) => setDisc({ ...disc, type: e.target.value })}>
                <option value="percent">Percent</option>
                <option value="fixed">Fixed (Rs)</option>
              </select>
            </div>
            <div style={{ flex: 1 }}><label>Value {disc.type === 'percent' ? '(%)' : '(Rs)'}</label><input type="number" step="0.01" min="0" value={disc.value} onChange={(e) => setDisc({ ...disc, value: e.target.value })} required /></div>
          </div>
          <div className="row">
            <div style={{ flex: 1 }}><label>Min purchase (Rs)</label><input type="number" step="0.01" min="0" value={disc.minPurchase} onChange={(e) => setDisc({ ...disc, minPurchase: e.target.value })} /></div>
            <div style={{ flex: 1 }}><label>Min qty</label><input type="number" min="0" value={disc.minQty} onChange={(e) => setDisc({ ...disc, minQty: e.target.value })} /></div>
            <div style={{ flex: 1 }}><label>Start</label><input type="date" value={disc.startDate} onChange={(e) => setDisc({ ...disc, startDate: e.target.value })} required /></div>
            <div style={{ flex: 1 }}><label>End</label><input type="date" value={disc.endDate} onChange={(e) => setDisc({ ...disc, endDate: e.target.value })} required /></div>
            <div style={{ flex: 1 }}><label>Usage limit (0 = unlimited)</label><input type="number" min="0" value={disc.usageLimit} onChange={(e) => setDisc({ ...disc, usageLimit: e.target.value })} /></div>
          </div>
          <div className="row mt"><button type="submit">Add discount</button></div>
        </form>
      </div>

      <div className="card">
        <table className="grid">
          <thead><tr><th>Name</th><th>Code</th><th>Type</th><th>Value</th><th>Window</th><th>Used</th><th></th></tr></thead>
          <tbody>
            {discounts.map((d) => (
              <tr key={d._id}>
                <td>{d.name}</td>
                <td>{d.code || '-'}</td>
                <td>{d.type}</td>
                <td>{d.type === 'percent' ? `${d.value}%` : rs(d.value)}</td>
                <td>{d.startDate?.slice(0, 10)} → {d.endDate?.slice(0, 10)}</td>
                <td>{d.usedCount}/{d.usageLimit || '∞'}</td>
                <td><button className="danger" onClick={async () => { if (window.confirm('Delete?')) { await api.delete(`/catalog/discounts/${d._id}`); load(); } }}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
