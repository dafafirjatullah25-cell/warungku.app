import React, { useEffect, useState } from 'react';
import { User, Save, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });

  useEffect(() => {
    api.get(`/customers/profile/${user.id}`)
      .then(({ data }) => {
        setProfile(data);
        setForm({ name: data.name, phone: data.phone || '', address: data.address || '' });
      })
      .catch(() => toast.error('Gagal memuat profil'))
      .finally(() => setLoading(false));
  }, [user.id]);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Nama tidak boleh kosong'); return; }
    if (!form.phone.trim()) { toast.error('Nomor HP wajib diisi'); return; }
    if (!form.address.trim()) { toast.error('Alamat wajib diisi'); return; }
    setSaving(true);
    try {
      const { data } = await api.put(`/customers/profile/${user.id}`, form);
      setProfile({ ...profile, ...data.customer });
      const stored = JSON.parse(localStorage.getItem('user'));
      localStorage.setItem('user', JSON.stringify({ ...stored, name: data.customer.name }));
      toast.success('Profil berhasil diperbarui');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui profil');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.delete('/customers/account');
      toast.success('Akun berhasil dihapus. Sampai jumpa! 👋');
      logout();
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus akun');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-5">Profil Saya</h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
            <User size={28} className="text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-100 text-lg">{profile?.name}</p>
            <p className="text-gray-400 text-sm">{profile?.email}</p>
          </div>
        </div>

        {!editing ? (
          <>
            <div className="space-y-3 mb-5">
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400 text-sm">Nama</span>
                <span className="text-gray-800 dark:text-gray-100 font-medium">{profile?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400 text-sm">Email</span>
                <span className="text-gray-800 dark:text-gray-100">{profile?.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400 text-sm">Nomor HP</span>
                <span className="text-gray-800 dark:text-gray-100">{profile?.phone || '-'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400 text-sm">Alamat</span>
                <span className="text-gray-800 dark:text-gray-100 text-right max-w-xs">{profile?.address || '-'}</span>
              </div>
            </div>

            <button
              onClick={() => setEditing(true)}
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors mb-3"
            >
              Edit Profil
            </button>

            {/* Tombol hapus akun — terpisah dengan warna berbeda agar tidak salah klik */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center gap-2 border border-red-200 dark:border-red-800 text-red-400 py-2 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 hover:border-red-300 transition-colors"
            >
              <Trash2 size={14} />
              Hapus Akun Saya
            </button>
          </>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Nama <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Nomor HP <span className="text-red-500">*</span></label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="08xxxxxxxxxx"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Alamat Rumah <span className="text-red-500">*</span></label>
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="Jl. Contoh No. 123..."
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                <Save size={15} /> {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button
                onClick={() => { setEditing(false); setForm({ name: profile.name, phone: profile.phone || '', address: profile.address || '' }); }}
                className="flex-1 flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <X size={15} /> Batal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal konfirmasi hapus akun */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteConfirm(false); }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm shadow-xl p-6 border border-gray-200 dark:border-gray-700">
            {/* Ikon peringatan */}
            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={26} className="text-red-500" />
            </div>

            <h2 className="font-bold text-gray-800 dark:text-gray-100 text-lg text-center mb-2">
              Hapus Akun?
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-1">
              Akun <strong>{profile?.name}</strong> akan dihapus permanen.
            </p>
            <p className="text-sm text-gray-400 text-center mb-6">
              Kamu masih bisa daftar ulang kapan saja dengan email yang sama.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700/50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors"
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus Akun'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
