import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Subscription } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import {
  CreditCard,
  Search,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Calendar,
} from 'lucide-react';

interface SubscriptionsViewProps {
  onOpenCreateSubscription: () => void;
  onOpenRenewals: () => void;
}

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({
  onOpenCreateSubscription,
  onOpenRenewals,
}) => {
  const { subscriptions, renewSubscription, setSelectedInvoiceForModal, invoices } = useApp();
  const [filter, setFilter] = useState<'all' | 'active' | 'past_due' | 'expired'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredSubs = subscriptions.filter((s) => {
    if (filter !== 'all' && s.status !== filter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        s.customerCompany.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q) ||
        s.planName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (sub: Subscription) => {
    if (sub.status === 'active') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" />
          Active
        </span>
      );
    }
    if (sub.status === 'past_due') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Clock className="w-3 h-3" />
          Past Due (Retry {sub.retryCount}/3)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
        <AlertTriangle className="w-3 h-3" />
        Expired
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-indigo-400 font-mono">
              Recurring Subscriptions
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {subscriptions.length} Plans Monitored
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1">Subscription Registry</h1>
          <p className="text-sm text-slate-400 mt-0.5 max-w-xl">
            Live catalog of customer contract terms, billing intervals, renewal horizons, and payment statuses.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <button
            onClick={onOpenRenewals}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            Renewal Horizons
          </button>
          <button
            onClick={onOpenCreateSubscription}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Subscription</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
              filter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({subscriptions.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
              filter === 'active' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Active ({subscriptions.filter((s) => s.status === 'active').length})
          </button>
          <button
            onClick={() => setFilter('past_due')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
              filter === 'past_due' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Past Due ({subscriptions.filter((s) => s.status === 'past_due').length})
          </button>
          <button
            onClick={() => setFilter('expired')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
              filter === 'expired' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Expired ({subscriptions.filter((s) => s.status === 'expired').length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search company or plan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Company & Customer</th>
                <th className="py-3 px-4">Plan Tier</th>
                <th className="py-3 px-4">Rate & Cadence</th>
                <th className="py-3 px-4">Next Renewal</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredSubs.map((sub) => {
                const inv = invoices.find((i) => i.subscriptionId === sub.id);

                return (
                  <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{sub.customerCompany}</div>
                      <div className="text-[11px] text-slate-400">{sub.customerName}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-200">{sub.planName}</span>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <span className="text-white font-bold">{formatCurrency(sub.amount)}</span>
                      <span className="text-slate-400 text-[11px]">/{sub.interval === 'monthly' ? 'mo' : 'yr'}</span>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <div className="text-slate-200">{formatDate(sub.nextRenewalDate)}</div>
                      <div className="text-[10px] text-slate-400">
                        {sub.daysUntilRenewal === 0
                          ? 'Renews Today'
                          : sub.daysUntilRenewal > 0
                          ? `${sub.daysUntilRenewal} days remaining`
                          : `${Math.abs(sub.daysUntilRenewal)} days overdue`}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">{getStatusBadge(sub)}</td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {inv && (
                          <button
                            onClick={() => setSelectedInvoiceForModal(inv)}
                            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                          >
                            Invoice
                          </button>
                        )}
                        <button
                          onClick={() => renewSubscription(sub.id)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 transition-colors"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Renew</span>
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
    </div>
  );
};
