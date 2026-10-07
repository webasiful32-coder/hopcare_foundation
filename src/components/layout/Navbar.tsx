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
  Sparkles,
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

  const navLinks = [
    {
      id: 'home',
      label: lang === 'bn' ? 'হোম' : 'Home',
    },
    {
      id: 'campaigns',
      label: lang === 'bn' ? 'ক্যাম্পেইন' : 'Causes',
    },
    {
      id: 'blood-donors',
      label: lang === 'bn' ? 'রক্তদাতা' : 'Blood Donors',
    },
    {
      id: 'blood-requests',
      label: lang === 'bn' ? 'জরুরি রক্ত' : 'Blood Requests',
    },
    {
      id: 'beneficiaries',
      label: lang === 'bn' ? 'উপকারভোগী' : 'Beneficiaries',
    },
    {
      id: 'gallery',
      label: lang === 'bn' ? 'গ্যালারি' : 'Gallery',
    },
    {
      id: 'blog',
      label: lang === 'bn' ? 'ব্লগ' : 'Blog',
    },
    {
      id: 'about',
      label: lang === 'bn' ? 'আমাদের কথা' : 'About',
    },
    {
      id: 'contact',
      label: lang === 'bn' ? 'যোগাযোগ' : 'Contact',
    },
  ];

  const handleNavClick = (pageId: string) => {
    setCurrentPage(pageId);
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full max-w-full overflow-x-hidden bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.06)]">

      {/* =====================================================
          EMERGENCY TOP BAR
      ====================================================== */}
      <div className="w-full bg-gradient-to-r from-[#8B1230] via-[#A3153D] to-[#86112F] text-white">
  <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-6 xl:px-8">
    <div className="min-h-[36px] flex items-center justify-between gap-2">

      {/* Hotline */}
      <div className="flex items-center gap-2 text-[11px] sm:text-xs">

        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-50 animate-ping" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
        </span>

        <span className="hidden sm:inline font-semibold">
          24/7 Bangladesh Emergency Blood Hotline:
        </span>

        <a
          href="tel:"
          className="font-extrabold flex items-center gap-1 text-white hover:text-rose-100 transition whitespace-nowrap"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          
        </a>

      </div>

      {/* Right */}
      <div className="flex items-center gap-2">

        <button
          onClick={() => openBloodRequestModal()}
          className="
            hidden sm:flex
            items-center gap-1.5
            text-[10px] sm:text-[11px]
            font-bold
            text-white
            bg-white/10
            hover:bg-white/20
            border border-white/25
            px-3
            py-1
            rounded-full
            transition-all
          "
        >
          <Droplet className="w-3 h-3" />
          Request Blood Immediately
        </button>

        <button
          onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
          className="
            flex items-center gap-1
            text-[10px] sm:text-[11px]
            font-bold
            text-white
            bg-white/10
            hover:bg-white/20
            border border-white/25
            px-2.5
            py-1
            rounded-full
            transition-all
          "
        >
          <Globe className="w-3 h-3" />

          {lang === 'en' ? 'বাংলা' : 'English'}
        </button>

      </div>

    </div>
  </div>
