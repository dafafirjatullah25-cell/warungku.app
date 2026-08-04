import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Download } from 'lucide-react';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Cek apakah sudah diinstall sebagai PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
      setIsInstalled(true);
      toast.success('Warungku berhasil diinstall!');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(form.email, form.password);
      toast.success('Login berhasil!');
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/shop');
    } catch (err) {
      const data = err.response?.data;
      // Akun belum diverifikasi → arahkan ke halaman OTP
      if (data?.needVerification) {
        toast('Akun belum diverifikasi, masukkan kode OTP', { icon: '📧' });
        navigate('/verify-otp', { state: { email: data.email } });
        return;
      }
      toast.error(data?.message || 'Login gagal');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
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
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">Selamat datang!</h2>
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-6">Masuk untuk melanjutkan</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                placeholder="email@contoh.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-3 rounded-xl font-semibold disabled:opacity-50 transition-all shadow-md hover:shadow-lg mt-2"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
            Belum punya akun?{' '}
            <Link to="/register" className="text-emerald-600 font-semibold hover:underline">
              Daftar sekarang
            </Link>
          </p>
        </div>

        {/* Tombol Install PWA */}
        {!isInstalled && installPrompt && (
          <div className="mt-4">
            <button
              onClick={handleInstall}
              className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 py-3 rounded-2xl font-semibold shadow-sm hover:shadow-md hover:bg-emerald-50 dark:hover:bg-gray-700 transition-all text-sm"
            >
              <Download size={16} />
              Install Aplikasi Warungku
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">Buka seperti aplikasi tanpa browser</p>
          </div>
        )}
      </div>
    </div>
  );
}
