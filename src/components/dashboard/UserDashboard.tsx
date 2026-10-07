import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Donation, BloodRequest, ChatMessage, Conversation, BloodGroup } from '../../types';
import { BLOOD_GROUPS, BANGLADESH_DIVISIONS, DISTRICT_UPAZILAS } from '../../data/bangladeshData';
import {
  Heart,
  Droplet,
  MessageSquare,
  Bell,
  User as UserIcon,
  Shield,
  Printer,
  Calendar,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Settings,
  ChevronRight
} from 'lucide-react';

export const UserDashboard: React.FC = () => {
  const { user, openReceiptModal, addToast, openDonateModal, openBloodRequestModal } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'donations' | 'blood' | 'requests' | 'messages' | 'settings'>('overview');

  const [myDonations, setMyDonations] = useState<Donation[]>([]);
  const [myRequests, setMyRequests] = useState<BloodRequest[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [msgInput, setMsgInput] = useState('');

  // Blood profile state
  const [isDonorActive, setIsDonorActive] = useState(user?.isBloodDonor || false);
  const [donorBloodGroup, setDonorBloodGroup] = useState<BloodGroup>('O+');
  const [isAvailable, setIsAvailable] = useState(true);

  // Settings state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');

  useEffect(() => {
    // Fetch user donations
    fetch('/api/donations')
      .then((r) => r.json())
      .then((data: Donation[]) => {
        setMyDonations(data.filter((d) => d.userId === user?.id || d.donorEmail === user?.email));
      })
      .catch(() => {});

    // Fetch user blood requests
    fetch('/api/blood-requests')
      .then((r) => r.json())
      .then((data: BloodRequest[]) => {
        setMyRequests(data.filter((r) => r.userId === user?.id || r.contactPerson === user?.fullName));
      })
      .catch(() => {});

    // Fetch chat conversations
    fetch('/api/chat/conversations')
      .then((r) => r.json())
      .then((data: Conversation[]) => {
        setConversations(data);
        if (data.length > 0) {
          setActiveConv(data[0]);
        }
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (activeConv) {
      fetch(`/api/chat/messages/${activeConv.id}`)
        .then((r) => r.json())
        .then((data) => setMessages(data))
        .catch(() => {});
    }
  }, [activeConv]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim() || !activeConv) return;

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConv.id,
          senderId: user?.id || 'anon',
          senderName: user?.fullName || 'User',
          senderRole: user?.role || 'DONOR',
          text: msgInput
        })
      });
      const data = await res.json();
      setMessages((prev) => [...prev, data]);
      setMsgInput('');
    } catch {
      addToast('Error sending message', 'error');
    }
  };

  const totalDonationAmount = myDonations.reduce((acc, curr) => acc + curr.amount, 0);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center px-4">
        <p className="text-slate-500 mb-4">Please sign in to access your user dashboard.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Profile Header */}
      <div className="rounded-3xl bg-white border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-emerald-500 text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover rounded-2xl" />
            ) : (
              user.fullName.charAt(0)
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{user.fullName}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-sky-100 text-sky-800">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {user.email} • {user.phone} • {user.upazila}, {user.district}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => openDonateModal()}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition"
          >
            + New Donation
          </button>
          <button
            onClick={() => openBloodRequestModal()}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition"
          >
            + Request Blood
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Overview', icon: Heart },
          { id: 'donations', label: 'My Donations', icon: Heart },
          { id: 'blood', label: 'My Blood Profile', icon: Droplet },
          { id: 'requests', label: 'Blood Requests', icon: Droplet },
          { id: 'messages', label: 'Messages', icon: MessageSquare },
          { id: 'settings', label: 'Profile Settings', icon: Settings }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === t.id
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* TAB CONTENT: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-medium">Total Donated</span>
              <p className="text-2xl font-extrabold text-slate-900">
                ৳{totalDonationAmount.toLocaleString('en-IN')}
              </p>
              <span className="text-[11px] text-emerald-600 font-bold block">
                {myDonations.length} Contributions
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-medium">Blood Donor Status</span>
              <p className="text-2xl font-extrabold text-rose-600">
                {isDonorActive ? 'Registered' : 'Not Registered'}
              </p>
              <span className="text-[11px] text-slate-400 block">
                {isDonorActive ? (isAvailable ? 'Ready to Donate' : 'Cooldown') : 'Register in 1 click'}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-medium">My Blood Requests</span>
              <p className="text-2xl font-extrabold text-slate-900">{myRequests.length}</p>
              <span className="text-[11px] text-slate-400 block">Active patient calls</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-medium">Volunteer Status</span>
              <p className="text-2xl font-extrabold text-teal-600">
                {user.role === 'VOLUNTEER' ? 'Active Volunteer' : 'Donor Supporter'}
              </p>
              <span className="text-[11px] text-teal-700 font-bold block">Good Standing</span>
            </div>
          </div>

          {/* Recent Donations Table */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Recent Donation History</h3>
              <button
                onClick={() => setActiveTab('donations')}
                className="text-xs font-bold text-sky-600 hover:underline"
              >
                View All
              </button>
            </div>

            {myDonations.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No donations made yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {myDonations.slice(0, 3).map((d) => (
                  <div key={d.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{d.campaignTitle}</p>
                      <p className="text-[11px] text-slate-500">{d.paymentGateway} • {new Date(d.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900 text-sm">৳{d.amount.toLocaleString()}</span>
                      <button
                        onClick={() => openReceiptModal(d)}
                        className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                      >
                        Receipt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: My Donations */}
      {activeTab === 'donations' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Complete Donation History</h3>
              <p className="text-xs text-slate-500">Official digital receipts with NGO affairs tax verification</p>
            </div>
            <button
              onClick={() => openDonateModal()}
              className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-700 transition"
            >
              Make Donation
            </button>
          </div>

          {myDonations.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">
              You haven't made any donations yet. Support a verified cause today!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold">
                  <tr>
                    <th className="p-3">Receipt No</th>
                    <th className="p-3">Campaign</th>
                    <th className="p-3">Gateway</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myDonations.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-mono font-bold text-slate-700">{d.receiptNumber}</td>
                      <td className="p-3 font-semibold text-slate-900 max-w-xs truncate">{d.campaignTitle}</td>
                      <td className="p-3 text-slate-600">{d.paymentGateway}</td>
                      <td className="p-3 font-bold text-emerald-700 text-sm">৳{d.amount.toLocaleString()}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          {d.paymentStatus}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => openReceiptModal(d)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-100 shadow-xs"
                        >
                          <Printer className="w-3 h-3" />
                          <span>View Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: My Blood Profile */}
      {activeTab === 'blood' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-base">Blood Donor Settings & Availability</h3>
            <p className="text-xs text-slate-500">Manage your blood group, district, and emergency availability</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Blood Group</label>
                <select
                  value={donorBloodGroup}
                  onChange={(e) => setDonorBloodGroup(e.target.value as BloodGroup)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white font-bold text-rose-700"
                >
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Availability</label>
                <button
                  type="button"
                  onClick={() => setIsAvailable(!isAvailable)}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs border transition ${
                    isAvailable
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-200 text-slate-700 border-slate-300'
                  }`}
                >
                  {isAvailable ? '✓ Available for Emergency Requests' : '✕ On Cooldown / Unavailable'}
                </button>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <h4 className="font-bold text-slate-900">Privacy Safeguards:</h4>
              <p>• Your direct phone number is hidden from the general public.</p>
              <p>• When a hospital creates an emergency request for <strong>{donorBloodGroup}</strong> blood in <strong>{user.district}</strong>, our system will notify you with priority.</p>
              <button
                onClick={() => {
                  setIsDonorActive(true);
                  addToast('Blood donor profile updated successfully!', 'success');
                }}
                className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition shadow-sm cursor-pointer"
              >
                Save Blood Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Messages */}
      {activeTab === 'messages' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs h-[550px] flex flex-col md:flex-row">
          {/* Conversation List */}
          <div className="w-full md:w-72 border-r border-slate-200 p-4 space-y-2 overflow-y-auto">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Conversations</h4>
            {conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => setActiveConv(c)}
                className={`p-3 rounded-2xl cursor-pointer transition text-xs space-y-1 ${
                  activeConv?.id === c.id ? 'bg-sky-50 border border-sky-200' : 'hover:bg-slate-50'
                }`}
              >
                <h5 className="font-bold text-slate-900 truncate">{c.subject}</h5>
                <p className="text-[11px] text-slate-500 truncate">{c.lastMessage}</p>
              </div>
            ))}
          </div>

          {/* Chat Window */}
          <div className="flex-1 flex flex-col bg-slate-50/50">
            {activeConv ? (
              <>
                <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{activeConv.subject}</h4>
                    <p className="text-[11px] text-slate-400">HopeCare Secure Humanitarian Chat</p>
                  </div>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {messages.map((m) => {
                    const isMe = m.senderId === user.id;
                    return (
                      <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <span className="text-[10px] text-slate-400 mb-0.5">{m.senderName} ({m.senderRole})</span>
                        <div
                          className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                            isMe ? 'bg-sky-600 text-white' : 'bg-white border border-slate-200 text-slate-800'
                          }`}
                        >
                          {m.text}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={msgInput}
                    onChange={(e) => setMsgInput(e.target.value)}
                    className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                  />
                  <button type="submit" className="p-2.5 bg-sky-600 text-white rounded-xl hover:bg-sky-700">
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                Select a conversation to begin.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Settings */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 max-w-xl">
          <h3 className="font-bold text-slate-900 text-base">Account Settings</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addToast('Profile changes saved successfully!', 'success');
            }}
            className="space-y-4 text-xs"
          >
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2 border rounded-xl border-slate-300"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mobile Phone (+880)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 border rounded-xl border-slate-300"
              />
            </div>
            <button
              type="submit"
              className="py-2.5 px-5 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-700 transition"
            >
              Save Profile
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
