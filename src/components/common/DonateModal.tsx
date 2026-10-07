import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Campaign, PaymentGateway } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, ShieldCheck, Check, Sparkles, Loader2 } from 'lucide-react';

const PRESET_AMOUNTS = [100, 500, 1000, 5000, 10000];

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch active campaigns for the selector
    fetch('/api/campaigns')
      .then((res) => res.json())
      .then((data) => {
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
      setDonorName(user.fullName);
      setDonorEmail(user.email);
      setDonorPhone(user.phone);
    }
  }, [user]);

  if (!isDonateOpen) return null;

  const currentCampaign = campaigns.find((c) => c.id === targetCampaignId) || selectedCampaign;
  const effectiveAmount = isCustom ? Number(customAmount) || 0 : selectedAmount;

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
          userId: user?.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process donation');
      }

      addToast(`Alhamdulillah! Donation of ৳${effectiveAmount.toLocaleString()} successful.`, 'success');
      closeDonateModal();
      // Auto open receipt modal with verified transaction!
      openReceiptModal(data.donation);
    } catch (err: any) {
      addToast(err.message || 'Payment processing failed. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isDonateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Heart className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">Donate to Save Lives</h3>
                  <p className="text-xs text-sky-100">100% transparent donation to verified humanitarian appeals</p>
                </div>
              </div>
              <button
                onClick={closeDonateModal}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Campaign Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Campaign
            </label>
            <select
              value={targetCampaignId}
              onChange={(e) => setTargetCampaignId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} (Target: ৳{c.targetAmount.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          {/* Amount Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Select Amount (BDT / ৳)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-2.5">
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
                    className={`py-2 px-3 rounded-xl text-sm font-semibold border transition text-center ${
                      isSelected
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-200'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ৳{amt.toLocaleString('en-IN')}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCustom(true)}
                className={`px-3 py-2 text-xs font-semibold rounded-xl border transition ${
                  isCustom ? 'bg-sky-50 text-sky-700 border-sky-300' : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                Custom Amount
              </button>
              {isCustom && (
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">৳</span>
                  <input
                    type="number"
                    min="50"
                    placeholder="Enter amount (min ৳50)"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full pl-8 pr-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                    autoFocus
                  />
                </div>
              )}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Choose Payment Method
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['bKash', 'Nagad', 'SSLCommerz', 'Stripe'] as PaymentGateway[]).map((gw) => {
                const active = gateway === gw;
                return (
                  <button
                    type="button"
                    key={gw}
                    onClick={() => setGateway(gw)}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      active
                        ? 'border-sky-600 bg-sky-50/70 text-sky-900 ring-2 ring-sky-500/30'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">{gw}</span>
                      {active && <Check className="w-3.5 h-3.5 text-sky-600" />}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {gw === 'bKash' ? 'Instant PIN' : gw === 'Nagad' ? 'Digital App' : gw === 'SSLCommerz' ? 'Local Banks' : 'Visa / Master'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Donor Information */}
          <div className="space-y-3 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
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

            {!isAnonymous && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required={!isAnonymous}
                />
                <input
                  type="email"
                  placeholder="Email Address (for receipt)"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  className="px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required={!isAnonymous}
                />
                <input
                  type="tel"
                  placeholder="Mobile Phone (+880)"
                  value={donorPhone}
                  onChange={(e) => setDonorPhone(e.target.value)}
                  className="px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 sm:col-span-2"
                />
              </div>
            )}

            <input
              type="text"
              placeholder="Leave an encouraging prayer or message (Optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Trust Banner */}
          <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-800 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Secure 256-bit encrypted checkout. Verified instant official receipt provided.</span>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={isSubmitting || effectiveAmount <= 0}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 transition shadow-lg shadow-sky-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
