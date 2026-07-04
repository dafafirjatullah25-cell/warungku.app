import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function VerifyOtpPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const email = state?.email || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef([]);

  // Countdown untuk resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  if (!email) {
    navigate('/register');
    return null;
  }

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // hanya angka
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    // Auto focus ke kotak berikutnya
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      toast.error('Masukkan 6 digit kode OTP');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp: otpString });
      // Simpan token & user
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success('Verifikasi berhasil! Selamat datang 🎉');
      navigate('/shop');
      window.location.reload(); // refresh context
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verifikasi gagal');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await api.post('/auth/resend-otp', { email });
      toast.success('Kode OTP baru telah dikirim');
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal kirim ulang OTP');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
        <div className="text-5xl mb-4">📧</div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Verifikasi Email</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Kode OTP telah dikirim ke:</p>
        <p className="text-blue-600 font-semibold mb-6">{email}</p>

        {/* OTP Input */}
        <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-xl focus:outline-none transition-colors dark:bg-gray-700 dark:text-gray-100 ${
                digit ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/40' : 'border-gray-300 dark:border-gray-600 focus:border-blue-400'
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleVerify}
          disabled={loading || otp.join('').length !== 6}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors mb-4"
        >
          {loading ? 'Memverifikasi...' : 'Verifikasi'}
        </button>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Tidak menerima kode?{' '}
          {countdown > 0 ? (
            <span className="text-gray-400">Kirim ulang dalam {countdown}s</span>
          ) : (
            <button
              onClick={handleResend}
              disabled={resendLoading}
              className="text-blue-600 font-medium hover:underline disabled:opacity-50"
            >
              {resendLoading ? 'Mengirim...' : 'Kirim Ulang'}
            </button>
          )}
        </p>

        <button
          onClick={() => navigate('/register')}
          className="mt-3 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          ← Kembali ke halaman daftar
        </button>
      </div>
    </div>
  );
}
