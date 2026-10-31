import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { rs } from '../../api.js';

const STEPS = ['Draft', 'Quotation', 'Confirmed', 'Active', 'Closed'];

export function Pipeline({ status }) {
  const idx = status === 'Paused' ? STEPS.indexOf('Active') : STEPS.indexOf(status);
  return (
    <div className="pipeline">
      {STEPS.map((s, i) => (
        <span key={s}>
          <span className={`step ${i < idx ? 'done' : ''} ${s === status ? 'now' : ''}`}>{s}</span>
          {i < STEPS.length - 1 && <span className="arrow"> → </span>}
        </span>
      ))}
      {status === 'Paused' && <span className="badge amber">Paused</span>}
    </div>
  );
}

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState([]);
  const [status, setStatus] = useState('');
  const [templates, setTemplates] = useState([]);
  const [showQuote, setShowQuote] = useState(false);
  const [quote, setQuote] = useState({ templateId: '', customerId: '', startDate: '' });
  const navigate = useNavigate();

  const load = () => {
    api.get('/subscriptions', { params: status ? { status } : {} }).then((r) => setSubs(r.data.subscriptions));
  };
  useEffect(load, [status]);
  useEffect(() => {
    api.get('/subscriptions/templates').then((r) => setTemplates(r.data.templates));
  }, []);

  return (
    <div>
      <h1>Subscriptions</h1>
      <div className="row">
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: 'auto' }}>
          <option value="">All statuses</option>
          {[...STEPS, 'Paused'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button onClick={() => setShowQuote(true)}>New from template</button>
        <Link to="/staff/subscriptions/new"><button className="secondary">Blank subscription</button></Link>
      </div>

      <div className="card mt">
        <table className="grid">
          <thead><tr><th>Number</th><th>Customer</th><th>Plan</th><th>Status</th><th>Next invoice</th></tr></thead>
          <tbody>
            {subs.map((s) => (
              <tr key={s._id}>
                <td><Link to={`/staff/subscriptions/${s._id}`}>{s.number}</Link></td>
                <td>{s.customerId?.name || s.customerId?.email}</td>
                <td>{s.planId?.name}</td>
                <td><span className={`badge ${s.status === 'Active' ? 'green' : s.status === 'Closed' ? 'red' : s.status === 'Paused' ? 'amber' : 'blue'}`}>{s.status}</span></td>
                <td>{s.nextInvoiceDate ? s.nextInvoiceDate.slice(0, 10) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showQuote && (
        <div className="modal-back" onClick={() => setShowQuote(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>1-click quote from template</h2>
            <label>Template</label>
            <select value={quote.templateId} onChange={(e) => setQuote({ ...quote, templateId: e.target.value })}>
              <option value="">Select template</option>
              {templates.map((t) => (
                <option key={t._id} value={t._id}>{t.name} ({t.plan?.name})</option>
              ))}
            </select>
            <label>Customer ID</label>
            <input value={quote.customerId} onChange={(e) => setQuote({ ...quote, customerId: e.target.value })} placeholder="User _id of the customer" required />
            <label>Start date</label>
            <input type="date" value={quote.startDate} onChange={(e) => setQuote({ ...quote, startDate: e.target.value })} />
            <div className="row mt">
              <button
                disabled={!quote.templateId || !quote.customerId}
                onClick={async () => {
                  const r = await api.post(`/subscriptions/from-template/${quote.templateId}`, quote);
                  setShowQuote(false);
                  navigate(`/staff/subscriptions/${r.data.subscription._id}`);
                }}
              >
                Create quote
              </button>
              <button className="secondary" onClick={() => setShowQuote(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
