import React, { useState } from 'react';
import { ShieldAlert, FileText, Lock, Heart, CheckCircle } from 'lucide-react';

export const LegalPage: React.FC = () => {
  const [tab, setTab] = useState<'disclaimer' | 'privacy' | 'donation' | 'terms'>('disclaimer');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Governance & Safeguards
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Legal Policies & Medical Disclaimers
        </h1>
        <p className="text-xs text-slate-500">
          Last updated: October 2026 • Registered NGOAB Reg # 2847/BD
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'disclaimer', label: 'Blood Donation Disclaimer' },
          { id: 'privacy', label: 'Privacy Policy' },
          { id: 'donation', label: 'Donation & Refund Policy' },
          { id: 'terms', label: 'Terms & Conditions' }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              tab === t.id
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-xs space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
        {tab === 'disclaimer' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sm font-bold mb-1">
                  CRITICAL MEDICAL NOTICE & EMERGENCY PROTOCOL
                </strong>
                <span>
                  HopeCare Foundation is a voluntary facilitator platform and does <strong>NOT</strong> provide direct clinical medical services, apheresis lab blood testing, or infectious disease screening.
                </span>
              </div>
            </div>

            <h3 className="text-base font-bold text-slate-900">1. Voluntary Facilitation Only</h3>
            <p>
              The blood donor matching database connects voluntary donors with hospital attendants in good faith. All cross-matching, blood screening (HIV, Hepatitis B/C, Syphilis, Malaria), and transfusions <strong>must be conducted solely by certified hospital pathologists and licensed transfusion centers</strong> (e.g. DMCH, BSMMU, Badhan, Quantum, Red Crescent).
            </p>

            <h3 className="text-base font-bold text-slate-900">2. Emergency Situations</h3>
            <p>
              In acute life-threatening situations, attendants must contact hospital emergency units and national emergency numbers immediately. HopeCare does not guarantee the availability or physical arrival of volunteer donors.
            </p>

            <h3 className="text-base font-bold text-slate-900">3. Commercial Prohibition</h3>
            <p>
              Buying, selling, or offering monetary incentives for human blood is strictly illegal under the laws of Bangladesh. Any user demanding or offering money for blood donations will be permanently banned and reported to law enforcement authorities.
            </p>
          </div>
        )}

        {tab === 'privacy' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">1. Donor Data Protection</h3>
            <p>
              We protect the private mobile numbers and personal addresses of voluntary blood donors. Public searches display only masked identifiers until an attendant specifically requests contact for a verified hospital case.
            </p>

            <h3 className="text-base font-bold text-slate-900">2. Beneficiary Safeguards</h3>
            <p>
              We honor the dignity of underprivileged patients and children. We never disclose national ID numbers, exact residential coordinates, or degrading photos on public campaigns.
            </p>

            <h3 className="text-base font-bold text-slate-900">3. Security Standards</h3>
            <p>
              All payment credentials (bKash/Nagad/SSLCommerz/Cards) are processed via bank-grade TLS 1.3 encrypted conduits. We never store credit card numbers or Mobile Financial Services (MFS) PINs.
            </p>
          </div>
        )}

        {tab === 'donation' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">1. Allocation of Charitable Contributions</h3>
            <p>
              100% of donations made to specific campaigns are credited directly towards that verified appeal. General operational costs are funded via separate institutional endowments.
            </p>

            <h3 className="text-base font-bold text-slate-900">2. Official Tax Receipts</h3>
            <p>
              Every cleared payment automatically generates a verified digital receipt bearing a unique serial number (REC-2026-XXXXX) eligible for tax exemption in Bangladesh.
            </p>

            <h3 className="text-base font-bold text-slate-900">3. Refund Policy</h3>
            <p>
              In the rare event of duplicate debiting or fraudulent card usage, please email <strong>contact@hopecare.org</strong> with your transaction receipt within 7 days for verification and full refund processing.
            </p>
          </div>
        )}

        {tab === 'terms' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900">1. User Code of Conduct</h3>
            <p>
              Users must provide accurate identity information when posting blood requests or applying as volunteers. Any fraudulent appeal is subject to immediate suspension and legal reporting.
            </p>

            <h3 className="text-base font-bold text-slate-900">2. Intellectual Property & Brand</h3>
            <p>
              HopeCare Foundation logos, field photos, and campaign materials are protected. Reposting content for commercial gain without written consent is strictly prohibited.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
