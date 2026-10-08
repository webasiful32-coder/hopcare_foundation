import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import {
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Database,
  Heart,
  Droplet,
  Compass,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { BANGLADESH_DIVISIONS, DISTRICT_UPAZILAS, BLOOD_GROUPS } from '../../data/bangladeshData';

interface MotionAuthPageProps {
  onBypassToSite?: () => void;
  defaultMode?: 'login' | 'register';
}

export const MotionAuthPage: React.FC<MotionAuthPageProps> = ({ onBypassToSite, defaultMode = 'login' }) => {
  const { login, addToast, setCurrentPage } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [division, setDivision] = useState('Dhaka');
  const [district, setDistrict] = useState('Dhaka');
  const [upazila, setUpazila] = useState('Dhanmondi');
  const [bloodGroup, setBloodGroup] = useState('A+');
  const [isBloodDonor, setIsBloodDonor] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Neon DB Status
  const [dbStatus, setDbStatus] = useState<{ isConnected: boolean; provider: string; message: string } | null>(null);

  useEffect(() => {
    fetch('/api/health/db-status')
      .then((res) => res.json())
      .then((data) => setDbStatus(data))
      .catch(() => {});
  }, []);

  const handleDivisionChange = (div: string) => {
    setDivision(div);
    const districts = BANGLADESH_DIVISIONS[div] || ['Dhaka'];
    setDistrict(districts[0]);
    const upazilas = DISTRICT_UPAZILAS[districts[0]] || ['Sadar'];
    setUpazila(upazilas[0]);
  };

  const handleDistrictChange = (dist: string) => {
    setDistrict(dist);
    const upazilas = DISTRICT_UPAZILAS[dist] || ['Sadar'];
    setUpazila(upazilas[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়। দয়া করে আবার চেষ্টা করুন।');
        }

        login(data.token, data.user);
        addToast(`স্বাগতম, ${data.user.fullName}!`, 'success');

        // Redirect to Home Page on login
        setCurrentPage('home');
      } else {
        // Register
        if (!fullName.trim() || !email.trim() || !phone.trim() || !password) {
          throw new Error('দয়া করে সব প্রয়োজনীয় ঘর পূরণ করুন');
        }

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
          throw new Error(data.error || 'রেজিস্ট্রেশন সম্পন্ন করা যায়নি। পুনরায় চেষ্টা করুন।');
        }

        // If user also wants to be a blood donor, register donor profile
        if (isBloodDonor && data.token) {
          try {
            await fetch('/api/blood-donors', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${data.token}`
              },
              body: JSON.stringify({
                fullName: fullName.trim(),
                bloodGroup,
                phone: phone.trim(),
                email: email.trim(),
                division,
                district,
                upazila,
                userId: data.user.id
              })
            });
          } catch {}
        }

        login(data.token, data.user);
        addToast(`রেজিস্ট্রেশন সফলভাবে সম্পন্ন হয়েছে! স্বাগতম, ${data.user.fullName}।`, 'success');

        // Redirect to Home Page on registration
        setCurrentPage('home');
      }
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full relative flex items-center justify-center p-3 sm:p-5 overflow-hidden bg-gradient-to-br from-slate-100 via-sky-50/70 to-indigo-100/60 font-sans selection:bg-blue-600 selection:text-white">
      {/* Background Animated Floating Gradient Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          x: [0, 25, 0],
          y: [0, -20, 0]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-8 left-8 w-72 h-72 rounded-full bg-gradient-to-tr from-sky-400/25 to-blue-500/20 blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, -30, 0],
          y: [0, 30, 0]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-8 right-8 w-80 h-80 rounded-full bg-gradient-to-bl from-teal-400/20 to-emerald-400/20 blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          y: [0, 15, 0]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-gradient-to-br from-rose-400/15 to-pink-400/15 blur-3xl pointer-events-none"
      />

      {/* Main Glass Card - Compact & Screen-Fitting (No scroll required) */}
      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className={`relative z-10 w-full ${
          mode === 'register' ? 'max-w-xl' : 'max-w-md'
        } bg-white/95 backdrop-blur-2xl border border-white/80 shadow-2xl shadow-indigo-500/15 rounded-3xl p-5 sm:p-7 max-h-[96vh] flex flex-col justify-between overflow-y-auto`}
      >
        {/* Top Header & Branding */}
        <div>
          <div className="flex flex-col items-center text-center space-y-2 mb-3">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 3 }}
              whileTap={{ scale: 0.95 }}
              className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 via-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30"
            >
              <Heart className="w-6 h-6 fill-white/90" />
            </motion.div>

            <div className="space-y-0.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Shohayota<span className="text-blue-600">Foundation</span>
              </h1>
              <p className="text-xs font-semibold text-slate-600">
                মানবিক সহায়তা ও জরুরি রক্তদান প্ল্যাটফর্ম • Bangladesh Gateway
              </p>
            </div>

            {/* Neon DB Live Status Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {dbStatus?.isConnected
                  ? 'Neon PostgreSQL ক্লাউড ডাটাবেজ যুক্ত'
                  : 'Neon Cloud Database প্রস্তুত'}
              </span>
            </div>
          </div>

          {/* Animated Tab Switcher with sliding pill */}
          <div className="flex p-1 bg-slate-100/90 rounded-2xl mb-3 relative">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-black transition-all relative z-10 cursor-pointer ${
                mode === 'login' ? 'text-blue-700' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {mode === 'login' && (
                <motion.div
                  layoutId="activeAuthTabPill"
                  className="absolute inset-0 bg-white rounded-xl shadow-md border border-slate-200/60"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                লগইন (Sign In)
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMode('register')}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-black transition-all relative z-10 cursor-pointer ${
                mode === 'register' ? 'text-blue-700' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {mode === 'register' && (
                <motion.div
                  layoutId="activeAuthTabPill"
                  className="absolute inset-0 bg-white rounded-xl shadow-md border border-slate-200/60"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <span className="relative z-10 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                নতুন একাউন্ট (Register)
              </span>
            </button>
          </div>

          {/* Notice Card - High Contrast & Clear Text */}
          <div className="mb-3 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-left text-xs leading-tight">
              <p className="font-extrabold text-blue-950">
                {mode === 'login'
                  ? 'আপনার একাউন্টে লগইন করে ড্যাশবোর্ড দেখুন'
                  : 'প্রথম একাউন্টটি স্বয়ংক্রিয়ভাবে SUPER ADMIN হবে'}
              </p>
              <p className="text-[11px] font-semibold text-slate-600">
                {mode === 'login'
                  ? 'সঠিক ইমেইল ও পাসওয়ার্ড প্রদান করে প্রবেশ করুন।'
                  : 'অ্যাডমিন ড্যাশবোর্ড থেকে সবকিছু যোগ, আপডেট ও ডিলিট করা যাবে।'}
              </p>
            </div>
          </div>
        </div>

        {/* Animated Form Fields */}
        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            initial={{ opacity: 0, x: mode === 'login' ? -15 : 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: mode === 'login' ? 15 : -15 }}
            transition={{ duration: 0.22 }}
            onSubmit={handleSubmit}
            className="space-y-3"
          >
            {/* LOGIN MODE */}
            {mode === 'login' && (
              <>
                <div>
                  <label className="block text-xs sm:text-sm font-extrabold text-slate-900 mb-1">
                    ইমেইল ঠিকানা (Email Address) *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="আপনার ইমেইল ঠিকানা দিন"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/80 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-extrabold text-slate-900 mb-1">
                    পাসওয়ার্ড (Password) *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="আপনার পাসওয়ার্ড দিন"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50/80 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* REGISTER MODE - 2-Column Responsive Layout */}
            {mode === 'register' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-900 mb-1">
                      পুরো নাম (Full Name) *
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        placeholder="আপনার পূর্ণ নাম"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50/80 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-900 mb-1">
                      মোবাইল নম্বর (Phone) *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="tel"
                        required
                        placeholder="01XXXXXXXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50/80 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-900 mb-1">
                      ইমেইল (Email) *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        placeholder="example@mail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50/80 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-900 mb-1">
                      পাসওয়ার্ড (Password) *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="কমপক্ষে ৬ ডিজিটের পাসওয়ার্ড"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-9 py-2 bg-slate-50/80 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3-Column Location Selector */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-900 mb-1">বিভাগ *</label>
                    <select
                      value={division}
                      onChange={(e) => handleDivisionChange(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50/80 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.keys(BANGLADESH_DIVISIONS).map((div) => (
                        <option key={div} value={div}>
                          {div}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-900 mb-1">জেলা *</label>
                    <select
                      value={district}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50/80 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    >
                      {(BANGLADESH_DIVISIONS[division] || []).map((dst) => (
                        <option key={dst} value={dst}>
                          {dst}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-900 mb-1">উপজেলা</label>
                    <input
                      type="text"
                      placeholder="উপজেলা/এলাকা"
                      value={upazila}
                      onChange={(e) => setUpazila(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50/80 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Optional Blood Donor Checkbox */}
                <div className="px-3 py-2 bg-rose-50/80 border border-rose-200 rounded-xl flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isBloodDonor}
                      onChange={(e) => setIsBloodDonor(e.target.checked)}
                      className="w-4 h-4 text-rose-600 rounded-sm focus:ring-rose-500 cursor-pointer"
                    />
                    <span className="text-xs font-extrabold text-rose-950 flex items-center gap-1">
                      <Droplet className="w-3.5 h-3.5 text-rose-600" />
                      রক্তদান করতে আগ্রহী?
                    </span>
                  </label>

                  {isBloodDonor && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-rose-900">গ্রুপ:</span>
                      <select
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        className="px-2 py-0.5 bg-white border border-rose-300 rounded-lg text-xs font-black text-rose-700"
                      >
                        {BLOOD_GROUPS.map((bg) => (
                          <option key={bg} value={bg}>
                            {bg}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Glowing Gradient Submit Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
              type="submit"
              className="w-full py-3 sm:py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-sm sm:text-base shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer mt-1"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'login'
                      ? 'লগইন করে ড্যাশবোর্ডে প্রবেশ করুন'
                      : 'রেজিস্ট্রেশন সম্পন্ন করে ড্যাশবোর্ডে প্রবেশ করুন'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </motion.form>
        </AnimatePresence>

        {/* Bottom Options & Guest Browsing */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
          {mode === 'login' ? (
            <button
              type="button"
              onClick={() => setMode('register')}
              className="text-xs font-extrabold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
            >
              একাউন্ট নেই? নতুন একাউন্ট খুলুন →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setMode('login')}
              className="text-xs font-extrabold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
            >
              আগে থেকেই একাউন্ট আছে? লগইন করুন →
            </button>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => {
              if (onBypassToSite) {
                onBypassToSite();
              } else {
                setCurrentPage('home');
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-blue-600" />
            <span>অতিথি হিসেবে দেখুন</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
