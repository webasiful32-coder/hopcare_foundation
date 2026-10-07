import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BANGLADESH_DIVISIONS, DISTRICT_UPAZILAS } from '../../data/bangladeshData';
import { motion, AnimatePresence } from 'motion/react';
import { X, HandHeart, CheckCircle, Loader2 } from 'lucide-react';

const COMMON_SKILLS = [
  'First Aid & Triage',
  'Blood Donor Coordination',
  'Medical Student / Nurse',
  'Disaster Relief Logistics',
  'Boat / Vehicle Transport',
  'Slum School Teaching',
  'Social Media & Photography',
  'Fundraising & Public Outreach'
];

const PREFERRED_AREAS = [
  'Emergency Blood Hotline',
  'Flood & Cold Wave Relief',
  'Health & Eye Camps',
  'Child Education Programs',
  'Food Basket Distribution'
];

export const VolunteerModal: React.FC = () => {
  const { isVolunteerOpen, closeVolunteerModal, user, addToast } = useApp();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [division, setDivision] = useState(user?.division || 'Dhaka');
  const [district, setDistrict] = useState(user?.district || 'Dhaka');
  const [upazila, setUpazila] = useState(user?.upazila || 'Dhanmondi');

  const [selectedSkills, setSelectedSkills] = useState<string[]>(['First Aid & Triage']);
  const [selectedActivities, setSelectedActivities] = useState<string[]>(['Emergency Blood Hotline']);
  const [availability, setAvailability] = useState('Weekends (Fri-Sat)');
  const [motivation, setMotivation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isVolunteerOpen) return null;

  const currentDistricts = BANGLADESH_DIVISIONS[division] || ['Dhaka'];
  const currentUpazilas = DISTRICT_UPAZILAS[district] || ['Sadar'];

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const toggleActivity = (act: string) => {
    setSelectedActivities((prev) =>
      prev.includes(act) ? prev.filter((a) => a !== act) : [...prev, act]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !phone || !motivation) {
      addToast('Please provide your name, contact, and motivation statement', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/volunteers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          division,
          district,
          upazila,
          skills: selectedSkills,
          availability,
          motivation,
          preferredActivities: selectedActivities,
          userId: user?.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit application');
      }

      setIsSuccess(true);
      addToast('Volunteer application submitted! Our team will review within 24 hours.', 'success');
    } catch (err: any) {
      addToast(err.message || 'Submission error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isVolunteerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-6"
          >
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <HandHeart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">Join as a Volunteer</h3>
                  <p className="text-xs text-emerald-100">Serve humanity on the frontlines across Bangladesh</p>
                </div>
              </div>
              <button
                onClick={closeVolunteerModal}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-bold text-slate-900">Application Submitted!</h4>
            <p className="text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
              Thank you, <strong>{fullName}</strong>. An email confirmation has been dispatched. Our divisional coordinator for <strong>{district}</strong> will contact you shortly.
            </p>
            <button
              onClick={() => {
                setIsSuccess(false);
                closeVolunteerModal();
              }}
              className="px-6 py-2.5 bg-emerald-600 text-white font-semibold text-xs rounded-xl hover:bg-emerald-700 transition"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone (+880) *</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            {/* Location */}
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
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Upazila</label>
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

            {/* Skills */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Your Skills & Strengths
              </label>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_SKILLS.map((sk) => {
                  const has = selectedSkills.includes(sk);
                  return (
                    <button
                      type="button"
                      key={sk}
                      onClick={() => toggleSkill(sk)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                        has
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {has ? '✓ ' : '+ '}
                      {sk}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preferred Activities */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Preferred Activities
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PREFERRED_AREAS.map((act) => {
                  const has = selectedActivities.includes(act);
                  return (
                    <button
                      type="button"
                      key={act}
                      onClick={() => toggleActivity(act)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                        has
                          ? 'bg-teal-50 text-teal-800 border-teal-300 font-semibold'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {has ? '✓ ' : '+ '}
                      {act}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Availability */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Weekly Availability</label>
              <input
                type="text"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                placeholder="e.g., Friday & Saturday 4 hours, or On-Call"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Motivation */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Why do you want to volunteer with HopeCare? *
              </label>
              <textarea
                rows={2}
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                placeholder="Share your personal commitment or past volunteer experience..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 transition shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Submitting Application...</span>
                </>
              ) : (
                <span>Submit Volunteer Application</span>
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