</div>

      {/* =====================================================
          MAIN NAVBAR
      ====================================================== */}
      <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-6 xl:px-8">
        <div className="h-[72px] lg:h-[78px] flex items-center justify-between gap-2">

          {/* =================================================
              BRAND
          ================================================== */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none group shrink-0"
          >

            {/* Logo */}
            <div className="relative shrink-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-[15px] bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/25 group-hover:scale-105 group-hover:rotate-1 transition-all duration-300">
                <Heart
                  className="w-5 h-5 sm:w-6 sm:h-6 fill-white"
                  strokeWidth={2}
                />
              </div>

              <span className="absolute -right-1 -bottom-1 w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center shadow-sm">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
              </span>
            </div>

            {/* Brand */}
            <div className="text-left">
              <div className="text-[16px] sm:text-[18px] lg:text-[19px] font-extrabold tracking-[-0.4px] text-slate-900 leading-[1.05] whitespace-nowrap">
                Shohayota Foundation
              </div>

              <div
                className="text-[10px] sm:text-[11px] lg:text-[12px] font-medium text-slate-600 mt-1 leading-tight whitespace-nowrap"
                style={{
                  fontFamily:
                    "'Noto Sans Bengali', 'Hind Siliguri', sans-serif",
                }}
              >
                মানুষের পাশে, মানবতার পথে
              </div>
            </div>
          </button>

          {/* =================================================
    DESKTOP NAVIGATION
    XL = 1280px+
================================================== */}
<nav className="hidden xl:flex items-center justify-center flex-1 min-w-0 mx-1">

  <div className="flex items-center gap-0.5">

    {navLinks.map((link) => {
      const isActive = currentPage === link.id;

      return (
        <button
          key={link.id}
          onClick={() => handleNavClick(link.id)}
          className={`
            relative
            px-2.5
            py-2.5
            rounded-xl
            text-[12px]
            font-bold
            whitespace-nowrap
            transition-all
            duration-200
            ${
              isActive
                ? 'text-teal-700 bg-teal-50'
                : 'text-slate-600 hover:text-teal-700 hover:bg-slate-50'
            }
          `}
        >
          {link.label}

          {isActive && (
            <motion.span
              layoutId="navbar-active"
              className="
                absolute
                left-1/2
                -translate-x-1/2
                -bottom-0.5
                w-6
                h-0.5
                rounded-full
                bg-gradient-to-r
                from-cyan-500
                to-emerald-500
              "
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 30,
              }}
            />
          )}
        </button>
      );
    })}

  </div>

