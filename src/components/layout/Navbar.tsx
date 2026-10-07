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
    setIsNotifOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full overflow-x-hidden bg-white border-b border-slate-200 shadow-[0_4px_20px_rgba(15,23,42,0.06)]">

      {/* =====================================================
          EMERGENCY BAR
      ====================================================== */}

      <div className="w-full bg-gradient-to-r from-[#8f1239] via-[#a91446] to-[#8f1239] text-white">

        <div className="w-full max-w-[1500px] mx-auto px-3 sm:px-5 lg:px-7">

          <div className="min-h-[38px] flex items-center justify-between gap-3">

            {/* Hotline */}

            <div className="flex items-center gap-2 min-w-0">

              <span className="relative flex w-2.5 h-2.5 shrink-0">
                <span className="absolute inset-0 rounded-full bg-white opacity-50 animate-ping" />
                <span className="relative w-2.5 h-2.5 rounded-full bg-white" />
              </span>

              <span className="hidden sm:block text-[11px] sm:text-xs font-semibold whitespace-nowrap">
                24/7 Bangladesh Emergency Blood Hotline:
              </span>

              <a
                href="tel:+8801800467322"
                className="flex items-center gap-1 text-[11px] sm:text-xs font-extrabold text-white hover:text-rose-100 transition whitespace-nowrap"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>+880 1800-467322</span>
              </a>

            </div>

            {/* Top Right */}

            <div className="flex items-center gap-2 shrink-0">

              <button
                onClick={() => openBloodRequestModal()}
                className="
                  hidden sm:flex
                  items-center
                  gap-1.5
                  px-3
                  py-1
                  rounded-full
                  border border-white/25
                  bg-white/10
                  hover:bg-white/20
                  text-[10px]
                  sm:text-[11px]
                  font-bold
                  text-white
                  transition-all
                  whitespace-nowrap
                "
              >
                <Droplet className="w-3 h-3" />
                Request Blood Immediately
              </button>

              <button
                onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
                className="
                  flex
                  items-center
                  gap-1.5
                  px-2.5
                  py-1
                  rounded-full
                  border border-white/25
                  bg-white/10
                  hover:bg-white/20
                  text-[10px]
                  sm:text-[11px]
                  font-bold
                  text-white
                  transition-all
                  whitespace-nowrap
                "
              >
                <Globe className="w-3 h-3" />

                <span>
                  {lang === 'en' ? 'বাংলা' : 'English'}
                </span>
              </button>

            </div>

          </div>

        </div>

      </div>


      {/* =====================================================
          MAIN NAVBAR
      ====================================================== */}

      <div className="w-full">

        <div
          className="
            w-full
            max-w-[1500px]
            mx-auto
            px-3
            sm:px-5
            lg:px-7
            xl:px-8
          "
        >

          {/* IMPORTANT:
              3-part layout
              BRAND | NAVIGATION | ACTIONS
          */}

          <div
            className="
              min-h-[76px]
              lg:min-h-[82px]
              grid
              grid-cols-[auto_minmax(0,1fr)_auto]
              items-center
              gap-3
              lg:gap-4
            "
          >

            {/* =================================================
                BRAND
            ================================================== */}

            <button
              onClick={() => handleNavClick('home')}
              className="
                flex
                items-center
                gap-2.5
                shrink-0
                text-left
                cursor-pointer
                select-none
                group
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
                    text-white
                    shadow-lg
                    shadow-teal-500/25
                    group-hover:scale-105
                    transition-all
                    duration-300
                  "
                >

                  <Heart
                    className="w-6 h-6 fill-white"
                    strokeWidth={2}
                  />

                </div>

                {/* Online Dot */}

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
                    shadow-sm
                  "
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                </span>

              </div>


              {/* Brand Text */}

              <div className="min-w-0">

                <div
                  className="
                    text-[17px]
                    sm:text-[19px]
                    lg:text-[20px]
                    font-extrabold
                    tracking-[-0.5px]
                    text-slate-900
                    leading-[1.05]
                    whitespace-nowrap
                  "
                >
                  Shohayota Foundation
                </div>

                <div
                  className="
                    text-[10px]
                    sm:text-[11px]
                    lg:text-[12px]
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
            ================================================== */}

            <nav
              className="
                hidden
                lg:flex
                min-w-0
                items-center
                justify-center
                overflow-hidden
              "
            >

              <div
                className="
                  flex
                  items-center
                  justify-center
                  min-w-0
                  w-full
                  gap-0
                "
              >

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
                        relative
                        shrink
                        whitespace-nowrap
                        px-[7px]
                        xl:px-[9px]
                        2xl:px-[11px]
                        py-3
                        rounded-xl
                        text-[11px]
                        xl:text-[12px]
                        2xl:text-[13px]
                        font-bold
                        transition-all
                        duration-200
                        ${
                          isActive
                            ? `
                              text-teal-700
                              bg-teal-50
                            `
                            : `
                              text-slate-600
                              hover:text-teal-700
                              hover:bg-slate-50
                            `
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
                            bottom-0
                            w-6
                            h-[3px]
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

            <div
              className="
                flex
                items-center
                justify-end
                gap-1.5
                lg:gap-2
                shrink-0
              "
            >

              {/* Notification */}

              <div className="relative">

                <button
                  onClick={() => {

                    setIsNotifOpen(!isNotifOpen);

                    if (
                      !isNotifOpen &&
                      unreadNotifsCount > 0
                    ) {
                      markNotificationsAsRead();
                    }

                  }}
                  className="
                    w-9
                    h-9
                    flex
                    items-center
                    justify-center
                    rounded-xl
                    text-slate-600
                    hover:text-teal-700
                    hover:bg-teal-50
                    transition-all
                    relative
                  "
                  aria-label="Notifications"
                >

                  <Bell className="w-[18px] h-[18px]" />

                  {unreadNotifsCount > 0 && (

                    <span
                      className="
                        absolute
                        top-0
                        right-0
                        min-w-[16px]
                        h-[16px]
                        px-1
                        bg-rose-500
                        text-white
                        text-[8px]
                        font-extrabold
                        rounded-full
                        flex
                        items-center
                        justify-center
                        border-2
                        border-white
                      "
                    >
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
                      transition={{
                        duration: 0.18,
                      }}
                      className="
                        absolute
                        right-0
                        top-full
                        mt-3
                        w-[310px]
                        sm:w-[370px]
                        max-w-[calc(100vw-24px)]
                        bg-white
                        rounded-2xl
                        shadow-[0_20px_50px_rgba(15,23,42,0.15)]
                        border
                        border-slate-200
                        overflow-hidden
                        z-[100]
                      "
                    >

                      <div
                        className="
                          px-4
                          py-3.5
                          flex
                          items-center
                          justify-between
                          border-b
                          border-slate-100
                          bg-slate-50/70
                        "
                      >

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
                          className="
                            text-[10px]
                            font-bold
                            text-teal-600
                            hover:text-teal-700
                            hover:underline
                          "
                        >
                          Mark all read
                        </button>

                      </div>


                      <div className="max-h-80 overflow-y-auto">

                        {notifications.length === 0 ? (

                          <div className="py-10 text-center">

                            <div
                              className="
                                w-10
                                h-10
                                mx-auto
                                rounded-full
                                bg-slate-100
                                flex
                                items-center
                                justify-center
                                mb-2
                              "
                            >
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
                              className="
                                px-4
                                py-3
                                border-b
                                border-slate-100
                                last:border-0
                                hover:bg-slate-50
                                transition
                              "
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
                      setIsUserMenuOpen(
                        !isUserMenuOpen
                      )
                    }
                    className="
                      flex
                      items-center
                      gap-1.5
                      h-10
                      px-2
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      hover:border-teal-200
                      hover:bg-teal-50/50
                      transition-all
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
                        font-extrabold
                        text-xs
                        flex
                        items-center
                        justify-center
                        overflow-hidden
                      "
                    >

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
                        transition={{
                          duration: 0.18,
                        }}
                        className="
                          absolute
                          right-0
                          top-full
                          mt-3
                          w-60
                          max-w-[calc(100vw-24px)]
                          bg-white
                          rounded-2xl
                          shadow-[0_20px_50px_rgba(15,23,42,0.15)]
                          border
                          border-slate-200
                          p-2
                          z-[100]
                        "
                      >

                        <div
                          className="
                            px-3
                            py-3
                            mb-1
                            rounded-xl
                            bg-gradient-to-r
                            from-teal-50
                            to-cyan-50
                          "
                        >

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
                            flex
                            items-center
                            gap-3
                            px-3
                            py-2.5
                            text-slate-700
                            hover:bg-teal-50
                            hover:text-teal-700
                            rounded-xl
                            transition
                            text-left
                          "
                        >

                          <span
                            className="
                              w-8
                              h-8
                              rounded-lg
                              bg-teal-50
                              flex
                              items-center
                              justify-center
                            "
                          >
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
                              flex
                              items-center
                              gap-3
                              px-3
                              py-2.5
                              text-purple-700
                              hover:bg-purple-50
                              rounded-xl
                              transition
                              text-left
                            "
                          >

                            <span
                              className="
                                w-8
                                h-8
                                rounded-lg
                                bg-purple-50
                                flex
                                items-center
                                justify-center
                              "
                            >
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
                              flex
                              items-center
                              gap-3
                              px-3
                              py-2.5
                              text-rose-600
                              hover:bg-rose-50
                              rounded-xl
                              transition
                              text-left
                            "
                          >

                            <span
                              className="
                                w-8
                                h-8
                                rounded-lg
                                bg-rose-50
                                flex
                                items-center
                                justify-center
                              "
                            >
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
                  onClick={() =>
                    openAuthModal('login')
                  }
                  className="
                    hidden
                    sm:flex
                    items-center
                    gap-1.5
                    h-10
                    px-3
                    lg:px-3.5
                    text-[11px]
                    lg:text-xs
                    font-extrabold
                    text-slate-700
                    bg-white
                    border
                    border-slate-200
                    rounded-xl
                    hover:border-teal-200
                    hover:text-teal-700
                    hover:bg-teal-50
                    transition-all
                    whitespace-nowrap
                  "
                >

                  <UserIcon className="w-3.5 h-3.5" />

                  <span>
                    {t.signIn}
                  </span>

                </button>

              )}


              {/* =================================================
                  DONATE
              ================================================== */}

              <button
                onClick={() => openDonateModal()}
                className="
                  h-10
                  px-3
                  sm:px-3.5
                  lg:px-4
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
                  rounded-xl
                  shadow-lg
                  shadow-teal-600/20
                  hover:-translate-y-0.5
                  transition-all
                  flex
                  items-center
                  justify-center
                  gap-1.5
                  whitespace-nowrap
                "
              >

                <Sparkles className="hidden xl:block w-3.5 h-3.5" />

                <Heart className="w-4 h-4 fill-white" />

                <span>
                  {t.donateNow}
                </span>

              </button>


              {/* =================================================
                  MOBILE MENU BUTTON
              ================================================== */}

              <button
                onClick={() =>
                  setIsMobileMenuOpen(
                    !isMobileMenuOpen
                  )
                }
                className="
                  lg:hidden
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
            transition={{
              duration: 0.25,
            }}
            className="
              lg:hidden
              border-t
              border-slate-200
              bg-white
              shadow-[0_12px_30px_rgba(15,23,42,0.08)]
              overflow-hidden
            "
          >

            <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-6 py-4">

              {/* Mobile Brand */}

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
                  <Heart
                    className="w-6 h-6 text-white fill-white"
                  />
                </div>

                <div className="min-w-0">

                  <p className="text-base font-extrabold text-slate-900">
                    Shohayota Foundation
                  </p>

                  <p
                    className="text-xs text-slate-600 mt-0.5"
                    style={{
                      fontFamily:
                        "'Noto Sans Bengali', 'Hind Siliguri', sans-serif",
                    }}
                  >
                    মানুষের পাশে, মানবতার পথে
                  </p>

                </div>

              </div>


              {/* Mobile Navigation */}

              <div
                className="
                  grid
                  grid-cols-2
                  sm:grid-cols-3
                  gap-2
                  pb-4
                  border-b
                  border-slate-100
                "
              >

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
                        min-h-[44px]
                        px-3
                        py-2.5
                        rounded-xl
                        text-left
                        text-sm
                        font-bold
                        transition-all
                        ${
                          isActive
                            ? 'bg-teal-50 text-teal-700 border border-teal-200'
                            : 'text-slate-600 bg-slate-50/60 border border-transparent hover:bg-slate-100'
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
                      min-h-[46px]
                      text-sm
                      font-extrabold
                      text-slate-700
                      bg-white
                      border
                      border-slate-200
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
                      min-h-[46px]
                      text-sm
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
                    min-h-[46px]
                    text-sm
                    font-extrabold
                    text-white
                    bg-gradient-to-r
                    from-rose-500
                    to-red-600
                    rounded-xl
                    shadow-sm
                    flex
                    items-center
                    justify-center
                    gap-2
                  "
                >

                  <Droplet className="w-5 h-5" />

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