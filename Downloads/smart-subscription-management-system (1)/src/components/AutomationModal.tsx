import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AutomationResultSummary } from '../types';
import {
  Sparkles,
  CheckCircle2,
  Scan,
  BellRing,
  FileSpreadsheet,
  AlertTriangle,
  ArrowRight,
  X,
  Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: string) => void;
}

export const AutomationModal: React.FC<AutomationModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const { runRenewalAutomation } = useApp();
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [summary, setSummary] = useState<AutomationResultSummary | null>(null);

  const steps = [
    { title: 'Scanning Subscription Accounts', desc: 'Querying all active billing schedules and renewal milestones...' },
    { title: 'Evaluating Milestone Thresholds', desc: 'Detecting 30-day, 15-day, 7-day, and immediate expiration dates...' },
    { title: 'Dispatching Renewal Reminders', desc: 'Generating multichannel customer notifications and dispatch logs...' },
    { title: 'Generating Renewal Invoices', desc: 'Calculating tax rates and generating official itemized invoices...' },
    { title: 'Auditing Failed Payments & Dunning', desc: 'Syncing payment retry schedules and flagging high-risk churn...' },
  ];

  useEffect(() => {
    if (!isOpen) {
      setIsRunning(false);
      setCurrentStepIndex(0);
      setSummary(null);
      return;
    }

    let isMounted = true;
    setIsRunning(true);
    setCurrentStepIndex(0);
    setSummary(null);

    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 450);

    // Run actual context automation logic
    const execute = async () => {
      // Simulate brief realistic scan time
      await new Promise((r) => setTimeout(r, 2200));
      if (!isMounted) return;
      const res = await runRenewalAutomation();
      if (!isMounted) return;
      clearInterval(stepInterval);
      setCurrentStepIndex(steps.length);
      setIsRunning(false);
      setSummary(res);
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.6 },
      });
    };

    execute();

    return () => {
      isMounted = false;
      clearInterval(stepInterval);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden text-slate-100">
        {/* Glow */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Smart Renewal Automation Engine</h3>
              <p className="text-xs text-slate-400">Live execution of autonomous lifecycle workflows</p>
            </div>
          </div>
          {!isRunning && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Running state */}
        {isRunning && (
          <div className="py-8 space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-indigo-400">
                  <Scan className="w-6 h-6 animate-pulse" />
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-white">
                  Executing Automated Lifecycle Scan
                </div>
                <div className="text-xs text-indigo-400 font-mono mt-0.5">
                  Phase {Math.min(currentStepIndex + 1, steps.length)} of {steps.length}
                </div>
              </div>
            </div>

            <div className="space-y-2 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
              {steps.map((st, i) => {
                const isPassed = currentStepIndex > i;
                const isCurrent = currentStepIndex === i;

                return (
                  <div
                    key={i}
                    className={`flex items-start gap-3 p-2 rounded-lg text-xs transition-colors ${
                      isCurrent
                        ? 'bg-indigo-950/50 text-indigo-200 border border-indigo-500/30'
                        : isPassed
                        ? 'text-slate-400'
                        : 'text-slate-600'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isPassed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : isCurrent ? (
                        <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-700" />
                      )}
                    </div>
                    <div>
                      <div className={`font-semibold ${isCurrent ? 'text-white' : ''}`}>{st.title}</div>
                      <div className="text-[11px] text-slate-400">{st.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Finished Summary State */}
        {!isRunning && summary && (
          <div className="py-6 space-y-5">
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-sm text-emerald-200">
                  Automation Cycle Completed Successfully
                </div>
                <div className="text-xs text-slate-300 mt-0.5">
                  All customer subscriptions and renewal horizons were evaluated. Actions executed below:
                </div>
              </div>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-800">
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <Scan className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Subscriptions Scanned</span>
                </div>
                <div className="text-xl font-bold font-mono text-white mt-1">
                  {summary.scannedCount}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-800">
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <BellRing className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Reminders Dispatched</span>
                </div>
                <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
                  {summary.remindersGenerated}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-800">
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Invoices Created</span>
                </div>
                <div className="text-xl font-bold font-mono text-emerald-300 mt-1">
                  {summary.invoicesCreated}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-800">
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Attention Required</span>
                </div>
                <div className="text-xl font-bold font-mono text-amber-300 mt-1">
                  {summary.failedPaymentsFlagged}
                </div>
              </div>
            </div>

            {/* Summary bullet highlights */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5 font-mono">
              <div className="text-slate-400 font-sans font-semibold mb-1 text-[11px] uppercase tracking-wider">
                Execution Log Highlights
              </div>
              <div className="text-slate-300 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{summary.scannedCount} subscriptions scanned across customer base</span>
              </div>
              <div className="text-slate-300 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>{summary.remindersGenerated} renewal reminders generated</span>
              </div>
              <div className="text-slate-300 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span>{summary.invoicesCreated} renewal invoices created & queued</span>
              </div>
              <div className="text-slate-300 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>{summary.failedPaymentsFlagged} payment requires attention in recovery queue</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Close
              </button>
              {onNavigate && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigate('invoices');
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-colors"
                >
                  <span>Review Generated Invoices</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
