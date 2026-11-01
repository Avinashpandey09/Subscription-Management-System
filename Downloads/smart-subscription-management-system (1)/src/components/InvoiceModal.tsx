import React from 'react';
import { useApp } from '../context/AppContext';
import { Invoice } from '../types';
import { formatCurrency, formatDate, downloadInvoiceAsFile } from '../utils/helpers';
import {
  X,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building,
  CreditCard,
  FileSpreadsheet,
} from 'lucide-react';

interface InvoiceModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, onClose }) => {
  const { simulatePayment } = useApp();

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    downloadInvoiceAsFile(invoice);
  };

  const getStatusBadge = () => {
    if (invoice.status === 'paid') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5" />
          PAID IN FULL
        </span>
      );
    }
    if (invoice.status === 'failed' || invoice.status === 'overdue') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <AlertTriangle className="w-3.5 h-3.5" />
          PAYMENT FAILED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <Clock className="w-3.5 h-3.5" />
        PAYMENT PENDING
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative text-slate-100 my-8">
        {/* Action Toolbar */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-800 no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Document:</span>
            <span className="text-sm font-bold text-white font-mono">{invoice.invoiceNumber}</span>
          </div>

          <div className="flex items-center gap-2">
            {invoice.status !== 'paid' && (
              <button
                onClick={() => simulatePayment(invoice.id, 'paid')}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-sm transition-colors"
                title="Simulate collecting payment for this invoice"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Simulate Payment
              </button>
            )}

            <button
              onClick={handleDownload}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
              title="Download text receipt"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
              title="Print invoice"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Body */}
        <div id="printable-invoice" className="pt-6 space-y-6">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                  SS
                </div>
                <span className="text-lg font-bold tracking-tight text-white">
                  SmartSub Systems Inc.
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-2 space-y-0.5">
                <p>Automated Billing & Dunning Cloud</p>
                <p>100 Montgomery St, Suite 2400</p>
                <p>San Francisco, CA 94104 · billing@smartsub.io</p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-xl font-extrabold text-white font-mono tracking-tight">
                INVOICE
              </div>
              <div className="text-xs font-mono text-indigo-400 mt-0.5">
                {invoice.invoiceNumber}
              </div>
              <div className="mt-2">{getStatusBadge()}</div>
            </div>
          </div>

          {/* Dates & Billing Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
            <div>
              <div className="text-slate-400 uppercase tracking-wider font-semibold text-[10px] mb-1">
                Billed To
              </div>
              <div className="font-bold text-white text-sm">{invoice.customerName}</div>
              <div className="text-slate-300 font-medium">{invoice.customerCompany}</div>
              <div className="text-slate-400 mt-1">{invoice.customerAddress}</div>
              <div className="text-slate-400">{invoice.customerEmail}</div>
            </div>

            <div className="space-y-2 sm:text-right">
              <div>
                <span className="text-slate-400">Issue Date: </span>
                <span className="font-semibold text-slate-200 font-mono">
                  {formatDate(invoice.issueDate)}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Due Date: </span>
                <span className="font-semibold text-slate-200 font-mono">
                  {formatDate(invoice.dueDate)}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Billing Cycle: </span>
                <span className="font-semibold text-slate-200 font-mono">
                  {formatDate(invoice.periodStart)} – {formatDate(invoice.periodEnd)}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Payment Instrument: </span>
                <span className="font-semibold text-slate-200">
                  {invoice.paymentMethod}
                </span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="py-3 px-3 text-slate-200 font-sans font-medium">
                      {item.description}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-300">
                      {item.quantity}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-white">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Subtotals & Total calculation */}
          <div className="flex flex-col sm:flex-row justify-between items-start pt-4 border-t border-slate-800 gap-4">
            <div className="text-xs text-slate-400 max-w-xs space-y-1">
              <div className="font-semibold text-slate-300">Terms & Conditions</div>
              <p>
                Subscription invoices are billed automatically according to the service agreement.
                For questions regarding tax deductions or enterprise wire options, contact billing@smartsub.io.
              </p>
            </div>

            <div className="w-full sm:w-64 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span className="text-slate-200 font-medium">
                  {formatCurrency(invoice.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tax ({(invoice.taxRate * 100).toFixed(1)}%):</span>
                <span className="text-slate-200 font-medium">
                  {formatCurrency(invoice.taxAmount)}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-slate-800">
                <span className="font-sans">Total Due:</span>
                <span className="text-indigo-400">{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 no-print">
          <div className="flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5" />
            <span>Linked to Customer ID: {invoice.customerId}</span>
          </div>
          <div>
            <span>Subscription Reference: {invoice.subscriptionId}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
