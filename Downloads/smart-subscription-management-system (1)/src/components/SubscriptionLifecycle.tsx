import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  CreditCard,
  ScanSearch,
  BellRing,
  FileSpreadsheet,
  BadgeDollarSign,
  RefreshCw,
  ChevronRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

interface StepInfo {
  id: string;
  name: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  statKey: string;
  actionText: string;
}

export const SubscriptionLifecycle: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const { customers, subscriptions, invoices, notifications } = useApp();
  const [activeStepId, setActiveStepId] = useState<string>('detection');

  const totalCustomers = customers.length;
  const activeSubs = subscriptions.filter((s) => s.status === 'active').length;
  const dueSoonSubs = subscriptions.filter((s) => s.daysUntilRenewal >= 0 && s.daysUntilRenewal <= 30).length;
  const sentReminders = notifications.filter((n) => n.type.includes('reminder') || n.type === 'renewal_today').length;
  const totalInvoices = invoices.length;
  const pendingOrFailedPayments = subscriptions.filter((s) => s.paymentStatus !== 'paid').length;
  const mrr = subscriptions
    .filter((s) => s.status === 'active')
    .reduce((acc, curr) => acc + (curr.interval === 'monthly' ? curr.amount : curr.amount / 12), 0);

  const steps: StepInfo[] = [
    {
      id: 'customer',
      name: 'Customer',
      title: 'Customer Onboarding',
      description: 'Account profiles, corporate tax IDs, and billing contacts centralized.',
      icon: Users,
      statKey: `${totalCustomers} Accounts`,
      actionText: 'View Customers',
    },
    {
      id: 'subscription',
      name: 'Subscription',
      title: 'Plan Configuration',
      description: 'Contract terms, seat allocation, and recurring billing interval binding.',
      icon: CreditCard,
      statKey: `${activeSubs} Active Plans`,
      actionText: 'View Subscriptions',
    },
    {
      id: 'detection',
      name: 'Renewal Detection',
      title: 'Automated Horizon Scanning',
      description: 'Proactively identifies renewals at 30, 15, 7, and 0-day milestones.',
      icon: ScanSearch,
      statKey: `${dueSoonSubs} Upcoming`,
      actionText: 'View Renewals',
    },
    {
      id: 'reminder',
      name: 'Reminder',
      title: 'Intelligent Notification',
      description: 'Dispatches automated branded email & in-app alerts to prevent surprises.',
      icon: BellRing,
      statKey: `${sentReminders} Sent Alerts`,
      actionText: 'View Activity',
    },
    {
      id: 'invoice',
      name: 'Invoice',
      title: 'Instant Tax Invoicing',
      description: 'Auto-calculates local taxes, line-items, and attaches printable invoices.',
      icon: FileSpreadsheet,
      statKey: `${totalInvoices} Invoices`,
      actionText: 'View Invoices',
    },
    {
      id: 'payment',
      name: 'Payment',
      title: 'Payment & Dunning',
      description: 'Automatic credit card charging + 3-stage retry dunning recovery.',
      icon: BadgeDollarSign,
      statKey: pendingOrFailedPayments > 0 ? `${pendingOrFailedPayments} Attention` : 'All Settled',
      actionText: 'View Dunning Engine',
    },
    {
      id: 'renewal',
      name: 'Renewal',
      title: 'Cycle Extension',
      description: 'Advances subscription period, triggers retention metrics, logs audit trail.',
      icon: RefreshCw,
      statKey: `${formatCurrency(mrr)}/mo MRR`,
      actionText: 'View Subscriptions',
    },
  ];

  const activeStep = steps.find((s) => s.id === activeStepId) || steps[2];

  const handleActionClick = (stepId: string) => {
    if (!onNavigate) return;
    if (stepId === 'customer') onNavigate('customers');
    else if (stepId === 'subscription' || stepId === 'renewal') onNavigate('subscriptions');
    else if (stepId === 'detection' || stepId === 'reminder') onNavigate('renewals');
    else if (stepId === 'invoice') onNavigate('invoices');
    else if (stepId === 'payment') onNavigate('recovery');
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
      {/* Background ambient lighting */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-indigo-400 font-mono">
              Autonomous Pipeline
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Continuous Engine
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
            Subscription Lifecycle Automation
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            End-to-end automated pipeline tracking subscriptions from acquisition to renewal and recovery.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate && onNavigate('about')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg transition-all"
          >
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            Problem vs Solution
          </button>
        </div>
      </div>

      {/* Pipeline Steps Flow */}
      <div className="relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {steps.map((step, index) => {
            const isSelected = activeStepId === step.id;
            const Icon = step.icon;

            return (
              <div key={step.id} className="relative group">
                <button
                  type="button"
                  onClick={() => setActiveStepId(step.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex flex-col justify-between h-32 relative ${
                    isSelected
                      ? 'bg-indigo-950/60 border-indigo-500 shadow-lg shadow-indigo-950/40 ring-1 ring-indigo-500/40'
                      : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-mono text-slate-500 font-semibold">
                      0{index + 1}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-bold text-slate-200 truncate">{step.name}</div>
                    <div
                      className={`text-[11px] font-mono font-medium truncate mt-0.5 ${
                        step.id === 'payment' && pendingOrFailedPayments > 0
                          ? 'text-amber-400'
                          : isSelected
                          ? 'text-indigo-300'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.statKey}
                    </div>
                  </div>

                  {/* Active bottom accent bar */}
                  {isSelected && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-500 rounded-full" />
                  )}
                </button>

                {/* Arrow connector between steps (for desktop) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute -right-2 top-1/2 -translate-y-1/2 z-20 pointer-events-none text-slate-600">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Step Detail Panel */}
        <div className="mt-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{activeStep.title}</span>
                <span className="text-xs text-slate-500 font-mono">({activeStep.statKey})</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed max-w-2xl">
                {activeStep.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => handleActionClick(activeStep.id)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all"
            >
              <span>{activeStep.actionText}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
