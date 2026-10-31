import { useEffect, useState } from 'react';
import api, { rs, toPaise, toRupees } from '../../api.js';

const empty = { name: '', type: 'goods', salesPrice: '', costPrice: '', notes: '', variants: [] };

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);

  const load = () => api.get('/catalog/products').then((r) => setProducts(r.data.products));
  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      salesPrice: toPaise(form.salesPrice),
      costPrice: toPaise(form.costPrice || 0),
      variants: form.variants.map((v) => ({ ...v, extraPrice: toPaise(v.extraPriceRs || 0) }))
    };
    delete payload.extraPriceRs;
    if (editing) await api.put(`/catalog/products/${editing}`, payload);
    else await api.post('/catalog/products', payload);
    setForm(empty);
    setEditing(null);
    load();
  };

  const startEdit = (p) => {
    setEditing(p._id);
    setForm({
      name: p.name,
      type: p.type,
      salesPrice: toRupees(p.salesPrice),
      costPrice: toRupees(p.costPrice),
      notes: p.notes || '',
      variants: (p.variants || []).map((v) => ({ attribute: v.attribute, value: v.value, extraPriceRs: toRupees(v.extraPrice) }))
    });
  };

  return (
    <div>
      <h1>Products</h1>
      <div className="card">
        <h3>{editing ? 'Edit product' : 'New product'}</h3>
        <form onSubmit={submit}>
          <div className="row">
            <div style={{ flex: 2 }}><label>Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div style={{ flex: 1 }}><label>Type</label><input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required /></div>
          </div>
          <div className="row">
            <div style={{ flex: 1 }}><label>Sales price (Rs)</label><input type="number" step="0.01" min="0" value={form.salesPrice} onChange={(e) => setForm({ ...form, salesPrice: e.target.value })} required /></div>
            <div style={{ flex: 1 }}><label>Cost price (Rs)</label><input type="number" step="0.01" min="0" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} /></div>
          </div>
          <label>Notes</label>
          <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

          <h4>Variants (attribute + extra price)</h4>
          {form.variants.map((v, i) => (
            <div className="row" key={i}>
              <input placeholder="Attribute (e.g. Brand)" value={v.attribute} onChange={(e) => { const vs = [...form.variants]; vs[i].attribute = e.target.value; setForm({ ...form, variants: vs }); }} required />
              <input placeholder="Value (e.g. Odoo)" value={v.value} onChange={(e) => { const vs = [...form.variants]; vs[i].value = e.target.value; setForm({ ...form, variants: vs }); }} required />
              <input placeholder="+ Rs" type="number" step="0.01" min="0" value={v.extraPriceRs} onChange={(e) => { const vs = [...form.variants]; vs[i].extraPriceRs = e.target.value; setForm({ ...form, variants: vs }); }} required />
              <button type="button" className="secondary" onClick={() => setForm({ ...form, variants: form.variants.filter((_, j) => j !== i) })}>Remove</button>
            </div>
          ))}
          <div className="row mt">
            <button type="button" className="secondary" onClick={() => setForm({ ...form, variants: [...form.variants, { attribute: '', value: '', extraPriceRs: '' }] })}>Add variant</button>
          </div>
          <div className="row mt">
            <button type="submit">{editing ? 'Save' : 'Create'}</button>
            {editing && <button type="button" className="secondary" onClick={() => { setEditing(null); setForm(empty); }}>Cancel</button>}
          </div>
        </form>
      </div>

      <div className="card">
        <table className="grid">
          <thead><tr><th>Name</th><th>Type</th><th>Sales</th><th>Cost</th><th>Variants</th><th></th></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id}>
                <td>{p.name}</td>
                <td>{p.type}</td>
                <td>{rs(p.salesPrice)}</td>
                <td>{rs(p.costPrice)}</td>
                <td>{(p.variants || []).map((v) => `${v.attribute}: ${v.value} (+${rs(v.extraPrice)})`).join(', ') || '-'}</td>
                <td>
                  <div className="row">
                    <button className="secondary" onClick={() => startEdit(p)}>Edit</button>
                    <button className="danger" onClick={async () => { if (window.confirm('Delete?')) { await api.delete(`/catalog/products/${p._id}`); load(); } }}>Delete</button>
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
