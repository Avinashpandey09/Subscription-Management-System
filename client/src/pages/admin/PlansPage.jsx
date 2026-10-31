import { useEffect, useState } from 'react';
import api, { rs, toPaise, toRupees } from '../../api.js';

const empty = { name: '', price: '', billingPeriod: 'monthly', minQty: 1, startDate: '', endDate: '', autoClose: false, closable: true, pausable: false, renewable: true };

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  const load = () => api.get('/catalog/plans').then((r) => setPlans(r.data.plans));
  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      price: toPaise(form.price),
      minQty: Number(form.minQty) || 1,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined
    };
    if (editing) await api.put(`/catalog/plans/${editing}`, payload);
    else await api.post('/catalog/plans', payload);
    setForm(empty);
    setEditing(null);
    load();
  };

  const startEdit = (p) => {
    setEditing(p._id);
    setForm({
      name: p.name,
      price: toRupees(p.price),
      billingPeriod: p.billingPeriod,
      minQty: p.minQty,
      startDate: p.startDate ? p.startDate.slice(0, 10) : '',
      endDate: p.endDate ? p.endDate.slice(0, 10) : '',
      autoClose: !!p.autoClose,
      closable: !!p.closable,
      pausable: !!p.pausable,
      renewable: !!p.renewable
    });
  };

  return (
    <div>
      <h1>Plans</h1>
      <div className="card">
        <h3>{editing ? 'Edit plan' : 'New plan'}</h3>
        <form onSubmit={submit}>
          <div className="row">
            <div style={{ flex: 2 }}><label>Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div style={{ flex: 1 }}><label>Price (Rs)</label><input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></div>
          </div>
          <div className="row">
            <div style={{ flex: 1 }}>
              <label>Billing period</label>
              <select value={form.billingPeriod} onChange={(e) => setForm({ ...form, billingPeriod: e.target.value })}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div style={{ flex: 1 }}><label>Min qty</label><input type="number" min="1" value={form.minQty} onChange={(e) => setForm({ ...form, minQty: e.target.value })} /></div>
            <div style={{ flex: 1 }}><label>Start date</label><input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></div>
            <div style={{ flex: 1 }}><label>End date</label><input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></div>
          </div>
          <div className="row mt">
            <label className="inline"><input type="checkbox" checked={form.autoClose} onChange={(e) => setForm({ ...form, autoClose: e.target.checked })} /> Auto-close</label>
            <label className="inline"><input type="checkbox" checked={form.closable} onChange={(e) => setForm({ ...form, closable: e.target.checked })} /> Closable</label>
            <label className="inline"><input type="checkbox" checked={form.pausable} onChange={(e) => setForm({ ...form, pausable: e.target.checked })} /> Pausable</label>
            <label className="inline"><input type="checkbox" checked={form.renewable} onChange={(e) => setForm({ ...form, renewable: e.target.checked })} /> Renewable</label>
          </div>
          <div className="row mt">
            <button type="submit">{editing ? 'Save' : 'Create'}</button>
            {editing && <button type="button" className="secondary" onClick={() => { setEditing(null); setForm(empty); }}>Cancel</button>}
          </div>
        </form>
      </div>

      <div className="card">
        <table className="grid">
          <thead><tr><th>Name</th><th>Price</th><th>Period</th><th>Flags</th><th></th></tr></thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p._id}>
                <td>{p.name}</td>
                <td>{rs(p.price)}</td>
                <td>{p.billingPeriod}</td>
                <td>
                  {[p.autoClose && 'auto-close', p.closable && 'closable', p.pausable && 'pausable', p.renewable && 'renewable'].filter(Boolean).join(', ')}
                </td>
                <td>
                  <div className="row">
                    <button className="secondary" onClick={() => startEdit(p)}>Edit</button>
                    <button className="danger" onClick={async () => { if (window.confirm('Delete?')) { await api.delete(`/catalog/plans/${p._id}`); load(); } }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
