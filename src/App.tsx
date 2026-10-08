import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
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
        return <UserDashboard />;

      case 'admin':
        return <AdminDashboard />;

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