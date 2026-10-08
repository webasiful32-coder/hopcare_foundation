import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Campaign, PaymentGateway } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Heart,
  ShieldCheck,
  Check,
  Sparkles,
  Loader2,
  Copy,
  CheckCircle2,
  Smartphone,
  Info,
} from 'lucide-react';

const PRESET_AMOUNTS = [100, 500, 1000, 5000, 10000];

/* =========================================================
   PAYMENT NUMBERS  (শুধু এই দুইটা number change করবে)
   ========================================================= */
const BKASH_NUMBER = '01XXXXXXXXX';
const NAGAD_NUMBER = '01XXXXXXXXX';
/* ========================================================= */

const inputCls =
  'w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-500';
const labelCls = 'block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1';

export const DonateModal: React.FC = () => {
  const { isDonateOpen, closeDonateModal, selectedCampaign, user, addToast, openReceiptModal } = useApp();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [targetCampaignId, setTargetCampaignId] = useState<string>('');
  const [selectedAmount, setSelectedAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [gateway, setGateway] = useState<PaymentGateway>('bKash');

  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [message, setMessage] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/campaigns')
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        setCampaigns(data);
        if (selectedCampaign) {
          setTargetCampaignId(selectedCampaign.id);
        } else if (data.length > 0) {
          setTargetCampaignId(data[0].id);
        }
      })
      .catch(() => {});
  }, [selectedCampaign]);

  useEffect(() => {
    if (user) {
      setDonorName(user.fullName || '');
      setDonorEmail(user.email || '');
      setDonorPhone(user.phone || '');
    }
  }, [user]);

  useEffect(() => {
    setTransactionId('');
    setCopied(false);
  }, [gateway]);

  // Lock background scroll while the modal is open
  useEffect(() => {
    if (!isDonateOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isDonateOpen]);

  if (!isDonateOpen) return null;

  const effectiveAmount = isCustom ? Number(customAmount) || 0 : selectedAmount;
  const isMobileBanking = gateway === 'bKash' || gateway === 'Nagad';
  const paymentNumber = gateway === 'bKash' ? BKASH_NUMBER : gateway === 'Nagad' ? NAGAD_NUMBER : '';

  const handleCopyNumber = async () => {
    if (!paymentNumber || paymentNumber.includes('X')) {
      addToast('Payment number is not configured yet', 'error');
      return;
    }
    try {
      await navigator.clipboard.writeText(paymentNumber);
      setCopied(true);
      addToast(`${gateway} number copied`, 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('Could not copy the number', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!targetCampaignId) {
      addToast('Please select a campaign to support', 'error');
      return;
    }
    if (effectiveAmount < 50) {
      addToast('Minimum donation amount is ৳50', 'error');
      return;
    }
    if (isMobileBanking && !transactionId.trim()) {
      addToast(`Please enter your ${gateway} Transaction ID after sending the money`, 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: targetCampaignId,
          amount: effectiveAmount,
          donorName: isAnonymous ? 'Anonymous Donor' : donorName || 'Kind Donor',
          donorEmail: isAnonymous ? 'donor@anon.org' : donorEmail || 'donor@hopecare.org',
          donorPhone: donorPhone || '+8801800000000',
          isAnonymous,
          message,
          paymentGateway: gateway,
          transactionId: transactionId.trim(),
          userId: user?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process donation');
      }

      addToast(`Alhamdulillah! Donation of ৳${effectiveAmount.toLocaleString()} submitted.`, 'success');
      closeDonateModal();
      openReceiptModal(data.donation);

      setTransactionId('');
      setMessage('');
    } catch (err: any) {
      addToast(err.message || 'Payment processing failed. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isDonateOpen && (
        <div className="fixed inset-0 z-[200] flex items-start sm:items-center justify-center p-2 sm:p-4 bg-indigo-950/40 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)]"
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-5 py-3 bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 text-white">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 shrink-0 rounded-lg bg-white/20 flex items-center justify-center">
                  <Heart className="w-5 h-5 fill-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-base sm:text-lg leading-tight">Donate to Save Lives</h3>
                  <p className="text-[11px] sm:text-xs text-sky-100 truncate">
                    100% transparent donation to verified humanitarian appeals
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDonateModal}
                aria-label="Close donation modal"
                className="shrink-0 p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body: two columns on desktop (no scroll), single scrollable column on phones */}
            <form
              onSubmit={handleSubmit}
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5"
            >
              {/* ============ LEFT COLUMN ============ */}
              <div className="space-y-3.5">
                {/* Campaign */}
                <div>
                  <label className={labelCls}>Select Campaign</label>
                  <select
                    value={targetCampaignId}
                    onChange={(e) => setTargetCampaignId(e.target.value)}
                    className={inputCls}
                  >
                    {campaigns.length === 0 && <option value="">No campaigns available</option>}
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} (Target: ৳{Number(c.targetAmount || 0).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className={labelCls}>Select Amount (BDT / ৳)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_AMOUNTS.map((amt) => {
                      const isSelected = !isCustom && selectedAmount === amt;
                      return (
                        <button
                          type="button"
                          key={amt}
                          onClick={() => {
                            setIsCustom(false);
                            setSelectedAmount(amt);
                          }}
                          className={`py-2 px-2 rounded-xl text-sm font-semibold border transition text-center ${
                            isSelected
                              ? 'bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-200'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          ৳{amt.toLocaleString('en-IN')}
                        </button>
                      );
                    })}

                    {/* 6th cell: Custom button turns into an input (same size, no extra height) */}
                    {isCustom ? (
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                          ৳
                        </span>
                        <input
                          type="number"
                          min="50"
                          placeholder="Min 50"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          className="w-full h-full pl-6 pr-1 py-2 text-sm border border-sky-300 bg-sky-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsCustom(true)}
                        className="py-2 px-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
                      >
                        Custom
                      </button>
                    )}
                  </div>
                </div>

                {/* Payment method */}
                <div>
                  <label className={labelCls}>Choose Payment Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['bKash', 'Nagad', 'SSLCommerz', 'Stripe'] as PaymentGateway[]).map((gw) => {
                      const active = gateway === gw;
                      return (
                        <button
                          type="button"
                          key={gw}
                          onClick={() => setGateway(gw)}
                          className={`px-3 py-2 rounded-xl border text-left transition ${
                            active
                              ? 'border-sky-600 bg-sky-50/70 text-sky-900 ring-2 ring-sky-500/30'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs">{gw}</span>
                            {active && <Check className="w-3.5 h-3.5 text-sky-600" />}
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {gw === 'bKash' || gw === 'Nagad'
                              ? 'Send Money'
                              : gw === 'SSLCommerz'
                                ? 'Local Banks'
                                : 'Visa / Master'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Trust banner */}
                <div className="flex items-center gap-2 p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-800 text-[11px] leading-4">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Secure 256-bit encrypted checkout. Verified instant official receipt provided.</span>
                </div>
              </div>

              {/* ============ RIGHT COLUMN ============ */}
              <div className="space-y-3.5">
                {/* bKash / Nagad send money */}
                {isMobileBanking && (
                  <motion.div
                    key={gateway}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-sky-50 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <div className="shrink-0 w-7 h-7 rounded-lg bg-white text-emerald-600 shadow-sm flex items-center justify-center">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">Send Money via {gateway}</h4>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <span className="break-all text-lg font-bold tracking-wide text-slate-900">
                        {paymentNumber}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyNumber}
                        className="shrink-0 flex items-center gap-1.5 rounded-lg bg-sky-50 px-2.5 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition"
                      >
                        {copied ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>

                    <p className="mt-2 text-xs leading-5 text-slate-600">
                      Open <strong>{gateway}</strong> → <strong>Send Money</strong> →{' '}
                      <strong>৳{effectiveAmount ? effectiveAmount.toLocaleString('en-IN') : '0'}</strong> to this
                      number, then paste the Transaction ID.
                    </p>

                    <input
                      type="text"
                      placeholder={`${gateway} Transaction ID`}
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      className="mt-2 w-full px-3 py-2 text-sm font-semibold text-slate-800 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                      <Info className="w-3 h-3 shrink-0" />
                      Enter the exact ID from your payment confirmation.
                    </p>
                  </motion.div>
                )}

                {/* Donor information */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                      Donor Information
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="rounded text-sky-600 focus:ring-sky-500"
                      />
                      Donate Anonymously
                    </label>
                  </div>

                  <div className="space-y-2">
                    {!isAnonymous && (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Full Name"
                            value={donorName}
                            onChange={(e) => setDonorName(e.target.value)}
                            className={inputCls}
                            required={!isAnonymous}
                          />
                          <input
                            type="email"
                            placeholder="Email (for receipt)"
                            value={donorEmail}
                            onChange={(e) => setDonorEmail(e.target.value)}
                            className={inputCls}
                            required={!isAnonymous}
                          />
                        </div>
                        <input
                          type="tel"
                          placeholder="Mobile Phone (+880)"
                          value={donorPhone}
                          onChange={(e) => setDonorPhone(e.target.value)}
                          className={inputCls}
                        />
                      </>
                    )}
                    <input
                      type="text"
                      placeholder="Leave an encouraging message (Optional)"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Action button */}
                <button
                  type="submit"
                  disabled={isSubmitting || effectiveAmount <= 0}
                  className="w-full py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 transition shadow-lg shadow-sky-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Verifying {gateway} Transaction...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Confirm & Donate ৳{effectiveAmount ? effectiveAmount.toLocaleString('en-IN') : '0'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};