import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BloodGroup, EmergencyLevel } from '../../types';
import { BANGLADESH_DIVISIONS, DISTRICT_UPAZILAS, BLOOD_GROUPS } from '../../data/bangladeshData';
import { motion, AnimatePresence } from 'motion/react';
import { X, Droplet, AlertTriangle, CheckCircle, Loader2, Users } from 'lucide-react';

export const BloodRequestModal: React.FC = () => {
  const { isBloodRequestOpen, closeBloodRequestModal, user, addToast } = useApp();

  const [patientName, setPatientName] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O+');
  const [requiredUnits, setRequiredUnits] = useState(1);
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalAddress, setHospitalAddress] = useState('');
  const [division, setDivision] = useState('Dhaka');
  const [district, setDistrict] = useState('Dhaka');
  const [upazila, setUpazila] = useState('Dhanmondi');
  const [requiredDate, setRequiredDate] = useState('Today (Urgent)');
  const [requiredTime, setRequiredTime] = useState('Within 4 Hours');
  const [emergencyLevel, setEmergencyLevel] = useState<EmergencyLevel>('Urgent');
  const [contactPerson, setContactPerson] = useState(user?.fullName || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [patientCondition, setPatientCondition] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [matchedPreview, setMatchedPreview] = useState<any[] | null>(null);

  if (!isBloodRequestOpen) return null;

  const currentDistricts = BANGLADESH_DIVISIONS[division] || ['Dhaka'];
  const currentUpazilas = DISTRICT_UPAZILAS[district] || ['Sadar'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientName || !hospitalName || !contactPhone || !patientCondition) {
      addToast('Please complete all mandatory patient and hospital fields', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/blood-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName,
          bloodGroup,
          requiredUnits,
          hospitalName,
          hospitalAddress,
          division,
          district,
          upazila,
          requiredDate,
          requiredTime,
          emergencyLevel,
          contactPerson,
          contactPhone,
          patientCondition,
          additionalInfo,
          userId: user?.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }

      setMatchedPreview(data.matchedDonors || []);
      addToast(`Emergency Request Created! ${data.matchedDonors?.length || 0} donors matched nearby.`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Error creating request', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    setMatchedPreview(null);
    closeBloodRequestModal();
  };

  return (
    <AnimatePresence>
      {isBloodRequestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-rose-600 to-red-700 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Droplet className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">Create Emergency Blood Request</h3>
                  <p className="text-xs text-rose-100">Live matching with active verified blood donors in Bangladesh</p>
                </div>
              </div>
              <button
                onClick={closeBloodRequestModal}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

        {matchedPreview ? (
          /* Success & Matching Donors Screen */
          <div className="p-6 space-y-5">
            <div className="text-center py-4 bg-emerald-50 rounded-2xl border border-emerald-100 p-6">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Emergency Request Broadcasted!</h4>
              <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
                Our matching algorithm identified <strong className="text-emerald-700">{matchedPreview.length} available {bloodGroup} donors</strong> in and around {district}.
              </p>
            </div>

            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-rose-600" />
                Top Matched Compatible Donors
              </h5>

              <div className="space-y-2">
                {matchedPreview.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">
                    No immediate donors in the same upazila right now. Request has been broadcast to regional volunteers.
                  </p>
                ) : (
                  matchedPreview.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-slate-900 text-sm">{item.donor.fullName}</span>
                          <span className="px-2 py-0.5 font-bold rounded-full bg-rose-100 text-rose-700">
                            {item.donor.bloodGroup}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                            {item.distanceCategory}
                          </span>
                        </div>
                        <p className="text-slate-500">
                          {item.donor.upazila}, {item.donor.district} • Donations: {item.donor.totalDonationCount} times
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-emerald-600 font-bold block">{item.matchScore}% Match</span>
                        <span className="text-[11px] text-slate-400">Notified via App</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                24/7 Hotline support: <strong>+880 1800-467322</strong>
              </span>
              <button
                type="button"
                onClick={handleFinish}
                className="px-6 py-2.5 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700 shadow-sm transition cursor-pointer"
              >
                Close & View Request Feed
              </button>
            </div>
          </div>
        ) : (
          /* Request Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Patient & Blood Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Patient Full Name & Age *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Mrs. Salma Begum (Age 45)"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Blood Group *
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl font-bold text-rose-700 bg-rose-50/50 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Units & Emergency Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Required Units / Bags *
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={requiredUnits}
                  onChange={(e) => setRequiredUnits(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Emergency Level *
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Normal', 'Urgent', 'Critical'] as EmergencyLevel[]).map((lvl) => {
                    const active = emergencyLevel === lvl;
                    return (
                      <button
                        type="button"
                        key={lvl}
                        onClick={() => setEmergencyLevel(lvl)}
                        className={`py-2 text-xs font-bold rounded-lg border transition text-center ${
                          active
                            ? lvl === 'Critical'
                              ? 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-400'
                              : lvl === 'Urgent'
                              ? 'bg-amber-500 text-white border-amber-500'
                              : 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {lvl}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Hospital & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hospital Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., DMCH / BSMMU / Evercare"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hospital Ward / Cabin / Address
                </label>
                <input
                  type="text"
                  placeholder="e.g., ICU Bed 4, Burn Unit"
                  value={hospitalAddress}
                  onChange={(e) => setHospitalAddress(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Geographic Coordinates */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Division</label>
                <select
                  value={division}
                  onChange={(e) => {
                    const div = e.target.value;
                    setDivision(div);
                    const dists = BANGLADESH_DIVISIONS[div] || ['Dhaka'];
                    setDistrict(dists[0]);
                    setUpazila((DISTRICT_UPAZILAS[dists[0]] || ['Sadar'])[0]);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl bg-white"
                >
                  {Object.keys(BANGLADESH_DIVISIONS).map((div) => (
                    <option key={div} value={div}>
                      {div}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">District</label>
                <select
                  value={district}
                  onChange={(e) => {
                    const dist = e.target.value;
                    setDistrict(dist);
                    setUpazila((DISTRICT_UPAZILAS[dist] || ['Sadar'])[0]);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl bg-white"
                >
                  {currentDistricts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Upazila / Area</label>
                <select
                  value={upazila}
                  onChange={(e) => setUpazila(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-xl bg-white"
                >
                  {currentUpazilas.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Timing & Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Person *
                </label>
                <input
                  type="text"
                  placeholder="Relative / Attendant Name"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone (+880) *
                </label>
                <input
                  type="tel"
                  placeholder="e.g., +88017XXXXXXXX"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>
            </div>

            {/* Condition & Details */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Medical Condition / Diagnosis *
              </label>
              <textarea
                rows={2}
                placeholder="Explain the clinical urgency (e.g. Major orthopedic surgery, post-accident trauma, thalassemia, dengue shock)"
                value={patientCondition}
                onChange={(e) => setPatientCondition(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 transition shadow-lg shadow-rose-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Matching Available Donors...</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>Broadcast Emergency Blood Request</span>
                </>
              )}
            </button>
          </form>
        )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
