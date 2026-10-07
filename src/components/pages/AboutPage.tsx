import React from 'react';
import { useApp } from '../../context/AppContext';
import { Heart, ShieldCheck, Award, Users, CheckCircle2, FileText, ArrowRight } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { openDonateModal, openVolunteerModal } = useApp();

  const team = [
    {
      name: 'Syeda Nafisa Rahman',
      role: 'Executive Director & Co-Founder',
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      bio: 'Former humanitarian consultant with 14 years in disaster recovery across South Asia.'
    },
    {
      name: 'Dr. Tanzil Hasan, MD',
      role: 'Head of Blood & Medical Cell',
      photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80',
      bio: 'Associate Professor of Hematology at DMCH, overseeing patient triage and blood safety.'
    },
    {
      name: 'Shakil Ahmed',
      role: 'Director of Field Logistics',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      bio: 'Coordinates emergency flood relief and mobile medical clinics across haor regions.'
    },
    {
      name: 'Ayesha Siddiqua',
      role: 'Volunteer Engagement Lead',
      photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
      bio: 'Managing 600+ university youth volunteers and organizing regular blood donation drives.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* Intro Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7 space-y-5">
          <span className="px-3.5 py-1.5 rounded-full bg-sky-100 text-sky-800 text-xs font-bold uppercase tracking-wider">
            Who We Are
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Restoring Dignity & Saving Lives Across Bangladesh
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            HopeCare Foundation is a registered humanitarian organization committed to zero-leakage charitable donations, swift emergency blood matching, and grassroots disaster rehabilitation.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => openDonateModal()}
              className="px-6 py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs sm:text-sm shadow-md transition"
            >
              Support Our Mission
            </button>
            <button
              onClick={() => openVolunteerModal()}
              className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition"
            >
              Join Our Team
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 relative">
          <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white aspect-4/3">
            <img
              src="https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=800&q=80"
              alt="HopeCare Volunteers"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <Heart className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Our Mission</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            To eliminate delays in life-saving blood transfusions and deliver transparent, direct financial aid to impoverished medical patients, orphans, and disaster victims.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Our Vision</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            A compassionate, resilient Bangladesh where no human life is lost due to lack of blood or inability to afford emergency healthcare.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Core Values</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Absolute Transparency • Rapid Medical Response • Beneficiary Dignity & Privacy • Youth Volunteer Leadership.
          </p>
        </div>
      </div>

      {/* Transparency Framework */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-700 via-blue-700 to-teal-700 text-white p-8 sm:p-12 space-y-8 shadow-xl shadow-indigo-500/20">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs font-bold text-teal-300 uppercase tracking-wider">
            Accountability First
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold">
            How HopeCare Ensures Zero Donation Leakage
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs text-blue-100">
          <div className="space-y-2 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
            <strong className="text-white text-sm block">1. In-Person Verification</strong>
            <p>Every medical and disaster appeal is physically verified by volunteer doctors and regional cells before launch.</p>
          </div>
          <div className="space-y-2 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
            <strong className="text-white text-sm block">2. Digital Auto-Ledger</strong>
            <p>Instant SMS & downloadable verified receipts generated upon clearance with unique transaction IDs.</p>
          </div>
          <div className="space-y-2 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
            <strong className="text-white text-sm block">3. Direct Hospital Settlement</strong>
            <p>Surgical fees are disbursed straight to accredited hospital billing desks rather than unverified intermediaries.</p>
          </div>
          <div className="space-y-2 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
            <strong className="text-white text-sm block">4. Annual Open Audits</strong>
            <p>Independent chartered accounting audits published annually for governing authorities and public review.</p>
          </div>
        </div>
      </div>

      {/* Leadership Team */}
      <div className="space-y-8">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="text-xs font-bold text-sky-600 uppercase tracking-wider">
            Our People
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Leadership & Medical Cell
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Guided by senior medical professionals, humanitarian logisticians, and community organizers.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {team.map((m, idx) => (
            <div
              key={idx}
              className="rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-xs text-center p-6 space-y-4 hover:shadow-md transition"
            >
              <div className="w-24 h-24 rounded-full overflow-hidden mx-auto border-2 border-sky-500 shadow-md">
                <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{m.name}</h3>
                <span className="text-xs text-sky-600 font-medium block mt-0.5">{m.role}</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{m.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
