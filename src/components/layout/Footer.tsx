import React from 'react';
import { useApp } from '../../context/AppContext';
import { Heart, Droplet, Phone, MessageCircle, Mail, MapPin, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export const Footer: React.FC = () => {
  const { setCurrentPage, openDonateModal, openBloodRequestModal, openVolunteerModal } = useApp();

  return (
    <footer className="bg-gradient-to-b from-slate-50 via-slate-100/90 to-sky-50/60 text-slate-700 pt-16 pb-12 border-t border-slate-200 shadow-inner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-200">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              {/* LOGO */}
                  <div className="relative shrink-0">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.85, y: -8 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        y: [0, -2, 0],
                      }}
                      transition={{
                        opacity: { duration: 0.5 },
                        scale: { duration: 0.5, ease: 'easeOut' },
                        y: {
                          duration: 3,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        },
                      }}
                      whileHover={{ scale: 1.05 }}
                      className="
                        relative
                        w-10
                        h-10
                        sm:w-12
                        sm:h-12
                        2xl:w-14
                        2xl:h-14
                        shrink-0
                        rounded-2xl
                        overflow-hidden
                        bg-white
                        shadow-lg
                        shadow-teal-500/20
                        ring-1
                        ring-emerald-100
                        cursor-pointer
                      "
                    >
                      <img
                        src="/logo.png"
                        alt="Shohayota Foundation"
                        className="
                          w-full
                          h-full
                          object-contain
                          p-0.5
                        "
                      />

                      {/* Small live indicator */}
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.4, duration: 0.3 }}
                        className="
                          absolute
                          right-0
                          bottom-0
                          w-3
                          h-3
                          sm:w-3.5
                          sm:h-3.5
                          rounded-full
                          bg-white
                          flex
                          items-center
                          justify-center
                          shadow-md
                        "
                      >
                        <span
                          className="
                            w-2
                            h-2
                            sm:w-2.5
                            sm:h-2.5
                            rounded-full
                            bg-rose-500
                          "
                        />
                      </motion.span>
                    </motion.div>
                  </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight text-slate-900 block leading-none">
                  Shohayota<span className="text-sky-600">.</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mt-1">
                  Humanitarian Foundation
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed max-w-sm">
              Dedicated to saving lives through direct charitable donations, emergency blood donor network, disaster relief, and volunteer mobilization across all 64 districts of Bangladesh.
            </p>

            <div className="p-3.5 rounded-2xl bg-white border border-emerald-200/90 shadow-xs flex items-center gap-2.5 text-xs text-emerald-900">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Registered with Bangladesh NGO Affairs Bureau (Reg # NGOAB-2847/BD). Tax exemption certified.</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Explore Causes
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setCurrentPage('campaigns')} className="text-slate-600 hover:text-sky-600 transition cursor-pointer">
                  Medical Appeals
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('campaigns')} className="text-slate-600 hover:text-sky-600 transition cursor-pointer">
                  Flood & Disaster Relief
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('campaigns')} className="text-slate-600 hover:text-sky-600 transition cursor-pointer">
                  Slum Child Education
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('campaigns')} className="text-slate-600 hover:text-sky-600 transition cursor-pointer">
                  Thalassemia Support
                </button>
              </li>
              <li>
                <button onClick={() => openDonateModal()} className="text-sky-600 font-bold hover:underline cursor-pointer">
                  Make a Direct Donation
                </button>
              </li>
            </ul>
          </div>

          {/* Blood & Volunteer */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Emergency & Volunteers
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setCurrentPage('blood-donors')} className="text-slate-600 hover:text-slate-900 transition cursor-pointer">
                  Find Blood Donor
                </button>
              </li>
              <li>
                <button onClick={() => openBloodRequestModal()} className="text-rose-600 font-bold hover:underline cursor-pointer">
                  Request Emergency Blood
                </button>
              </li>
              <li>
                <button onClick={() => openVolunteerModal()} className="text-slate-600 hover:text-slate-900 transition cursor-pointer">
                  Apply as Volunteer
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('beneficiaries')} className="text-slate-600 hover:text-slate-900 transition cursor-pointer">
                  Beneficiary Stories
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('gallery')} className="text-slate-600 hover:text-slate-900 transition cursor-pointer">
                  Field Photo Gallery
                </button>
              </li>
            </ul>
          </div>

          {/* Contact & Hotline */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Headquarters
            </h4>
            <ul className="space-y-3 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <span>House 42, Road 11/A, Dhanmondi, Dhaka-1209, Bangladesh</span>
              </li>

              <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-emerald-700 font-bold">
                      +8801934201151
                    </span>
                </li>

                <li className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <a 
                    href="https://wa.me/8801934201151" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-emerald-700 font-bold hover:underline"
                  >
                    Inbox us on WhatsApp for any queries
                  </a>
                </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-500 shrink-0" />
                <span>contact@hopecare.org</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal & Disclaimer */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 HopeCare Foundation Bangladesh. All rights reserved.</p>

          <div className="flex flex-wrap items-center gap-4">
            <button onClick={() => setCurrentPage('legal')} className="hover:text-slate-800 transition cursor-pointer">
              Privacy Policy
            </button>
            <span>•</span>
            <button onClick={() => setCurrentPage('legal')} className="hover:text-slate-800 transition cursor-pointer">
              Terms & Conditions
            </button>
            <span>•</span>
            <button onClick={() => setCurrentPage('legal')} className="hover:text-slate-800 transition cursor-pointer">
              Donation Policy
            </button>
            <span>•</span>
            <button onClick={() => setCurrentPage('legal')} className="hover:text-slate-800 transition cursor-pointer">
              Medical & Blood Disclaimer
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
