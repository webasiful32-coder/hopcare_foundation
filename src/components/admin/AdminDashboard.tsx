import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  User,
  Campaign,
  BloodRequest,
  BloodDonor,
  Volunteer,
  AuditLog,
  UserRole,
  Beneficiary,
  BlogPost,
  GalleryItem
} from '../../types';
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
  Filter,
  Edit2,
  Trash2,
  Database,
  RefreshCw,
  Copy,
  Check,
  Image as ImageIcon,
  BookOpen,
  UserCheck
} from 'lucide-react';
import { BLOOD_GROUPS } from '../../data/bangladeshData';

export const AdminDashboard: React.FC = () => {
  const { user, token, addToast } = useApp();

  type TabType =
    | 'metrics'
    | 'campaigns'
    | 'blood'
    | 'users'
    | 'beneficiaries'
    | 'blog'
    | 'gallery'
    | 'database'
    | 'volunteers'
    | 'contacts'
    | 'audit';

  const [activeTab, setActiveTab] = useState<TabType>('metrics');

  const [metrics, setMetrics] = useState<any>({
    totalUsers: 0,
    totalBloodDonors: 0,
    totalVolunteers: 0,
    totalCampaigns: 0,
    totalDonationsAmount: 0,
    totalDonationsCount: 0,
    activeBloodRequests: 0,
    criticalRequests: 0,
    pendingVolunteers: 0
  });

  const [usersList, setUsersList] = useState<User[]>([]);
  const [campaignsList, setCampaignsList] = useState<Campaign[]>([]);
  const [bloodReqs, setBloodReqs] = useState<BloodRequest[]>([]);
  const [bloodDonorsList, setBloodDonorsList] = useState<BloodDonor[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [beneficiariesList, setBeneficiariesList] = useState<Beneficiary[]>([]);
  const [blogPostsList, setBlogPostsList] = useState<BlogPost[]>([]);
  const [galleryList, setGalleryList] = useState<GalleryItem[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Neon DB State
  const [dbStatus, setDbStatus] = useState<{
    isConnected: boolean;
    provider: string;
    message: string;
  } | null>(null);
  const [neonUrlInput, setNeonUrlInput] = useState('');
  const [isConnectingNeon, setIsConnectingNeon] = useState(false);
  const [isSyncingNeon, setIsSyncingNeon] = useState(false);
  const [neonTableCounts, setNeonTableCounts] = useState<Record<string, number>>({});
  const [neonSqlScript, setNeonSqlScript] = useState<string>('');
  const [copiedSql, setCopiedSql] = useState(false);

  // Modals State
  const [isNewCampOpen, setIsNewCampOpen] = useState(false);
  const [editingCamp, setEditingCamp] = useState<Campaign | null>(null);

  // Campaign Form State
  const [campTitle, setCampTitle] = useState('');
  const [campCategory, setCampCategory] = useState('Medical Support');
  const [campTarget, setCampTarget] = useState(300000);
  const [campShortDesc, setCampShortDesc] = useState('');
  const [campFullDesc, setCampFullDesc] = useState('');
  const [campImage, setCampImage] = useState('');
  const [campDeadline, setCampDeadline] = useState('2026-12-31');
  const [campUrgent, setCampUrgent] = useState(false);

  // Blood Request Modal State
  const [isNewBloodReqOpen, setIsNewBloodReqOpen] = useState(false);
  const [bloodPatientName, setBloodPatientName] = useState('');
  const [bloodReqGroup, setBloodReqGroup] = useState('A+');
  const [bloodUnits, setBloodUnits] = useState(1);
  const [bloodHospital, setBloodHospital] = useState('');
  const [bloodDistrict, setBloodDistrict] = useState('Dhaka');
  const [bloodEmergency, setBloodEmergency] = useState('Urgent');
  const [bloodContactPerson, setBloodContactPerson] = useState('');
  const [bloodContactPhone, setBloodContactPhone] = useState('');

  // Beneficiary Modal State
  const [isNewBenOpen, setIsNewBenOpen] = useState(false);
  const [benName, setBenName] = useState('');
  const [benLocation, setBenLocation] = useState('Dhaka');
  const [benStory, setBenStory] = useState('');
  const [benCategory, setBenCategory] = useState('Patient');
  const [benTarget, setBenTarget] = useState(30000);
  const [benPhoto, setBenPhoto] = useState('');

  // Blog Modal State
  const [isNewBlogOpen, setIsNewBlogOpen] = useState(false);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogCategory, setBlogCategory] = useState('Updates');
  const [blogImage, setBlogImage] = useState('');

  // Gallery Modal State
  const [isNewGalOpen, setIsNewGalOpen] = useState(false);
  const [galTitle, setGalTitle] = useState('');
  const [galCategory, setGalCategory] = useState('Medical Support');
  const [galImage, setGalImage] = useState('');
  const [galDesc, setGalDesc] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = () => {
    fetchMetrics();
    fetchUsers();
    fetchCampaigns();
    fetchBloodRequests();
    fetchBloodDonors();
    fetchVolunteers();
    fetchBeneficiaries();
    fetchBlog();
    fetchGallery();
    fetchContacts();
    fetchAuditLogs();
    fetchDbStatus();
  };

  const fetchDbStatus = async () => {
    try {
      const res = await fetch('/api/health/db-status');
      if (res.ok) setDbStatus(await res.json());

      if (token) {
        const countsRes = await fetch('/api/admin/database/table-counts', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (countsRes.ok) {
          const cData = await countsRes.json();
          setNeonTableCounts(cData.counts || {});
        }
        const sqlRes = await fetch('/api/admin/database/sql-script', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (sqlRes.ok) {
          const sData = await sqlRes.json();
          setNeonSqlScript(sData.sql || '');
        }
      }
    } catch {}
  };

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

  const fetchBloodDonors = async () => {
    try {
      const res = await fetch('/api/blood-donors');
      if (res.ok) setBloodDonorsList(await res.json());
    } catch {}
  };

  const fetchVolunteers = async () => {
    try {
      const res = await fetch('/api/volunteers');
      if (res.ok) setVolunteers(await res.json());
    } catch {}
  };

  const fetchBeneficiaries = async () => {
    try {
      const res = await fetch('/api/beneficiaries');
      if (res.ok) setBeneficiariesList(await res.json());
    } catch {}
  };

  const fetchBlog = async () => {
    try {
      const res = await fetch('/api/blog');
      if (res.ok) setBlogPostsList(await res.json());
    } catch {}
  };

  const fetchGallery = async () => {
    try {
      const res = await fetch('/api/gallery');
      if (res.ok) setGalleryList(await res.json());
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

  // ==========================================
  // Neon DB Connection & Sync Handlers
  // ==========================================
  const handleConnectNeon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!neonUrlInput.trim()) {
      addToast('Please enter your Neon DATABASE_URL', 'error');
      return;
    }
    setIsConnectingNeon(true);
    try {
      const res = await fetch('/api/admin/database/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ connectionString: neonUrlInput.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Connection failed');
      }
      addToast(data.message || 'Connected to Neon PostgreSQL successfully!', 'success');
      fetchDbStatus();
      setNeonUrlInput('');
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setIsConnectingNeon(false);
    }
  };

  const handleSyncAllToNeon = async () => {
    setIsSyncingNeon(true);
    try {
      const res = await fetch('/api/admin/database/sync-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sync failed');
      addToast(data.message || 'All records synced to Neon cloud successfully!', 'success');
      fetchDbStatus();
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setIsSyncingNeon(false);
    }
  };

  const handleCopySql = () => {
    if (!neonSqlScript) return;
    navigator.clipboard.writeText(neonSqlScript);
    setCopiedSql(true);
    addToast('Neon PostgreSQL Schema copied to clipboard!', 'success');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  // ==========================================
  // Campaigns CRUD Handlers
  // ==========================================
  const openNewCampaignModal = () => {
    setEditingCamp(null);
    setCampTitle('');
    setCampCategory('Medical Support');
    setCampTarget(300000);
    setCampShortDesc('');
    setCampFullDesc('');
    setCampImage('https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80');
    setCampDeadline('2026-12-31');
    setCampUrgent(false);
    setIsNewCampOpen(true);
  };

  const openEditCampaignModal = (camp: Campaign) => {
    setEditingCamp(camp);
    setCampTitle(camp.title);
    setCampCategory(camp.category);
    setCampTarget(camp.targetAmount);
    setCampShortDesc(camp.shortDescription);
    setCampFullDesc(camp.fullDescription);
    setCampImage(camp.featuredImageUrl);
    setCampDeadline(camp.deadline);
    setCampUrgent(Boolean(camp.isUrgent));
    setIsNewCampOpen(true);
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campTitle.trim() || !campFullDesc.trim()) return;

    try {
      const payload = {
        title: campTitle,
        category: campCategory,
        shortDescription: campShortDesc || campFullDesc.substring(0, 120),
        fullDescription: campFullDesc,
        targetAmount: Number(campTarget),
        featuredImageUrl: campImage || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80',
        deadline: campDeadline,
        isUrgent: campUrgent
      };

      if (editingCamp) {
        const res = await fetch(`/api/campaigns/${editingCamp.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          addToast('Campaign updated successfully!', 'success');
          setIsNewCampOpen(false);
          fetchCampaigns();
          fetchMetrics();
        }
      } else {
        const res = await fetch('/api/campaigns', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          addToast('New campaign created successfully!', 'success');
          setIsNewCampOpen(false);
          fetchCampaigns();
          fetchMetrics();
        }
      }
    } catch {
      addToast('Failed to save campaign', 'error');
    }
  };

  const handleDeleteCampaign = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete campaign: "${title}"?`)) return;
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        addToast('Campaign deleted successfully', 'success');
        fetchCampaigns();
        fetchMetrics();
      }
    } catch {
      addToast('Error deleting campaign', 'error');
    }
  };

  // ==========================================
  // Blood Requests & Donors Handlers
  // ==========================================
  const handleSaveBloodRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bloodPatientName || !bloodHospital || !bloodContactPhone) return;

    try {
      const res = await fetch('/api/blood-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          patientName: bloodPatientName,
          bloodGroup: bloodReqGroup,
          requiredUnits: Number(bloodUnits),
          hospitalName: bloodHospital,
          district: bloodDistrict,
          emergencyLevel: bloodEmergency,
          contactPerson: bloodContactPerson || 'Hospital Attendant',
          contactPhone: bloodContactPhone
        })
      });
      if (res.ok) {
        addToast('Blood appeal published successfully!', 'success');
        setIsNewBloodReqOpen(false);
        fetchBloodRequests();
        fetchMetrics();
      }
    } catch {
      addToast('Failed to create blood request', 'error');
    }
  };

  const handleBloodRequestStatus = async (reqId: string, status: string) => {
    try {
      const res = await fetch(`/api/blood-requests/${reqId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
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

  const handleDeleteBloodRequest = async (id: string) => {
    if (!window.confirm('Delete this blood request appeal?')) return;
    try {
      const res = await fetch(`/api/blood-requests/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        addToast('Blood request deleted', 'success');
        fetchBloodRequests();
        fetchMetrics();
      }
    } catch {
      addToast('Error deleting request', 'error');
    }
  };

  const handleDeleteBloodDonor = async (id: string, name: string) => {
    if (!window.confirm(`Delete blood donor ${name}?`)) return;
    try {
      const res = await fetch(`/api/blood-donors/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        addToast('Blood donor deleted', 'success');
        fetchBloodDonors();
        fetchMetrics();
      }
    } catch {
      addToast('Error deleting donor', 'error');
    }
  };

  // ==========================================
  // Users CRUD Handlers
  // ==========================================
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

  const handleToggleUserStatus = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        addToast('User status updated', 'success');
        fetchUsers();
      }
    } catch {
      addToast('Error changing status', 'error');
    }
  };

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete user account "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        addToast('User deleted successfully', 'success');
        fetchUsers();
        fetchMetrics();
      } else {
        addToast(data.error || 'Failed to delete user', 'error');
      }
    } catch {
      addToast('Error deleting user', 'error');
    }
  };

  // ==========================================
  // Beneficiaries Handlers
  // ==========================================
  const handleCreateBeneficiary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!benName || !benStory) return;
    try {
      const res = await fetch('/api/beneficiaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: benName,
          location: benLocation,
          story: benStory,
          category: benCategory,
          supportRequired: benTarget,
          photoUrl: benPhoto || 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&w=600&q=80'
        })
      });
      if (res.ok) {
        addToast('Beneficiary record created!', 'success');
        setIsNewBenOpen(false);
        fetchBeneficiaries();
      }
    } catch {
      addToast('Failed to create beneficiary', 'error');
    }
  };

  const handleDeleteBeneficiary = async (id: string) => {
    if (!window.confirm('Delete this beneficiary record?')) return;
    try {
      const res = await fetch(`/api/beneficiaries/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        addToast('Beneficiary deleted', 'success');
        fetchBeneficiaries();
      }
    } catch {
      addToast('Error deleting beneficiary', 'error');
    }
  };

  // ==========================================
  // Blog Handlers
  // ==========================================
  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogTitle || !blogContent) return;
    try {
      const res = await fetch('/api/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: blogTitle,
          content: blogContent,
          category: blogCategory,
          coverImage: blogImage || 'https://images.unsplash.com/photo-1579208575657-c595a053b977?auto=format&fit=crop&w=800&q=80'
        })
      });
      if (res.ok) {
        addToast('Blog article published!', 'success');
        setIsNewBlogOpen(false);
        fetchBlog();
      }
    } catch {
      addToast('Failed to publish article', 'error');
    }
  };

  const handleDeleteBlog = async (id: string) => {
    if (!window.confirm('Delete this article?')) return;
    try {
      const res = await fetch(`/api/blog/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        addToast('Article deleted', 'success');
        fetchBlog();
      }
    } catch {
      addToast('Error deleting article', 'error');
    }
  };

  // ==========================================
  // Gallery Handlers
  // ==========================================
  const handleCreateGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galTitle || !galImage) return;
    try {
      const res = await fetch('/api/gallery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: galTitle,
          imageUrl: galImage,
          category: galCategory,
          description: galDesc
        })
      });
      if (res.ok) {
        addToast('Photo added to gallery!', 'success');
        setIsNewGalOpen(false);
        fetchGallery();
      }
    } catch {
      addToast('Failed to add photo', 'error');
    }
  };

  const handleDeleteGallery = async (id: string) => {
    if (!window.confirm('Delete this photo from gallery?')) return;
    try {
      const res = await fetch(`/api/gallery/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        addToast('Photo deleted', 'success');
        fetchGallery();
      }
    } catch {
      addToast('Error deleting photo', 'error');
    }
  };

  // ==========================================
  // Volunteer Applications Handlers
  // ==========================================
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

  const handleDeleteVolunteer = async (volId: string) => {
    if (!window.confirm('Delete this volunteer application?')) return;
    try {
      const res = await fetch(`/api/volunteers/${volId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        addToast('Volunteer deleted', 'success');
        fetchVolunteers();
        fetchMetrics();
      }
    } catch {
      addToast('Error deleting volunteer', 'error');
    }
  };

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'ID,Title,Category,Target,Collected,Status,Deadline\n' +
      campaignsList
        .map(
          (c) =>
            `"${c.id}","${c.title.replace(/"/g, '""')}","${c.category}",${c.targetAmount},${c.collectedAmount},"${c.status}","${c.deadline}"`
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'hopecare_campaign_master_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('CSV Report Downloaded', 'success');
  };

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="max-w-2xl mx-auto py-24 text-center px-4">
        <p className="text-slate-500 mb-4">Admin privileges required to access this console.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Top Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 text-white p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl shadow-indigo-500/20">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center border border-white/30 backdrop-blur-sm">
            <ShieldAlert className="w-6 h-6 text-sky-200" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">HopeCare Executive Admin Panel</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border flex items-center gap-1.5 ${
                dbStatus?.isConnected
                  ? 'bg-emerald-400/20 text-emerald-200 border-emerald-300/30'
                  : 'bg-amber-400/20 text-amber-200 border-amber-300/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${dbStatus?.isConnected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                {dbStatus ? dbStatus.provider : 'Connecting DB...'}
              </span>
            </div>
            <p className="text-xs text-sky-100 mt-0.5">
              Administrator: <strong>{user.fullName}</strong> • Full Site RBAC & Database Authority
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('database')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border cursor-pointer ${
              dbStatus?.isConnected
                ? 'bg-emerald-500/20 border-emerald-300 text-emerald-200 hover:bg-emerald-500/30'
                : 'bg-amber-500/20 border-amber-300 text-amber-200 hover:bg-amber-500/30'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{dbStatus?.isConnected ? 'Neon DB Active' : 'Connect Neon DB'}</span>
          </button>

          <button
            onClick={async () => {
              if (confirm('Clear all data records? Database will be completely clean.')) {
                const res = await fetch('/api/admin/clear-data', {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                  addToast('All data cleared successfully! Database is completely fresh.', 'success');
                  fetchAllData();
                }
              }
            }}
            className="px-3 py-2 rounded-xl bg-rose-500/30 hover:bg-rose-500/40 text-white text-xs font-bold transition border border-rose-300/30 backdrop-blur-sm cursor-pointer"
          >
            Clear Data
          </button>

          <button
            onClick={async () => {
              const res = await fetch('/api/admin/seed-data', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
              });
              if (res.ok) {
                addToast('Sample test data loaded!', 'info');
                fetchAllData();
              }
            }}
            className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition border border-white/20 backdrop-blur-sm cursor-pointer"
          >
            Sample Data
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1.5 transition border border-white/20 backdrop-blur-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={openNewCampaignModal}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Campaign</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 pb-3">
        {[
          { id: 'metrics', label: 'Overview Analytics', icon: TrendingUp },
          { id: 'campaigns', label: 'Campaigns', icon: Heart, badge: campaignsList.length },
          { id: 'blood', label: 'Blood Appeals & Donors', icon: Droplet, badge: bloodReqs.length },
          { id: 'users', label: 'Users & Roles', icon: Users, badge: usersList.length },
          { id: 'beneficiaries', label: 'Beneficiaries', icon: UserCheck, badge: beneficiariesList.length },
          { id: 'blog', label: 'Articles & News', icon: BookOpen, badge: blogPostsList.length },
          { id: 'gallery', label: 'Gallery', icon: ImageIcon, badge: galleryList.length },
          { id: 'database', label: 'Neon Database', icon: Database, isHighlight: true },
          { id: 'volunteers', label: 'Volunteer Apps', icon: HandHeart, badge: volunteers.length },
          { id: 'contacts', label: 'Inquiries', icon: Mail, badge: contacts.length },
          { id: 'audit', label: 'Audit Logs', icon: ShieldCheck }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === t.id
                ? t.isHighlight
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                  : 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                : t.isHighlight
                ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden">{t.label.split(' ')[0]}</span>
            {t.badge !== undefined && (
              <span
                className={`px-1.5 rounded-full text-[10px] leading-5 ${
                  activeTab === t.id ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>




      {/* ========================================================= */}
      {/* TAB: OVERVIEW METRICS */}
      {/* ========================================================= */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-medium">Total Donated (BDT)</span>
              <p className="text-2xl font-extrabold text-emerald-600">
                ৳{(metrics.totalDonationsAmount || 0).toLocaleString('en-IN')}
              </p>
              <span className="text-[11px] text-slate-400 block">{metrics.totalDonationsCount || 0} Transactions</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-medium">Blood Donors & Requests</span>
              <p className="text-2xl font-extrabold text-rose-600">
                {bloodDonorsList.length} / {bloodReqs.length}
              </p>
              <span className="text-[11px] text-rose-600 font-bold block">{metrics.criticalRequests || 0} Critical Active</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-medium">Registered Volunteers</span>
              <p className="text-2xl font-extrabold text-teal-600">{volunteers.length}</p>
              <span className="text-[11px] text-amber-600 font-bold block">{metrics.pendingVolunteers || 0} Pending Approval</span>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
              <span className="text-xs text-slate-500 font-medium">Active Campaigns</span>
              <p className="text-2xl font-extrabold text-slate-900">{campaignsList.length}</p>
              <span className="text-[11px] text-slate-400 block">Across 8 Divisions</span>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">
                  {dbStatus?.isConnected ? '🟢 Live Neon PostgreSQL Cloud Connected' : '⚡ Neon Cloud Standby Mode'}
                </h4>
                <p className="text-xs text-slate-500">
                  {dbStatus?.isConnected
                    ? 'All user registrations, campaigns, and blood appeals are directly saved in Neon PostgreSQL.'
                    : 'Configure your Neon database URL in the Neon Database tab to persist all data.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('database')}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
            >
              Open Database Manager
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: CAMPAIGNS (FULL CRUD) */}
      {/* ========================================================= */}
      {activeTab === 'campaigns' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Campaigns Master Management</h3>
              <p className="text-xs text-slate-500">Create, update target, modify descriptions, or remove campaigns.</p>
            </div>
            <button
              onClick={openNewCampaignModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Launch New Campaign</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold">
                <tr>
                  <th className="p-3">Campaign</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Target (BDT)</th>
                  <th className="p-3">Collected (BDT)</th>
                  <th className="p-3">Deadline</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaignsList.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70">
                    <td className="p-3 max-w-xs">
                      <div className="flex items-center gap-3">
                        <img src={c.featuredImageUrl} alt={c.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        <div>
                          <span className="font-bold text-slate-900 line-clamp-1">{c.title}</span>
                          <span className="text-[11px] text-slate-400 line-clamp-1">{c.shortDescription}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-slate-600 font-semibold">{c.category}</td>
                    <td className="p-3 font-bold text-slate-800">৳{c.targetAmount.toLocaleString()}</td>
                    <td className="p-3 font-bold text-emerald-600">৳{c.collectedAmount.toLocaleString()}</td>
                    <td className="p-3 text-slate-500">{c.deadline}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditCampaignModal(c)}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition cursor-pointer"
                          title="Edit Campaign"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCampaign(c.id, c.title)}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition cursor-pointer"
                          title="Delete Campaign"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: BLOOD APPEALS & DONORS (FULL CRUD) */}
      {/* ========================================================= */}
      {activeTab === 'blood' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Emergency Blood Requests Dispatch</h3>
                <p className="text-xs text-slate-500">Manage patient blood appeals, update fulfillment state, or remove.</p>
              </div>
              <button
                onClick={() => setIsNewBloodReqOpen(true)}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Blood Request</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {bloodReqs.map((r) => (
                <div key={r.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                        {r.bloodGroup}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">{r.patientName}</span>
                      <span className="text-slate-500">({r.requiredUnits} Units at {r.hospitalName}, {r.district})</span>
                    </div>
                    <p className="text-slate-500 mt-1">
                      Attendant: {r.contactPerson} ({r.contactPhone}) • Emergency:{' '}
                      <span className="font-bold text-rose-600">{r.emergencyLevel}</span>
                    </p>
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

                    <button
                      onClick={() => handleDeleteBloodRequest(r.id)}
                      className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition cursor-pointer"
                      title="Delete Blood Request"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Registered Blood Donors Directory</h3>
                <p className="text-xs text-slate-500">{bloodDonorsList.length} Registered Volunteers</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold">
                  <tr>
                    <th className="p-3">Donor Name</th>
                    <th className="p-3">Blood Group</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Availability</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bloodDonorsList.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{d.fullName}</td>
                      <td className="p-3">
                        <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {d.bloodGroup}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">{d.phone}</td>
                      <td className="p-3 text-slate-600">{d.upazila || d.district}, {d.division}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          d.isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {d.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteBloodDonor(d.id, d.fullName)}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition cursor-pointer"
                          title="Delete Donor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: USERS & ROLES (FULL CRUD) */}
      {/* ========================================================= */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">System Users & Role Management</h3>
              <p className="text-xs text-slate-500">
                Grant ADMIN, MODERATOR, or DONOR roles. You can also suspend or delete accounts.
              </p>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              {usersList.length} Accounts
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Change Role</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <span className="font-bold text-slate-900 block">{u.fullName}</span>
                      <span className="text-[11px] text-slate-400">{u.email}</span>
                    </td>
                    <td className="p-3 text-slate-600">{u.phone}</td>
                    <td className="p-3 text-slate-600">{u.district}, {u.division}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        u.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : u.role === 'VOLUNTEER'
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleToggleUserStatus(u.id)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                          u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Suspended'}
                      </button>
                    </td>
                    <td className="p-3">
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
                    <td className="p-3 text-right">
                      {user?.id !== u.id && (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.fullName)}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: BENEFICIARIES (FULL CRUD) */}
      {/* ========================================================= */}
      {activeTab === 'beneficiaries' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Beneficiary Aid Stories</h3>
              <p className="text-xs text-slate-500">Transparent record of humanitarian assistance delivered.</p>
            </div>
            <button
              onClick={() => setIsNewBenOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Beneficiary</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {beneficiariesList.map((b) => (
              <div key={b.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <img src={b.photoUrl} alt={b.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{b.name}</h4>
                      <p className="text-xs text-slate-500">{b.location} • {b.category}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-3 italic">"{b.story}"</p>
                  <div className="flex items-center justify-between text-xs font-semibold pt-1">
                    <span className="text-blue-600">{b.category}</span>
                    <span className="text-emerald-600 font-bold">Target: ৳{b.supportRequired?.toLocaleString()}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-end">
                  <button
                    onClick={() => handleDeleteBeneficiary(b.id)}
                    className="p-1 hover:bg-rose-50 text-rose-600 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: BLOG & NEWS (FULL CRUD) */}
      {/* ========================================================= */}
      {activeTab === 'blog' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Articles & Field Reports</h3>
              <p className="text-xs text-slate-500">Publish news, medical stories, and ground updates.</p>
            </div>
            <button
              onClick={() => setIsNewBlogOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publish Article</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {blogPostsList.map((p) => (
              <div key={p.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img src={p.coverImage} alt={p.title} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm line-clamp-1">{p.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-1">{p.excerpt}</p>
                    <span className="text-[11px] text-blue-600 font-medium">{p.category} • {p.publishedDate}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteBlog(p.id)}
                  className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition cursor-pointer"
                  title="Delete Post"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: GALLERY (FULL CRUD) */}
      {/* ========================================================= */}
      {activeTab === 'gallery' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Field Photos & Media Gallery</h3>
              <p className="text-xs text-slate-500">Upload photos of medical camps, aid distribution, and relief.</p>
            </div>
            <button
              onClick={() => setIsNewGalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Photo</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {galleryList.map((g) => (
              <div key={g.id} className="relative group rounded-2xl overflow-hidden border border-slate-200">
                <img src={g.imageUrl} alt={g.title} className="w-full h-36 object-cover" />
                <div className="p-2.5 bg-white space-y-0.5">
                  <p className="font-bold text-slate-900 text-xs line-clamp-1">{g.title}</p>
                  <p className="text-[10px] text-slate-400">{g.description || g.category}</p>
                </div>
                <button
                  onClick={() => handleDeleteGallery(g.id)}
                  className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition shadow-sm cursor-pointer"
                  title="Delete Photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: NEON DATABASE MANAGEMENT (CRITICAL) */}
      {/* ========================================================= */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    dbStatus?.isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Neon PostgreSQL Cloud Database Management
                  </h3>
                  <p className="text-xs text-slate-500">
                    Status:{' '}
                    <span className={`font-bold ${dbStatus?.isConnected ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {dbStatus?.provider}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchDbStatus}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Check Status</span>
                </button>
                {dbStatus?.isConnected && (
                  <button
                    onClick={handleSyncAllToNeon}
                    disabled={isSyncingNeon}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingNeon ? 'animate-spin' : ''}`} />
                    <span>Sync All Data to Neon</span>
                  </button>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-600 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              {dbStatus?.message}
            </p>

            <form onSubmit={handleConnectNeon} className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-700">
                Connect / Update Neon Database URL (DATABASE_URL)
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="postgresql://username:password@ep-sample-pool.us-east-2.aws.neon.tech/neondb?sslmode=require"
                  value={neonUrlInput}
                  onChange={(e) => setNeonUrlInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={isConnectingNeon}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shrink-0 cursor-pointer disabled:opacity-60"
                >
                  {isConnectingNeon ? 'Connecting...' : 'Connect to Neon Now'}
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Tip: Copy the connection string from your Neon.tech Console dashboard and paste it here. All tables will auto-initialize!
              </p>
            </form>

            {dbStatus?.isConnected && (
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 uppercase mb-3">Live Neon Table Row Counts</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs">
                  {Object.entries(neonTableCounts).map(([table, count]) => (
                    <div key={table} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                      <span className="text-[11px] text-slate-500 font-mono block">{table}</span>
                      <span className="text-lg font-black text-slate-800">{count} rows</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Neon PostgreSQL Schema DDL Script</h4>
                <p className="text-xs text-slate-500">
                  You can also copy and run this pure SQL script directly in the Neon Console SQL Editor.
                </p>
              </div>
              <button
                onClick={handleCopySql}
                className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copied!' : 'Copy SQL Script'}</span>
              </button>
            </div>

            <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl font-mono text-xs overflow-x-auto max-h-72">
              <pre>{neonSqlScript || '-- Loading SQL script...'}</pre>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: VOLUNTEERS */}
      {/* ========================================================= */}
      {activeTab === 'volunteers' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Volunteer Applications</h3>
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

                <div className="flex items-center gap-2">
                  {v.status === 'Pending' && (
                    <>
                      <button
                        onClick={() => handleVolunteerApproval(v.id, 'Approved')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleVolunteerApproval(v.id, 'Rejected')}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDeleteVolunteer(v.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                    title="Delete Volunteer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: CONTACTS */}
      {/* ========================================================= */}
      {activeTab === 'contacts' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Inquiries & Contact Messages</h3>
          <div className="divide-y divide-slate-100 text-xs">
            {contacts.map((c) => (
              <div key={c.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-slate-900">{c.name} ({c.email})</span>
                  <p className="text-slate-600 mt-0.5">{c.message}</p>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0">{new Date(c.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: AUDIT LOGS */}
      {/* ========================================================= */}
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

      {/* ========================================================= */}
      {/* MODAL: CAMPAIGN CREATE & EDIT */}
      {/* ========================================================= */}
      {isNewCampOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              {editingCamp ? 'Update Campaign Details' : 'Launch New Campaign'}
            </h3>
            <form onSubmit={handleSaveCampaign} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Campaign Title *</label>
                <input
                  type="text"
                  value={campTitle}
                  onChange={(e) => setCampTitle(e.target.value)}
                  className="w-full px-3.5 py-2 border rounded-xl border-slate-300"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={campCategory}
                    onChange={(e) => setCampCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl border-slate-300"
                  >
                    <option value="Medical Support">Medical Support</option>
                    <option value="Disaster Relief">Disaster Relief</option>
                    <option value="Education">Education</option>
                    <option value="Food">Food</option>
                    <option value="Winter Aid">Winter Aid</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target (BDT) *</label>
                  <input
                    type="number"
                    value={campTarget}
                    onChange={(e) => setCampTarget(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl border-slate-300"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Featured Image URL</label>
                <input
                  type="url"
                  value={campImage}
                  onChange={(e) => setCampImage(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl border-slate-300"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Description *</label>
                <textarea
                  rows={4}
                  value={campFullDesc}
                  onChange={(e) => setCampFullDesc(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl border-slate-300"
                  required
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="font-bold text-slate-700">Urgent Emergency Banner?</span>
                <input
                  type="checkbox"
                  checked={campUrgent}
                  onChange={(e) => setCampUrgent(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded-sm cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition cursor-pointer"
                >
                  {editingCamp ? 'Save Changes' : 'Create Campaign'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewCampOpen(false)}
                  className="py-2.5 px-4 border border-slate-200 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: BLOOD REQUEST CREATE */}
      {/* ========================================================= */}
      {isNewBloodReqOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">New Emergency Blood Appeal</h3>
            <form onSubmit={handleSaveBloodRequest} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Patient Name *</label>
                <input
                  type="text"
                  required
                  value={bloodPatientName}
                  onChange={(e) => setBloodPatientName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Blood Group *</label>
                  <select
                    value={bloodReqGroup}
                    onChange={(e) => setBloodReqGroup(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl border-slate-300 font-bold"
                  >
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Required Units</label>
                  <input
                    type="number"
                    min="1"
                    value={bloodUnits}
                    onChange={(e) => setBloodUnits(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hospital Name & Address *</label>
                <input
                  type="text"
                  required
                  value={bloodHospital}
                  onChange={(e) => setBloodHospital(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">District *</label>
                  <input
                    type="text"
                    value={bloodDistrict}
                    onChange={(e) => setBloodDistrict(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Emergency Level</label>
                  <select
                    value={bloodEmergency}
                    onChange={(e) => setBloodEmergency(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl border-slate-300"
                  >
                    <option value="Critical">Critical</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Normal">Normal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Attendant</label>
                  <input
                    type="text"
                    value={bloodContactPerson}
                    onChange={(e) => setBloodContactPerson(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    value={bloodContactPhone}
                    onChange={(e) => setBloodContactPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl border-slate-300"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition cursor-pointer"
                >
                  Publish Blood Appeal
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewBloodReqOpen(false)}
                  className="py-2.5 px-4 border border-slate-200 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: BENEFICIARY CREATE */}
      {/* ========================================================= */}
      {isNewBenOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Add Beneficiary Record</h3>
            <form onSubmit={handleCreateBeneficiary} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Beneficiary Name *</label>
                <input
                  type="text"
                  required
                  value={benName}
                  onChange={(e) => setBenName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={benLocation}
                    onChange={(e) => setBenLocation(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Amount (BDT)</label>
                  <input
                    type="number"
                    value={benTarget}
                    onChange={(e) => setBenTarget(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={benCategory}
                  onChange={(e) => setBenCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl border-slate-300"
                >
                  <option value="Patient">Patient</option>
                  <option value="Child">Child</option>
                  <option value="Student">Student</option>
                  <option value="Elderly">Elderly</option>
                  <option value="Family">Family</option>
                  <option value="Disaster affected">Disaster affected</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Story & Assistance Summary *</label>
                <textarea
                  rows={3}
                  required
                  value={benStory}
                  onChange={(e) => setBenStory(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl border-slate-300"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition cursor-pointer"
                >
                  Save Record
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewBenOpen(false)}
                  className="py-2.5 px-4 border border-slate-200 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: BLOG CREATE */}
      {/* ========================================================= */}
      {isNewBlogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Publish Blog Article</h3>
            <form onSubmit={handleCreateBlog} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={blogTitle}
                  onChange={(e) => setBlogTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <input
                  type="text"
                  value={blogCategory}
                  onChange={(e) => setBlogCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Content *</label>
                <textarea
                  rows={5}
                  required
                  value={blogContent}
                  onChange={(e) => setBlogContent(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl border-slate-300"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition cursor-pointer"
                >
                  Publish Article
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewBlogOpen(false)}
                  className="py-2.5 px-4 border border-slate-200 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: GALLERY CREATE */}
      {/* ========================================================= */}
      {isNewGalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Add Photo to Gallery</h3>
            <form onSubmit={handleCreateGallery} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Caption / Title *</label>
                <input
                  type="text"
                  required
                  value={galTitle}
                  onChange={(e) => setGalTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Image URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={galImage}
                  onChange={(e) => setGalImage(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={galCategory}
                  onChange={(e) => setGalCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl border-slate-300"
                >
                  <option value="Health Camp">Health Camp</option>
                  <option value="Disaster Relief">Disaster Relief</option>
                  <option value="Blood Drive">Blood Drive</option>
                  <option value="Education">Education</option>
                  <option value="Food Distribution">Food Distribution</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={galDesc}
                  onChange={(e) => setGalDesc(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl border-slate-300"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition cursor-pointer"
                >
                  Add Photo
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewGalOpen(false)}
                  className="py-2.5 px-4 border border-slate-200 rounded-xl cursor-pointer"
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