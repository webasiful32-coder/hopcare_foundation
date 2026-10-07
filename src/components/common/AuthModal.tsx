import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BANGLADESH_DIVISIONS, DISTRICT_UPAZILAS } from '../../data/bangladeshData';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Mail, User as UserIcon, Phone, Shield, ArrowRight, Loader2 } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthOpen, closeAuthModal, authMode, openAuthModal, login, addToast } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [division, setDivision] = useState('Dhaka');
  const [district, setDistrict] = useState('Dhaka');
  const [upazila, setUpazila] = useState('Dhanmondi');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthOpen) return null;

  const currentDistricts = BANGLADESH_DIVISIONS[division] || ['Dhaka'];
  const currentUpazilas = DISTRICT_UPAZILAS[district] || ['Sadar'];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      login(data.token, data.user);
      closeAuthModal();
    } catch (err: any) {
      addToast(err.message || 'Login failed', 'error');
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
          fullName,
          email,
          phone,
          password,
          division,
          district,
          upazila
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      login(data.token, data.user);
      addToast('Registration successful! Welcome to HopeCare.', 'success');
      closeAuthModal();
    } catch (err: any) {
      addToast(err.message || 'Registration failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isAuthOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white shadow-sm">
              <div>
                <h3 className="font-bold text-lg">
                  {authMode === 'login' ? 'Welcome Back' : authMode === 'register' ? 'Join HopeCare Foundation' : 'Reset Password'}
                </h3>
                <p className="text-xs text-blue-100">
                  {authMode === 'login' ? 'Access your donor dashboard & messages' : 'Create your secure account in under 60 seconds'}
                </p>
              </div>
              <button
                onClick={closeAuthModal}
                className="p-1.5 text-white/80 hover:text-white rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

        {/* Form Body */}
        {authMode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@hopecare.org"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => openAuthModal('forgot')}
                  className="text-xs text-sky-600 hover:underline"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl font-bold text-white bg-sky-600 hover:bg-sky-700 transition shadow-md shadow-sky-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2 text-xs text-slate-500">
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => openAuthModal('register')}
                className="font-bold text-sky-600 hover:underline"
              >
                Register Here
              </button>
            </div>
          </form>
        ) : authMode === 'register' ? (
          <form onSubmit={handleRegisterSubmit} className="p-6 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Asif Ahmed"
                  className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone (+880) *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Division</label>
                <select
                  value={division}
                  onChange={(e) => {
                    const div = e.target.value;
                    setDivision(div);
                    const dists = BANGLADESH_DIVISIONS[div] || ['Dhaka'];
                    setDistrict(dists[0]);
                    setUpazila((DISTRICT_UPAZILAS[dists[0]] || ['Sadar'])[0]);
                  }}
                  className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-xl bg-white"
                >
                  {Object.keys(BANGLADESH_DIVISIONS).map((div) => (
                    <option key={div} value={div}>
                      {div}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">District</label>
                <select
                  value={district}
                  onChange={(e) => {
                    const dist = e.target.value;
                    setDistrict(dist);
                    setUpazila((DISTRICT_UPAZILAS[dist] || ['Sadar'])[0]);
                  }}
                  className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-xl bg-white"
                >
                  {currentDistricts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Upazila</label>
                <select
                  value={upazila}
                  onChange={(e) => setUpazila(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded-xl bg-white"
                >
                  {currentUpazilas.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl font-bold text-white bg-sky-600 hover:bg-sky-700 transition shadow-md shadow-sky-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <span>Create Donor Account</span>
              )}
            </button>

            <div className="text-center pt-1 text-xs text-slate-500">
              Already registered?{' '}
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="font-bold text-sky-600 hover:underline"
              >
                Sign In
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Enter your registered email address and we'll send you a password reset verification link.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
            />
            <button
              type="button"
              onClick={() => {
                addToast(`Reset instructions dispatched to ${email || 'your email'}.`, 'success');
                openAuthModal('login');
              }}
              className="w-full py-2.5 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-700 transition"
            >
              Send Reset Link
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Back to Sign In
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
