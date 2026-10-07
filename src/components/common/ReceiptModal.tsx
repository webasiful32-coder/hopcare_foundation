import React from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer, CheckCircle, ShieldCheck, Heart, Download } from 'lucide-react';

export const ReceiptModal: React.FC = () => {
  const { receiptData, closeReceiptModal } = useApp();

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = receiptData
    ? new Date(receiptData.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : '';

  return (
    <AnimatePresence>
      {receiptData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8 print:m-0 print:border-none print:shadow-none"
          >
            {/* Header Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 print:hidden">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle className="w-5 h-5" />
                </span>
                <span className="font-semibold text-slate-900">Official Donation Receipt</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition shadow-sm cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Save PDF
                </button>
                <button
                  onClick={closeReceiptModal}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Content */}
        <div id="receipt-print-area" className="p-8 text-slate-800 space-y-6">
          {/* Organization Letterhead */}
          <div className="flex items-start justify-between border-b pb-6 border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-emerald-500 flex items-center justify-center text-white font-bold shadow-md">
                  <Heart className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">HopeCare Foundation</h2>
                  <p className="text-xs text-slate-500">Registered NGO Affairs Bureau (Reg: NGOAB-2847/BD)</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-2 max-w-xs">
                House 42, Road 11/A, Dhanmondi, Dhaka-1209, Bangladesh.<br />
                Hotline: +880 1800-467322 | contact@hopecare.org
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-md uppercase tracking-wider mb-2">
                VERIFIED PAYMENT
              </span>
              <p className="text-xs text-slate-500 font-mono">Receipt No:</p>
              <p className="text-sm font-bold text-slate-900 font-mono">{receiptData.receiptNumber}</p>
              <p className="text-xs text-slate-500 mt-1">Date: {formattedDate}</p>
            </div>
          </div>

          {/* Donor & Campaign Details */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block font-medium mb-0.5">Donated By:</span>
              <span className="font-semibold text-slate-900 text-sm block">
                {receiptData.isAnonymous ? 'Anonymous Well-Wisher' : receiptData.donorName}
              </span>
              {!receiptData.isAnonymous && (
                <span className="text-slate-500 block mt-0.5">{receiptData.donorEmail}</span>
              )}
            </div>

            <div>
              <span className="text-slate-400 block font-medium mb-0.5">Designated Campaign:</span>
              <span className="font-semibold text-slate-900 block line-clamp-2">
                {receiptData.campaignTitle}
              </span>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-600 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-2.5">Description</th>
                  <th className="px-4 py-2.5">Method</th>
                  <th className="px-4 py-2.5">Tx ID</th>
                  <th className="px-4 py-2.5 text-right">Amount (BDT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    Humanitarian Charitable Contribution
                  </td>
                  <td className="px-4 py-3 text-slate-600">{receiptData.paymentGateway}</td>
                  <td className="px-4 py-3 font-mono text-slate-500">{receiptData.transactionId}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-900 text-sm">
                    ৳{receiptData.amount.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-50/80 border-t border-slate-200 font-bold">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right text-slate-700">Total Cleared Contribution:</td>
                  <td className="px-4 py-3 text-right text-emerald-700 text-base">
                    ৳{receiptData.amount.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {receiptData.message && (
            <div className="p-3 bg-sky-50/60 border border-sky-100 rounded-xl text-xs text-sky-900 italic">
              "{receiptData.message}"
            </div>
          )}

          {/* Verification & Official Signoff */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs">
            <div className="flex items-center gap-2 text-slate-500">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Tax exemption eligible under National Board of Revenue Section 44(4).</span>
            </div>

            <div className="text-center">
              <div className="w-24 border-b border-slate-400 mb-1 mx-auto"></div>
              <span className="text-[11px] text-slate-500 font-medium">Authorized Trustee Signature</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between print:hidden">
          <p className="text-xs text-slate-500">
            A confirmation receipt copy was sent to the donor email.
          </p>
          <button
            onClick={closeReceiptModal}
            className="px-5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition shadow-sm cursor-pointer"
          >
            Close Receipt
          </button>
        </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
