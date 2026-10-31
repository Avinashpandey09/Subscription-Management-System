import { useEffect, useState } from 'react';
import api, { rs } from '../../api.js';

export const isOverdue = (inv) =>
  new Date(inv.dueDate) < new Date(new Date().toDateString()) && !['Paid', 'Cancelled'].includes(inv.status);

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);

  const load = () => {
    api.get('/invoices', { params: status ? { status } : {} }).then((r) => setInvoices(r.data.invoices));
  };
  useEffect(load, [status]);

  const download = async (inv) => {
    const r = await api.get(`/invoices/${inv._id}/pdf`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${inv.number}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h1>Invoices</h1>
      <div className="row">
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 'auto' }}>
          <option value="">All statuses</option>
          {['Draft', 'Confirmed', 'Paid', 'Cancelled'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button
          onClick={async () => {
            const r = await api.post('/invoices/run-billing');
            setResult(r.data);
            load();
          }}
        >
          Run Billing Now
        </button>
      </div>
      {result && (
        <p className="hint">
          Billed {result.billed}, skipped {result.skipped}
          {result.errors?.length ? `, errors: ${result.errors.map((e) => `${e.subscription}: ${e.message}`).join('; ')}` : ''}
        </p>
      )}
      <div className="card mt">
        <table className="grid">
          <thead><tr><th>Number</th><th>Customer</th><th>Period</th><th>Total</th><th>Due</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv._id}>
                <td>{inv.number}</td>
                <td>{inv.customer?.name}</td>
                <td>{inv.periodStart?.slice(0, 10)}</td>
                <td>{rs(inv.total)}</td>
                <td>{inv.dueDate?.slice(0, 10)}</td>
                <td>
                  <span className={`badge ${inv.status === 'Paid' ? 'green' : inv.status === 'Cancelled' ? 'red' : 'blue'}`}>{inv.status}</span>{' '}
                  {isOverdue(inv) && <span className="badge amber">Overdue</span>}
                </td>
                <td>
                  <div className="row">
                    {inv.status === 'Draft' && (
                      <button className="secondary" onClick={async () => { await api.patch(`/invoices/${inv._id}/status`, { status: 'Confirmed' }); load(); }}>Confirm</button>
                    )}
                    {['Draft', 'Confirmed'].includes(inv.status) && (
                      <button className="secondary" onClick={async () => { if (window.confirm('Cancel invoice?')) { await api.patch(`/invoices/${inv._id}/status`, { status: 'Cancelled' }); load(); } }}>Cancel</button>
                    )}
                    <button className="secondary" onClick={() => download(inv)}>PDF</button>
                    <button className="secondary" onClick={async () => { const r = await api.post(`/invoices/${inv._id}/send`); alert(r.data.message); }}>Send</button>
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
