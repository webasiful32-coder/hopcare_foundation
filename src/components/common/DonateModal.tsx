import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Campaign, PaymentGateway } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ShieldCheck,
  Check,
  Sparkles,
  Loader2,
  Copy,
  CheckCircle2,
  Smartphone,
} from 'lucide-react';

const PRESET_AMOUNTS = [100, 500, 1000, 5000, 10000];

/* =========================================================
   PAYMENT NUMBERS (শুধু এই দুইটা number change করবে)
   ========================================================= */
const BKASH_NUMBER = '01983461138';
const NAGAD_NUMBER = '01983461138';
/* ========================================================= */

const inputCls =
  'w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-500';
const labelCls = 'block text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-0.5 sm:mb-1';

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

  // Lock background scroll while modal is open
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col my-auto max-h-[96dvh]"
          >
            {/* Header - অ্যানিমেটেড লোগো সহ স্লিম লুক */}
            <div className="shrink-0 flex items-center justify-between gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 text-white">
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative shrink-0">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85, y: -8 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      y: [0, -2, 0],
                    }}
                    transition={{
                      opacity: { duration: 0.5 },
                      scale: { duration: 0.5, ease: 'easeOut' },
                      y: {
                        duration: 3,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      },
                    }}
                    whileHover={{ scale: 1.05 }}
                    className="relative w-7 h-7 sm:w-10 sm:h-10 2xl:w-12 2xl:h-12 shrink-0 rounded-xl overflow-hidden bg-white shadow-md ring-1 ring-emerald-100 cursor-pointer"
                  >
                    <img
                      src="/logo.png"
                      alt="Shohayota Foundation"
                      className="w-full h-full object-contain p-0.5"
                    />

                    {/* Small live indicator */}
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4, duration: 0.3 }}
                      className="absolute right-0 bottom-0 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-white flex items-center justify-center shadow-xs"
                    >
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-rose-500" />
                    </motion.span>
                  </motion.div>
                </div>

                <div className="min-w-0">
                  <h3 className="font-bold text-xs sm:text-base leading-tight">Donate to Save Lives</h3>
                  <p className="text-[9.5px] sm:text-xs text-sky-100 truncate">
                    100% transparent donation to verified appeals
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeDonateModal}
                aria-label="Close donation modal"
                className="shrink-0 p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Body: কম্পিউটারে ২ কলাম, মোবাইলে ১ স্ক্রিনে ফিট */}
            <form
              onSubmit={handleSubmit}
              className="p-2.5 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 md:gap-5 overflow-y-auto sm:overflow-hidden max-h-[calc(96dvh-45px)]"
            >
              {/* ============ LEFT COLUMN ============ */}
              <div className="space-y-1.5 sm:space-y-3">
                {/* Campaign */}
                <div>
                  <label className={labelCls}>Select Campaign</label>
                  <select
                    value={targetCampaignId}
                    onChange={(e) => setTargetCampaignId(e.target.value)}
                    className={`${inputCls} py-1`}
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
                  <div className="grid grid-cols-3 gap-1 sm:gap-2">
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
                          className={`py-1 sm:py-2 px-1 rounded-xl text-xs sm:text-sm font-bold border transition text-center cursor-pointer ${
                            isSelected
                              ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          ৳{amt.toLocaleString('en-IN')}
                        </button>
                      );
                    })}

                    {/* Custom Amount Button/Input */}
                    {isCustom ? (
                      <div className="relative">
                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                          ৳
                        </span>
                        <input
                          type="number"
                          min="50"
                          placeholder="Min 50"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          className="w-full h-full pl-4 pr-1 py-1 text-xs font-bold border border-sky-300 bg-sky-50 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsCustom(true)}
                        className="py-1 sm:py-2 px-1 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                      >
                        Custom
                      </button>
                    )}
                  </div>
                </div>

                {/* Payment method - মোবাইলে কমপ্যাক্ট ৪ বাটন */}
                <div>
                  <label className={labelCls}>Choose Payment Method</label>
                  <div className="grid grid-cols-4 sm:grid-cols-2 gap-1 sm:gap-2">
                    {(['bKash', 'Nagad', 'SSLCommerz', 'Stripe'] as PaymentGateway[]).map((gw) => {
                      const active = gateway === gw;
                      return (
                        <button
                          type="button"
                          key={gw}
                          onClick={() => setGateway(gw)}
                          className={`px-1 py-1 sm:py-2 rounded-xl border text-center sm:text-left transition cursor-pointer ${
                            active
                              ? 'border-sky-600 bg-sky-50 text-sky-900 ring-1 ring-sky-500'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-center sm:justify-between">
                            <span className="font-extrabold text-[11px] sm:text-xs truncate">{gw}</span>
                            {active && <Check className="w-3 h-3 text-sky-600 hidden sm:block shrink-0" />}
                          </div>
                          <span className="text-[9px] text-slate-500 hidden sm:block truncate">
                            {gw === 'bKash' || gw === 'Nagad' ? 'Send Money' : gw === 'SSLCommerz' ? 'Local Banks' : 'Visa/Master'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Trust banner (ডেস্কটপে দৃশ্যমান) */}
                <div className="hidden sm:flex items-center gap-1.5 p-2 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-800 text-[10px] leading-tight">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Secure 256-bit encrypted checkout. Verified instant official receipt provided.</span>
                </div>
              </div>

              {/* ============ RIGHT COLUMN ============ */}
              <div className="space-y-1.5 sm:space-y-3">
                {/* bKash / Nagad Send Money Box (সুপার স্লিম) */}
                {isMobileBanking && (
                  <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-sky-50/70 p-1.5 sm:p-2.5">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1 min-w-0">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-extrabold text-slate-900 text-xs">
                          {gateway}: <span className="font-mono text-emerald-700">{paymentNumber}</span>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyNumber}
                        className="shrink-0 flex items-center gap-1 rounded-lg bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700 hover:bg-sky-200 transition cursor-pointer"
                      >
                        {copied ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        placeholder={`Paste ${gateway} Transaction ID *`}
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="w-full px-2.5 py-1 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Donor Information (২ কলামে স্লিম গ্রিড) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className={labelCls}>Donor Info</label>
                    <label className="flex items-center gap-1 text-[10px] text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="rounded text-sky-600 focus:ring-sky-500 h-3 w-3"
                      />
                      Anonymous
                    </label>
                  </div>

                  {!isAnonymous && (
                    <div className="grid grid-cols-2 gap-1">
                      <input
                        type="text"
                        placeholder="Full Name *"
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                        className={`${inputCls} py-1`}
                        required={!isAnonymous}
                      />
                      <input
                        type="tel"
                        placeholder="Mobile (+880)"
                        value={donorPhone}
                        onChange={(e) => setDonorPhone(e.target.value)}
                        className={`${inputCls} py-1`}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {!isAnonymous && (
                      <input
                        type="email"
                        placeholder="Email (for receipt)"
                        value={donorEmail}
                        onChange={(e) => setDonorEmail(e.target.value)}
                        className={`${inputCls} py-1`}
                      />
                    )}
                    <input
                      type="text"
                      placeholder="Message (Optional)"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className={`${inputCls} py-1 ${isAnonymous ? 'col-span-2' : ''}`}
                    />
                  </div>
                </div>

                {/* Action button - কনফার্ম ডোনেট */}
                <button
                  type="submit"
                  disabled={isSubmitting || effectiveAmount <= 0}
                  className="w-full py-2 sm:py-2.5 px-3 rounded-xl font-extrabold text-xs sm:text-sm text-white bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 transition shadow-md shadow-sky-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
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