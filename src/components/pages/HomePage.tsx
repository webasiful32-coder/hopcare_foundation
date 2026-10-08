import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Campaign, BloodRequest, BlogPost, GalleryItem } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  Droplet,
  Users,
  HandHeart,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  Building2,
  PlusCircle,
  PhoneCall
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const {
    t,
    openDonateModal,
    openBloodRequestModal,
    openVolunteerModal,
    setCurrentPage,
    setPageWithParam
  } = useApp();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [bloodRequests, setBloodRequests] = useState<BloodRequest[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [donorCount, setDonorCount] = useState(0);

  useEffect(() => {
    fetch('/api/campaigns')
      .then((r) => r.json())
      .then((data) => setCampaigns(data.slice(0, 3)))
      .catch(() => {});

    fetch('/api/blood-requests')
      .then((r) => r.json())
      .then((data) => setBloodRequests(data.slice(0, 3)))
      .catch(() => {});

    fetch('/api/blog')
      .then((r) => r.json())
      .then((data) => setBlogPosts(data.slice(0, 3)))
      .catch(() => {});

    fetch('/api/gallery')
      .then((r) => r.json())
      .then((data) => setGallery(data.slice(0, 4)))
      .catch(() => {});

    fetch('/api/blood-donors')
      .then((r) => r.json())
      .then((data) => setDonorCount(data.length))
      .catch(() => {});
  }, []);

  const totalRaised = campaigns.reduce((acc, curr) => acc + curr.collectedAmount, 0);

  return (
    <div className="space-y-16 sm:space-y-24 pb-16 overflow-hidden">
      {/* 1. HERO SECTION WITH RICH MOTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-50/80 via-white to-slate-50 pt-10 sm:pt-20 pb-20 border-b border-slate-100">
        {/* Animated background blobs */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-24 -left-24 w-96 h-96 bg-sky-200/40 rounded-full blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute top-1/2 -right-24 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="lg:col-span-7 space-y-6"
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs font-bold tracking-wide shadow-xs"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>100% Transparent Bangladesh Humanitarian Platform</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.7 }}
                className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]"
              >
                Together We Can <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600">
                  Make A Difference.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.7 }}
                className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal"
              >
                Empowering real lives through direct charitable donations, instant emergency blood matching across 64 districts, and dedicated volunteer action.
              </motion.p>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.7 }}
                className="flex flex-wrap items-center gap-3 pt-2"
              >
                <motion.button
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => openDonateModal()}
                  className="px-6 py-3.5 rounded-2xl font-bold text-white bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 transition shadow-lg shadow-sky-600/25 flex items-center gap-2 text-sm cursor-pointer"
                >
                  <Heart className="w-4 h-4 fill-white" />
                  <span>Donate to a Cause</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setCurrentPage('blood-donors')}
                  className="px-5 py-3.5 rounded-2xl font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition flex items-center gap-2 text-sm cursor-pointer"
                >
                  <Droplet className="w-4 h-4 fill-rose-600 text-rose-600" />
                  <span>Find Blood Donor</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => openVolunteerModal()}
                  className="px-5 py-3.5 rounded-2xl font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition flex items-center gap-2 text-sm shadow-xs cursor-pointer"
                >
                  <Users className="w-4 h-4 text-slate-500" />
                  <span>Join as Volunteer</span>
                </motion.button>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-500 font-medium"
              >
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Instant Tax Receipts</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>bKash & Nagad Verified</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Zero Administrative Cuts</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Hero Visual with Floating Animations */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, x: 30 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="lg:col-span-5 relative"
            >
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-4/3"
                >
                  <img
                    src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80"
                    alt="HopeCare Foundation Bangladesh"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-6">
                    <div className="text-white">
                      <span className="px-2.5 py-1 bg-emerald-500 text-slate-900 text-[11px] font-bold rounded-lg uppercase tracking-wider">
                        Active In Bangladesh
                      </span>
                      <h3 className="text-base font-bold mt-2 leading-snug">
                        Immediate Healthcare & Disaster Relief Dispatch
                      </h3>
                    </div>
                  </div>
                </motion.div>

                {/* Floating Emergency Pill */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  whileHover={{ scale: 1.05 }}
                  className="absolute -bottom-6 -left-4 sm:-left-6 bg-white p-3.5 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 backdrop-blur-sm"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                    <Droplet className="w-5 h-5 fill-rose-600" />
                  </div>
                  <div className="text-left">
                    <span className="text-[11px] font-bold text-slate-500 uppercase block">Emergency Dispatch</span>
                    <span className="text-xs font-bold text-slate-900 block">24/7 Live Blood Network</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. REAL-TIME STATISTICS SECTION WITH MOTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {[
            { label: 'Total Raised (BDT)', value: `৳${totalRaised.toLocaleString('en-IN')}`, icon: Heart, color: 'text-sky-600', bg: 'bg-sky-50' },
            { label: 'Verified Donors', value: `${donorCount}`, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Active Appeals', value: `${campaigns.length}`, icon: Sparkles, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Emergency Requests', value: `${bloodRequests.length}`, icon: Droplet, color: 'text-rose-600', bg: 'bg-rose-50' },
            { label: 'Districts Covered', value: '64', icon: MapPin, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Hotline Readiness', value: '24/7', icon: PhoneCall, color: 'text-teal-600', bg: 'bg-teal-50' }
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08, duration: 0.5 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center"
            >
              <div className={`w-9 h-9 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mx-auto mb-2.5`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">{stat.value}</div>
              <div className="text-[11px] font-semibold text-slate-500 mt-0.5">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 3. EMERGENCY BLOOD TICKER SECTION */}
      <motion.section
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="rounded-3xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 text-white p-6 sm:p-10 shadow-xl shadow-rose-500/25 relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-rose-300/40">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wider mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-200" /> Urgent Medical Care
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Need Blood Urgently?</h2>
              <p className="text-xs sm:text-sm text-rose-50 mt-1 max-w-xl">
                Broadcast an emergency alert to matched donors in your district or call our 24/7 hotline (+880 1800-467322).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => openBloodRequestModal()}
                className="px-5 py-3 rounded-xl font-bold bg-white text-rose-700 hover:bg-rose-50 transition shadow-md text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
              >
                <Droplet className="w-4 h-4 fill-rose-600 text-rose-600" />
                <span>Request Blood Now</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage('blood-donors')}
                className="px-5 py-3 rounded-xl font-bold bg-rose-700 hover:bg-rose-800 text-white border border-rose-300/30 transition text-xs sm:text-sm cursor-pointer shadow-xs"
              >
                Find Blood Donors
              </motion.button>
            </div>
          </div>

          {/* Active Live Requests Cards or Clean Empty State */}
          <div className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-200">
                Live Urgent Hospital Requests:
              </h3>
              <button
                onClick={() => setCurrentPage('blood-requests')}
                className="text-xs text-rose-200 hover:text-white font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>View All Requests</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {bloodRequests.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-8 text-center bg-white/5 border border-white/10 rounded-2xl space-y-3"
              >
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto text-rose-300">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">No Active Emergency Requests Currently</h4>
                <p className="text-xs text-rose-200 max-w-md mx-auto">
                  Alhamdulillah! All prior requests are fulfilled. If you or a family member in hospital needs blood, click below to post an emergency request.
                </p>
                <button
                  onClick={() => openBloodRequestModal()}
                  className="px-4 py-2 bg-white text-rose-900 font-bold text-xs rounded-xl hover:bg-rose-50 transition"
                >
                  + Post New Blood Request
                </button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {bloodRequests.map((req, idx) => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-xs space-y-2 hover:bg-white/15 transition"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black bg-white text-rose-900 px-2.5 py-0.5 rounded-lg">
                        {req.bloodGroup}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                          req.emergencyLevel === 'Critical'
                            ? 'bg-red-500 text-white'
                            : req.emergencyLevel === 'Urgent'
                            ? 'bg-amber-400 text-slate-900'
                            : 'bg-emerald-400 text-slate-900'
                        }`}
                      >
                        {req.emergencyLevel}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-white text-sm truncate">{req.patientName}</h4>
                      <p className="text-rose-200 text-[11px] truncate flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 shrink-0" />
                        {req.hospitalName}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-rose-200">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {req.upazila}, {req.district}
                      </span>
                      <span className="font-bold text-white">{req.requiredUnits} Bag(s)</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* 4. FEATURED CAMPAIGNS WITH MOTION & CLEAN EMPTY STATE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 block mb-1">
              Active Appeals
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Featured Campaigns
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Verified humanitarian appeals with instant digital tax receipts.
            </p>
          </div>

          <button
            onClick={() => setCurrentPage('campaigns')}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-sky-600 hover:text-sky-700 self-start sm:self-auto cursor-pointer"
          >
            <span>Browse All Campaigns</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {campaigns.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl bg-white border border-slate-200/90 p-10 sm:p-14 text-center space-y-4 shadow-xs"
          >
            <div className="w-16 h-16 rounded-3xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
              <Heart className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-slate-900">No Active Campaigns Right Now</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Database is clean and ready. The administrator can launch genuine humanitarian appeals directly from the Admin Panel.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setCurrentPage('admin')}
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
              >
                + Launch First Campaign (Admin)
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => openDonateModal()}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Make General Donation
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((camp, idx) => {
              const percent = Math.min(100, Math.round((camp.collectedAmount / camp.targetAmount) * 100));

              return (
                <motion.div
                  key={camp.id}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  className="group flex flex-col rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-xl transition overflow-hidden"
                >
                  <div className="relative aspect-16/10 overflow-hidden bg-slate-100">
                    <img
                      src={camp.featuredImageUrl}
                      alt={camp.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <span className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-md text-slate-900 font-bold text-[11px] rounded-full shadow-sm">
                      {camp.category}
                    </span>
                    {camp.isUrgent && (
                      <span className="absolute top-3 right-3 px-2.5 py-1 bg-rose-600 text-white font-bold text-[10px] rounded-full shadow-sm uppercase tracking-wider">
                        Urgent Appeal
                      </span>
                    )}
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-sky-600 transition">
                        {camp.title}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {camp.shortDescription}
                      </p>
                    </div>

                    {/* Progress Section */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900">৳{camp.collectedAmount.toLocaleString('en-IN')}</span>
                        <span className="text-slate-500 font-medium">{percent}% funded</span>
                      </div>

                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${percent}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full"
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>Target: ৳{camp.targetAmount.toLocaleString('en-IN')}</span>
                        <span>{camp.donorCount} Donors</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => openDonateModal(camp)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Heart className="w-3.5 h-3.5 fill-white" />
                        <span>Donate Now</span>
                      </motion.button>

                      <button
                        onClick={() => setPageWithParam('campaigns', camp.id)}
                        className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. BLOOD DONOR REGISTRATION CTA */}
      <motion.section
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-600 to-sky-600 text-white p-8 sm:p-12 overflow-hidden relative shadow-xl shadow-blue-500/20">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <span className="px-3 py-1 rounded-full bg-white/20 text-white font-bold text-xs uppercase tracking-wider backdrop-blur-sm">
                Be Someone's Lifeline
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Become a Registered Blood Donor
              </h2>
              <p className="text-sm text-blue-100 leading-relaxed max-w-xl">
                A single whole blood donation takes less than 20 minutes and can sustain up to 3 critically ill patients. We safeguard your privacy and notify you only for genuine hospital emergencies.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setCurrentPage('blood-donors')}
                  className="px-6 py-3.5 rounded-xl font-bold bg-rose-500 hover:bg-rose-600 text-white transition text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-md shadow-rose-500/30"
                >
                  <Droplet className="w-4 h-4 fill-white" />
                  <span>Register as Blood Donor</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setCurrentPage('blood-donors')}
                  className="px-5 py-3.5 rounded-xl font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/25 backdrop-blur-md transition text-xs sm:text-sm cursor-pointer"
                >
                  Browse Donors Near You
                </motion.button>
              </div>
            </div>

            <div className="lg:col-span-4 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-xs space-y-3">
              <h4 className="font-bold text-white text-sm">Quick Donor Eligibility</h4>
              <ul className="space-y-2 text-blue-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>Age: 18 - 60 years old</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>Minimum Weight: 48 kg (Male) / 45 kg (Female)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>Donation interval: ≥ 90 days cooldown</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>Healthy hemoglobin (≥ 12.5 g/dL)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 6. CALL TO ACTION */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="rounded-3xl bg-gradient-to-r from-teal-600 via-emerald-600 to-sky-600 text-white p-8 sm:p-14 text-center space-y-6 shadow-xl shadow-teal-500/20">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight max-w-2xl mx-auto">
            Your Small Contribution Can Save A Life Today.
          </h2>
          <p className="text-sm text-teal-100 max-w-xl mx-auto">
            Whether it is ৳100 for a hot meal, a unit of life-saving blood, or a few volunteer hours — you are building a kinder Bangladesh.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openDonateModal()}
              className="px-7 py-3.5 bg-white text-emerald-800 font-extrabold text-sm rounded-xl shadow-lg hover:bg-emerald-50 transition cursor-pointer"
            >
              Donate Now
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openVolunteerModal()}
              className="px-7 py-3.5 bg-white/20 hover:bg-white/30 text-white font-bold text-sm rounded-xl border border-white/25 backdrop-blur-sm transition cursor-pointer"
            >
              Join Our Volunteer Corps
            </motion.button>
          </div>
        </div>
      </motion.section>
    </div>
  );
};