import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Subscription } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
import {
  Play,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  BellRing,
  FileSpreadsheet,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Search,
} from 'lucide-react';

interface RenewalsViewProps {
  onOpenAutomation: () => void;
  onOpenInvoiceModal: (invoiceId?: string) => void;
  onNavigate?: (tab: string) => void;
}

export const RenewalsView: React.FC<RenewalsViewProps> = ({
  onOpenAutomation,
  onOpenInvoiceModal,
  onNavigate,
}) => {
  const { subscriptions, lastAutomationSummary, renewSubscription, addToast, invoices, setSelectedInvoiceForModal } =
    useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Categorize subscriptions strictly per specification
  const dueToday = subscriptions.filter((s) => s.daysUntilRenewal === 0 && s.status === 'active');
  const due7Days = subscriptions.filter(
    (s) => s.daysUntilRenewal > 0 && s.daysUntilRenewal <= 7 && s.status === 'active'
  );
  const due15Days = subscriptions.filter(
    (s) => s.daysUntilRenewal > 7 && s.daysUntilRenewal <= 15 && s.status === 'active'
  );
  const due30Days = subscriptions.filter(
    (s) => s.daysUntilRenewal > 15 && s.daysUntilRenewal <= 30 && s.status === 'active'
  );
  const expiredOrPastDue = subscriptions.filter(
    (s) => s.status === 'past_due' || s.status === 'expired' || s.daysUntilRenewal < 0
  );

  const filterMatches = (sub: Subscription) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      sub.customerName.toLowerCase().includes(q) ||
      sub.customerCompany.toLowerCase().includes(q) ||
      sub.planName.toLowerCase().includes(q)
    );
  };

  const handleSendManualReminder = (sub: Subscription) => {
    addToast(
      'info',
      'Reminder Dispatched',
      `Sent automated renewal reminder notice to ${sub.customerName} (${sub.customerEmail}).`
    );
  };

  const handleViewInvoice = (sub: Subscription) => {
    // Find latest invoice for this sub
    const inv = invoices.find((i) => i.subscriptionId === sub.id) || invoices[0];
    if (inv) {
      setSelectedInvoiceForModal(inv);
    }
  };

  const renderSubscriptionCard = (sub: Subscription, categoryType: 'today' | '7d' | '15d' | '30d' | 'expired') => {
    let badgeColor = 'text-slate-400 bg-slate-800 border-slate-700';
    let urgencyText = `${sub.daysUntilRenewal} days remaining`;

    if (categoryType === 'today') {
      badgeColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30 font-bold';
      urgencyText = 'RENEWS TODAY';
    } else if (categoryType === '7d') {
      badgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      urgencyText = `Due in ${sub.daysUntilRenewal} days`;
    } else if (categoryType === '15d') {
      badgeColor = 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
      urgencyText = `Due in ${sub.daysUntilRenewal} days`;
    } else if (categoryType === '30d') {
      badgeColor = 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      urgencyText = `Due in ${sub.daysUntilRenewal} days`;
    } else if (categoryType === 'expired') {
      badgeColor = 'text-red-400 bg-red-950/40 border-red-500/40';
      urgencyText = sub.status === 'past_due' ? 'PAST DUE (In Dunning)' : 'EXPIRED';
    }

    return (
      <div
        key={sub.id}
        className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-sm shrink-0">
            {sub.customerCompany.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white text-sm">{sub.customerCompany}</span>
              <span className="text-xs text-slate-400">· {sub.customerName}</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono border ${badgeColor}`}>
                {urgencyText}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
              <span className="text-indigo-300 font-medium">{sub.planName}</span>
              <span>·</span>
              <span className="font-mono text-slate-200">{formatCurrency(sub.amount)}/{sub.interval === 'monthly' ? 'mo' : 'yr'}</span>
              <span>·</span>
              <span>Scheduled Date: <strong className="text-slate-300 font-mono">{formatDate(sub.nextRenewalDate)}</strong></span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => handleSendManualReminder(sub)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
            title="Dispatch manual reminder email & in-app alert"
          >
            <BellRing className="w-3.5 h-3.5 text-slate-400" />
            <span>Remind</span>
          </button>

          <button
            onClick={() => handleViewInvoice(sub)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
            title="View generated invoice"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
            <span>Invoice</span>
          </button>

          {sub.status === 'past_due' || sub.status === 'expired' ? (
            <button
              onClick={() => onNavigate && onNavigate('recovery')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Dunning Recovery</span>
            </button>
          ) : (
            <button
              onClick={() => renewSubscription(sub.id)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-colors shadow-sm"
              title="Execute renewal right now"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Renew Now</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header with Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-indigo-400 font-mono">
              Horizon Monitoring Engine
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Real-time Detection
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1">
            Renewal Automation Demo
          </h1>
          <p className="text-sm text-slate-400 mt-0.5 max-w-xl">
            Simulate the autonomous lifecycle daemon scanning customer milestones, triggering reminders,
            generating billing invoices, and managing renewal expirations.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={onOpenAutomation}
            className="px-5 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Run Automation</span>
          </button>
        </div>
      </div>

      {/* Automation Result Summary Banner (Requirement #2) */}
      {lastAutomationSummary && (
        <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/40 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Latest Automation Run Summary
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  ({lastAutomationSummary.timestamp})
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 mt-1 font-mono">
                <span className="text-white font-semibold">
                  "{lastAutomationSummary.scannedCount} subscriptions scanned"
                </span>
                <span>·</span>
                <span className="text-cyan-300 font-semibold">
                  "{lastAutomationSummary.remindersGenerated} renewal reminders generated"
                </span>
                <span>·</span>
                <span className="text-emerald-300 font-semibold">
                  "{lastAutomationSummary.invoicesCreated} invoices created"
                </span>
                <span>·</span>
                <span className="text-amber-300 font-semibold">
                  "{lastAutomationSummary.failedPaymentsFlagged} payment requires attention"
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenAutomation}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600/40 hover:bg-indigo-600/60 text-indigo-200 border border-indigo-500/30 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Rerun Demo</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        {/* Category Pill Filters */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Categories ({subscriptions.length})
          </button>
          <button
            onClick={() => setSelectedCategory('today')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
              selectedCategory === 'today'
                ? 'bg-rose-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Due Today ({dueToday.length})
          </button>
          <button
            onClick={() => setSelectedCategory('7d')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
              selectedCategory === '7d'
                ? 'bg-amber-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Due in 7 Days ({due7Days.length})
          </button>
          <button
            onClick={() => setSelectedCategory('15d')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
              selectedCategory === '15d'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Due in 15 Days ({due15Days.length})
          </button>
          <button
            onClick={() => setSelectedCategory('30d')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
              selectedCategory === '30d'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Due in 30 Days ({due30Days.length})
          </button>
          <button
            onClick={() => setSelectedCategory('expired')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
              selectedCategory === 'expired'
                ? 'bg-red-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Expired / Past Due ({expiredOrPastDue.length})
          </button>
        </div>

        {/* Search */}
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

      {/* Categorized Lists */}
      <div className="space-y-6">
        {/* 1. DUE TODAY */}
        {(selectedCategory === 'all' || selectedCategory === 'today') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  Due Today
                  <span className="text-xs text-rose-400 font-mono font-normal">
                    ({dueToday.length} subscriptions)
                  </span>
                </h2>
              </div>
              <span className="text-xs text-slate-400">Immediate invoice & billing trigger</span>
            </div>

            {dueToday.filter(filterMatches).length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-500 italic">
                No active subscriptions currently due today.
              </div>
            ) : (
              <div className="space-y-2.5">
                {dueToday.filter(filterMatches).map((sub) => renderSubscriptionCard(sub, 'today'))}
              </div>
            )}
          </div>
        )}

        {/* 2. DUE IN 7 DAYS */}
        {(selectedCategory === 'all' || selectedCategory === '7d') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  Due in 7 Days
                  <span className="text-xs text-amber-400 font-mono font-normal">
                    ({due7Days.length} subscriptions)
                  </span>
                </h2>
              </div>
              <span className="text-xs text-slate-400">Pre-billing confirmation reminder scheduled</span>
            </div>

            {due7Days.filter(filterMatches).length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-500 italic">
                No subscriptions due within 7 days.
              </div>
            ) : (
              <div className="space-y-2.5">
                {due7Days.filter(filterMatches).map((sub) => renderSubscriptionCard(sub, '7d'))}
              </div>
            )}
          </div>
        )}

        {/* 3. DUE IN 15 DAYS */}
        {(selectedCategory === 'all' || selectedCategory === '15d') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  Due in 15 Days
                  <span className="text-xs text-indigo-400 font-mono font-normal">
                    ({due15Days.length} subscriptions)
                  </span>
                </h2>
              </div>
              <span className="text-xs text-slate-400">Mid-term review & renewal preview</span>
            </div>

            {due15Days.filter(filterMatches).length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-500 italic">
                No subscriptions due in 15 days.
              </div>
            ) : (
              <div className="space-y-2.5">
                {due15Days.filter(filterMatches).map((sub) => renderSubscriptionCard(sub, '15d'))}
              </div>
            )}
          </div>
        )}

        {/* 4. DUE IN 30 DAYS */}
        {(selectedCategory === 'all' || selectedCategory === '30d') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  Due in 30 Days
                  <span className="text-xs text-blue-400 font-mono font-normal">
                    ({due30Days.length} subscriptions)
                  </span>
                </h2>
              </div>
              <span className="text-xs text-slate-400">Early renewal notification window</span>
            </div>

            {due30Days.filter(filterMatches).length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-500 italic">
                No subscriptions due in 30 days.
              </div>
            ) : (
              <div className="space-y-2.5">
                {due30Days.filter(filterMatches).map((sub) => renderSubscriptionCard(sub, '30d'))}
              </div>
            )}
          </div>
        )}

        {/* 5. EXPIRED / PAST DUE */}
        {(selectedCategory === 'all' || selectedCategory === 'expired') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  Expired / Past Due
                  <span className="text-xs text-red-400 font-mono font-normal">
                    ({expiredOrPastDue.length} subscriptions)
                  </span>
                </h2>
              </div>
              <span className="text-xs text-slate-400">Handled by Failed Payment Recovery Engine</span>
            </div>

            {expiredOrPastDue.filter(filterMatches).length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-500 italic">
                No expired or past due subscriptions.
              </div>
            ) : (
              <div className="space-y-2.5">
                {expiredOrPastDue.filter(filterMatches).map((sub) => renderSubscriptionCard(sub, 'expired'))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
