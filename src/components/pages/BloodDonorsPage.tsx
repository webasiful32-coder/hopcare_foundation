import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { BloodDonor, BloodGroup } from '../../types';
import { BANGLADESH_DIVISIONS, DISTRICT_UPAZILAS, BLOOD_GROUPS, DIVISION_NAMES_BN, DISTRICT_NAMES_BN, INITIAL_BLOOD_DONORS } from '../../data/bangladeshData';
import { registerBloodDonor, safeFetchJson } from '../../services/apiClient';
import { motion, AnimatePresence } from 'motion/react';
import { Droplet, Search, MapPin, CheckCircle, Clock, ShieldCheck, Heart, UserPlus, PhoneCall, AlertCircle } from 'lucide-react';

export const BloodDonorsPage: React.FC = () => {
  const { user, addToast, openBloodRequestModal } = useApp();

  const [donors, setDonors] = useState<BloodDonor[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('All');
  const [division, setDivision] = useState<string>('All');
  const [district, setDistrict] = useState<string>('All');
  const [upazila, setUpazila] = useState<string>('All');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [search, setSearch] = useState('');

  // Register Donor state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regName, setRegName] = useState(user?.fullName || '');
  const [regPhone, setRegPhone] = useState(user?.phone || '');
  const [regBlood, setRegBlood] = useState<BloodGroup>('O+');
  const [regDivision, setRegDivision] = useState('Dhaka');
  const [regDistrict, setRegDistrict] = useState('Dhaka');
  const [regUpazila, setRegUpazila] = useState('Dhanmondi');
  const [contactSuccessDonor, setContactSuccessDonor] = useState<BloodDonor | null>(null);

  useEffect(() => {
    fetchDonors();
  }, [selectedGroup, division, district, availableOnly]);

  const fetchDonors = () => {
    const params = new URLSearchParams();
    if (selectedGroup !== 'All') params.append('bloodGroup', selectedGroup);
    if (division !== 'All') params.append('division', division);
    if (district !== 'All') params.append('district', district);
    if (availableOnly) params.append('availableOnly', 'true');

    safeFetchJson<BloodDonor[]>(`/api/blood-donors?${params.toString()}`)
      .then((res) => {
        if (res.ok && Array.isArray(res.data)) {
          setDonors(res.data);
        } else {
          // Fallback to initial donors + localStorage donors
          try {
            const localRaw = localStorage.getItem('hopecare_blood_donors_local');
            const localDonors = localRaw ? JSON.parse(localRaw) : [];
            let combined = [...localDonors, ...INITIAL_BLOOD_DONORS];
            if (selectedGroup !== 'All') combined = combined.filter(d => d.bloodGroup === selectedGroup);
            if (division !== 'All') combined = combined.filter(d => d.division === division);
            if (district !== 'All') combined = combined.filter(d => d.district === district);
            if (availableOnly) combined = combined.filter(d => d.status === 'AVAILABLE' || d.isAvailable);
            setDonors(combined);
          } catch {
            setDonors(INITIAL_BLOOD_DONORS);
          }
        }
      })
      .catch(() => {
        setDonors(INITIAL_BLOOD_DONORS);
      });
  };

  const handleRegisterDonor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regPhone) {
      addToast('Name and phone are required to register as donor', 'error');
      return;
    }

    try {
      await registerBloodDonor({
        fullName: regName,
        bloodGroup: regBlood,
        phone: regPhone,
        division: regDivision,
        district: regDistrict,
        upazila: regUpazila,
        gender: 'Male',
        userId: user?.id
      });

      addToast('You have been successfully registered as a verified blood donor!', 'success');
      setIsRegisterOpen(false);
      fetchDonors();
    } catch {
      addToast('Error registering blood donor', 'error');
    }
  };

  const handleRequestContact = (donor: BloodDonor) => {
    setContactSuccessDonor(donor);
  };

  const currentDistricts = division !== 'All' ? BANGLADESH_DIVISIONS[division] || [] : [];
  const currentUpazilas = district !== 'All' ? DISTRICT_UPAZILAS[district] || [] : [];

  const filtered = donors.filter((d) => {
    if (upazila !== 'All' && d.upazila.toLowerCase() !== upazila.toLowerCase()) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        d.fullName.toLowerCase().includes(q) ||
        d.district.toLowerCase().includes(q) ||
        d.upazila.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="rounded-3xl bg-gradient-to-r from-rose-950 via-rose-900 to-red-900 text-white p-8 sm:p-12 relative overflow-hidden shadow-xl"
      >
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <span className="px-3 py-1 bg-white/20 text-rose-100 text-xs font-bold rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
              <Droplet className="w-3.5 h-3.5 fill-white" />
              Verified Blood Network
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Find Blood Donors Across Bangladesh
            </h1>
            <p className="text-sm text-rose-100 leading-relaxed">
              Locate active, eligible blood donors in your upazila and district. In critical emergency situations, broadcast an emergency request to our hospital dispatch cell.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsRegisterOpen(true)}
              className="px-5 py-3 rounded-xl font-bold bg-white text-rose-800 hover:bg-rose-50 transition shadow-md text-xs sm:text-sm flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-rose-700" />
              <span>Register as Donor</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => openBloodRequestModal()}
              className="px-5 py-3 rounded-xl font-bold bg-rose-800 hover:bg-rose-700 text-white border border-rose-600 transition text-xs sm:text-sm cursor-pointer"
            >
              Post Emergency Request
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Blood Group Fast Filter */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
          Filter by Blood Group:
        </label>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedGroup('All')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedGroup === 'All'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Groups
          </motion.button>
          {BLOOD_GROUPS.map((bg) => (
            <motion.button
              whileTap={{ scale: 0.95 }}
              key={bg}
              onClick={() => setSelectedGroup(bg)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedGroup === bg
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {bg}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Geographic & Availability Filters */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search donor name or upazila..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <select
              value={division}
              onChange={(e) => {
                setDivision(e.target.value);
                setDistrict('All');
                setUpazila('All');
              }}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-700"
            >
              <option value="All">All Divisions (সব বিভাগ)</option>
              {Object.keys(BANGLADESH_DIVISIONS).map((div) => (
                <option key={div} value={div}>
                  {DIVISION_NAMES_BN[div] ? `${DIVISION_NAMES_BN[div]} (${div})` : div}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={district}
              disabled={division === 'All'}
              onChange={(e) => {
                setDistrict(e.target.value);
                setUpazila('All');
              }}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-700 disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="All">All Districts (সব জেলা)</option>
              {currentDistricts.map((d) => (
                <option key={d} value={d}>
                  {DISTRICT_NAMES_BN[d] ? `${DISTRICT_NAMES_BN[d]} (${d})` : d}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                className="rounded text-rose-600 focus:ring-rose-500"
              />
              Available Now Only
            </label>
          </div>
        </div>
      </div>

      {/* Donors List or Clean Empty State */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>Found {filtered.length} verified donors in Bangladesh</span>
          <span className="flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Contact privacy protected
          </span>
        </div>

        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-4 shadow-xs"
          >
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Droplet className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-bold text-slate-900">No Donors Registered in this Filter</h3>
              <p className="text-xs text-slate-500">
                Be the very first life-saver in your community! Register as a voluntary blood donor in under 60 seconds.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setIsRegisterOpen(true)}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              + Register as Blood Donor Now
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((donor, idx) => (
              <motion.div
                key={donor.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-sm leading-tight">{donor.fullName}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {donor.upazila}, {donor.district}
                    </p>
                  </div>
                  <span className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 font-extrabold text-base flex items-center justify-center border border-rose-200">
                    {donor.bloodGroup}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className="flex items-center gap-1 font-semibold text-emerald-600">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {donor.isAvailable ? 'Available to Donate' : 'On Cooldown'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Phone (Shielded):</span>
                    <span className="font-mono text-slate-700">{donor.phone}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleRequestContact(donor)}
                  className="w-full py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Request Contact Info</span>
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Request Contact Reveal Dialog */}
      <AnimatePresence>
        {contactSuccessDonor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <PhoneCall className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Donor Contact Authorized</h3>
                <p className="text-xs text-slate-500">
                  Please treat this contact respectfully for verified medical emergencies only.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Donor Name:</span>
                  <span className="font-bold text-slate-900">{contactSuccessDonor.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Blood Group:</span>
                  <span className="font-bold text-rose-600">{contactSuccessDonor.bloodGroup}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Location:</span>
                  <span className="font-medium text-slate-700">{contactSuccessDonor.upazila}, {contactSuccessDonor.district}</span>
                </div>
              </div>

              <button
                onClick={() => setContactSuccessDonor(null)}
                className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm transition cursor-pointer"
              >
                Close Window
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Registration Modal */}
      <AnimatePresence>
        {isRegisterOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-base">Register as a Blood Donor</h3>
                <button onClick={() => setIsRegisterOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
              </div>

              <form onSubmit={handleRegisterDonor} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl border-slate-300"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Blood Group *</label>
                    <select
                      value={regBlood}
                      onChange={(e) => setRegBlood(e.target.value as any)}
                      className="w-full px-3 py-2 border rounded-xl border-slate-300 font-bold text-rose-700"
                    >
                      {BLOOD_GROUPS.map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Phone (+880) *</label>
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl border-slate-300"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">Division</label>
                    <select
                      value={regDivision}
                      onChange={(e) => {
                        const div = e.target.value;
                        setRegDivision(div);
                        const dists = BANGLADESH_DIVISIONS[div] || ['Dhaka'];
                        setRegDistrict(dists[0]);
                        setRegUpazila((DISTRICT_UPAZILAS[dists[0]] || ['Sadar'])[0]);
                      }}
                      className="w-full px-2 py-1.5 border rounded-xl bg-white"
                    >
                      {Object.keys(BANGLADESH_DIVISIONS).map((div) => (
                        <option key={div} value={div}>
                          {DIVISION_NAMES_BN[div] ? `${DIVISION_NAMES_BN[div]} (${div})` : div}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">District</label>
                    <select
                      value={regDistrict}
                      onChange={(e) => {
                        const dist = e.target.value;
                        setRegDistrict(dist);
                        setRegUpazila((DISTRICT_UPAZILAS[dist] || ['Sadar'])[0]);
                      }}
                      className="w-full px-2 py-1.5 border rounded-xl bg-white"
                    >
                      {(BANGLADESH_DIVISIONS[regDivision] || ['Dhaka']).map((d) => (
                        <option key={d} value={d}>
                          {DISTRICT_NAMES_BN[d] ? `${DISTRICT_NAMES_BN[d]} (${d})` : d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-1">Upazila</label>
                    <select
                      value={regUpazila}
                      onChange={(e) => setRegUpazila(e.target.value)}
                      className="w-full px-2 py-1.5 border rounded-xl bg-white"
                    >
                      {(DISTRICT_UPAZILAS[regDistrict] || ['Sadar']).map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition cursor-pointer"
                >
                  Confirm Blood Donor Registration
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
