import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  Droplet,
  Bell,
  Menu,
  X,
  User as UserIcon,
  Globe,
  PhoneCall,
  ShieldAlert,
  LogOut,
  LayoutDashboard,
  ChevronDown,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    user,
    logout,
    lang,
    setLang,
    t,
    currentPage,
    setCurrentPage,
    openDonateModal,
    openBloodRequestModal,
    openAuthModal,
    notifications,
    unreadNotifsCount,
    markNotificationsAsRead,
  } = useApp();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // =========================================================
  // কঠোর অ্যাডমিন চেকিং (সাধারণ কোনো ইউজার কখনোই দেখতে পাবে না)
  // ১. প্রধান সুপার অ্যাডমিন: mdarfanahmed97@gmail.com
  // ২. অ্যাডমিন কর্তৃক অনুমোদিত রোল: role === 'ADMIN'
  // =========================================================
  const SUPER_ADMIN_EMAILS = [
    'mdarfanahmed97@gmail.com',
    'asifulcse@gmail.com',
    'asifulcse22@gmail.com',
    'admin@hopecare.org'
  ];

  const isSuperAdmin = Boolean(
    user?.email && SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase().trim())
  );

  const isRoleAdmin = Boolean(
    user && String(user.role ?? '').trim().toUpperCase() === 'ADMIN'
  );

  // সাধারণ ইউজারদের জন্য isAdmin সর্বদা false থাকবে
  const isAdmin = Boolean(user && (isSuperAdmin || isRoleAdmin));

  const baseNavLinks = [
    { id: 'home', label: lang === 'bn' ? 'হোম' : 'Home' },
    { id: 'campaigns', label: lang === 'bn' ? 'ক্যাম্পেইন' : 'Causes' },
    { id: 'blood-donors', label: lang === 'bn' ? 'রক্তদাতা' : 'Blood Donors' },
    { id: 'blood-requests', label: lang === 'bn' ? 'জরুরি রক্ত' : 'Blood Requests' },
    { id: 'beneficiaries', label: lang === 'bn' ? 'উপকারভোগী' : 'Beneficiaries' },
    { id: 'gallery', label: lang === 'bn' ? 'গ্যালারি' : 'Gallery' },
    { id: 'blog', label: lang === 'bn' ? 'ব্লগ' : 'Blog' },
    { id: 'about', label: lang === 'bn' ? 'আমাদের কথা' : 'About' },
    { id: 'contact', label: lang === 'bn' ? 'যোগাযোগ' : 'Contact' },
  ];

  // শুধুমাত্র আসল অ্যাডমিন লগইন করলেই মেনুতে 'অ্যাডমিন প্যানেল' যুক্ত হবে
  const navLinks = isAdmin
    ? [...baseNavLinks, { id: 'admin', label: lang === 'bn' ? 'অ্যাডমিন প্যানেল' : 'Admin Panel' }]
    : baseNavLinks;

  const handleNavClick = (pageId: string) => {
    setCurrentPage(pageId);
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
    setIsNotifOpen(false);
  };

  return (
    // z-40: every modal (z-50 and above) always opens ON TOP of the navbar
    <header className="sticky top-0 z-40 w-full max-w-full bg-white border-b border-slate-200 shadow-[0_4px_20px_rgba(15,23,42,0.07)]">

      {/* =====================================================
          EMERGENCY TOP BAR
      ====================================================== */}
      <div className="w-full max-w-full bg-[#991B45] bg-gradient-to-r from-[#991B45] via-[#B0184B] to-[#8F123C] text-white">
        <div className="w-full max-w-[1440px] mx-auto px-2.5 sm:px-5 lg:px-8">
          <div className="min-h-[34px] sm:min-h-[38px] py-1 flex items-center justify-between gap-1.5 sm:gap-3 min-w-0">

            {/* LEFT: HOTLINE */}
            <div className="flex items-center min-w-0 gap-1.5 sm:gap-2">
              <span className="relative flex h-2 sm:h-2.5 w-2 sm:w-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-60 animate-ping" />
                <span className="relative inline-flex h-2 sm:h-2.5 w-2 sm:w-2.5 rounded-full bg-white" />
              </span>

              <span className="hidden md:inline text-[11px] sm:text-xs font-semibold whitespace-nowrap">
                24/7 Bangladesh Emergency Blood Hotline:
              </span>

              <a
                href="tel:+8801934201151"
                className="flex items-center gap-1 text-[11px] sm:text-xs font-extrabold text-white whitespace-nowrap hover:text-rose-100 transition shrink-0"
              >
                <PhoneCall className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span>+8801934201151</span>
              </a>
            </div>

            {/* RIGHT: BLOOD REQUEST & LANGUAGE */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={() => openBloodRequestModal()}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold text-white bg-white/10 border border-white/25 hover:bg-white/20 transition whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Droplet className="w-3.5 h-3.5 shrink-0" />
                Request Blood Immediately
              </button>

              <button
                onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold text-white bg-white/10 border border-white/25 hover:bg-white/20 transition whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span>{lang === 'en' ? 'বাংলা' : 'English'}</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* =====================================================
          MAIN NAVBAR
      ====================================================== */}
      <div className="w-full max-w-full">
        <div className="w-full max-w-[1440px] mx-auto px-2 sm:px-4 lg:px-8">
          <div className="min-h-[62px] sm:min-h-[74px] lg:min-h-[82px] flex items-center justify-between gap-1.5 sm:gap-3 xl:gap-4 min-w-0">

            {/* =================================================
                LOGO + FULL BRAND TEXT + বাংলা স্লোগান
            ================================================== */}
            <button
              onClick={() => handleNavClick('home')}
              className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink xl:shrink-0 cursor-pointer text-left group"
            >
              {/* ANIMATED LOGO */}
              <div className="relative shrink-0">
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: [0, -2, 0] }}
                  transition={{
                    opacity: { duration: 0.5 },
                    scale: { duration: 0.5, ease: 'easeOut' },
                    y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
                  }}
                  whileHover={{ scale: 1.05 }}
                  className="relative w-8 h-8 sm:w-11 sm:h-11 2xl:w-13 2xl:h-13 shrink-0 rounded-xl sm:rounded-2xl overflow-hidden bg-white shadow-sm sm:shadow-md ring-1 ring-emerald-100 cursor-pointer"
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
                    className="absolute right-0 bottom-0 w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-white flex items-center justify-center shadow-md"
                  >
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-rose-500" />
                  </motion.span>
                </motion.div>
              </div>

              {/* Brand Text + Subtitle */}
              <div className="min-w-0 flex flex-col justify-center">
                <div className="text-[12px] min-[400px]:text-[13.5px] sm:text-[17px] xl:text-[18px] 2xl:text-[20px] font-black tracking-tight text-slate-900 leading-tight whitespace-nowrap truncate">
                  Shohayota Foundation
                </div>
                <div
                  className="block text-[8.5px] min-[400px]:text-[9.5px] sm:text-[11px] font-medium text-slate-600 mt-0.5 leading-none whitespace-nowrap truncate"
                  style={{ fontFamily: "'Noto Sans Bengali', 'Hind Siliguri', sans-serif" }}
                >
                  মানুষের পাশে, মানবতার পথে
                </div>
              </div>
            </button>

            {/* =================================================
                DESKTOP NAVIGATION (Laptops & Desktops)
            ================================================== */}
            <nav className="hidden xl:flex flex-1 items-center justify-center min-w-0 px-1">
              <div className="flex items-center gap-0.5 2xl:gap-1.5 min-w-0">
                {navLinks.map((link) => {
                  const isActive = currentPage === link.id;

                  return (
                    <button
                      key={link.id}
                      onClick={() => handleNavClick(link.id)}
                      className={`relative px-2 2xl:px-3 py-2 rounded-xl text-[12px] 2xl:text-[13px] font-bold whitespace-nowrap transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 shrink-0 cursor-pointer ${
                        isActive
                          ? link.id === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-teal-50 text-teal-700'
                          : link.id === 'admin'
                          ? 'text-purple-700 hover:text-purple-800 hover:bg-purple-50 font-extrabold'
                          : 'text-slate-600 hover:text-teal-700 hover:bg-slate-50'
                      }`}
                    >
                      {link.label}

                      {isActive && (
                        <motion.span
                          layoutId="navbar-active"
                          className={`absolute left-1/2 -translate-x-1/2 bottom-0.5 w-6 2xl:w-7 h-[3px] rounded-full ${
                            link.id === 'admin'
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600'
                              : 'bg-gradient-to-r from-cyan-500 to-emerald-500'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* =================================================
                RIGHT SIDE CONTROLS
            ================================================== */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-auto min-w-0">

              {/* 1. Notification */}
              <div className="relative shrink-0">
                <button
                  onClick={() => {
                    setIsNotifOpen(!isNotifOpen);
                    setIsUserMenuOpen(false);
                    if (!isNotifOpen && unreadNotifsCount > 0) {
                      markNotificationsAsRead();
                    }
                  }}
                  className="relative w-7.5 h-7.5 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-slate-600 hover:text-teal-700 hover:bg-teal-50 transition cursor-pointer"
                  aria-label="Notifications"
                >
                  <Bell className="w-3.5 h-3.5 sm:w-5 sm:h-5" />

                  {unreadNotifsCount > 0 && (
                    <span className="absolute top-0 right-0 min-w-[14px] h-[14px] px-0.5 bg-rose-500 text-white text-[8px] sm:text-[9px] font-extrabold rounded-full flex items-center justify-center border-2 border-white">
                      {unreadNotifsCount > 9 ? '9+' : unreadNotifsCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                <AnimatePresence>
                  {isNotifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.97 }}
                      className="fixed inset-x-2.5 top-[100px] sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[360px] max-w-[calc(100vw-20px)] sm:max-w-[420px] mx-auto sm:mx-0 bg-white rounded-2xl border border-slate-200 shadow-[0_20px_50px_rgba(15,23,42,0.18)] overflow-hidden z-[200]"
                    >
                      <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 min-w-0">
                        <div className="min-w-0">
                          <h3 className="text-sm font-extrabold text-slate-900 truncate">Notifications</h3>
                          <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                            Stay updated with Shohayota Foundation
                          </p>
                        </div>

                        <button
                          onClick={markNotificationsAsRead}
                          className="text-[10px] font-bold text-teal-600 hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Mark all read
                        </button>
                      </div>

                      <div className="max-h-[300px] sm:max-h-[340px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="py-10 text-center">
                            <Bell className="w-6 h-6 mx-auto text-slate-300 mb-2" />
                            <p className="text-xs font-semibold text-slate-500">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div key={n.id} className="px-4 py-3 border-b border-slate-100 hover:bg-slate-50 min-w-0">
                              <p className="text-xs font-bold text-slate-900 break-words">{n.title}</p>
                              <p className="text-[11px] text-slate-600 mt-1 break-words">{n.message}</p>
                              <span className="text-[9px] text-slate-400 mt-1 block">
                                {new Date(n.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 2. Admin Panel Button:
                  - শুধুমাত্র isAdmin TRUE হলেই দৃশ্যমান হবে (সাধারণ ইউজারের কাছে লুকিয়ে থাকবে)
                  - LAPTOPS/TABLETS (md:flex): Full button with text and icon
                  - MOBILE (< md): Compact purple icon badge directly in the header */}
              {isAdmin && (
                <>
                  <button
                    onClick={() => handleNavClick('admin')}
                    className="hidden md:flex items-center gap-1.5 h-8 sm:h-10 px-2.5 sm:px-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-[11px] sm:text-xs font-extrabold shadow-md shadow-purple-600/20 transition cursor-pointer whitespace-nowrap shrink-0"
                    title="Admin Dashboard"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span>Admin Panel</span>
                  </button>

                  <button
                    onClick={() => handleNavClick('admin')}
                    className="flex md:hidden items-center justify-center w-7.5 h-7.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm hover:opacity-90 transition shrink-0 cursor-pointer"
                    title="Admin Dashboard"
                    aria-label="Admin Dashboard"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {/* 3. User Avatar Button */}
              {user ? (
                <div className="relative shrink-0">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(!isUserMenuOpen);
                      setIsNotifOpen(false);
                    }}
                    className="flex items-center justify-center gap-1 sm:gap-2 h-7.5 sm:h-10 px-1 sm:px-2 rounded-xl border border-slate-200 bg-white hover:bg-teal-50 hover:border-teal-200 transition shrink-0 cursor-pointer"
                  >
                    <div className="w-5.5 h-5.5 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 text-white font-bold text-[11px] sm:text-xs flex items-center justify-center overflow-hidden shrink-0">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
                      ) : (
                        user.fullName.charAt(0).toUpperCase()
                      )}
                    </div>

                    <div className="hidden xl:block text-left min-w-0 max-w-[100px]">
                      <span className="text-[11px] font-bold text-slate-900 block truncate">
                        {user.fullName.split(' ')[0]}
                      </span>
                      <span className="text-[9px] text-slate-500 uppercase font-bold truncate block">
                        {user.role}
                      </span>
                    </div>

                    <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 hidden sm:block" />
                  </button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        className="fixed right-2.5 top-[100px] sm:absolute sm:right-0 sm:top-full sm:mt-2 w-60 max-w-[calc(100vw-20px)] bg-white rounded-2xl border border-slate-200 shadow-[0_20px_50px_rgba(15,23,42,0.18)] p-2 z-[200]"
                      >
                        <div className="p-3 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 mb-1 min-w-0">
                          <p className="text-sm font-extrabold text-slate-900 truncate">{user.fullName}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5 truncate">{user.email}</p>
                        </div>

                        <button
                          onClick={() => handleNavClick('dashboard')}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-teal-50 transition min-w-0 cursor-pointer"
                        >
                          <span className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                            <LayoutDashboard className="w-4 h-4 text-teal-600" />
                          </span>
                          <span className="text-xs font-bold text-slate-700 truncate">User Dashboard</span>
                        </button>

                        {/* শুধুমাত্র অ্যাডমিনের ড্রপডাউনেই এটি দেখা যাবে */}
                        {isAdmin && (
                          <button
                            onClick={() => handleNavClick('admin')}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left bg-purple-50 hover:bg-purple-100 transition min-w-0 mt-1 cursor-pointer"
                          >
                            <span className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center shrink-0 text-white">
                              <ShieldAlert className="w-4 h-4" />
                            </span>
                            <span className="text-xs font-bold text-purple-700 truncate">Admin Dashboard</span>
                          </button>
                        )}

                        <div className="border-t border-slate-100 mt-1 pt-1">
                          <button
                            onClick={() => {
                              logout();
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          >
                            <LogOut className="w-4 h-4 shrink-0" />
                            <span className="text-xs font-bold">Sign Out</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                /* Sign in (Desktop & Laptop) */
                <button
                  onClick={() => handleNavClick('auth')}
                  className="hidden sm:flex items-center gap-1.5 h-8 sm:h-10 px-2.5 sm:px-3.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:text-teal-700 hover:bg-teal-50 text-xs font-extrabold transition cursor-pointer whitespace-nowrap shrink-0"
                >
                  <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>{t.signIn}</span>
                </button>
              )}

              {/* 4. Donate Button */}
              <button
                onClick={() => openDonateModal()}
                className="h-7.5 sm:h-10 px-2 sm:px-4 2xl:px-5 rounded-xl text-[10px] sm:text-xs font-extrabold text-white bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-700 hover:via-teal-700 hover:to-emerald-700 shadow-sm sm:shadow-md flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap transition shrink-0 cursor-pointer"
              >
                <Heart className="w-3 h-3 sm:w-4 sm:h-4 fill-white shrink-0" />
                <span>Donate</span>
              </button>

              {/* 5. HAMBURGER MENU BUTTON */}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(!isMobileMenuOpen);
                  setIsNotifOpen(false);
                  setIsUserMenuOpen(false);
                }}
                className="xl:hidden w-7.5 h-7.5 sm:w-10 sm:h-10 shrink-0 flex items-center justify-center rounded-xl text-slate-800 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 transition cursor-pointer"
                aria-label="Toggle Navigation"
              >
                {isMobileMenuOpen ? (
                  <X className="w-4 h-4 sm:w-6 sm:h-6" />
                ) : (
                  <Menu className="w-4 h-4 sm:w-6 sm:h-6" />
                )}
              </button>

            </div>

          </div>
        </div>
      </div>

      {/* =====================================================
          MOBILE & TABLET DRAWER
      ====================================================== */}
      {isMobileMenuOpen && (
        <div className="xl:hidden w-full max-w-full bg-white border-t border-slate-200 shadow-[0_15px_35px_rgba(15,23,42,0.12)] relative z-[150]">
          <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-6 py-3.5 sm:py-4 max-h-[calc(100dvh-100px)] overflow-y-auto overscroll-contain min-w-0">

            {/* Mobile Brand Card */}
            <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 mb-3 sm:mb-4 rounded-2xl bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-100 min-w-0">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl overflow-hidden bg-white p-0.5 border border-emerald-100 shadow-xs shrink-0">
                <img src="/logo.png" alt="Shohayota Foundation" className="w-full h-full object-contain" />
              </div>

              <div className="min-w-0">
                <p className="text-sm sm:text-base font-extrabold text-slate-900 truncate">Shohayota Foundation</p>
                <p
                  className="text-[10px] sm:text-xs text-slate-600 mt-0.5 truncate"
                  style={{ fontFamily: "'Noto Sans Bengali', 'Hind Siliguri', sans-serif" }}
                >
                  মানুষের পাশে, মানবতার পথে
                </p>
              </div>
            </div>

            {/* Mobile Nav Links Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 min-w-0">
              {navLinks.map((link) => {
                const isActive = currentPage === link.id;

                return (
                  <button
                    key={link.id}
                    onClick={() => handleNavClick(link.id)}
                    className={`w-full min-w-0 flex items-center justify-between gap-2 px-3.5 py-3 sm:py-3.5 rounded-xl text-left text-xs sm:text-sm font-bold transition-all border cursor-pointer ${
                      isActive
                        ? link.id === 'admin'
                          ? 'bg-purple-100 text-purple-800 border-purple-300'
                          : 'bg-teal-50 text-teal-700 border-teal-200'
                        : link.id === 'admin'
                        ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-teal-200 hover:text-teal-700'
                    }`}
                  >
                    <span className="truncate">{link.label}</span>
                    {isActive && (
                      <span className={`w-2 h-2 rounded-full shrink-0 ${link.id === 'admin' ? 'bg-purple-600' : 'bg-teal-500'}`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Mobile Actions */}
            <div className="mt-3.5 pt-3.5 sm:mt-4 sm:pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0">
              {!user ? (
                <button
                  onClick={() => {
                    openAuthModal('login');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full min-w-0 py-3 sm:py-3.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs sm:text-sm font-extrabold hover:bg-slate-50 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserIcon className="w-4 h-4 shrink-0" />
                  <span className="truncate">Sign In / Register</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleNavClick('dashboard');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full min-w-0 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white text-xs sm:text-sm font-extrabold shadow-sm truncate cursor-pointer"
                >
                  Go to User Dashboard
                </button>
              )}

              {/* শুধুমাত্র অ্যাডমিন হলেই মোবাইল ড্রয়ারে বাটনটি দেখা যাবে */}
              {isAdmin && (
                <button
                  onClick={() => {
                    handleNavClick('admin');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full min-w-0 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs sm:text-sm font-extrabold shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span className="truncate">Admin Dashboard</span>
                </button>
              )}

              <button
                onClick={() => {
                  openBloodRequestModal();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full min-w-0 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <Droplet className="w-4 h-4 shrink-0" />
                <span>Request Blood</span>
              </button>
            </div>

            {/* Language Switch */}
            <button
              onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
              className="w-full min-w-0 mt-2 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Globe className="w-4 h-4 shrink-0" />
              <span>{lang === 'en' ? 'বাংলায় দেখুন' : 'View in English'}</span>
            </button>

            {/* Sign Out */}
            {user && (
              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full min-w-0 mt-2 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      )}

    </header>
  );
};