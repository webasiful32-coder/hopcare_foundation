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
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  // Navigation helper
  currentPage: string;
  setCurrentPage: (page: string) => void;
  pageParam?: string;
  setPageWithParam: (page: string, param?: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('hopecare_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('hopecare_token') || null;
  });

  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem('hopecare_lang') as Language) || 'en';
  });

  const [currentPage, setCurrentPage] = useState<string>('home');
  const [pageParam, setPageParam] = useState<string | undefined>(undefined);

  const [isDonateOpen, setIsDonateOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const [isBloodRequestOpen, setIsBloodRequestOpen] = useState(false);
  const [isVolunteerOpen, setIsVolunteerOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<Donation | null>(null);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const t = TRANSLATIONS[lang];

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('hopecare_lang', newLang);
  };

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('hopecare_token', newToken);
    localStorage.setItem('hopecare_user', JSON.stringify(newUser));
    addToast(`Welcome back, ${newUser.fullName}!`, 'success');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('hopecare_token');
    localStorage.removeItem('hopecare_user');
    addToast('Signed out successfully', 'info');
    if (currentPage === 'dashboard' || currentPage === 'admin') {
      setCurrentPage('home');
    }
  };

  const openDonateModal = (campaign?: Campaign | null) => {
    setSelectedCampaign(campaign || null);
    setIsDonateOpen(true);
  };

  const closeDonateModal = () => {
    setIsDonateOpen(false);
  };

  const openBloodRequestModal = () => setIsBloodRequestOpen(true);
  const closeBloodRequestModal = () => setIsBloodRequestOpen(false);

  const openVolunteerModal = () => setIsVolunteerOpen(true);
  const closeVolunteerModal = () => setIsVolunteerOpen(false);

  const openAuthModal = (mode: 'login' | 'register' | 'forgot' = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };
  const closeAuthModal = () => setIsAuthOpen(false);

  const openReceiptModal = (donation: Donation) => setReceiptData(donation);
  const closeReceiptModal = () => setReceiptData(null);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

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
      await fetch('/api/notifications/read-all', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  const setPageWithParam = (page: string, param?: string) => {
    setCurrentPage(page);
    setPageParam(param);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        lang,
        t,
        setLang,
        login,
        logout,
        isDonateOpen,
        selectedCampaign,
        openDonateModal,
        closeDonateModal,
        isBloodRequestOpen,
        openBloodRequestModal,
        closeBloodRequestModal,
        isVolunteerOpen,
        openVolunteerModal,
        closeVolunteerModal,
        isAuthOpen,
        authMode,
        openAuthModal,
        closeAuthModal,
        isAiChatOpen,
        setIsAiChatOpen,
        receiptData,
        openReceiptModal,
        closeReceiptModal,
        notifications,
        unreadNotifsCount,
        markNotificationsAsRead,
        refreshNotifications,
        toasts,
        addToast,
        removeToast,
        currentPage,
        setCurrentPage: (page: string) => setPageWithParam(page, undefined),
        pageParam,
        setPageWithParam
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
