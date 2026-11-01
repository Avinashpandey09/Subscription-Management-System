import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import {
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Clock,
  Sparkles,
  CreditCard,
  DollarSign,
  TrendingUp,
  Settings,
  ChevronRight,
} from 'lucide-react';

export const FailedPaymentRecoveryView: React.FC = () => {
  const { subscriptions, retryPayment, addToast, setSelectedInvoiceForModal, invoices } = useApp();

  // Find subscriptions in dunning / failed states
  const dunningSubs = subscriptions.filter(
    (s) => s.paymentStatus === 'failed' || s.status === 'past_due' || s.status === 'expired'
  );

  const workflowStages = [
    { id: 1, title: 'Payment Failed', desc: 'Card declined or ACH returned', icon: AlertTriangle, color: 'text-rose-400' },
    { id: 2, title: 'Payment Failure Notification', desc: 'Automated email + self-service portal link', icon: Mail, color: 'text-amber-400' },
    { id: 3, title: 'Retry Attempt 1', desc: 'Auto-retry after 48 hrs smart window', icon: RefreshCw, color: 'text-indigo-400' },
    { id: 4, title: 'Retry Attempt 2', desc: 'Second attempt + SMS alert to admin', icon: RefreshCw, color: 'text-indigo-400' },
    { id: 5, title: 'Final Retry', desc: 'Last chance attempt before cutoff', icon: Clock, color: 'text-purple-400' },
    { id: 6, title: 'Mark Past Due / Expired', desc: 'Access suspended; revenue churned', icon: ShieldAlert, color: 'text-red-500' },
  ];

  const handleSimulateSuccess = (subId: string, company: string) => {
    retryPayment(subId, true);
  };

  const handleSimulateFailure = (subId: string, company: string) => {
    retryPayment(subId, false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-rose-400 font-mono">
              Smart Dunning & Revenue Defense
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              Autonomous Recovery Active
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1">
            Failed Payment Recovery Workflow
          </h1>
          <p className="text-sm text-slate-400 mt-0.5 max-w-2xl">
            When renewals fail due to expired cards, bank limits, or insufficient balance, the system
            automatically runs a multi-stage intelligent recovery schedule before churning the subscription.
          </p>
        </div>
      </div>

      {/* 1. Visual Dunning Workflow Pipeline (Requirement #3) */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Dunning Recovery Escalation Protocol</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">Zero-Touch Automation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {workflowStages.map((st, i) => {
            const Icon = st.icon;
            return (
              <div key={st.id} className="relative">
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between h-32">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      STEP 0{st.id}
                    </span>
                    <Icon className={`w-4 h-4 ${st.color}`} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white leading-tight">{st.title}</div>
                    <div className="text-[11px] text-slate-400 mt-1 leading-snug">{st.desc}</div>
                  </div>
                </div>

                {i < workflowStages.length - 1 && (
                  <div className="hidden lg:flex absolute -right-2 top-1/2 -translate-y-1/2 z-20 pointer-events-none text-slate-600">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Recovered Revenue (30d)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1">$4,890.00</div>
          <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" />
            +18.4% churn recovery
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Dunning Success Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">78.5%</div>
          <div className="text-[11px] text-slate-400 mt-1">Industry avg: ~45%</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Dunning Cases</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">{dunningSubs.length} Accounts</div>
          <div className="text-[11px] text-slate-400 mt-1">Under auto-retry</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Smart Retry Schedule</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1">3 Attempts</div>
          <div className="text-[11px] text-slate-400 mt-1">Over 7-day grace window</div>
        </div>
      </div>

      {/* Active Dunning Subscriptions List with Demo Retry Button */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Active Recovery Queue</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono">
                {dunningSubs.length} flagged
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live status, retry attempt counter, next scheduled execution, and interactive demo controls.
            </p>
          </div>
        </div>

        {dunningSubs.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-950/60 border border-slate-800">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-white">All Accounts Fully Recovered</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              There are currently no active failed payment cases. All recurring subscriptions are paid.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {dunningSubs.map((sub) => {
              const inv = invoices.find((i) => i.subscriptionId === sub.id);
              const isExhausted = sub.retryCount >= sub.maxRetries || sub.status === 'expired';

              return (
                <div
                  key={sub.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-rose-950/50 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold text-sm shrink-0 mt-0.5">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm">{sub.customerCompany}</span>
                        <span className="text-xs text-slate-400">· {sub.customerName}</span>
                        <span className="text-xs font-mono text-rose-400 font-bold">
                          {formatCurrency(sub.amount)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1.5 flex-wrap">
                        <span className="text-slate-300 font-medium">{sub.planName}</span>
                        <span>·</span>
                        {/* Retry count indicator */}
                        <span className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-200">
                          <strong className="text-indigo-400">Retry Count:</strong>
                          <span className={isExhausted ? 'text-red-400 font-bold' : 'text-amber-400'}>
                            {sub.retryCount} of {sub.maxRetries}
                          </span>
                        </span>
                        <span>·</span>
                        {/* Next retry date */}
                        <span className="inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-200">
                          <strong className="text-indigo-400">Next Retry Date:</strong>
                          <span className="text-slate-300">
                            {sub.nextRetryDate || 'Immediate'}
                          </span>
                        </span>
                      </div>

                      {/* Status explanation */}
                      <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Dunning notice dispatched to {sub.customerEmail} with secure payment link.</span>
                      </div>
                    </div>
                  </div>

                  {/* Demo Interactive Actions (Requirement #3: Retry Payment Demo Button) */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                    {/* View Invoice */}
                    {inv && (
                      <button
                        onClick={() => setSelectedInvoiceForModal(inv)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                      >
                        View Invoice
                      </button>
                    )}

                    {/* Retry Payment (Success Simulation) */}
                    <button
                      onClick={() => handleSimulateSuccess(sub.id, sub.customerCompany)}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm transition-all"
                      title="Simulate card update or successful retry attempt"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Retry Payment (Success)</span>
                    </button>

                    {/* Escalate Retry Failure */}
                    {!isExhausted && (
                      <button
                        onClick={() => handleSimulateFailure(sub.id, sub.customerCompany)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 transition-colors"
                        title="Simulate another decline to demonstrate escalation to final retry & expired"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Simulate Decline</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dunning Configuration Preview */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-white font-bold mb-3">
          <Settings className="w-4 h-4 text-indigo-400" />
          <span>Configured Smart Dunning Rules</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-400">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="font-semibold text-slate-200">Attempt Cadence</span>
            <p className="mt-1">
              Attempt 1: +2 days · Attempt 2: +4 days · Final: +7 days with card updater API.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="font-semibold text-slate-200">Self-Service Update Link</span>
            <p className="mt-1">
              Email token links directly to one-click credit card update without requiring password reset.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="font-semibold text-slate-200">Terminal Grace Period</span>
            <p className="mt-1">
              Subscriptions marked "Expired" preserve customer records for frictionless reactivation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
