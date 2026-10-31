import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import api, { rs } from '../../api.js';

const COLORS = ['#0e6e4e', '#1d4fa3', '#b3540c', '#b3261e', '#5c6b63', '#7a4fb5'];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.get('/dashboard').then((r) => setData(r.data));
  }, []);

  if (!data) return <div className="center">Loading dashboard...</div>;

  const overdue = (data.overdue || []).filter(
    (o) => !filter || o.number.toLowerCase().includes(filter.toLowerCase()) || o.customer?.name?.toLowerCase().includes(filter.toLowerCase())
  );
  const pie = Object.entries(data.statusBreakdown || {}).map(([name, value]) => ({ name, value }));
  const bars = (data.revenueByMonth || []).map((r) => ({ month: r.month, revenue: r.revenue / 100 }));

  return (
    <div>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1>Finance Dashboard</h1>
        <span className={`badge ${data.durationMs < 2000 ? 'green' : 'amber'}`}>
          Response: {data.durationMs} ms {data.durationMs < 2000 ? '(< 2s target)' : '(over 2s!)'}
        </span>
      </div>

      <div className="kpis">
        <div className="kpi"><div className="label">Active subscriptions</div><div className="value">{data.kpis.activeSubscriptions}</div></div>
        <div className="kpi"><div className="label">Revenue collected</div><div className="value">{rs(data.kpis.revenueCollected)}</div></div>
        <div className="kpi"><div className="label">Outstanding ({data.kpis.outstandingCount})</div><div className="value">{rs(data.kpis.outstanding)}</div></div>
        <div className="kpi"><div className="label">Overdue invoices</div><div className="value">{data.kpis.overdueCount}</div></div>
      </div>

      <div className="charts">
        <div className="card">
          <h3>Revenue by month (Rs)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={bars}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#0e6e4e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3>Subscriptions by status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pie} dataKey="value" nameKey="name" outerRadius={90} label>
                {pie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3>Overdue invoices</h3>
        <input placeholder="Filter by number or customer..." value={filter} onChange={(e) => setFilter(e.target.value)} style={{ maxWidth: 320, marginBottom: 8 }} />
        <table className="grid">
          <thead><tr><th>Number</th><th>Customer</th><th>Total</th><th>Due</th><th>Due date</th><th>Status</th></tr></thead>
          <tbody>
            {overdue.map((o) => (
              <tr key={o._id}>
                <td>{o.number}</td>
                <td>{o.customer?.name}</td>
                <td>{rs(o.total)}</td>
                <td>{rs(o.amountDue)}</td>
                <td>{o.dueDate?.slice(0, 10)}</td>
                <td><span className="badge amber">{o.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
