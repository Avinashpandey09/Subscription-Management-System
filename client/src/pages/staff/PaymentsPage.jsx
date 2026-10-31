import { useEffect, useState } from 'react';
import api, { rs } from '../../api.js';
import RecordPaymentModal from './RecordPaymentModal.jsx';

export default function PaymentsPage() {
  const [outstanding, setOutstanding] = useState([]);
  const [payments, setPayments] = useState([]);
  const [paying, setPaying] = useState(null);
  const [history, setHistory] = useState(null);

  const load = async () => {
    const [inv, pay] = await Promise.all([api.get('/invoices'), api.get('/payments')]);
    setOutstanding(inv.data.invoices.filter((i) => ['Draft', 'Confirmed'].includes(i.status) && i.amountDue > 0));
    setPayments(pay.data.payments);
  };
  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <h1>Payments</h1>

      <div className="card">
        <h3>Outstanding invoices</h3>
        <table className="grid">
          <thead><tr><th>Invoice</th><th>Customer</th><th>Total</th><th>Paid</th><th>Due</th><th></th></tr></thead>
          <tbody>
            {outstanding.map((inv) => (
              <tr key={inv._id}>
                <td>{inv.number}</td>
                <td>{inv.customer?.name}</td>
                <td>{rs(inv.total)}</td>
                <td>{rs(inv.amountPaid)}</td>
                <td>{rs(inv.amountDue)}</td>
                <td>
                  <div className="row">
                    <button onClick={() => setPaying(inv)}>Record payment</button>
                    <button className="secondary" onClick={async () => { const r = await api.get(`/payments/invoice/${inv._id}`); setHistory(r.data); }}>History</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Payment history</h3>
        <table className="grid">
          <thead><tr><th>Date</th><th>Invoice</th><th>Method</th><th>Amount</th><th>Note</th><th>Recorded by</th></tr></thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p._id}>
                <td>{p.date?.slice(0, 10)}</td>
                <td>{p.invoiceId?.number}</td>
                <td>{p.method}</td>
                <td>{rs(p.amount)}</td>
                <td>{p.note}</td>
                <td>{p.recordedBy?.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {paying && <RecordPaymentModal invoice={paying} onClose={() => setPaying(null)} onSaved={() => { setPaying(null); load(); }} />}

      {history && (
        <div className="modal-back" onClick={() => setHistory(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Payments — {history.invoice.number}</h2>
            <p className="hint">Total {rs(history.invoice.total)} · Due {rs(history.invoice.amountDue)}</p>
            <table className="grid">
              <thead><tr><th>Date</th><th>Method</th><th>Amount</th></tr></thead>
              <tbody>
                {history.payments.map((p) => (
                  <tr key={p._id}><td>{p.date?.slice(0, 10)}</td><td>{p.method}</td><td>{rs(p.amount)}</td></tr>
                ))}
              </tbody>
            </table>
            <div className="row mt"><button className="secondary" onClick={() => setHistory(null)}>Close</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
