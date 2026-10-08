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

  // Admin check
  const isAdmin = String(user?.role ?? '')
    .trim()
    .toUpperCase()
    .includes('ADMIN');

  const navLinks = [
    { id: 'home', label: lang === 'bn' ? 'হোম' : 'Home' },
    { id: 'campaigns', label: lang === 'bn' ? 'ক্যাম্পেইন' : 'Causes' },
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
    { id: 'gallery', label: lang === 'bn' ? 'গ্যালারি' : 'Gallery' },
    { id: 'blog', label: lang === 'bn' ? 'ব্লগ' : 'Blog' },
    { id: 'about', label: lang === 'bn' ? 'আমাদের কথা' : 'About' },
    { id: 'contact', label: lang === 'bn' ? 'যোগাযোগ' : 'Contact' },
  ];

  const handleNavClick = (pageId: string) => {
    setCurrentPage(pageId);
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  return (
    <header
      className="
        sticky
        top-0
        z-[100]
        w-full
        max-w-full
        min-w-0
        bg-white
        border-b
        border-slate-200
        shadow-[0_4px_20px_rgba(15,23,42,0.07)]
      "
    >
      {/* =====================================================
          EMERGENCY TOP BAR
      ====================================================== */}

      <div
        className="
          w-full
          max-w-full
          overflow-hidden
          bg-[#991B45]
          bg-gradient-to-r
          from-[#991B45]
          via-[#B0184B]
          to-[#8F123C]
          text-white
        "
      >
        <div
          className="
            w-full
            max-w-[1440px]
            mx-auto
            px-3
            sm:px-5
            lg:px-8
            min-w-0
          "
        >
          <div
            className="
              min-h-[38px]
              flex
              items-center
              justify-between
              gap-2
              sm:gap-3
              min-w-0
            "
          >
            {/* LEFT */}
            <div className="flex items-center min-w-0 gap-2 overflow-hidden">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-60 animate-ping" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
              </span>

              <span className="hidden sm:inline text-[11px] sm:text-xs font-semibold whitespace-nowrap">
                24/7 Bangladesh Emergency Blood Hotline:
              </span>

              <a
                href="tel:+8801934201151"
                className="
                  flex
                  items-center
                  gap-1
                  text-[12px]
                  sm:text-xs
                  font-extrabold
                  text-white
                  whitespace-nowrap
                  hover:text-rose-100
                  transition
                  shrink-0
                "
              >
                <PhoneCall className="w-3.5 h-3.5 shrink-0" />
                <span>+8801934201151</span>
              </a>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Request Blood */}
              <button
                onClick={() => openBloodRequestModal()}
                className="
                  hidden
                  md:flex
                  items-center
                  gap-1.5
                  px-3
                  py-1.5
                  rounded-full
                  text-[11px]
                  font-bold
                  text-white
                  bg-white/10
                  border
                  border-white/25
                  hover:bg-white/20
                  transition
                  whitespace-nowrap
                  shrink-0
                "
              >
                <Droplet className="w-3.5 h-3.5 shrink-0" />
                Request Blood Immediately
              </button>

              {/* Language */}
              <button
                onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
                className="
                  flex
                  items-center
                  gap-1.5
                  px-2.5
                  sm:px-3
                  py-1.5
                  rounded-full
                  text-[11px]
                  sm:text-xs
                  font-bold
                  text-white
                  bg-white/10
                  border
                  border-white/25
                  hover:bg-white/20
                  transition
                  whitespace-nowrap
                  shrink-0
                "
              >
                <Globe className="w-3.5 h-3.5 shrink-0" />

                <span>{lang === 'en' ? 'বাংলা' : 'English'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          MAIN NAVBAR
      ====================================================== */}

      <div className="w-full max-w-full min-w-0 overflow-visible">
        <div
          className="
            w-full
            max-w-[1440px]
            mx-auto
            px-3
            sm:px-5
            lg:px-8
            min-w-0
          "
        >
          <div
            className="
              min-h-[78px]
              lg:min-h-[82px]
              flex
              items-center
              gap-2
              sm:gap-3
              2xl:gap-4
              min-w-0
            "
          >
            {/* =================================================
                LOGO + BRAND
            ================================================== */}

            <button
              onClick={() => handleNavClick('home')}
              className="
                flex
                items-center
                gap-2.5
                shrink-0
                cursor-pointer
                text-left
                group
                min-w-0
              "
            >
              {/* Logo */}
              <div className="relative shrink-0">
                <div
                  className="
                    w-11
                    h-11
                    sm:w-12
                    sm:h-12
                    rounded-[16px]
                    bg-gradient-to-br
                    from-cyan-500
                    via-teal-500
                    to-emerald-500
                    flex
                    items-center
                    justify-center
                    shadow-lg
                    shadow-teal-500/25
                    group-hover:scale-105
                    transition-transform
                  "
                >
                  <Heart
                    className="w-6 h-6 sm:w-7 sm:h-7 text-white fill-white"
                    strokeWidth={2}
                  />
                </div>

                <span
                  className="
                    absolute
                    -right-1
                    -bottom-1
                    w-4
                    h-4
                    rounded-full
                    bg-white
                    flex
                    items-center
                    justify-center
                    shadow
                  "
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                </span>
              </div>

              {/* Brand Text
                  Hidden on very small screens to prevent overflow */}
              <div className="hidden sm:block min-w-0">
                <div
                  className="
                    text-[16px]
                    sm:text-[18px]
                    2xl:text-[21px]
                    font-extrabold
                    tracking-tight
                    text-slate-900
                    leading-tight
                    whitespace-nowrap
                  "
                >
                  Shohayota Foundation
                </div>

                <div
                  className="
                    text-[10px]
                    sm:text-[11px]
                    2xl:text-[12px]
                    font-medium
                    text-slate-600
                    mt-1
                    leading-tight
                    whitespace-nowrap
                  "
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
                1536px+ only
            ================================================== */}

            <nav
              className="
                hidden
                2xl:flex
                flex-1
                items-center
                justify-center
                min-w-0
                overflow-hidden
              "
            >
              <div className="flex items-center gap-0 2xl:gap-1 min-w-0">
                {navLinks.map((link) => {
                  const isActive = currentPage === link.id;

                  return (
                    <button
                      key={link.id}
                      onClick={() => handleNavClick(link.id)}
                      className={`
                        relative
                        px-2
                        2xl:px-3
                        py-2.5
                        rounded-xl
                        text-[12px]
                        2xl:text-[13px]
                        font-bold
                        whitespace-nowrap
                        transition-all
                        duration-200
                        focus:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-teal-400
                        shrink-0
                        ${
                          isActive
                            ? 'bg-teal-50 text-teal-700'
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
                            bottom-0.5
                            w-7
                            h-[3px]
                            rounded-full
                            bg-gradient-to-r
                            from-cyan-500
                            to-emerald-500
                          "
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* =================================================
                RIGHT SIDE
            ================================================== */}

            <div
              className="
                flex
                items-center
                gap-1
                sm:gap-1.5
                lg:gap-2
                shrink-0
                ml-auto
                min-w-0
              "
            >
              {/* Notification */}
              <div className="relative shrink-0">
                <button
                  onClick={() => {
                    setIsNotifOpen(!isNotifOpen);

                    if (!isNotifOpen && unreadNotifsCount > 0) {
                      markNotificationsAsRead();
                    }
                  }}
                  className="
                    relative
                    w-10
                    h-10
                    flex
                    items-center
                    justify-center
                    rounded-xl
                    text-slate-600
                    hover:text-teal-700
                    hover:bg-teal-50
                    transition
                    shrink-0
                  "
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />

                  {unreadNotifsCount > 0 && (
                    <span
                      className="
                        absolute
                        top-0
                        right-0
                        min-w-[17px]
                        h-[17px]
                        px-1
                        bg-rose-500
                        text-white
                        text-[9px]
                        font-extrabold
                        rounded-full
                        flex
                        items-center
                        justify-center
                        border-2
                        border-white
                      "
                    >
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
                      className="
                        absolute
                        right-0
                        top-full
                        mt-2
                        w-[310px]
                        sm:w-[370px]
                        max-w-[calc(100vw-20px)]
                        bg-white
                        rounded-2xl
                        border
                        border-slate-200
                        shadow-[0_20px_50px_rgba(15,23,42,0.18)]
                        overflow-hidden
                        z-[200]
                      "
                    >
                      <div
                        className="
                          px-4
                          py-3
                          flex
                          items-center
                          justify-between
                          gap-3
                          border-b
                          border-slate-100
                          bg-slate-50
                          min-w-0
                        "
                      >
                        <div className="min-w-0">
                          <h3 className="text-sm font-extrabold text-slate-900">
                            Notifications
                          </h3>

                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Stay updated with HopeCare
                          </p>
                        </div>

                        <button
                          onClick={markNotificationsAsRead}
                          className="
                            text-[10px]
                            font-bold
                            text-teal-600
                            hover:underline
                            whitespace-nowrap
                            shrink-0
                          "
                        >
                          Mark all read
                        </button>
                      </div>

                      <div className="max-h-[320px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="py-10 text-center">
                            <Bell className="w-6 h-6 mx-auto text-slate-300 mb-2" />

                            <p className="text-xs font-semibold text-slate-500">
                              No notifications yet
                            </p>
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className="
                                px-4
                                py-3
                                border-b
                                border-slate-100
                                hover:bg-slate-50
                                min-w-0
                              "
                            >
                              <p className="text-xs font-bold text-slate-900 break-words">
                                {n.title}
                              </p>

                              <p className="text-[11px] text-slate-600 mt-1 break-words">
                                {n.message}
                              </p>

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

              {/* =================================================
                  DIRECT ADMIN PANEL BUTTON
                  1536px+ only
              ================================================== */}

              {isAdmin && (
                <button
                  onClick={() => handleNavClick('admin')}
                  className="
                    hidden
                    2xl:flex
                    items-center
                    gap-1.5
                    h-10
                    px-3
                    rounded-xl
                    bg-gradient-to-r
                    from-purple-600
                    to-indigo-600
                    hover:from-purple-700
                    hover:to-indigo-700
                    text-white
                    text-xs
                    font-extrabold
                    shadow-md
                    shadow-purple-600/20
                    transition
                    cursor-pointer
                    shrink-0
                  "
                  title="Admin Dashboard"
                >
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Admin Panel</span>
                </button>
              )}

              {/* =================================================
                  USER
              ================================================== */}

              {user ? (
                <div className="relative shrink-0">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="
                      flex
                      items-center
                      gap-1.5
                      sm:gap-2
                      h-10
                      px-1.5
                      sm:px-2
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      hover:bg-teal-50
                      hover:border-teal-200
                      transition
                      shrink-0
                    "
                  >
                    <div
                      className="
                        w-7
                        h-7
                        rounded-lg
                        bg-gradient-to-br
                        from-cyan-500
                        to-teal-600
                        text-white
                        font-bold
                        text-xs
                        flex
                        items-center
                        justify-center
                        overflow-hidden
                        shrink-0
                      "
                    >
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user.fullName.charAt(0).toUpperCase()
                      )}
                    </div>

                    <div className="hidden 2xl:block text-left min-w-0">
                      <span className="text-[11px] font-bold text-slate-900 block truncate max-w-[90px]">
                        {user.fullName.split(' ')[0]}
                      </span>

                      <span className="text-[9px] text-slate-500 uppercase font-bold">
                        {user.role}
                      </span>
                    </div>

                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        className="
                          absolute
                          right-0
                          top-full
                          mt-2
                          w-60
                          max-w-[calc(100vw-24px)]
                          bg-white
                          rounded-2xl
                          border
                          border-slate-200
                          shadow-[0_20px_50px_rgba(15,23,42,0.18)]
                          p-2
                          z-[200]
                        "
                      >
                        <div className="p-3 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 mb-1 min-w-0">
                          <p className="text-sm font-extrabold text-slate-900 truncate">
                            {user.fullName}
                          </p>

                          <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                            {user.email}
                          </p>
                        </div>

                        <button
                          onClick={() => handleNavClick('dashboard')}
                          className="
                            w-full
                            flex
                            items-center
                            gap-3
                            px-3
                            py-2.5
                            rounded-xl
                            text-left
                            hover:bg-teal-50
                            transition
                          "
                        >
                          <span className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                            <LayoutDashboard className="w-4 h-4 text-teal-600" />
                          </span>

                          <span className="text-xs font-bold text-slate-700">
                            User Dashboard
                          </span>
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => handleNavClick('admin')}
                            className="
                              w-full
                              flex
                              items-center
                              gap-3
                              px-3
                              py-2.5
                              rounded-xl
                              text-left
                              hover:bg-purple-50
                              transition
                            "
                          >
                            <span className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                              <ShieldAlert className="w-4 h-4 text-purple-600" />
                            </span>

                            <span className="text-xs font-bold text-purple-700">
                              Admin Dashboard
                            </span>
                          </button>
                        )}

                        <div className="border-t border-slate-100 mt-1 pt-1">
                          <button
                            onClick={() => {
                              logout();
                              setIsUserMenuOpen(false);
                            }}
                            className="
                              w-full
                              flex
                              items-center
                              gap-3
                              px-3
                              py-2.5
                              rounded-xl
                              text-left
                              text-rose-600
                              hover:bg-rose-50
                              transition
                            "
                          >
                            <LogOut className="w-4 h-4 shrink-0" />

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
                /* SIGN IN */
                <button
                  onClick={() => handleNavClick('auth')}
                  className="
                    hidden
                    lg:flex
                    items-center
                    gap-1.5
                    h-10
                    px-3
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    text-slate-700
                    hover:text-teal-700
                    hover:bg-teal-50
                    text-xs
                    font-extrabold
                    transition
                    cursor-pointer
                    shrink-0
                  "
                >
                  <UserIcon className="w-4 h-4 shrink-0" />
                  <span>{t.signIn}</span>
                </button>
              )}

              {/* =================================================
                  DONATE
              ================================================== */}

              <button
                onClick={() => openDonateModal()}
                className="
                  h-10
                  px-2.5
                  sm:px-4
                  2xl:px-5
                  rounded-xl
                  text-[11px]
                  sm:text-xs
                  font-extrabold
                  text-white
                  bg-gradient-to-r
                  from-cyan-600
                  via-teal-600
                  to-emerald-600
                  hover:from-cyan-700
                  hover:via-teal-700
                  hover:to-emerald-700
                  shadow-lg
                  shadow-teal-600/20
                  flex
                  items-center
                  justify-center
                  gap-1.5
                  whitespace-nowrap
                  transition
                  shrink-0
                "
              >
                <Heart className="w-4 h-4 fill-white shrink-0" />

                <span className="hidden sm:inline">{t.donateNow}</span>

                <span className="sm:hidden">Donate</span>
              </button>

              {/* =================================================
                  HAMBURGER
                  below 1536px
              ================================================== */}

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="
                  2xl:hidden
                  w-10
                  h-10
                  shrink-0
                  flex
                  items-center
                  justify-center
                  rounded-xl
                  text-slate-700
                  bg-slate-50
                  border
                  border-slate-200
                  hover:bg-teal-50
                  hover:text-teal-700
                  hover:border-teal-200
                  transition
                "
                aria-label="Toggle Navigation"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          MOBILE / TABLET MENU
          below 1536px
      ====================================================== */}

      {isMobileMenuOpen && (
        <div
          className="
            2xl:hidden
            w-full
            max-w-full
            bg-white
            border-t
            border-slate-200
            shadow-[0_15px_35px_rgba(15,23,42,0.12)]
            relative
            z-[150]
            overflow-hidden
          "
        >
          <div
            className="
              w-full
              max-w-[1440px]
              mx-auto
              px-3
              sm:px-6
              py-4
              max-h-[calc(100vh-115px)]
              overflow-y-auto
              overflow-x-hidden
              min-w-0
            "
          >
            {/* Mobile Brand Header */}
            <div
              className="
                flex
                items-center
                gap-3
                p-3
                mb-4
                rounded-2xl
                bg-gradient-to-r
                from-teal-50
                to-cyan-50
                border
                border-teal-100
                min-w-0
              "
            >
              <div
                className="
                  w-11
                  h-11
                  rounded-xl
                  bg-gradient-to-br
                  from-cyan-500
                  to-emerald-500
                  flex
                  items-center
                  justify-center
                  shrink-0
                "
              >
                <Heart className="w-6 h-6 text-white fill-white" />
              </div>

              <div className="min-w-0">
                <p className="text-base font-extrabold text-slate-900 truncate">
                  Shohayota Foundation
                </p>

                <p
                  className="text-xs text-slate-600 mt-0.5 truncate"
                  style={{
                    fontFamily:
                      "'Noto Sans Bengali', 'Hind Siliguri', sans-serif",
                  }}
                >
                  মানুষের পাশে, মানবতার পথে
                </p>
              </div>
            </div>

            {/* MOBILE NAV LINKS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0">
              {navLinks.map((link) => {
                const isActive = currentPage === link.id;

                return (
                  <button
                    key={link.id}
                    onClick={() => handleNavClick(link.id)}
                    className={`
                      w-full
                      min-w-0
                      flex
                      items-center
                      justify-between
                      gap-3
                      px-4
                      py-3.5
                      rounded-xl
                      text-left
                      text-sm
                      font-bold
                      transition-all
                      border
                      ${
                        isActive
                          ? 'bg-teal-50 text-teal-700 border-teal-200'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-teal-200 hover:text-teal-700'
                      }
                    `}
                  >
                    <span className="truncate">{link.label}</span>

                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* MOBILE ACTIONS */}
            <div
              className="
                mt-4
                pt-4
                border-t
                border-slate-200
                grid
                grid-cols-1
                sm:grid-cols-2
                gap-2
                min-w-0
              "
            >
              {!user ? (
                <button
                  onClick={() => {
                    openAuthModal('login');
                    setIsMobileMenuOpen(false);
                  }}
                  className="
                    w-full
                    min-w-0
                    py-3.5
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    text-slate-700
                    text-sm
                    font-extrabold
                    hover:bg-slate-50
                    transition
                    flex
                    items-center
                    justify-center
                    gap-2
                  "
                >
                  <UserIcon className="w-4 h-4 shrink-0" />

                  Sign In / Register
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleNavClick('dashboard');
                    setIsMobileMenuOpen(false);
                  }}
                  className="
                    w-full
                    min-w-0
                    py-3.5
                    rounded-xl
                    bg-gradient-to-r
                    from-cyan-600
                    to-teal-600
                    text-white
                    text-sm
                    font-extrabold
                    shadow-sm
                  "
                >
                  Go to User Dashboard
                </button>
              )}

              {/* ADMIN */}
              {isAdmin && (
                <button
                  onClick={() => {
                    handleNavClick('admin');
                    setIsMobileMenuOpen(false);
                  }}
                  className="
                    w-full
                    min-w-0
                    py-3.5
                    rounded-xl
                    bg-gradient-to-r
                    from-purple-600
                    to-indigo-600
                    text-white
                    text-sm
                    font-extrabold
                    shadow-sm
                    flex
                    items-center
                    justify-center
                    gap-2
                  "
                >
                  <ShieldAlert className="w-5 h-5 shrink-0" />

                  Admin Dashboard
                </button>
              )}

              {/* Request Blood */}
              <button
                onClick={() => {
                  openBloodRequestModal();
                  setIsMobileMenuOpen(false);
                }}
                className="
                  w-full
                  min-w-0
                  py-3.5
                  rounded-xl
                  bg-gradient-to-r
                  from-rose-500
                  to-red-600
                  text-white
                  text-sm
                  font-extrabold
                  flex
                  items-center
                  justify-center
                  gap-2
                  shadow-sm
                "
              >
                <Droplet className="w-5 h-5 shrink-0" />

                Request Blood
              </button>
            </div>

            {/* Mobile Language */}
            <button
              onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
              className="
                w-full
                min-w-0
                mt-2
                py-3
                rounded-xl
                bg-slate-50
                border
                border-slate-200
                text-slate-700
                text-sm
                font-bold
                flex
                items-center
                justify-center
                gap-2
              "
            >
              <Globe className="w-4 h-4 shrink-0" />

              {lang === 'en' ? 'বাংলায় দেখুন' : 'View in English'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};