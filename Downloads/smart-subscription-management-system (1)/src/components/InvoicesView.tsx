import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Invoice } from '../types';
import { formatCurrency, formatDate, downloadInvoiceAsFile } from '../utils/helpers';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  DollarSign,
  Plus,
} from 'lucide-react';

interface InvoicesViewProps {
  onOpenCreateSubscription: () => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({ onOpenCreateSubscription }) => {
  const { invoices, setSelectedInvoiceForModal, simulatePayment } = useApp();
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'failed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredInvoices = invoices.filter((inv) => {
    if (filter !== 'all' && inv.status !== filter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        inv.customerCompany.toLowerCase().includes(q) ||
        inv.planName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalCollected = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.total, 0);

  const totalPending = invoices
    .filter((i) => i.status === 'pending')
    .reduce((sum, i) => sum + i.total, 0);

  const totalFailed = invoices
    .filter((i) => i.status === 'failed')
    .reduce((sum, i) => sum + i.total, 0);

  const totalTax = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.taxAmount, 0);

  const handlePrint = (invoice: Invoice) => {
    setSelectedInvoiceForModal(invoice);
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const getStatusBadge = (status: Invoice['status']) => {
    if (status === 'paid') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" />
          Paid
        </span>
      );
    }
    if (status === 'failed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <AlertTriangle className="w-3 h-3" />
          Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <Clock className="w-3 h-3" />
        Pending
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wider uppercase text-indigo-400 font-mono">
              Financial Documentation
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Auto-Invoicing Active
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1">
            Automated Invoices & Billing
          </h1>
          <p className="text-sm text-slate-400 mt-0.5 max-w-xl">
            Invoices are auto-generated upon subscription creation, renewal, or dunning cycle execution
            with tax calculation, unique invoice ID sequences, and printable statements.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <button
            onClick={onOpenCreateSubscription}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Subscription Invoice</span>
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Collected Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {formatCurrency(totalCollected)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Successfully settled</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Pending Invoices</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">
            {formatCurrency(totalPending)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Awaiting bank settlement</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Past Due / Failed</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-400 mt-1">
            {formatCurrency(totalFailed)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Queued for retry</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Tax Withheld (Collected)</span>
            <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {formatCurrency(totalTax)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Local jurisdiction compliance</div>
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
            All Invoices ({invoices.length})
          </button>
          <button
            onClick={() => setFilter('paid')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
              filter === 'paid' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Paid ({invoices.filter((i) => i.status === 'paid').length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
              filter === 'pending' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending ({invoices.filter((i) => i.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('failed')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
              filter === 'failed' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Failed ({invoices.filter((i) => i.status === 'failed').length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search invoice #, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer & Plan</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Subtotal / Tax</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                    No invoices matching the current filter.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {inv.invoiceNumber}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white">{inv.customerCompany}</div>
                      <div className="text-[11px] text-slate-400">
                        {inv.customerName} · <span className="text-indigo-400">{inv.planName}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {formatDate(inv.issueDate)}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      <div>{formatCurrency(inv.subtotal)}</div>
                      <div className="text-[10px] text-slate-500">
                        + {formatCurrency(inv.taxAmount)} ({(inv.taxRate * 100).toFixed(1)}% tax)
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-white">
                      {formatCurrency(inv.total)}
                    </td>

                    <td className="py-3.5 px-4 text-center">{getStatusBadge(inv.status)}</td>

                    {/* Action Buttons: View, Download, Print, Simulate Payment */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedInvoiceForModal(inv)}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 transition-colors"
                          title="View Invoice Modal"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-400" />
                          <span>View</span>
                        </button>

                        <button
                          onClick={() => downloadInvoiceAsFile(inv)}
                          className="p-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                          title="Download Invoice Text Receipt"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handlePrint(inv)}
                          className="p-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                          title="Print Invoice"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {inv.status !== 'paid' && (
                          <button
                            onClick={() => simulatePayment(inv.id, 'paid')}
                            className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                            title="Simulate collecting payment"
                          >
                            Pay
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
