import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BillingInterval } from '../types';
import { calculateRenewalDate, formatCurrency, formatDate } from '../utils/helpers';
import { TODAY_DATE } from '../data/mockData';
import { X, Calendar, Sparkles, Check, CreditCard, ArrowRight } from 'lucide-react';

interface CreateSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCustomerId?: string;
}

export const CreateSubscriptionModal: React.FC<CreateSubscriptionModalProps> = ({
  isOpen,
  onClose,
  defaultCustomerId,
}) => {
  const { customers, plans, createSubscription } = useApp();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    defaultCustomerId || (customers[0] ? customers[0].id : '')
  );
  const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[1].id); // Professional by default
  const [interval, setInterval] = useState<BillingInterval>('monthly');
  const [startDate, setStartDate] = useState<string>(TODAY_DATE);

  if (!isOpen) return null;

  const currentPlan = plans.find((p) => p.id === selectedPlanId) || plans[0];
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0];

  const calculatedRenewal = calculateRenewalDate(startDate, interval);
  const price = interval === 'monthly' ? currentPlan.monthlyPrice : currentPlan.yearlyPrice;
  const taxEst = price * 0.09;
  const totalEst = price + taxEst;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedPlanId) return;

    createSubscription({
      customerId: selectedCustomerId,
      planId: selectedPlanId,
      interval,
      startDate,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative text-slate-100 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Create New Subscription</h3>
              <p className="text-xs text-slate-400">
                Configure plan, interval, and automatic lifecycle calculation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="pt-4 space-y-4">
          {/* Customer select */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Select Customer Account <span className="text-rose-400">*</span>
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.company} ({c.email})
                </option>
              ))}
            </select>
          </div>

          {/* Plan cards */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Choose Subscription Tier
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {plans.map((p) => {
                const isSelected = p.id === selectedPlanId;
                const cost = interval === 'monthly' ? p.monthlyPrice : p.yearlyPrice;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPlanId(p.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-950/70 border-indigo-500 ring-1 ring-indigo-500 shadow-md'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-white">{p.tier}</div>
                    <div className="text-sm font-extrabold font-mono text-indigo-400 mt-1">
                      {formatCurrency(cost)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      /{interval === 'monthly' ? 'mo' : 'yr'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Billing Interval & Start Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Billing Cadence
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setInterval('monthly')}
                  className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    interval === 'monthly'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setInterval('yearly')}
                  className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    interval === 'yearly'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Annual (Save 15%)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Real-time Calculated Renewal Horizon Box */}
          <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs space-y-2">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Automated Renewal Engine Prediction</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-300 pt-1">
              <div>
                <span className="text-slate-400">Calculated Expiry/Renewal:</span>
                <div className="font-mono font-bold text-white text-sm mt-0.5">
                  {formatDate(calculatedRenewal)}
                </div>
              </div>

              <div>
                <span className="text-slate-400">Automated Invoice Amount:</span>
                <div className="font-mono font-bold text-emerald-400 text-sm mt-0.5">
                  {formatCurrency(totalEst)} <span className="text-[10px] text-slate-400 font-sans font-normal">(incl. tax)</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 pt-1 border-t border-indigo-500/20">
              * Upon creation, the system immediately provisions an official itemized invoice, binds the
              recurring renewal daemon, and schedules 30d/15d/7d renewal reminders.
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
            >
              <span>Activate Subscription</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
