import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { BloodRequest } from '../../types';
import { BLOOD_GROUPS } from '../../data/bangladeshData';
import { motion, AnimatePresence } from 'motion/react';
import { Droplet, AlertTriangle, Building2, MapPin, Clock, Users, PlusCircle, CheckCircle } from 'lucide-react';

export const BloodRequestsPage: React.FC = () => {
  const { openBloodRequestModal, addToast } = useApp();

  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('All');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedResponseReq, setSelectedResponseReq] = useState<BloodRequest | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [selectedGroup, selectedUrgency, selectedStatus]);

  const fetchRequests = () => {
    const params = new URLSearchParams();
    if (selectedGroup !== 'All') params.append('bloodGroup', selectedGroup);
    if (selectedUrgency !== 'All') params.append('emergencyLevel', selectedUrgency);
    if (selectedStatus !== 'All') params.append('status', selectedStatus);

    fetch(`/api/blood-requests?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setRequests(data))
      .catch(() => {});
  };

  const handleRespond = (req: BloodRequest) => {
    setSelectedResponseReq(req);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600 block mb-1">
            Emergency Hospital Dispatch
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Active Blood Requests Feed
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Real-time emergency appeals from verified hospital ICUs, burns units, and pediatric wards across Bangladesh.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => openBloodRequestModal()}
          className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-600/20 flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post Emergency Request</span>
        </motion.button>
      </motion.div>

      {/* Filter Bars */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3"
      >
        <div className="flex flex-wrap items-center gap-3">
          {/*<div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-xs font-bold text-slate-400 mr-1">Group:</span>
            <button
              onClick={() => setSelectedGroup('All')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedGroup === 'All' ? 'bg-rose-600 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              All
            </button>
            {BLOOD_GROUPS.map((bg) => (
              <button
                key={bg}
                onClick={() => setSelectedGroup(bg)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedGroup === bg ? 'bg-rose-600 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {bg}
              </button>
            ))}
          </div> */}

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 w-full max-w-full min-w-0 no-scrollbar">
          {/* whitespace-nowrap shrink-0 এর কারণে 'Group:' আর কখনোই খাড়া ভাঙবে না */}
          <span className="text-xs font-bold text-slate-500 mr-1 whitespace-nowrap shrink-0">
            Group:
          </span>

          <button
            onClick={() => setSelectedGroup('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition cursor-pointer ${
              selectedGroup === 'All' ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All
          </button>

          {BLOOD_GROUPS.map((bg) => (
            <button
              key={bg}
              onClick={() => setSelectedGroup(bg)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition cursor-pointer ${
                selectedGroup === bg ? 'bg-rose-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {bg}
            </button>
          ))}
        </div>

          <div className="flex items-center gap-2 ml-auto">
            <select
              value={selectedUrgency}
              onChange={(e) => setSelectedUrgency(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl bg-white text-slate-700"
            >
              <option value="All">All Urgency Levels</option>
              <option value="Critical">Critical (Immediate)</option>
              <option value="Urgent">Urgent</option>
              <option value="Normal">Normal / Scheduled</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-xl bg-white text-slate-700"
            >
              <option value="All">All Statuses</option>
              <option value="Searching">Searching</option>
              <option value="Donor Found">Donor Found</option>
              <option value="Fulfilled">Fulfilled</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Requests Feed Grid or Clean Empty State */}
      {requests.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-4 shadow-xs"
        >
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900">No Emergency Requests in System</h3>
            <p className="text-xs text-slate-500">
              Alhamdulillah! No pending hospital appeals currently. If you or someone you know needs urgent blood in hospital, broadcast an emergency call immediately.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => openBloodRequestModal()}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            + Create Emergency Blood Request
          </motion.button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((req, idx) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-xs hover:shadow-lg transition flex flex-col justify-between space-y-4"
            >
              {/* Card Top */}
              <div className="flex items-start justify-between">
                <div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block mb-1.5 ${
                      req.emergencyLevel === 'Critical'
                        ? 'bg-rose-100 text-rose-800'
                        : req.emergencyLevel === 'Urgent'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {req.emergencyLevel}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base leading-snug">
                    {req.patientName}
                  </h3>
                </div>

                <div className="text-right">
                  <span className="w-12 h-12 rounded-2xl bg-rose-600 text-white font-black text-xl flex items-center justify-center shadow-sm">
                    {req.bloodGroup}
                  </span>
                  <span className="text-[10px] font-bold text-rose-700 mt-1 block">
                    {req.requiredUnits} Bag(s)
                  </span>
                </div>
              </div>

              {/* Hospital & Location */}
              <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div className="flex items-start gap-2">
                  <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800">{req.hospitalName}</strong>
                    <p className="text-[11px] text-slate-500">{req.hospitalAddress}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{req.upazila}, {req.district}</span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Needed: {req.requiredDate} ({req.requiredTime})</span>
                </div>
              </div>

              {/* Patient Condition */}
              <p className="text-xs text-slate-600 leading-relaxed italic line-clamp-2">
                "{req.patientCondition}"
              </p>

              {/* Matching & Action */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  {req.matchedDonorsCount} Matched Donors
                </span>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleRespond(req)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer"
                >
                  Respond & Donate
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Response Contact Reveal Dialog */}
      <AnimatePresence>
        {selectedResponseReq && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Droplet className="w-6 h-6 fill-rose-600" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Patient Emergency Attendant</h3>
                <p className="text-xs text-slate-500">
                  Contact the family or duty doctor to coordinate blood delivery.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Patient:</span>
                  <span className="font-bold text-slate-900">{selectedResponseReq.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hospital:</span>
                  <span className="font-medium text-slate-800">{selectedResponseReq.hospitalName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Attendant Person:</span>
                  <span className="font-bold text-slate-900">{selectedResponseReq.contactPerson}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500 font-bold">Hotline Phone:</span>
                  <a href={`tel:${selectedResponseReq.contactPhone}`} className="font-bold text-rose-700 text-sm font-mono underline">
                    {selectedResponseReq.contactPhone}
                  </a>
                </div>
              </div>

              <button
                onClick={() => setSelectedResponseReq(null)}
                className="w-full py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 shadow-sm transition cursor-pointer"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
