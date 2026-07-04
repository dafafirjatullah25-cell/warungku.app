const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { sendOTP } = require('../utils/mailer');

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ─── Register ─────────────────────────────────────────────────────
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Format email tidak valid'),
  body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
  body('name').notEmpty().trim().withMessage('Nama tidak boleh kosong'),
  body('phone').notEmpty().trim().withMessage('Nomor HP wajib diisi'),
  body('address').notEmpty().trim().withMessage('Alamat wajib diisi')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password, name, phone, address } = req.body;

    // Cek email domain valid
    const validDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'live.com', 'protonmail.com'];
    const emailDomain = email.split('@')[1];
    if (!validDomains.includes(emailDomain)) {
      return res.status(400).json({ message: 'Gunakan email valid (Gmail, Yahoo, Outlook, dll)' });
    }

    // Cek email sudah terdaftar dan sudah diverifikasi
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail && existingEmail.isVerified) {
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }

    // Cek nama sudah dipakai (case-insensitive: "Dafa" = "dafa" = "DAFA")
    const { Op } = require('sequelize');
    const existingName = await User.findOne({
      where: { name: { [Op.iLike]: name.trim() } }
    });
    if (existingName && existingName.email !== email) {
      return res.status(400).json({ message: 'Nama sudah digunakan pelanggan lain, gunakan nama yang berbeda' });
    }

    // Cek nomor HP sudah dipakai (hanya akun yang sudah terverifikasi)
    const existingPhone = await User.findOne({
      where: { phone: phone.trim(), isVerified: true }
    });
    if (existingPhone && existingPhone.email !== email) {
      return res.status(400).json({ message: 'Nomor HP sudah terdaftar, gunakan nomor yang berbeda' });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 menit

    // Kalau email sudah ada tapi belum verifikasi → update OTP saja
    if (existingEmail && !existingEmail.isVerified) {
      await existingEmail.update({ otp, otpExpiry, password, name: name.trim(), phone, address });
      await sendOTP(email, name.trim(), otp);
      return res.status(200).json({
        message: 'Kode OTP baru telah dikirim ke email Anda',
        email
      });
    }

    // Buat akun baru (belum aktif sampai verifikasi)
    await User.create({
      email,
      password,
      name: name.trim(),
      role: 'customer',
      phone,
      address,
      isVerified: false,
      otpCode: otp,
      otpExpiry
    });

    // Kirim OTP ke email
    await sendOTP(email, name.trim(), otp);

    res.status(201).json({
      message: 'Kode verifikasi telah dikirim ke email Anda',
      email
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengirim email verifikasi. Cek konfigurasi EMAIL di .env' });
  }
});

// ─── Verify OTP ───────────────────────────────────────────────────
router.post('/verify-otp', [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP harus 6 digit')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'Akun tidak ditemukan' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Akun sudah diverifikasi, silakan login' });
    }

    if (user.otpCode !== otp) {
      return res.status(400).json({ message: 'Kode OTP salah' });
    }

    if (new Date() > new Date(user.otpExpiry)) {
      return res.status(400).json({ message: 'Kode OTP sudah kadaluarsa, minta kode baru' });
    }

    // Aktivasi akun
    await user.update({
      isVerified: true,
      otpCode: null,
      otpExpiry: null
    });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      message: 'Verifikasi berhasil! Selamat datang',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Resend OTP ───────────────────────────────────────────────────
router.post('/resend-otp', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) return res.status(404).json({ message: 'Akun tidak ditemukan' });
    if (user.isVerified) return res.status(400).json({ message: 'Akun sudah diverifikasi' });

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await user.update({ otpCode: otp, otpExpiry });
    await sendOTP(email, user.name, otp);

    res.json({ message: 'Kode OTP baru telah dikirim' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengirim ulang OTP' });
  }
});

// ─── Login ────────────────────────────────────────────────────────
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    // Cek apakah sudah verifikasi (admin skip verifikasi)
    if (!user.isVerified && user.role !== 'admin') {
      return res.status(403).json({
        message: 'Akun belum diverifikasi',
        needVerification: true,
        email
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email atau password salah' });
    }

    // Cek batas device untuk akun admin (maks 10)
    const MAX_DEVICES = 10;
    if (user.role === 'admin') {
      const activeTokens = user.activeTokens || [];
      // Filter token yang masih valid (belum expired)
      const validTokens = activeTokens.filter(t => {
        try {
          jwt.verify(t, process.env.JWT_SECRET);
          return true;
        } catch {
          return false;
        }
      });

      if (validTokens.length >= MAX_DEVICES) {
        return res.status(403).json({
          message: `Batas maksimal ${MAX_DEVICES} device aktif tercapai. Keluar dari salah satu device terlebih dahulu.`
        });
      }
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    // Simpan token ke daftar aktif (khusus admin)
    if (user.role === 'admin') {
      const activeTokens = user.activeTokens || [];
      // Bersihkan token expired dulu
      const validTokens = activeTokens.filter(t => {
        try { jwt.verify(t, process.env.JWT_SECRET); return true; }
        catch { return false; }
      });
      validTokens.push(token);
      await user.update({ activeTokens: validTokens });
    }

    res.json({
      message: 'Login berhasil',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Logout ───────────────────────────────────────────────────────
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.json({ message: 'Logged out' });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.json({ message: 'Logged out' });
    }

    // Hapus token dari daftar aktif (khusus admin)
    if (decoded.role === 'admin') {
      const user = await User.findByPk(decoded.id);
      if (user) {
        const filtered = (user.activeTokens || []).filter(t => t !== token);
        await user.update({ activeTokens: filtered });
      }
    }

    res.json({ message: 'Logout berhasil' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
