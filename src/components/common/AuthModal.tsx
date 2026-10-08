import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BANGLADESH_DIVISIONS, DISTRICT_UPAZILAS } from '../../data/bangladeshData';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Mail, User as UserIcon, Phone, ArrowRight, Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthOpen, closeAuthModal, authMode, openAuthModal, login, addToast, setCurrentPage } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [division, setDivision] = useState('Dhaka');
  const [district, setDistrict] = useState('Dhaka');
  const [upazila, setUpazila] = useState('Dhanmondi');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthOpen) return null;

  const currentDistricts = BANGLADESH_DIVISIONS[division] || ['Dhaka'];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'লগইন ব্যর্থ হয়েছে। সঠিক ইমেইল ও পাসওয়ার্ড দিন।');
      }

      login(data.token, data.user);
      addToast(`স্বাগতম, ${data.user.fullName}!`, 'success');
      closeAuthModal();
      setCurrentPage('home');
    } catch (err: any) {
      addToast(err.message || 'লগইন ব্যর্থ হয়েছে', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
          division,
          district,
          upazila
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'নিবন্ধন সম্পন্ন করা যায়নি।');
      }

      login(data.token, data.user);
      addToast(`নিবন্ধন সফলভাবে সম্পন্ন হয়েছে! স্বাগতম, ${data.user.fullName}।`, 'success');
      closeAuthModal();
      setCurrentPage('home');
    } catch (err: any) {
      addToast(err.message || 'নিবন্ধন ব্যর্থ হয়েছে', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isAuthOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ duration: 0.2 }}
            className={`relative w-full ${
              authMode === 'register' ? 'max-w-lg' : 'max-w-md'
            } bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[95vh] flex flex-col justify-between`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-blue-600 text-white shadow-xs">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-blue-100" />
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg leading-tight">
                    {authMode === 'login'
                      ? 'লগইন করুন (Sign In)'
                      : authMode === 'register'
                      ? 'নতুন একাউন্ট নিবন্ধন (Register)'
                      : 'পাসওয়ার্ড পুনরুদ্ধার'}
                  </h3>
                  <p className="text-xs text-blue-100 font-medium">
                    HopeCare Foundation • ড্যাশবোর্ড এক্সেস
                  </p>
                </div>
              </div>
              <button
                onClick={closeAuthModal}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            {authMode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="p-5 sm:p-6 space-y-3.5">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1">
                    ইমেইল ঠিকানা (Email Address) *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-600 absolute left-3 top-3.5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="আপনার নিবন্ধিত ইমেইল দিন"
                      className="w-full pl-9 pr-3 py-2.5 text-sm font-semibold text-slate-950 placeholder:text-slate-400 placeholder:font-normal border-2 border-slate-300 rounded-xl focus:border-blue-600 focus:outline-hidden transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-900 mb-1">
                    পাসওয়ার্ড (Password) *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-600 absolute left-3 top-3.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="আপনার পাসওয়ার্ড দিন"
                      className="w-full pl-9 pr-10 py-2.5 text-sm font-semibold text-slate-950 placeholder:text-slate-400 placeholder:font-normal border-2 border-slate-300 rounded-xl focus:border-blue-600 focus:outline-hidden transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl font-black text-white text-sm sm:text-base bg-blue-600 hover:bg-blue-700 transition shadow-md shadow-blue-600/30 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>যাচাই করা হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <span>লগইন করুন</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2 text-xs font-semibold text-slate-700">
                  কোনো একাউন্ট নেই?{' '}
                  <button
                    type="button"
                    onClick={() => openAuthModal('register')}
                    className="font-black text-blue-700 hover:underline cursor-pointer"
                  >
                    নতুন একাউন্ট খুলুন
                  </button>
                </div>
              </form>
            ) : authMode === 'register' ? (
              <form onSubmit={handleRegisterSubmit} className="p-5 sm:p-6 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1">পুরো নাম *</label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-600 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="আপনার পূর্ণ নাম"
                        className="w-full pl-9 pr-3 py-2 text-sm font-semibold text-slate-950 border-2 border-slate-300 rounded-xl focus:border-blue-600 focus:outline-hidden"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1">ফোন নম্বর *</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-600 absolute left-3 top-3" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="017XXXXXXXX"
                        className="w-full pl-9 pr-3 py-2 text-sm font-semibold text-slate-950 border-2 border-slate-300 rounded-xl focus:border-blue-600 focus:outline-hidden"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1">ইমেইল *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full px-3 py-2 text-sm font-semibold text-slate-950 border-2 border-slate-300 rounded-xl focus:border-blue-600 focus:outline-hidden"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1">পাসওয়ার্ড *</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="কমপক্ষে ৬ অক্ষর"
                      className="w-full px-3 py-2 text-sm font-semibold text-slate-950 border-2 border-slate-300 rounded-xl focus:border-blue-600 focus:outline-hidden"
                      required
                    />
                  </div>
                </div>

                {/* Location Grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1">বিভাগ</label>
                    <select
                      value={division}
                      onChange={(e) => {
                        const div = e.target.value;
                        setDivision(div);
                        const dists = BANGLADESH_DIVISIONS[div] || ['Dhaka'];
                        setDistrict(dists[0]);
                        setUpazila((DISTRICT_UPAZILAS[dists[0]] || ['Sadar'])[0]);
                      }}
                      className="w-full px-2 py-2 text-xs font-semibold text-slate-900 border-2 border-slate-300 rounded-xl bg-white focus:border-blue-600 focus:outline-hidden"
                    >
                      {Object.keys(BANGLADESH_DIVISIONS).map((div) => (
                        <option key={div} value={div}>
                          {div}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1">জেলা</label>
                    <select
                      value={district}
                      onChange={(e) => {
                        const dist = e.target.value;
                        setDistrict(dist);
                        setUpazila((DISTRICT_UPAZILAS[dist] || ['Sadar'])[0]);
                      }}
                      className="w-full px-2 py-2 text-xs font-semibold text-slate-900 border-2 border-slate-300 rounded-xl bg-white focus:border-blue-600 focus:outline-hidden"
                    >
                      {currentDistricts.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1">উপজেলা</label>
                    <input
                      type="text"
                      value={upazila}
                      onChange={(e) => setUpazila(e.target.value)}
                      placeholder="উপজেলা"
                      className="w-full px-2 py-2 text-xs font-semibold text-slate-900 border-2 border-slate-300 rounded-xl focus:border-blue-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl font-black text-white text-sm sm:text-base bg-blue-600 hover:bg-blue-700 transition shadow-md shadow-blue-600/30 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>নিবন্ধন তৈরি হচ্ছে...</span>
                    </>
                  ) : (
                    <span>নিবন্ধন সম্পন্ন করুন</span>
                  )}
                </button>

                <div className="text-center pt-1 text-xs font-semibold text-slate-700">
                  ইতিমধ্যে একাউন্ট আছে?{' '}
                  <button
                    type="button"
                    onClick={() => openAuthModal('login')}
                    className="font-black text-blue-700 hover:underline cursor-pointer"
                  >
                    লগইন করুন
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-5 sm:p-6 space-y-3.5">
                <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed">
                  আপনার নিবন্ধিত ইমেইল ঠিকানা দিন, আমরা পাসওয়ার্ড পুনরুদ্ধারের নির্দেশনা পাঠাবো।
                </p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="আপনার ইমেইল ঠিকানা"
                  className="w-full px-3 py-2 text-sm font-semibold text-slate-950 border-2 border-slate-300 rounded-xl focus:border-blue-600 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => {
                    addToast(`রিসেট নির্দেশিকা পাঠানো হয়েছে ${email || 'আপনার ইমেইলে'}.`, 'success');
                    openAuthModal('login');
                  }}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-extrabold hover:bg-blue-700 transition cursor-pointer"
                >
                  রিসেট লিংক পাঠান
                </button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => openAuthModal('login')}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    ← ফিরে যান লগইন পেজে
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
