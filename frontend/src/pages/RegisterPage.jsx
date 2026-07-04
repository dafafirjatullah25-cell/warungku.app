import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.address.trim()) {
      toast.error('Alamat rumah wajib diisi');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/register', { ...form, role: 'customer' });
      toast.success('Kode verifikasi dikirim ke email Anda!');
      navigate('/verify-otp', { state: { email: form.email } });
    } catch (err) {
      const msg = err.response?.data?.message
        || err.response?.data?.errors?.[0]?.msg
        || 'Registrasi gagal';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const field = (label, key, type = 'text', placeholder = '', required = true) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-sm"
        placeholder={placeholder}
        required={required}
      />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-8">
      <div className="w-full max-w-md px-4">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg mb-4">
            <span className="text-4xl">🛍️</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight">Warungku</h1>
          <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium mt-1">Aplikasi Belanja Digital</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">Buat akun baru</h2>
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">Daftar untuk mulai berbelanja</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {field('Nama Lengkap', 'name', 'text', 'Nama Anda')}
            {field('Email', 'email', 'email', 'emailanda@gmail.com')}
            {field('Password', 'password', 'password', 'Minimal 6 karakter')}
            {field('Nomor HP', 'phone', 'tel', '08xxxxxxxxxx', true)}

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                Alamat Rumah <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition text-sm"
                placeholder="Jl. Contoh No. 123, Kelurahan, Kecamatan, Kota"
                rows={3}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-3 rounded-xl font-semibold disabled:opacity-50 transition-all shadow-md hover:shadow-lg mt-2"
            >
              {loading ? 'Mengirim kode...' : 'Daftar'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-emerald-600 font-semibold hover:underline">
              Masuk sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
