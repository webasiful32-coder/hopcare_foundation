import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert } from 'lucide-react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './components/pages/HomePage';
import { CampaignsPage } from './components/pages/CampaignsPage';
import { BloodDonorsPage } from './components/pages/BloodDonorsPage';
import { BloodRequestsPage } from './components/pages/BloodRequestsPage';
import { BeneficiariesPage } from './components/pages/BeneficiariesPage';
import { GalleryPage } from './components/pages/GalleryPage';
import { BlogPage } from './components/pages/BlogPage';
import { AboutPage } from './components/pages/AboutPage';
import { ContactPage } from './components/pages/ContactPage';
import { LegalPage } from './components/pages/LegalPage';
import { UserDashboard } from './components/dashboard/UserDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { MotionAuthPage } from './components/auth/MotionAuthPage';

import { DonateModal } from './components/common/DonateModal';
import { ReceiptModal } from './components/common/ReceiptModal';
import { BloodRequestModal } from './components/common/BloodRequestModal';
import { VolunteerModal } from './components/common/VolunteerModal';
import { AuthModal } from './components/common/AuthModal';
import { HopeCareAiDrawer } from './components/ai/HopeCareAiDrawer';
import { ToastContainer } from './components/common/ToastContainer';

const MainContent: React.FC = () => {
  const { user, currentPage, setCurrentPage } = useApp();
  const [guestBypassed, setGuestBypassed] = useState(false);

  // =========================================================
  // কঠোর অ্যাডমিন চেকিং (Access Control)
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

  const isAdmin = Boolean(user && (isSuperAdmin || isRoleAdmin));

  // If visitor is not logged in and hasn't chosen guest browsing, show MotionAuthPage
  const showAuthPortal = currentPage === 'auth' || (!user && !guestBypassed);

  if (showAuthPortal) {
    return (
      <div className="min-h-screen w-full max-w-full min-w-0 overflow-x-hidden bg-slate-50 font-sans">
        <MotionAuthPage
          onBypassToSite={() => {
            setGuestBypassed(true);
            setCurrentPage('home');
          }}
        />

        <ToastContainer />
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;

      case 'campaigns':
        return <CampaignsPage />;

      case 'blood-donors':
        return <BloodDonorsPage />;

      case 'blood-requests':
        return <BloodRequestsPage />;

      case 'beneficiaries':
        return <BeneficiariesPage />;

      case 'gallery':
        return <GalleryPage />;

      case 'blog':
        return <BlogPage />;

      case 'about':
        return <AboutPage />;

      case 'contact':
        return <ContactPage />;

      case 'legal':
        return <LegalPage />;

      case 'dashboard':
        return user ? <UserDashboard /> : <HomePage />;

      // =========================================================
      // সুরক্ষিত ADMIN ড্যাশবোর্ড রুট (সাধারণ ইউজারদের জন্য ব্লক করা)
      // =========================================================
      case 'admin': {
        if (!isAdmin) {
          return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4 shadow-sm">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2">
                অ্যাক্সেস অনুমোদিত নয় (Access Denied)
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mb-6 leading-relaxed">
                শুধুমাত্র অনুমোদিত অ্যাডমিন (mdarfanahmed97@gmail.com) এই প্যানেলটি ব্যবহার করতে পারবেন। সাধারণ ব্যবহারকারীদের জন্য এই পেজটি সুরক্ষিত রাখা হয়েছে।
              </p>
              <button
                onClick={() => setCurrentPage('home')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-extrabold text-xs sm:text-sm shadow-md hover:opacity-95 transition cursor-pointer"
              >
                হোম পেজে ফিরে যান
              </button>
            </div>
          );
        }

        return <AdminDashboard />;
      }

      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen w-full max-w-full min-w-0 flex flex-col overflow-x-hidden bg-gradient-to-b from-sky-50/50 via-white to-blue-50/30 text-slate-800 font-sans selection:bg-sky-500 selection:text-white">
      <Navbar />

      <main className="flex-1 w-full max-w-full min-w-0 overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            className="w-full max-w-full min-w-0 overflow-x-hidden"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{
              duration: 0.28,
              ease: 'easeInOut',
            }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />

      {/* Global Interactive Overlays */}
      <DonateModal />
      <ReceiptModal />
      <BloodRequestModal />
      <VolunteerModal />
      <AuthModal />
      <HopeCareAiDrawer />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}