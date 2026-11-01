import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SubscriptionLifecycle } from './SubscriptionLifecycle';
import { formatCurrency, formatDate } from '../utils/helpers';
import {
  Users,
  CreditCard,
  Clock,
  AlertTriangle,
  BadgeDollarSign,
  TrendingUp,
  RefreshCw,
  BellRing,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
  onOpenAutomation: () => void;
  onOpenCreateSubscription: () => void;
  onOpenCreateCustomer: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenAutomation,
  onOpenCreateSubscription,
  onOpenCreateCustomer,
}) => {
  const {
    customers,
    subscriptions,
    invoices,
    activities,
    renewSubscription,
    setSelectedInvoiceForModal,
    addToast,
  } = useApp();

  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  // Compute 6 requested dashboard metrics
  const totalCustomers = customers.length;
  const activeSubs = subscriptions.filter((s) => s.status === 'active').length;
  const dueSoonSubs = subscriptions.filter(
    (s) => s.daysUntilRenewal >= 0 && s.daysUntilRenewal <= 30 && s.status === 'active'
  ).length;
  const expiredSubs = subscriptions.filter(
    (s) => s.status === 'expired' || s.status === 'past_due'
  ).length;
  const pendingPayments = subscriptions.filter((s) => s.paymentStatus !== 'paid').length;
  const mrr = subscriptions
    .filter((s) => s.status === 'active')
    .reduce((acc, curr) => acc + (curr.interval === 'monthly' ? curr.amount : curr.amount / 12), 0);

  // Upcoming renewals table data (sorted by days until renewal)
  const upcomingRenewals = [...subscriptions]
    .filter((s) => s.status === 'active')
    .sort((a, b) => a.daysUntilRenewal - b.daysUntilRenewal)
    .slice(0, 5);

  // Revenue trend historical points
  const revenueTrend = [
    { month: 'Jun', mrr: 11200, growth: '+9.2%' },
    { month: 'Jul', mrr: 12800, growth: '+14.2%' },
    { month: 'Aug', mrr: 14100, growth: '+10.1%' },
    { month: 'Sep', mrr: 15400, growth: '+9.2%' },
    { month: 'Oct', mrr: 17200, growth: '+11.6%' },
    { month: 'Nov', mrr: Math.round(mrr * 1.05 + 18500), growth: '+12.4%', projected: true },
  ];

  // SVG Chart Dimensions
  const chartWidth = 560;
  const chartHeight = 160;
  const minVal = 10000;
  const maxVal = 24000;
  const points = revenueTrend.map((d, i) => {
    const x = 30 + (i * (chartWidth - 60)) / (revenueTrend.length - 1);
    const y = chartHeight - 25 - ((d.mrr - minVal) / (maxVal - minVal)) * (chartHeight - 45);
    return { ...d, x, y };
  });

  const pathD = points.reduce(
    (acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
    ''
  );
  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight - 15} L ${points[0].x} ${
    chartHeight - 15
  } Z`;

  // Status distribution
  const statusCounts = {
    active: subscriptions.filter((s) => s.status === 'active' && s.daysUntilRenewal > 7).length,
    dueSoon: subscriptions.filter((s) => s.status === 'active' && s.daysUntilRenewal <= 7).length,
    pastDue: subscriptions.filter((s) => s.status === 'past_due').length,
    expired: subscriptions.filter((s) => s.status === 'expired').length,
  };
  const totalSubCount = subscriptions.length || 1;

  return (
    <div className="space-y-6">
      {/* 1. Hero KPI Stat Cards (The 6 required metrics) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Customers */}
        <div
          onClick={() => onNavigate('customers')}
          className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all shadow-md group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Total Customers</span>
            <Users className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-white mt-1.5">
            {totalCustomers}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" />
            +2 this week
          </div>
        </div>

        {/* Active Subscriptions */}
        <div
          onClick={() => onNavigate('subscriptions')}
          className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all shadow-md group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Active Subs</span>
            <CreditCard className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-white mt-1.5">{activeSubs}</div>
          <div className="text-[11px] text-slate-400 mt-1">100% cloud delivery</div>
        </div>

        {/* Renewals Due Soon */}
        <div
          onClick={() => onNavigate('renewals')}
          className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 cursor-pointer transition-all shadow-md group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Due Soon (30d)</span>
            <Clock className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-amber-400 mt-1.5">
            {dueSoonSubs}
          </div>
          <div className="text-[11px] text-amber-400/90 mt-1">Auto-reminders armed</div>
        </div>

        {/* Expired Subscriptions */}
        <div
          onClick={() => onNavigate('renewals')}
          className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-red-500/40 cursor-pointer transition-all shadow-md group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Expired Subs</span>
            <AlertTriangle className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-rose-400 mt-1.5">
            {expiredSubs}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">In dunning buffer</div>
        </div>

        {/* Pending Payments */}
        <div
          onClick={() => onNavigate('recovery')}
          className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-all shadow-md group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Pending Payments</span>
            <BadgeDollarSign className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-purple-300 mt-1.5">
            {pendingPayments}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Retry queued</div>
        </div>

        {/* Monthly Recurring Revenue */}
        <div
          onClick={() => onNavigate('invoices')}
          className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/80 to-slate-900 border border-indigo-500/40 hover:border-indigo-400 cursor-pointer transition-all shadow-md group"
        >
          <div className="flex items-center justify-between text-indigo-300">
            <span className="text-xs font-medium">Current MRR</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
              ARR x12
            </span>
          </div>
          <div className="text-xl font-extrabold font-mono text-white mt-1.5">
            {formatCurrency(mrr)}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" />
            ARR {formatCurrency(mrr * 12)}
          </div>
        </div>
      </div>

      {/* 2. Visual Subscription Lifecycle Section (Requirement #1) */}
      <SubscriptionLifecycle onNavigate={onNavigate} />

      {/* 3. Analytics Row: Revenue Trend Chart & Status Breakdown Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Monthly Recurring Revenue Trajectory</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  +38% vs Q2
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Calculated recurring cash flow backed by automated renewal contract renewals.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                Actual
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400/40" />
                Projected
              </span>
            </div>
          </div>

          {/* SVG Line / Area Graph */}
          <div className="w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-44 overflow-visible"
            >
              <defs>
                <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {[12000, 16000, 20000].map((val) => {
                const y = chartHeight - 25 - ((val - minVal) / (maxVal - minVal)) * (chartHeight - 45);
                return (
                  <g key={val}>
                    <line
                      x1="30"
                      y1={y}
                      x2={chartWidth - 30}
                      y2={y}
                      stroke="#1e293b"
                      strokeDasharray="4 4"
                    />
                    <text
                      x="10"
                      y={y + 3}
                      fill="#64748b"
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="start"
                    >
                      ${val / 1000}k
                    </text>
                  </g>
                );
              })}

              {/* Shaded Area */}
              <path d={areaD} fill="url(#mrrGradient)" />

              {/* Line path */}
              <path
                d={pathD}
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {points.map((pt, idx) => (
                <g
                  key={idx}
                  onMouseEnter={() => setHoveredMonth(idx)}
                  onMouseLeave={() => setHoveredMonth(null)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredMonth === idx ? '6' : '4'}
                    fill="#0f172a"
                    stroke={pt.projected ? '#818cf8' : '#6366f1'}
                    strokeWidth="2"
                    className="transition-all"
                  />
                  {/* Month Label */}
                  <text
                    x={pt.x}
                    y={chartHeight - 2}
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {pt.month}
                  </text>
                  {/* Tooltip on hover */}
                  {hoveredMonth === idx && (
                    <g>
                      <rect
                        x={pt.x - 38}
                        y={pt.y - 28}
                        width="76"
                        height="20"
                        rx="4"
                        fill="#020617"
                        stroke="#4338ca"
                        strokeWidth="1"
                      />
                      <text
                        x={pt.x}
                        y={pt.y - 15}
                        fill="#ffffff"
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        ${pt.mrr.toLocaleString()}
                      </text>
                    </g>
                  )}
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Subscription Status Chart / Distribution */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-white">Subscription Health</h2>
              <span className="text-xs text-slate-500 font-mono">
                {subscriptions.length} Total
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Real-time portfolio status breakdown across retention phases.
            </p>

            {/* Visual stacked bar */}
            <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden flex mb-5 border border-slate-800">
              <div
                style={{ width: `${(statusCounts.active / totalSubCount) * 100}%` }}
                className="bg-emerald-500 h-full transition-all"
                title={`Active: ${statusCounts.active}`}
              />
              <div
                style={{ width: `${(statusCounts.dueSoon / totalSubCount) * 100}%` }}
                className="bg-amber-400 h-full transition-all"
                title={`Due Soon: ${statusCounts.dueSoon}`}
              />
              <div
                style={{ width: `${(statusCounts.pastDue / totalSubCount) * 100}%` }}
                className="bg-purple-500 h-full transition-all"
                title={`Past Due: ${statusCounts.pastDue}`}
              />
              <div
                style={{ width: `${(statusCounts.expired / totalSubCount) * 100}%` }}
                className="bg-rose-500 h-full transition-all"
                title={`Expired: ${statusCounts.expired}`}
              />
            </div>

            {/* Legend with numbers */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Active (Healthy)
                </span>
                <span className="font-mono font-bold text-white">
                  {statusCounts.active} ({Math.round((statusCounts.active / totalSubCount) * 100)}%)
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  Renewing Within 7d
                </span>
                <span className="font-mono font-bold text-amber-400">
                  {statusCounts.dueSoon} ({Math.round((statusCounts.dueSoon / totalSubCount) * 100)}%)
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  Past Due (In Dunning)
                </span>
                <span className="font-mono font-bold text-purple-300">
                  {statusCounts.pastDue} ({Math.round((statusCounts.pastDue / totalSubCount) * 100)}%)
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Terminated / Expired
                </span>
                <span className="font-mono font-bold text-rose-400">
                  {statusCounts.expired} ({Math.round((statusCounts.expired / totalSubCount) * 100)}%)
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onOpenAutomation}
            className="w-full mt-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 flex items-center justify-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Run Autonomous Health Scan</span>
          </button>
        </div>
      </div>

      {/* 4. Bottom Grid: Upcoming Renewals Table & Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Renewals Table */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Immediate Renewal Horizon</span>
                <span className="text-xs text-slate-400 font-mono">
                  (Next In Line)
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Subscriptions sorted by urgency with instant lifecycle triggers.
              </p>
            </div>

            <button
              onClick={() => onNavigate('renewals')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
            >
              <span>View All Renewals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Company & Plan</th>
                  <th className="py-2.5 px-3">Renewal Date</th>
                  <th className="py-2.5 px-3">Days Left</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-right">Instant Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {upcomingRenewals.map((sub) => {
                  const isToday = sub.daysUntilRenewal === 0;

                  return (
                    <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-white">{sub.customerCompany}</div>
                        <div className="text-[11px] text-slate-400">
                          {sub.planName} · {sub.interval}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-300">
                        {formatDate(sub.nextRenewalDate)}
                      </td>

                      <td className="py-3 px-3">
                        {isToday ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                            TODAY
                          </span>
                        ) : (
                          <span className="font-mono text-slate-300">
                            {sub.daysUntilRenewal} days
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-white">
                        {formatCurrency(sub.amount)}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              addToast(
                                'info',
                                'Reminder Sent',
                                `Dispatched notice to ${sub.customerName} for ${formatCurrency(sub.amount)}.`
                              );
                            }}
                            className="px-2 py-1 text-[11px] font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                            title="Send notice email"
                          >
                            Remind
                          </button>
                          <button
                            onClick={() => renewSubscription(sub.id)}
                            className="px-2 py-1 text-[11px] font-semibold rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                            title="Renew cycle now"
                          >
                            Renew
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity Log */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>System Audit Stream</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h2>
            <span className="text-[11px] text-slate-500 font-mono">Live</span>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {activities.slice(0, 7).map((act) => {
              let Icon = RefreshCw;
              let iconColor = 'text-indigo-400';

              if (act.type === 'invoice') {
                Icon = FileSpreadsheet;
                iconColor = 'text-emerald-400';
              } else if (act.type === 'dunning') {
                Icon = AlertTriangle;
                iconColor = 'text-rose-400';
              } else if (act.type === 'customer') {
                Icon = Users;
                iconColor = 'text-cyan-400';
              }

              return (
                <div
                  key={act.id}
                  className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5 text-xs"
                >
                  <div className={`mt-0.5 shrink-0 ${iconColor}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-200 truncate">{act.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      {act.description}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      {act.timestamp} · {act.actor}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
