import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Campaign, AppNotification, Donation } from '../types';
import { TRANSLATIONS, Language } from '../data/translations';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AppContextType {
  user: User | null;
  isAdmin: boolean;
  token: string | null;
  lang: Language;
  t: typeof TRANSLATIONS['en'];
  setLang: (lang: Language) => void;
  login: (token: string, user: User) => void;
  logout: () => void;

  // Modals
  isDonateOpen: boolean;
  selectedCampaign: Campaign | null;
  openDonateModal: (campaign?: Campaign | null) => void;
  closeDonateModal: () => void;

  isBloodRequestOpen: boolean;
  openBloodRequestModal: () => void;
  closeBloodRequestModal: () => void;

  isVolunteerOpen: boolean;
  openVolunteerModal: () => void;
  closeVolunteerModal: () => void;

  isAuthOpen: boolean;
  authMode: 'login' | 'register' | 'forgot';
  openAuthModal: (mode?: 'login' | 'register' | 'forgot') => void;
  closeAuthModal: () => void;

  isAiChatOpen: boolean;
  setIsAiChatOpen: (open: boolean) => void;

  receiptData: Donation | null;
  openReceiptModal: (donation: Donation) => void;
  closeReceiptModal: () => void;

  // Notifications & Toasts
  notifications: AppNotification[];
  unreadNotifsCount: number;
  markNotificationsAsRead: () => void;
  refreshNotifications: () => void;

  toasts: ToastMessage[];
  addToast: (
    message: string,
    type?: 'success' | 'error' | 'info'
  ) => void;
  removeToast: (id: string) => void;

  // Navigation helper
  currentPage: string;
  setCurrentPage: (page: string) => void;
  pageParam?: string;
  setPageWithParam: (page: string, param?: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/* =========================================================
   USER ROLE NORMALIZER
   ========================================================= */

const normalizeUser = (rawUser: User | null): User | null => {
  if (!rawUser) return null;

  const rawRole = String(rawUser.role ?? '')
    .trim()
    .toUpperCase();

  /*
   * Accept all common admin role formats:
   * ADMIN
   * admin
   * Admin
   * ADMINISTRATOR
   * administrator
   */

  const normalizedRole = rawRole.includes('ADMIN')
    ? 'ADMIN'
    : rawRole;

  return {
    ...rawUser,
    role: normalizedRole as User['role'],
  };
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  /* =========================================================
     USER
  ========================================================= */

  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('hopecare_user');

      if (!saved) {
        return null;
      }

      const parsedUser = JSON.parse(saved) as User;

      const normalizedUser = normalizeUser(parsedUser);

      /*
       * Save normalized user back to localStorage
       * so old users are fixed automatically.
       */
      if (normalizedUser) {
        localStorage.setItem(
          'hopecare_user',
          JSON.stringify(normalizedUser)
        );
      }

      return normalizedUser;
    } catch {
      return null;
    }
  });

  /* =========================================================
     TOKEN
  ========================================================= */

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('hopecare_token') || null;
  });

  useEffect(() => {
  if (!token) return;

  fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (!data?.user) return;
      const fresh = normalizeUser(data.user);
      setUser(fresh);
      localStorage.setItem('hopecare_user', JSON.stringify(fresh));
    })
    .catch(() => {});
}, [token]);

  /* =========================================================
     LANGUAGE
  ========================================================= */

  const [lang, setLangState] = useState<Language>(() => {
    return (
      (localStorage.getItem('hopecare_lang') as Language) || 'en'
    );
  });

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const [currentPage, setCurrentPage] = useState<string>('home');
  const [pageParam, setPageParam] = useState<string | undefined>(
    undefined
  );

  /* =========================================================
     MODALS
  ========================================================= */

  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] =
    useState<Campaign | null>(null);

  const [isBloodRequestOpen, setIsBloodRequestOpen] =
    useState(false);

  const [isVolunteerOpen, setIsVolunteerOpen] =
    useState(false);

  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const [authMode, setAuthMode] = useState<
    'login' | 'register' | 'forgot'
  >('login');

  const [isAiChatOpen, setIsAiChatOpen] = useState(false);

  const [receiptData, setReceiptData] =
    useState<Donation | null>(null);

  /* =========================================================
     NOTIFICATIONS & TOASTS
  ========================================================= */

  const [notifications, setNotifications] =
    useState<AppNotification[]>([]);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  /* =========================================================
     TRANSLATIONS
  ========================================================= */

  const t = TRANSLATIONS[lang];

  /* =========================================================
     ADMIN STATUS
  ========================================================= */

  const isAdmin =
    String(user?.role ?? '')
      .trim()
      .toUpperCase()
      .includes('ADMIN');

  /* =========================================================
     LANGUAGE
  ========================================================= */

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('hopecare_lang', newLang);
  };

  /* =========================================================
     LOGIN
  ========================================================= */

  const login = (newToken: string, newUser: User) => {
    const normalizedUser = normalizeUser(newUser);

    setToken(newToken);
    setUser(normalizedUser);

    localStorage.setItem('hopecare_token', newToken);

    if (normalizedUser) {
      localStorage.setItem(
        'hopecare_user',
        JSON.stringify(normalizedUser)
      );
    }

    setCurrentPage('home');

    addToast(
      `Welcome back, ${normalizedUser?.fullName || newUser.fullName}!`,
      'success'
    );
  };

  /* =========================================================
     LOGOUT
  ========================================================= */

  const logout = () => {
    setToken(null);
    setUser(null);

    localStorage.removeItem('hopecare_token');
    localStorage.removeItem('hopecare_user');

    addToast('Signed out successfully', 'info');

    if (
      currentPage === 'dashboard' ||
      currentPage === 'admin'
    ) {
      setCurrentPage('home');
    }
  };

  /* =========================================================
     DONATION MODAL
  ========================================================= */

  const openDonateModal = (
    campaign?: Campaign | null
  ) => {
    setSelectedCampaign(campaign || null);
    setIsDonateOpen(true);
  };

  const closeDonateModal = () => {
    setIsDonateOpen(false);
  };

  /* =========================================================
     BLOOD REQUEST MODAL
  ========================================================= */

  const openBloodRequestModal = () => {
    setIsBloodRequestOpen(true);
  };

  const closeBloodRequestModal = () => {
    setIsBloodRequestOpen(false);
  };

  /* =========================================================
     VOLUNTEER MODAL
  ========================================================= */

  const openVolunteerModal = () => {
    setIsVolunteerOpen(true);
  };

  const closeVolunteerModal = () => {
    setIsVolunteerOpen(false);
  };

  /* =========================================================
     AUTH MODAL
  ========================================================= */

  const openAuthModal = (
    mode: 'login' | 'register' | 'forgot' = 'login'
  ) => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthOpen(false);
  };

  /* =========================================================
     RECEIPT MODAL
  ========================================================= */

  const openReceiptModal = (donation: Donation) => {
    setReceiptData(donation);
  };

  const closeReceiptModal = () => {
    setReceiptData(null);
  };

  /* =========================================================
     TOAST
  ========================================================= */

  const addToast = (
    message: string,
    type: 'success' | 'error' | 'info' = 'success'
  ) => {
    const id =
      'toast-' +
      Date.now() +
      '-' +
      Math.random().toString(36).substring(2, 5);

    setToasts((prev) => [
      ...prev,
      {
        id,
        message,
        type,
      },
    ]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) =>
      prev.filter((t) => t.id !== id)
    );
  };

  /* =========================================================
     NOTIFICATIONS
  ========================================================= */

  const refreshNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');

      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch {
      // ignore
    }
  };

  const markNotificationsAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PATCH',
      });

      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true,
        }))
      );
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    refreshNotifications();

    const interval = setInterval(
      refreshNotifications,
      30000
    );

    return () => clearInterval(interval);
  }, []);

  const unreadNotifsCount = notifications.filter(
    (n) => !n.isRead
  ).length;

  /* =========================================================
     NAVIGATION WITH PARAM
  ========================================================= */

  const setPageWithParam = (
    page: string,
    param?: string
  ) => {
    setCurrentPage(page);
    setPageParam(param);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  /* =========================================================
     PROVIDER
  ========================================================= */

  return (
    <AppContext.Provider
      value={{
        user,
        isAdmin,

        token,

        lang,
        t,
        setLang,

        login,
        logout,

        // Donation
        isDonateOpen,
        selectedCampaign,
        openDonateModal,
        closeDonateModal,

        // Blood Request
        isBloodRequestOpen,
        openBloodRequestModal,
        closeBloodRequestModal,

        // Volunteer
        isVolunteerOpen,
        openVolunteerModal,
        closeVolunteerModal,

        // Auth
        isAuthOpen,
        authMode,
        openAuthModal,
        closeAuthModal,

        // AI Chat
        isAiChatOpen,
        setIsAiChatOpen,

        // Receipt
        receiptData,
        openReceiptModal,
        closeReceiptModal,

        // Notifications
        notifications,
        unreadNotifsCount,
        markNotificationsAsRead,
        refreshNotifications,

        // Toasts
        toasts,
        addToast,
        removeToast,

        // Navigation
        currentPage,
        setCurrentPage: (page: string) =>
          setPageWithParam(page, undefined),

        pageParam,
        setPageWithParam,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

/* =========================================================
   USE APP
========================================================= */

export const useApp = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error(
      'useApp must be used within an AppProvider'
    );
  }

  return context;
};