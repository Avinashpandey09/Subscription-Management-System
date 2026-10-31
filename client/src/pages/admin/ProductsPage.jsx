import { useEffect, useState } from 'react';
import api, { toPaise, toRupees } from '../../api.js';

const empty = {
  name: '',
  type: 'Consumable',
  salesPrice: '',
  costPrice: '',
  notes: '',
  isActive: true,
  variants: []
};
const pageSize = 10;

const inr = (paise) => `₹${(Number(paise || 0) / 100).toFixed(2)}`;
const errorMessage = (error) =>
  error?.response?.data?.message || 'The product could not be saved. Please try again.';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingStatus, setChangingStatus] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [activeFilter, setActiveFilter] = useState('');

  const load = async (requestedPage = page, requestedFilter = activeFilter) => {
    setLoading(true);
    try {
      const { data } = await api.get('/catalog/products', {
        params: {
          page: requestedPage,
          pageSize,
          isActive: requestedFilter === '' ? undefined : requestedFilter
        }
      });
      setProducts(data.products);
      setTotal(data.total);
      setPage(data.page);
      setError('');
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1, '');
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      name: form.name,
      type: form.type,
      salesPrice: toPaise(form.salesPrice),
      costPrice: toPaise(form.costPrice || 0),
      notes: form.notes,
      isActive: form.isActive,
      variants: form.variants.map((variant) => ({
        attributeName: variant.attributeName,
        attributeValue: variant.attributeValue,
        extraPrice: toPaise(variant.extraPriceRs || 0)
      }))
    };

    try {
      if (editing) await api.put(`/catalog/products/${editing}`, payload);
      else await api.post('/catalog/products', payload);
      setForm(empty);
      setEditing(null);
      await load(editing ? page : 1);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (product) => {
    setEditing(product.id);
    setForm({
      name: product.name,
      type: product.type,
      salesPrice: toRupees(product.salesPrice),
      costPrice: toRupees(product.costPrice),
      notes: product.notes || '',
      isActive: product.isActive,
      variants: product.variants.map((variant) => ({
        attributeName: variant.attributeName,
        attributeValue: variant.attributeValue,
        extraPriceRs: toRupees(variant.extraPrice)
      }))
    });
    setError('');
  };

  const updateVariant = (index, field, value) => {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, [field]: value } : variant
      )
    }));
  };

  const changeStatus = async (product) => {
    setChangingStatus(product.id);
    setError('');
    try {
      await api.patch(`/catalog/products/${product.id}/status`, {
        isActive: !product.isActive
      });
      await load();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setChangingStatus(null);
    }
  };

  const removeProduct = async (product) => {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    setError('');
    try {
      await api.delete(`/catalog/products/${product.id}`);
      await load(page);
    } catch (requestError) {
      setError(errorMessage(requestError));
    }
  };

  const changeFilter = (value) => {
    setActiveFilter(value);
    load(1, value);
  };

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <h1>Products</h1>
      {error && <p className="error" role="alert">{error}</p>}

      <div className="card">
        <h3>{editing ? 'Edit product' : 'New product'}</h3>
        <form onSubmit={submit}>
          <div className="row">
            <div style={{ flex: 2 }}>
              <label htmlFor="product-name">Name</label>
              <input id="product-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required maxLength="160" />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="product-type">Type</label>
              <select id="product-type" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
                <option>Consumable</option>
                <option>Service</option>
                <option>Storable</option>
              </select>
            </div>
          </div>
          <div className="row">
            <div style={{ flex: 1 }}>
              <label htmlFor="sales-price">Sales price (₹)</label>
              <input id="sales-price" type="number" step="0.01" min="0" value={form.salesPrice} onChange={(event) => setForm({ ...form, salesPrice: event.target.value })} required />
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="cost-price">Cost price (₹)</label>
              <input id="cost-price" type="number" step="0.01" min="0" value={form.costPrice} onChange={(event) => setForm({ ...form, costPrice: event.target.value })} />
            </div>
          </div>
          <label htmlFor="product-notes">Notes</label>
          <textarea id="product-notes" rows="3" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />

          <h4>Variants</h4>
          {form.variants.map((variant, index) => (
            <div className="row" key={index}>
              <input
                aria-label={`Variant ${index + 1} attribute`}
                placeholder="Attribute (e.g. Brand)"
                value={variant.attributeName}
                onChange={(event) => updateVariant(index, 'attributeName', event.target.value)}
                required
              />
              <input
                aria-label={`Variant ${index + 1} value`}
                placeholder="Value (e.g. Odoo)"
                value={variant.attributeValue}
                onChange={(event) => updateVariant(index, 'attributeValue', event.target.value)}
                required
              />
              <input
                aria-label={`Variant ${index + 1} extra price in rupees`}
                placeholder="Extra price (₹)"
                type="number"
                step="0.01"
                min="0"
                value={variant.extraPriceRs}
                onChange={(event) => updateVariant(index, 'extraPriceRs', event.target.value)}
                required
              />
              <button
                type="button"
                className="secondary"
                onClick={() => setForm({
                  ...form,
                  variants: form.variants.filter((_, variantIndex) => variantIndex !== index)
                })}
              >
                Remove
              </button>
            </div>
          ))}
          <div className="row mt">
            <button
              type="button"
              className="secondary"
              onClick={() => setForm({
                ...form,
                variants: [...form.variants, { attributeName: '', attributeValue: '', extraPriceRs: '' }]
              })}
            >
              Add variant
            </button>
            {editing && (
              <label className="inline">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
                />
                Active
              </label>
            )}
          </div>
          <div className="row mt">
            <button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create product'}</button>
            {editing && (
              <button type="button" className="secondary" onClick={() => { setEditing(null); setForm(empty); }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: '0.8rem' }}>
          <h3>Product list</h3>
          <label>
            Status
            <select value={activeFilter} onChange={(event) => changeFilter(event.target.value)}>
              <option value="">All products</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </label>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="grid">
            <thead>
              <tr><th>Name</th><th>Type</th><th>Sales price</th><th>Cost price</th><th>Variants</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <strong>{product.name}</strong>
                    {product.notes && <div className="hint">{product.notes}</div>}
                  </td>
                  <td>{product.type}</td>
                  <td>{inr(product.salesPrice)}</td>
                  <td>{inr(product.costPrice)}</td>
                  <td>
                    {product.variants.length
                      ? product.variants.map((variant) => (
                        <div key={variant.id}>
                          {variant.attributeName}: {variant.attributeValue} (+{inr(variant.extraPrice)}) · {inr(variant.finalPrice)}
                        </div>
                      ))
                      : '-'}
                  </td>
                  <td>
                    <label className="inline">
                      <input
                        type="checkbox"
                        checked={product.isActive}
                        disabled={changingStatus === product.id}
                        onChange={() => changeStatus(product)}
                        aria-label={`${product.isActive ? 'Deactivate' : 'Activate'} ${product.name}`}
                      />
                      {product.isActive ? 'Active' : 'Inactive'}
                    </label>
                  </td>
                  <td>
                    <div className="row">
                      <button className="secondary" onClick={() => startEdit(product)}>Edit</button>
                      <button className="danger" onClick={() => removeProduct(product)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && products.length === 0 && (
                <tr><td colSpan="7">No products found.</td></tr>
              )}
              {loading && <tr><td colSpan="7">Loading products…</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="row mt" style={{ justifyContent: 'space-between' }}>
          <span className="hint">{total} product{total === 1 ? '' : 's'}</span>
          <div className="row">
            <button className="secondary" disabled={loading || page <= 1} onClick={() => load(page - 1)}>Previous</button>
            <span className="hint">Page {page} of {pageCount}</span>
            <button className="secondary" disabled={loading || page >= pageCount} onClick={() => load(page + 1)}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
