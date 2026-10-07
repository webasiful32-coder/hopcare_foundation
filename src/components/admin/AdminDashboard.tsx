import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { User, Campaign, BloodRequest, Volunteer, AuditLog, UserRole } from '../../types';
import {
  ShieldAlert,
  Users,
  Heart,
  Droplet,
  HandHeart,
  TrendingUp,
  PlusCircle,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  Printer,
  Mail,
  ShieldCheck,
  Search,
  Filter
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, token, addToast } = useApp();

  const [activeTab, setActiveTab] = useState<'metrics' | 'users' | 'campaigns' | 'blood' | 'volunteers' | 'contacts' | 'audit'>('metrics');

  const [metrics, setMetrics] = useState<any>({
    totalUsers: 0,
    totalBloodDonors: 0,
    totalVolunteers: 0,
    totalCampaigns: 0,
    totalDonationsAmount: 0,
    activeBloodRequests: 0,
    criticalRequests: 0,
    pendingVolunteers: 0
  });

  const [usersList, setUsersList] = useState<User[]>([]);
  const [campaignsList, setCampaignsList] = useState<Campaign[]>([]);
  const [bloodReqs, setBloodReqs] = useState<BloodRequest[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [dbStatus, setDbStatus] = useState<{ isConnected: boolean; provider: string; message: string } | null>(null);

  // New campaign modal
  const [isNewCampOpen, setIsNewCampOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Medical Support');
  const [newTarget, setNewTarget] = useState(300000);
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    fetchMetrics();
    fetchUsers();
    fetchCampaigns();
    fetchBloodRequests();
    fetchVolunteers();
    fetchContacts();
    fetchAuditLogs();

    fetch('/api/health/db-status')
      .then((r) => r.json())
      .then((data) => setDbStatus(data))
      .catch(() => {});
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/admin/metrics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setMetrics(await res.json());
    } catch {}
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setUsersList(await res.json());
    } catch {}
  };

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns');
      if (res.ok) setCampaignsList(await res.json());
    } catch {}
  };

  const fetchBloodRequests = async () => {
    try {
      const res = await fetch('/api/blood-requests');
      if (res.ok) setBloodReqs(await res.json());
    } catch {}
  };

  const fetchVolunteers = async () => {
    try {
      const res = await fetch('/api/volunteers');
      if (res.ok) setVolunteers(await res.json());
    } catch {}
  };

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/contact', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setContacts(await res.json());
    } catch {}
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/admin/audit-logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setAuditLogs(await res.json());
    } catch {}
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        addToast(`User role updated to ${newRole}`, 'success');
        fetchUsers();
      }
    } catch {
      addToast('Failed to update role', 'error');
    }
  };

  const handleVolunteerApproval = async (volId: string, status: 'Approved' | 'Rejected') => {
    try {
      const res = await fetch(`/api/volunteers/${volId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        addToast(`Volunteer marked as ${status}`, 'success');
        fetchVolunteers();
        fetchMetrics();
      }
    } catch {
      addToast('Error updating volunteer status', 'error');
    }
  };

  const handleBloodRequestStatus = async (reqId: string, status: string) => {
    try {
      const res = await fetch(`/api/blood-requests/${reqId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        addToast(`Request status updated to ${status}`, 'success');
        fetchBloodRequests();
        fetchMetrics();
      }
    } catch {
      addToast('Error updating blood request', 'error');
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDesc) return;

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newTitle,
          category: newCategory,
          shortDescription: newDesc.substring(0, 100),
          fullDescription: newDesc,
          targetAmount: newTarget
        })
      });
      if (res.ok) {
        addToast('New campaign created successfully!', 'success');
        setIsNewCampOpen(false);
        fetchCampaigns();
        fetchMetrics();
      }
    } catch {
      addToast('Failed to create campaign', 'error');
    }
  };

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'ID,Title,Target,Collected,Status\n' +
      campaignsList.map((c) => `"${c.id}","${c.title}",${c.targetAmount},${c.collectedAmount},"${c.status}"`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'hopecare_campaign_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Report exported to CSV', 'success');
  };

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center px-4">
        <p className="text-slate-500 mb-4">Admin privileges required to access this console.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Admin Top Header */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 text-white p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl shadow-indigo-500/20">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center border border-white/30 backdrop-blur-sm">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">HopeCare Executive Admin Panel</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${
                dbStatus?.isConnected 
                  ? 'bg-emerald-400/20 text-emerald-200 border-emerald-300/30' 
                  : 'bg-amber-400/20 text-amber-200 border-amber-300/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${dbStatus?.isConnected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                {dbStatus ? dbStatus.provider : 'Connecting DB...'}
              </span>
            </div>
            <p className="text-xs text-blue-100 mt-0.5">
              Administrator: <strong>{user.fullName}</strong> • Full RBAC & Audit Authority
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={async () => {
              if (confirm('Clear all data records? Database will have 0 campaigns, 0 donors, 0 requests.')) {
                const res = await fetch('/api/admin/clear-data', {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                  addToast('All data cleared successfully! Database is completely clean.', 'success');
                  fetchMetrics();
                  fetchUsers();
                  fetchCampaigns();
                  fetchBloodRequests();
                  fetchVolunteers();
                }
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-rose-500/30 hover:bg-rose-500/40 text-white text-xs font-bold transition border border-rose-300/30 backdrop-blur-sm"
          >
            Clear All Data
          </button>
          <button
            onClick={async () => {
              const res = await fetch('/api/admin/seed-data', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
              });
              if (res.ok) {
                addToast('Sample test data loaded!', 'info');
                fetchMetrics();
                fetchCampaigns();
                fetchBloodRequests();
                fetchVolunteers();
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition border border-white/20 backdrop-blur-sm"
          >
            Load Sample Data
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1.5 transition border border-white/20 backdrop-blur-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setIsNewCampOpen(true)}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Campaign</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'metrics', label: 'Overview Analytics', icon: TrendingUp },
          { id: 'users', label: 'Users & Roles', icon: Users },
          { id: 'campaigns', label: 'Campaigns', icon: Heart },
          { id: 'blood', label: 'Blood Requests', icon: Droplet },
          { id: 'volunteers', label: 'Volunteer Apps', icon: HandHeart },
          { id: 'contacts', label: 'Inquiries', icon: Mail },
          { id: 'audit', label: 'Audit Logs', icon: ShieldCheck }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === t.id
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* TAB: Metrics */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-medium">Total Donated (BDT)</span>
              <p className="text-2xl font-extrabold text-emerald-600">
                ৳{(metrics.totalDonationsAmount || 0).toLocaleString('en-IN')}
              </p>
              <span className="text-[11px] text-slate-400 block">{metrics.totalDonationsCount || 3} Transactions</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-medium">Blood Donors & Requests</span>
              <p className="text-2xl font-extrabold text-rose-600">
                {metrics.totalBloodDonors || 20} / {metrics.activeBloodRequests || 4}
              </p>
              <span className="text-[11px] text-rose-600 font-bold block">{metrics.criticalRequests || 2} Critical Active</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-medium">Registered Volunteers</span>
              <p className="text-2xl font-extrabold text-teal-600">{metrics.totalVolunteers || 4}</p>
              <span className="text-[11px] text-amber-600 font-bold block">{metrics.pendingVolunteers || 1} Pending Approval</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-medium">Active Campaigns</span>
              <p className="text-2xl font-extrabold text-slate-900">{metrics.totalCampaigns || 10}</p>
              <span className="text-[11px] text-slate-400 block">Across 8 Divisions</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Users */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">System Users & Role-Based Access Control</h3>
            <span className="text-xs text-slate-500">{usersList.length} Accounts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Current Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Change Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60">
                    <td className="p-3">
                      <span className="font-bold text-slate-900 block">{u.fullName}</span>
                      <span className="text-[11px] text-slate-400">{u.email}</span>
                    </td>
                    <td className="p-3 text-slate-600">{u.phone}</td>
                    <td className="p-3 text-slate-600">{u.upazila}, {u.district}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : u.role === 'VOLUNTEER' ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-emerald-600 font-bold">Active</span>
                    </td>
                    <td className="p-3 text-right">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        className="px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white"
                      >
                        <option value="DONOR">DONOR</option>
                        <option value="VOLUNTEER">VOLUNTEER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: Volunteer Applications */}
      {activeTab === 'volunteers' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Volunteer Applications & Approvals</h3>
            <span className="text-xs text-slate-500">{volunteers.length} Applicants</span>
          </div>

          <div className="divide-y divide-slate-100">
            {volunteers.map((v) => (
              <div key={v.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{v.fullName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      v.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : v.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {v.status}
                    </span>
                  </div>
                  <p className="text-slate-500">{v.email} • {v.phone} • {v.district}</p>
                  <p className="text-slate-600 italic">Motivation: "{v.motivation}"</p>
                </div>

                {v.status === 'Pending' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVolunteerApproval(v.id, 'Approved')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleVolunteerApproval(v.id, 'Rejected')}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: Blood Requests */}
      {activeTab === 'blood' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Emergency Requests Dispatch</h3>
            <span className="text-xs text-slate-500">{bloodReqs.length} Total Appeals</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {bloodReqs.map((r) => (
              <div key={r.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">{r.bloodGroup}</span>
                    <span className="font-bold text-slate-900 text-sm">{r.patientName}</span>
                    <span className="text-slate-500">at {r.hospitalName} ({r.district})</span>
                  </div>
                  <p className="text-slate-500 mt-0.5">Attendant: {r.contactPerson} ({r.contactPhone})</p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={r.status}
                    onChange={(e) => handleBloodRequestStatus(r.id, e.target.value)}
                    className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Searching">Searching</option>
                    <option value="Donor Found">Donor Found</option>
                    <option value="Fulfilled">Fulfilled</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">System Security & Audit Trail</h3>
          <div className="divide-y divide-slate-100 text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">{log.action}</span>
                  <p className="text-slate-500">{log.details}</p>
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  <span>{log.adminName}</span>
                  <span className="block">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Campaign Creation Modal */}
      {isNewCampOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-md">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Launch New Campaign</h3>
            <form onSubmit={handleCreateCampaign} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Campaign Title *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl border-slate-300"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl border-slate-300"
                  >
                    <option value="Medical Support">Medical Support</option>
                    <option value="Disaster Relief">Disaster Relief</option>
                    <option value="Education">Education</option>
                    <option value="Food">Food</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target (BDT) *</label>
                  <input
                    type="number"
                    value={newTarget}
                    onChange={(e) => setNewTarget(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl border-slate-300"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description *</label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl border-slate-300"
                  required
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700"
                >
                  Create Campaign
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewCampOpen(false)}
                  className="py-2.5 px-4 border border-slate-200 rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
