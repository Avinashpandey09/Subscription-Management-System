import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Customer } from '../types';
import { formatDate } from '../utils/helpers';
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  Building,
  MapPin,
  CreditCard,
  ExternalLink,
} from 'lucide-react';

interface CustomersViewProps {
  onOpenCreateCustomer: () => void;
  onOpenCreateSubscriptionWithCustomer: (customerId: string) => void;
  onNavigate: (tab: string) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  onOpenCreateCustomer,
  onOpenCreateSubscriptionWithCustomer,
  onNavigate,
}) => {
  const { customers, subscriptions } = useApp();
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-indigo-400 font-mono">
              Account Directory
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {customers.length} Accounts Centralized
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1">Customer Management</h1>
          <p className="text-sm text-slate-400 mt-0.5 max-w-xl">
            Customer profiles linked to automated billing cycles, tax records, and notification history.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <button
            onClick={onOpenCreateCustomer}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by company, customer name, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((cust) => {
          const custSubs = subscriptions.filter((s) => s.customerId === cust.id);

          return (
            <div
              key={cust.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start gap-3">
                  <img
                    src={cust.avatar}
                    alt={cust.name}
                    className="w-11 h-11 rounded-xl object-cover border border-slate-700 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-white text-sm truncate">{cust.company}</h3>
                    <div className="text-xs text-slate-300 font-medium">{cust.name}</div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">{cust.email}</div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{cust.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{cust.city}, {cust.country}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-mono text-indigo-400">
                  {custSubs.length} Active {custSubs.length === 1 ? 'Sub' : 'Subs'}
                </span>

                <button
                  onClick={() => onOpenCreateSubscriptionWithCustomer(cust.id)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Assign Sub</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
