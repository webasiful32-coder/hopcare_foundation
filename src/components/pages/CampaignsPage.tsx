import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Campaign, CampaignCategory } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Heart, PlusCircle, Calendar, Users, ArrowRight } from 'lucide-react';

const CATEGORIES: ('All' | CampaignCategory)[] = [
  'All',
  'Medical Support',
  'Disaster Relief',
  'Education',
  'Food',
  'Orphan Support',
  'Elderly Support',
  'Emergency Support',
  'Community Development'
];

export const CampaignsPage: React.FC = () => {
  const { openDonateModal, pageParam, user, setCurrentPage } = useApp();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Completed'>('All');
  const [sortBy, setSortBy] = useState<'urgent' | 'newest' | 'target'>('urgent');
  const [activeModalCampaign, setActiveModalCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    fetch('/api/campaigns')
      .then((r) => r.json())
      .then((data: Campaign[]) => {
        setCampaigns(data);
        if (pageParam) {
          const matched = data.find((c) => c.id === pageParam);
          if (matched) setActiveModalCampaign(matched);
        }
      })
      .catch(() => {});
  }, [pageParam]);

  let filtered = campaigns.filter((c) => {
    if (selectedCategory !== 'All' && c.category !== selectedCategory) return false;
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return c.title.toLowerCase().includes(q) || c.shortDescription.toLowerCase().includes(q);
    }
    return true;
  });

  if (sortBy === 'urgent') {
    filtered.sort((a, b) => (b.isUrgent ? 1 : 0) - (a.isUrgent ? 1 : 0));
  } else if (sortBy === 'newest') {
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else if (sortBy === 'target') {
    filtered.sort((a, b) => b.targetAmount - a.targetAmount);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
            Transparent Aid Delivery
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Humanitarian Causes & Campaigns
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Support verified appeals across Bangladesh with instant digital receipts and tracking.
          </p>
        </div>

        {user?.role === 'ADMIN' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentPage('admin')}
            className="px-5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Launch New Campaign</span>
          </motion.button>
        )}
      </motion.div>

      {/* Filter and Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="space-y-4 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search campaigns by keyword, location, or beneficiary..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-white text-slate-700"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Completed">Completed</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-white text-slate-700"
            >
              <option value="urgent">Sort: Most Urgent First</option>
              <option value="newest">Sort: Newest</option>
              <option value="target">Sort: Target Amount</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <motion.button
              whileTap={{ scale: 0.95 }}
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-3.5 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              {cat}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Campaigns Grid or Clean Empty State */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-4 shadow-xs"
        >
          <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center mx-auto">
            <Heart className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900">No Campaigns Listed</h3>
            <p className="text-xs text-slate-500">
              There are currently no campaigns matching your filter. Administrator can add new humanitarian appeals from the Admin Dashboard.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearch('');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
            >
              Reset Filters
            </button>
            <button
              onClick={() => setCurrentPage('admin')}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition"
            >
              + Create Campaign as Admin
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((camp, idx) => {
            const percent = Math.min(100, Math.round((camp.collectedAmount / camp.targetAmount) * 100));

            return (
              <motion.div
                key={camp.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="group flex flex-col rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-xl transition overflow-hidden"
              >
                <div className="relative aspect-16/10 overflow-hidden bg-slate-100">
                  <img
                    src={camp.featuredImageUrl}
                    alt={camp.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <span className="absolute top-3 left-3 px-3 py-1 bg-white/95 text-slate-900 font-bold text-[11px] rounded-full shadow-sm">
                    {camp.category}
                  </span>
                  {camp.isUrgent && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 bg-rose-600 text-white font-bold text-[10px] rounded-full uppercase tracking-wider">
                      Urgent Appeal
                    </span>
                  )}
                  {camp.status === 'Completed' && (
                    <span className="absolute top-3 right-3 px-2.5 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded-full uppercase tracking-wider">
                      Fully Funded
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

                  {/* Progress */}
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">
                        ৳{camp.collectedAmount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-slate-500 font-medium">{percent}% funded</span>
                    </div>

                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full"
                        style={{ width: `${percent}%` }}
                      ></div>
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
                      onClick={() => setActiveModalCampaign(camp)}
                      className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer"
                    >
                      Read Details
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Campaign Details Modal */}
      <AnimatePresence>
        {activeModalCampaign && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8"
            >
              <div className="relative aspect-16/9 bg-slate-100">
                <img
                  src={activeModalCampaign.featuredImageUrl}
                  alt={activeModalCampaign.title}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setActiveModalCampaign(null)}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md flex items-center justify-center transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                    {activeModalCampaign.title}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Organized by: <strong className="text-slate-700">{activeModalCampaign.organizerName}</strong>
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block font-medium">Raised:</span>
                      <span className="text-base font-extrabold text-emerald-700">
                        ৳{activeModalCampaign.collectedAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block font-medium">Target:</span>
                      <span className="text-base font-bold text-slate-800">
                        ৳{activeModalCampaign.targetAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <h3 className="font-bold text-slate-900 text-sm">Campaign Appeal:</h3>
                  <p>{activeModalCampaign.fullDescription}</p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const c = activeModalCampaign;
                      setActiveModalCampaign(null);
                      openDonateModal(c);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700 transition flex items-center justify-center gap-2 text-sm shadow-md cursor-pointer"
                  >
                    <Heart className="w-4 h-4 fill-white" />
                    <span>Donate to This Campaign</span>
                  </motion.button>
                  <button
                    onClick={() => setActiveModalCampaign(null)}
                    className="py-3 px-5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
