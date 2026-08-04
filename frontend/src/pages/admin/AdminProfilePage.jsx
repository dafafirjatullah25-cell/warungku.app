import React, { useState, useEffect, useRef } from 'react';
import {
  KeyRound, Eye, EyeOff, Save, Users, Plus, Trash2, X,
  ShieldCheck, Pencil, Check, Camera
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { imgUrl } from '../../utils/imgUrl';

const inputCls = 'w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

// ─── Modal Tambah Admin ───────────────────────────────────────────
function AddAdminModal({ onClose, onAdded }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/admin/admins', form);
      toast.success(data.message);
      onAdded();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menambah admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <X size={20} />
        </button>
        <div className="flex items-center gap-2 mb-5">
          <ShieldCheck size={20} className="text-blue-600" />
          <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-lg">Tambah Admin Baru</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Nama <span className="text-red-500">*</span>
            </label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className={inputCls} placeholder="Nama lengkap admin" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              className={inputCls} placeholder="email@example.com" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className={`${inputCls} pr-10`} placeholder="Minimal 6 karakter" required minLength={6} />
              <button type="button" onClick={() => setShowPw(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Batal
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {loading ? 'Menambahkan...' : 'Tambah Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Halaman Utama ────────────────────────────────────────────────
export default function AdminProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  // Cek apakah user yang login adalah superadmin
  const SUPERADMIN_EMAIL = 'admin@kasir.com';
  const isSuperAdmin = user?.email === SUPERADMIN_EMAIL;

  // Edit nama
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [adminAvatar, setAdminAvatar] = useState(user?.avatar || null);
  const avatarInputRef = useRef(null);

  // Ganti password
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [savingPw, setSavingPw] = useState(false);

  // Manajemen admin
  const [admins, setAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const { data } = await api.get('/admin/admins');
      setAdmins(data);
    } catch {
      toast.error('Gagal memuat daftar admin');
    } finally {
      setLoadingAdmins(false);
    }
  };

  useEffect(() => { fetchAdmins(); }, []);

  // ── Upload Avatar ──
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Ukuran foto maksimal 5MB'); return; }
    const formData = new FormData();
    formData.append('avatar', file);
    setUploadingAvatar(true);
    try {
      const { data } = await api.post('/admin/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAdminAvatar(data.avatar);
      if (updateUser) updateUser({ avatar: data.avatar });
      toast.success('Foto profil berhasil diubah!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal upload foto');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ── Edit nama ──
  const startEditName = () => {
    setNameInput(user?.name || '');
    setEditingName(true);
  };

  const handleSaveName = async () => {
    if (!nameInput.trim()) { toast.error('Nama tidak boleh kosong'); return; }
    if (nameInput.trim() === user?.name) { setEditingName(false); return; }
    setSavingName(true);
    try {
      const { data } = await api.put('/admin/profile/update-name', { name: nameInput.trim() });
      toast.success(data.message);
      // Update context supaya nama di navbar ikut berubah
      if (updateUser) updateUser({ name: data.name });
      setEditingName(false);
      fetchAdmins(); // refresh tabel supaya nama terbaru muncul
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui nama');
    } finally {
      setSavingName(false);
    }
  };

  // ── Hapus admin ──
  const handleDeleteAdmin = async (admin) => {
    if (!window.confirm(`Hapus admin "${admin.name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setDeletingId(admin.id);
    try {
      const { data } = await api.delete(`/admin/admins/${admin.id}`);
      toast.success(data.message);
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus admin');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Ganti password ──
  const handleSubmitPw = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }
    setSavingPw(true);
    try {
      const { data } = await api.put('/admin/profile/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword
      });
      toast.success(data.message);
      setTimeout(() => { logout(); navigate('/login'); }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah password');
    } finally {
      setSavingPw(false);
    }
  };

  const toggle = (field) => setShow(s => ({ ...s, [field]: !s[field] }));

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">Profil Admin</h1>
        <p className="text-sm text-gray-400">Kelola akun dan keamanan</p>
      </div>

      {/* ─── Info Akun + Edit Nama + Ganti Password ─── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header info */}
        <div className="flex items-center gap-4 p-5 border-b border-gray-100 dark:border-gray-700">
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center overflow-hidden">
              {adminAvatar ? (
                <img src={imgUrl(adminAvatar)} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">⚡</span>
              )}
            </div>
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors disabled:opacity-50"
              title="Ganti foto profil"
            >
              {uploadingAvatar ? (
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera size={12} />
              )}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div className="flex-1 min-w-0">
            {/* Nama — mode edit / tampil */}
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false); }}
                  className="border border-blue-400 dark:border-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
                  autoFocus
                />
                <button onClick={handleSaveName} disabled={savingName}
                  className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  <Check size={14} />
                </button>
                <button onClick={() => setEditingName(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="font-bold text-gray-800 dark:text-gray-100 text-lg truncate">{user?.name}</p>
                <button onClick={startEditName}
                  className="p-1 rounded text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex-shrink-0"
                  title="Edit nama">
                  <Pencil size={14} />
                </button>
              </div>
            )}
            <p className="text-sm text-gray-400 mt-0.5">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium inline-block">
                Administrator
              </span>
              {isSuperAdmin && (
                <span className="text-xs bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-full font-medium inline-block">
                  👑 CEO
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Ganti Password */}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-5">
            <KeyRound size={18} className="text-blue-600" />
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">Ubah Password</h2>
          </div>

          <form onSubmit={handleSubmitPw} className="space-y-4 max-w-md">
            {/* Password Lama */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Password Lama <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={show.current ? 'text' : 'password'}
                  value={pwForm.currentPassword}
                  onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  className={`${inputCls} pr-10`}
                  placeholder="Masukkan password saat ini"
                  required
                />
                <button type="button" onClick={() => toggle('current')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  {show.current ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Password Baru */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Password Baru <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={show.new ? 'text' : 'password'}
                  value={pwForm.newPassword}
                  onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  className={`${inputCls} pr-10`}
                  placeholder="Minimal 6 karakter"
                  required minLength={6}
                />
                <button type="button" onClick={() => toggle('new')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  {show.new ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Konfirmasi Password Baru */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Konfirmasi Password Baru <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={show.confirm ? 'text' : 'password'}
                  value={pwForm.confirmPassword}
                  onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  className={`${inputCls} pr-10`}
                  placeholder="Ulangi password baru"
                  required
                />
                <button type="button" onClick={() => toggle('confirm')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  {show.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {pwForm.confirmPassword && (
                <p className={`text-xs mt-1 ${pwForm.newPassword === pwForm.confirmPassword ? 'text-green-500' : 'text-red-500'}`}>
                  {pwForm.newPassword === pwForm.confirmPassword ? '✓ Password cocok' : '✗ Password tidak cocok'}
                </p>
              )}
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg px-3 py-2.5">
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                ⚠ Setelah password diubah, semua device yang sedang login akan otomatis keluar dan perlu login ulang.
              </p>
            </div>

            <button
              type="submit"
              disabled={savingPw || pwForm.newPassword !== pwForm.confirmPassword || !pwForm.currentPassword || !pwForm.newPassword}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={16} />
              {savingPw ? 'Menyimpan...' : 'Simpan Password Baru'}
            </button>
          </form>
        </div>
      </div>

      {/* ─── Tabel Daftar Admin ─── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-blue-600" />
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">Daftar Admin Terdaftar</h2>
            {!loadingAdmins && (
              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                {admins.length} akun
              </span>
            )}
          </div>
          {isSuperAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={15} />
              Tambah Admin
            </button>
          )}        </div>

        {loadingAdmins ? (
          <div className="text-center py-12 text-gray-400 text-sm">Memuat data...</div>
        ) : admins.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">Belum ada data admin</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  <th className="text-left px-5 py-3 font-medium">#</th>
                  <th className="text-left px-5 py-3 font-medium">Nama</th>
                  <th className="text-left px-5 py-3 font-medium">Email</th>
                  <th className="text-left px-5 py-3 font-medium">Terdaftar</th>
                  <th className="text-center px-5 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {admins.map((admin, idx) => {
                  const isSelf = admin.id === user?.id;
                  return (
                    <tr key={admin.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-5 py-3.5 text-gray-400">{idx + 1}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${admin.email === SUPERADMIN_EMAIL ? 'bg-yellow-100 dark:bg-yellow-900/40' : 'bg-emerald-100 dark:bg-emerald-900/40'}`}>
                            {admin.avatar
                              ? <img src={imgUrl(admin.avatar)} alt={admin.name} className="w-full h-full object-cover" />
                              : <span className={`text-sm font-bold ${admin.email === SUPERADMIN_EMAIL ? 'text-yellow-600 dark:text-yellow-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                  {admin.name.charAt(0).toUpperCase()}
                                </span>
                            }
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium text-gray-800 dark:text-gray-100">{admin.name}</span>
                            {admin.email === SUPERADMIN_EMAIL && (
                              <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 rounded-full">
                                👑 CEO
                              </span>
                            )}
                            {isSelf && (
                              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-full">
                                Anda
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400">{admin.email}</td>
                      <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap">{formatDate(admin.createdAt)}</td>
                      <td className="px-5 py-3.5 text-center">
                        {/* Hanya superadmin yang bisa hapus, tidak bisa hapus diri sendiri */}
                        {isSuperAdmin && !isSelf ? (
                          <button
                            onClick={() => handleDeleteAdmin(admin)}
                            disabled={deletingId === admin.id}
                            className="inline-flex items-center gap-1 text-red-500 hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-medium"
                          >
                            <Trash2 size={14} />
                            {deletingId === admin.id ? 'Menghapus...' : 'Hapus'}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-300 dark:text-gray-600 italic">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddAdminModal onClose={() => setShowAddModal(false)} onAdded={fetchAdmins} />
      )}
    </div>
  );
}