</nav>

          {/* =================================================
              RIGHT ACTIONS
          ================================================== */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">

            {/* =================================================
                NOTIFICATION
            ================================================== */}
            <div className="relative">

              <button
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);

                  if (!isNotifOpen && unreadNotifsCount > 0) {
                    markNotificationsAsRead();
                  }
                }}
                className="
                  relative
                  w-9 h-9
                  flex items-center justify-center
                  rounded-xl
                  text-slate-600
                  hover:text-teal-700
                  hover:bg-teal-50
                  transition-all
                "
                aria-label="Notifications"
              >
                <Bell className="w-[18px] h-[18px]" />

                {unreadNotifsCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] px-1 bg-rose-500 text-white text-[8px] font-extrabold rounded-full flex items-center justify-center border-2 border-white">
                    {unreadNotifsCount > 9
                      ? '9+'
                      : unreadNotifsCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: 10,
                      scale: 0.96,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                    }}
                    exit={{
                      opacity: 0,
                      y: 10,
                      scale: 0.96,
                    }}
                    transition={{ duration: 0.18 }}
                    className="
                      absolute
                      right-0
                      mt-3
                      w-[300px]
                      sm:w-[370px]
                      max-w-[calc(100vw-24px)]
                      bg-white
                      rounded-2xl
                      shadow-[0_20px_50px_rgba(15,23,42,0.15)]
                      border border-slate-200
                      overflow-hidden
                      z-50
                    "
                  >

                    <div className="px-4 py-3.5 flex items-center justify-between border-b border-slate-100 bg-slate-50/70">

                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900">
                          Notifications
                        </h3>

                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Stay updated with HopeCare
                        </p>
                      </div>

                      <button
                        onClick={markNotificationsAsRead}
                        className="text-[10px] font-bold text-teal-600 hover:text-teal-700 hover:underline"
                      >
                        Mark all read
                      </button>

                    </div>

                    <div className="max-h-80 overflow-y-auto">

                      {notifications.length === 0 ? (
                        <div className="py-10 text-center">

                          <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-2">
                            <Bell className="w-5 h-5 text-slate-400" />
                          </div>

                          <p className="text-xs font-semibold text-slate-500">
                            No notifications yet
                          </p>

                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className="px-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition"
                          >

                            <p className="text-xs font-bold text-slate-900">
                              {n.title}
                            </p>

                            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                              {n.message}
                            </p>

                            <span className="text-[9px] font-medium text-slate-400 mt-1.5 block">
                              {new Date(
                                n.createdAt
                              ).toLocaleDateString()}
                            </span>

                          </div>
                        ))
                      )}

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* =================================================
                USER / SIGN IN
            ================================================== */}
            {user ? (
              <div className="relative">

                <button
                  onClick={() =>
                    setIsUserMenuOpen(!isUserMenuOpen)
                  }
                  className="
                    flex items-center gap-1.5
                    h-9
                    pl-1.5 pr-2
                    rounded-xl
                    border border-slate-200
                    bg-white
                    hover:border-teal-200
                    hover:bg-teal-50/50
                    transition-all
                  "
                >

                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 text-white font-extrabold text-xs flex items-center justify-center overflow-hidden">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      user.fullName
                        .charAt(0)
                        .toUpperCase()
                    )}
                  </div>

                  <div className="hidden xl:block text-left">

                    <span className="font-bold text-slate-900 block text-[10px] leading-tight">
                      {user.fullName.split(' ')[0]}
                    </span>

                    <span className="text-[8px] text-slate-500 uppercase font-bold">
                      {user.role}
                    </span>

                  </div>

                  <ChevronDown className="w-3 h-3 text-slate-400" />

                </button>

                {/* User Dropdown */}
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: 10,
                        scale: 0.96,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                      }}
                      exit={{
                        opacity: 0,
                        y: 10,
                        scale: 0.96,
                      }}
                      transition={{ duration: 0.18 }}
                      className="
                        absolute
                        right-0
                        mt-3
                        w-60
                        max-w-[calc(100vw-24px)]
                        bg-white
                        rounded-2xl
                        shadow-[0_20px_50px_rgba(15,23,42,0.15)]
                        border border-slate-200
                        p-2
                        z-50
                      "
                    >

                      <div className="px-3 py-3 mb-1 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50">

                        <p className="font-extrabold text-sm text-slate-900">
                          {user.fullName}
                        </p>

                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                          {user.email}
                        </p>

                      </div>

                      {/* Dashboard */}
                      <button
                        onClick={() => {
                          handleNavClick('dashboard');
                          setIsUserMenuOpen(false);
                        }}
                        className="
                          w-full
                          flex items-center gap-3
                          px-3 py-2.5
                          text-slate-700
                          hover:bg-teal-50
                          hover:text-teal-700
                          rounded-xl
                          transition
                          text-left
                        "
                      >

                        <span className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                          <LayoutDashboard className="w-4 h-4 text-teal-600" />
                        </span>

                        <span className="text-xs font-bold">
                          User Dashboard
                        </span>

                      </button>

                      {/* Admin */}
                      {user.role === 'ADMIN' && (
                        <button
                          onClick={() => {
                            handleNavClick('admin');
                            setIsUserMenuOpen(false);
                          }}
                          className="
                            w-full
                            flex items-center gap-3
                            px-3 py-2.5
                            text-purple-700
                            hover:bg-purple-50
                            rounded-xl
                            transition
                            text-left
                          "
                        >

                          <span className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                            <ShieldAlert className="w-4 h-4 text-purple-600" />
                          </span>

                          <span className="text-xs font-bold">
                            Admin Dashboard
                          </span>

                        </button>
                      )}

                      {/* Logout */}
                      <div className="border-t border-slate-100 mt-1 pt-1">

                        <button
                          onClick={() => {
                            logout();
                            setIsUserMenuOpen(false);
                          }}
                          className="
                            w-full
                            flex items-center gap-3
                            px-3 py-2.5
                            text-rose-600
                            hover:bg-rose-50
                            rounded-xl
                            transition
                            text-left
                          "
                        >

                          <span className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                            <LogOut className="w-4 h-4" />
                          </span>

                          <span className="text-xs font-bold">
                            Sign Out
                          </span>

                        </button>

                      </div>

                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            ) : (

              /* =================================================
                 SIGN IN
              ================================================== */
              <button
                onClick={() => openAuthModal('login')}
                className="
                  hidden sm:flex
                  items-center gap-1.5
                  h-9
                  px-2.5
                  lg:px-3
                  text-[10px]
                  lg:text-xs
                  font-extrabold
                  text-slate-700
                  bg-white
                  border border-slate-200
                  rounded-xl
                  hover:border-teal-200
                  hover:text-teal-700
                  hover:bg-teal-50
                  transition-all
                  whitespace-nowrap
                "
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>{t.signIn}</span>
              </button>
            )}

            {/* =================================================
                DONATE BUTTON
            ================================================== */}
            <button
              onClick={() => openDonateModal()}
              className="
                h-9
                px-2.5
                sm:px-3.5
                lg:px-4
                text-[10px]
                sm:text-[11px]
                lg:text-xs
                font-extrabold
                text-white
                bg-gradient-to-r
                from-cyan-600
                via-teal-600
                to-emerald-600
                hover:from-cyan-700
                hover:via-teal-700
                hover:to-emerald-700
                rounded-xl
                shadow-lg
                shadow-teal-600/20
                hover:shadow-teal-600/30
                hover:-translate-y-0.5
                transition-all
                flex items-center
                justify-center
                gap-1.5
                whitespace-nowrap
              "
            >

              <Sparkles className="w-3 h-3 hidden lg:block" />

              <Heart className="w-3.5 h-3.5 fill-white" />

              <span>
                {t.donateNow}
              </span>

            </button>

            {/* =================================================
                MOBILE / TABLET MENU
            ================================================== */}
            <button
              onClick={() =>
                setIsMobileMenuOpen(!isMobileMenuOpen)
              }
              className="
                xl:hidden
                w-9 h-9
                flex items-center justify-center
                rounded-xl
                text-slate-600
                hover:text-teal-700
                hover:bg-teal-50
                transition
              "
              aria-label="Toggle Navigation"
            >

              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}

            </button>

          </div>
        </div>
      </div>

      {/* =====================================================
          MOBILE / TABLET DRAWER
      ====================================================== */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{
              opacity: 0,
              height: 0,
            }}
            animate={{
              opacity: 1,
              height: 'auto',
            }}
            exit={{
              opacity: 0,
              height: 0,
            }}
            transition={{ duration: 0.25 }}
            className="
              xl:hidden
              border-t
              border-slate-200
              bg-white
              shadow-xl
              overflow-hidden
            "
          >

            <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-4">

              {/* Mobile Brand */}
              <div className="flex items-center gap-3 p-3 mb-3 rounded-2xl bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-100">

                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5 text-white fill-white" />
                </div>

                <div className="min-w-0">

                  <p className="text-sm font-extrabold text-slate-900">
                    Shohayota Foundation
                  </p>

                  <p
                    className="text-[11px] text-slate-600 mt-0.5"
                    style={{
                      fontFamily:
                        "'Noto Sans Bengali', 'Hind Siliguri', sans-serif",
                    }}
                  >
                    মানুষের পাশে, মানবতার পথে
                  </p>

                </div>
              </div>

              {/* Navigation */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 pb-4 border-b border-slate-100">

                {navLinks.map((link) => {

                  const isActive =
                    currentPage === link.id;

                  return (
                    <button
                      key={link.id}
                      onClick={() =>
                        handleNavClick(link.id)
                      }
                      className={`
                        px-3
                        py-2.5
                        rounded-xl
                        text-left
                        text-xs
                        font-bold
                        transition-all
                        ${
                          isActive
                            ? 'bg-teal-50 text-teal-700 border border-teal-100'
                            : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                        }
                      `}
                    >
                      {link.label}
                    </button>
                  );
                })}

              </div>

              {/* Mobile Actions */}
              <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">

                {!user ? (
                  <button
                    onClick={() => {
                      openAuthModal('login');
                      setIsMobileMenuOpen(false);
                    }}
                    className="
                      py-3
                      text-xs
                      font-extrabold
                      text-slate-700
                      bg-white
                      border border-slate-200
                      rounded-xl
                      hover:bg-slate-50
                      transition
                    "
                  >
                    Sign In / Register
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleNavClick(
                        user.role === 'ADMIN'
                          ? 'admin'
                          : 'dashboard'
                      );

                      setIsMobileMenuOpen(false);
                    }}
                    className="
                      py-3
                      text-xs
                      font-extrabold
                      text-white
                      bg-gradient-to-r
                      from-cyan-600
                      to-teal-600
                      rounded-xl
                      shadow-sm
                    "
                  >
                    Go to Dashboard
                  </button>
                )}

                <button
                  onClick={() => {
                    openBloodRequestModal();
                    setIsMobileMenuOpen(false);
                  }}
                  className="
                    py-3
                    text-xs
                    font-extrabold
                    text-white
                    bg-gradient-to-r
                    from-rose-500
                    to-red-600
                    rounded-xl
                    shadow-sm
                    flex items-center
                    justify-center
                    gap-1.5
                  "
                >
                  <Droplet className="w-4 h-4" />
                  Request Blood
                </button>

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};