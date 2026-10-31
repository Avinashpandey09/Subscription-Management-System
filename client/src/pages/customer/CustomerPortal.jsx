import { useEffect, useState } from 'react';
import api, { rs } from '../../api.js';
import { Pipeline } from '../staff/SubscriptionsPage.jsx';

// Customer self-service portal: the API strictly scopes every query to
// customerId = req.user.id, so customers only ever see their own data.
export default function CustomerPortal() {
  const [subs, setSubs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [msg, setMsg] = useState('');

  const load = async () => {
    const [s, i] = await Promise.all([api.get('/subscriptions'), api.get('/invoices')]);
    setSubs(s.data.subscriptions);
    setInvoices(i.data.invoices);
  };
  useEffect(() => {
    load();
  }, []);

  const act = async (id, action) => {
    setMsg('');
    try {
      if (action === 'renew') {
        await api.post(`/subscriptions/${id}/renew`);
        setMsg('Renewal draft created');
      } else {
        const status = action === 'pause' ? 'Paused' : action === 'resume' ? 'Active' : 'Closed';
        await api.patch(`/subscriptions/${id}/status`, { status });
        setMsg(`Subscription ${status.toLowerCase()}`);
      }
      load();
    } catch (e) {
      setMsg(e.response?.data?.message || 'Action failed');
    }
  };

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
      <h1>My Subscriptions</h1>
      {msg && <p className="hint">{msg}</p>}
      {subs.map((s) => (
        <div className="card" key={s._id}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <b>{s.number}</b>
            <span className={`badge ${s.status === 'Active' ? 'green' : s.status === 'Closed' ? 'red' : 'blue'}`}>{s.status}</span>
          </div>
          <Pipeline status={s.status} />
          <p className="hint">{s.planId?.name} — {rs(s.planId?.price)}/{s.planId?.billingPeriod}</p>
          <div className="row">
            {s.status === 'Active' && s.planId?.pausable && <button className="secondary" onClick={() => act(s._id, 'pause')}>Pause</button>}
            {s.status === 'Paused' && <button className="secondary" onClick={() => act(s._id, 'resume')}>Resume</button>}
            {['Active', 'Paused'].includes(s.status) && s.planId?.closable && <button className="secondary" onClick={() => act(s._id, 'close')}>Close early</button>}
            {['Closed', 'Active', 'Paused'].includes(s.status) && s.planId?.renewable && <button onClick={() => act(s._id, 'renew')}>Renew</button>}
          </div>
        </div>
      ))}
      {subs.length === 0 && <div className="card">No subscriptions yet.</div>}

      <h1>My Invoices</h1>
      <div className="card">
        <table className="grid">
          <thead><tr><th>Number</th><th>Period</th><th>Total</th><th>Due</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv._id}>
                <td>{inv.number}</td>
                <td>{inv.periodStart?.slice(0, 10)}</td>
                <td>{rs(inv.total)}</td>
                <td>{rs(inv.amountDue)}</td>
                <td>{inv.status}</td>
                <td><button className="secondary" onClick={() => download(inv)}>Download PDF</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
