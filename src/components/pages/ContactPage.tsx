import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const { addToast } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      addToast('Name, email, and message are required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, subject, message })
      });

      if (!res.ok) throw new Error('Failed to send message');

      setIsSuccess(true);
      addToast('Thank you! Your message has been routed to our support desk.', 'success');
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
    } catch {
      addToast('Error sending message. Please call our hotline.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
          Reach Our Humanitarian Team
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Contact HopeCare Foundation
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
          Have questions about making a donation, hospital blood dispatch, or organizing a corporate blood drive? Our coordinators are available around the clock.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Contact Info Card */}
        <div className="lg:col-span-5 space-y-6 bg-gradient-to-br from-blue-700 via-indigo-600 to-sky-700 text-white p-8 rounded-3xl shadow-xl shadow-blue-500/20">
          <div className="space-y-2">
            <h3 className="text-xl font-bold">Dhaka Headquarters</h3>
            <p className="text-xs text-blue-100">
              Registered NGO Affairs Bureau (Reg # NGOAB-2847/BD)
            </p>
          </div>

          <div className="space-y-4 text-xs text-blue-50">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-sky-300 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-0.5">Physical Address:</strong>
                <span>House 42, Road 11/A, Dhanmondi, Dhaka-1209, Bangladesh</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-0.5">24/7 Emergency Blood Hotline:</strong>
                <a href="tel:+8801800467322" className="text-emerald-200 font-bold hover:underline">
                  +880 1800-467322
                </a>
                <span className="block text-[11px] text-blue-200">Immediate ICU dispatch on call</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-0.5">General Inquiries & Partnerships:</strong>
                <span>contact@hopecare.org / info@hopecare.org</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-indigo-200 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-0.5">Office Hours:</strong>
                <span>Sunday – Thursday: 9:00 AM – 6:00 PM</span>
                <span className="block text-[11px] text-blue-200">Emergency Hotline operates 24/7/365</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/20 flex items-center gap-2 text-xs text-blue-100">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Encrypted transmission. No data shared with 3rd parties.</span>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-slate-200/90 shadow-xs">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Send Us a Direct Message</h3>
          <p className="text-xs text-slate-500 mb-6">
            We will reply to your registered email address within 4 hours.
          </p>

          {isSuccess && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-3 text-xs text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Thank you! Your message has been received by our coordinator.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Your Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Tanvir Rahman"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border rounded-xl border-slate-300 focus:ring-2 focus:ring-sky-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 border rounded-xl border-slate-300 focus:ring-2 focus:ring-sky-500 text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile Phone (+880)</label>
                <input
                  type="tel"
                  placeholder="017XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 border rounded-xl border-slate-300 focus:ring-2 focus:ring-sky-500 text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  placeholder="Donation inquiry / Blood camp / General"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 border rounded-xl border-slate-300 focus:ring-2 focus:ring-sky-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Your Message *</label>
              <textarea
                rows={4}
                placeholder="How can HopeCare help you or your organization?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 border rounded-xl border-slate-300 focus:ring-2 focus:ring-sky-500 text-sm"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="py-3 px-6 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl transition shadow-md shadow-sky-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Interactive Map Embed Section */}
      <div className="rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs h-72 w-full bg-slate-100">
        <iframe
          title="HopeCare Foundation Dhaka Office"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3652.170248464977!2d90.37255857593175!3d23.74130288913988!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755b8b7a451d69d%3A0x6b4453b3f293b6e8!2sDhanmondi%2C%20Dhaka%201205!5e0!3m2!1sen!2sbd!4v1710000000000!5m2!1sen!2sbd"
        ></iframe>
      </div>
    </div>
  );
};
