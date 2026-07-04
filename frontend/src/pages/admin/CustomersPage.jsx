import React, { useEffect, useState, useMemo } from 'react';
import { Search, Trash2, KeyRound, X, User, Phone, Mail, MapPin, Calendar, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const inputCls = 'w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const selectCls = 'text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [deletingId, setDeletingId] = useState(null);
  const [resetModal, setResetModal] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [profileModal, setProfileModal] = useState(null);

  const fetchCustomers = () => {
    setLoading(true);
    api.get('/admin/customers?page=1&limit=200')
      .then(({ data }) => setCustomers(data.customers))
      .catch(() => toast.error('Gagal memuat pelanggan'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetchCustomers(); }, []);

  const filteredCustomers = useMemo(() => {
    let r = [...customers];
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.phone||'').includes(q));
    }
    if (filterStatus === 'verified') r = r.filter(c => c.isVerified);
    else if (filterStatus === 'unverified') r = r.filter(c => !c.isVerified);
    if (sortBy === 'newest') r.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (sortBy === 'oldest') r.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
    else if (sortBy === 'name_az') r.sort((a,b) => a.name.localeCompare(b.name));
    else if (sortBy === 'name_za') r.sort((a,b) => b.name.localeCompare(a.name));
    return r;
  }, [customers, search, filterStatus, sortBy]);

  const hasFilter = search || filterStatus || sortBy !== 'newest';

  const handleDelete = async (customer) => {
    if (!window.confirm(`Hapus pelanggan "${customer.name}"?`)) return;
    setDeletingId(customer.id);
    try {
      await api.delete(`/admin/customers/${customer.id}`);
      toast.success(`Pelanggan "${customer.name}" berhasil dihapus`);
      fetchCustomers();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menghapus'); }
    finally { setDeletingId(null); }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) { toast.error('Password minimal 6 karakter'); return; }
    setResetting(true);
    try {
      const { data } = await api.put(`/admin/customers/${resetModal.id}/reset-password`, { newPassword });
      toast.success(data.message); setResetModal(null); setNewPassword('');
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal reset password'); }
    finally { setResetting(false); }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Manajemen Pelanggan</h1>
          <p className="text-sm text-gray-400 mt-0.5">Kelola akun pelanggan yang terdaftar</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama, email, no. HP..." className={`${inputCls} pl-9`} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={selectCls}>
          <option value="">Semua Status</option>
          <option value="verified">Terverifikasi</option>
          <option value="unverified">Belum Verifikasi</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={selectCls}>
          <option value="newest">Terbaru</option>
          <option value="oldest">Terlama</option>
          <option value="name_az">Nama: A → Z</option>
          <option value="name_za">Nama: Z → A</option>
        </select>
        {hasFilter && (
          <button onClick={() => { setSearch(''); setFilterStatus(''); setSortBy('newest'); }}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 flex items-center gap-1 px-2">
            <X size={14} /> Reset
          </button>
        )}
        <span className="text-sm text-gray-400 self-center ml-auto">{filteredCustomers.length} pelanggan</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map(c => (
              <div key={c.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                    <User size={18} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">{c.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {c.isVerified ? 'Terverifikasi' : 'Belum Verifikasi'}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2 truncate"><Mail size={13} className="flex-shrink-0 text-gray-400" /><span className="truncate">{c.email}</span></div>
                  <div className="flex items-center gap-2"><Phone size={13} className="flex-shrink-0 text-gray-400" /><span>{c.phone || '-'}</span></div>
                </div>
                <div className="flex gap-2 pt-1 border-t border-gray-100 dark:border-gray-700">
                  <button onClick={() => setProfileModal(c)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 py-1.5 rounded-lg font-medium transition-colors">
                    Lihat Profil <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredCustomers.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center text-gray-400">
              {customers.length === 0 ? 'Belum ada pelanggan terdaftar' : 'Tidak ada pelanggan yang cocok dengan filter'}
            </div>
          )}
        </>
      )}

      {/* Modal Profil */}
      {profileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) setProfileModal(null); }}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-bold text-lg text-gray-800 dark:text-gray-100">Profil Pelanggan</h2>
              <button onClick={() => setProfileModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                  <User size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-800 dark:text-gray-100 text-lg">{profileModal.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${profileModal.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {profileModal.isVerified ? '✓ Terverifikasi' : '⏳ Belum Verifikasi'}
                  </span>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                {[
                  { icon: Mail, label: 'Email', value: profileModal.email },
                  { icon: Phone, label: 'Telepon', value: profileModal.phone || '-' },
                  { icon: MapPin, label: 'Alamat', value: profileModal.address || '-' },
                  { icon: Calendar, label: 'Terdaftar sejak', value: formatDate(profileModal.createdAt) },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex gap-3">
                    <Icon size={15} className="text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className="text-gray-800 dark:text-gray-200 break-all">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <button onClick={() => { setProfileModal(null); setResetModal({ id: profileModal.id, name: profileModal.name }); setNewPassword(''); }}
                className="flex-1 flex items-center justify-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 text-blue-600 py-2.5 rounded-xl text-sm font-medium">
                <KeyRound size={15} /> Reset PW
              </button>
              <button onClick={() => { const t = profileModal; setProfileModal(null); handleDelete(t); }} disabled={deletingId === profileModal.id}
                className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 text-red-500 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40">
                <Trash2 size={15} /> Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reset Password */}
      {resetModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg text-gray-800 dark:text-gray-100">Reset Password</h2>
              <button onClick={() => setResetModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={20} /></button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Set password baru untuk <strong className="text-gray-700 dark:text-gray-200">{resetModal.name}</strong></p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password Baru</label>
              <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputCls} placeholder="Minimal 6 karakter" autoFocus />
            </div>
            <div className="flex gap-3">
              <button onClick={handleResetPassword} disabled={resetting} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {resetting ? 'Menyimpan...' : 'Reset Password'}
              </button>
              <button onClick={() => setResetModal(null)} className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
