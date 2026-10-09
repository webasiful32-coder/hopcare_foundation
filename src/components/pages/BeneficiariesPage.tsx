import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Beneficiary } from '../../types';
import { ShieldCheck, MapPin, Heart, CheckCircle2 } from 'lucide-react';

export const BeneficiariesPage: React.FC = () => {
  const { openDonateModal } = useApp();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [category, setCategory] = useState<string>('All');

  useEffect(() => {
    fetch('/api/beneficiaries')
      .then((r) => r.json())
      .then((data) => setBeneficiaries(data))
      .catch(() => {});
  }, []);

  const filtered = category === 'All' ? beneficiaries : beneficiaries.filter((b) => b.category === category);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
          Humanitarian Impact Stories
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Verified Beneficiaries
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
          Every human life supported through HopeCare is verified through on-ground volunteer inspection. We uphold strict privacy protection while ensuring complete financial transparency.
        </p>
      </div>

      {/* Category Pills */}
      {/*<div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {['All', 'Patient', 'Child', 'Student', 'Elderly', 'Family', 'Disaster affected'].map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition ${
              category === c
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {c}
          </button>
        ))}
      </div> */}

      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full pt-1 pb-2">
        {['All', 'Patient', 'Child', 'Student', 'Elderly', 'Family', 'Disaster affected'].map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`whitespace-nowrap px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
              category === c
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Beneficiaries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((ben) => {
          const percent = Math.min(100, Math.round((ben.supportReceived / ben.supportRequired) * 100));

          return (
            <div
              key={ben.id}
              className="rounded-3xl bg-white border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-lg transition flex flex-col justify-between"
            >
              <div className="relative aspect-16/10 bg-slate-100 overflow-hidden">
                <img src={ben.photoUrl} alt={ben.name} className="w-full h-full object-cover" />
                <span className="absolute top-3 left-3 px-3 py-1 bg-white/95 text-slate-900 font-bold text-[11px] rounded-full shadow-sm">
                  {ben.category}
                </span>
                <span className="absolute top-3 right-3 px-2.5 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded-full shadow-sm uppercase tracking-wider">
                  {ben.status}
                </span>
              </div>

              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-base">{ben.name}</h3>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {ben.location}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    "{ben.story}"
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Funded:</span>
                    <span className="font-bold text-slate-900">
                      ৳{ben.supportReceived.toLocaleString('en-IN')} / ৳{ben.supportRequired.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>

                <button
                  onClick={() => openDonateModal()}
                  className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition flex items-center justify-center gap-1.5"
                >
                  <Heart className="w-3.5 h-3.5 fill-emerald-700" />
                  <span>Support Similar Causes</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
