const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');
const upload = require('../utils/upload');
const path = require('path');
const fs = require('fs');

// Get customer profile
router.get('/profile/:customerId', verifyToken, async (req, res) => {
  try {
    const customer = await User.findByPk(req.params.customerId, {
      attributes: { exclude: ['password'] }
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Hapus akun sendiri (customer request)
router.delete('/account', verifyToken, async (req, res) => {
  try {
    // Hanya bisa hapus akun sendiri
    const customer = await User.findOne({
      where: { id: req.user.id, role: 'customer' }
    });

    if (!customer) {
      return res.status(404).json({ message: 'Akun tidak ditemukan' });
    }

    await customer.destroy();
    res.json({ message: 'Akun berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update customer profile
router.put('/profile/:customerId', verifyToken, async (req, res) => {
  try {
    const customer = await User.findByPk(req.params.customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Pastikan hanya bisa edit profil sendiri
    if (req.user.id !== req.params.customerId) {
      return res.status(403).json({ message: 'Tidak diizinkan mengedit profil orang lain' });
    }

    const { name, phone, address } = req.body;

    // Validasi phone dan address wajib diisi
    if (!phone || !phone.trim()) {
      return res.status(400).json({ message: 'Nomor HP wajib diisi' });
    }
    if (!address || !address.trim()) {
      return res.status(400).json({ message: 'Alamat wajib diisi' });
    }

    // Validasi nama unik case-insensitive jika nama berubah
    if (name && name.trim().toLowerCase() !== customer.name.toLowerCase()) {
      const { Op } = require('sequelize');
      const existingName = await User.findOne({
        where: { name: { [Op.iLike]: name.trim() } }
      });
      if (existingName && existingName.id !== customer.id) {
        return res.status(400).json({ message: 'Nama sudah digunakan pelanggan lain' });
      }
    }

    // Validasi nomor HP unik jika berubah
    if (phone && phone.trim() !== customer.phone) {
      const existingPhone = await User.findOne({
        where: { phone: phone.trim(), isVerified: true }
      });
      if (existingPhone && existingPhone.id !== customer.id) {
        return res.status(400).json({ message: 'Nomor HP sudah digunakan pelanggan lain' });
      }
    }

    await customer.update({
      name: name ? name.trim() : customer.name,
      phone: phone !== undefined ? phone : customer.phone,
      address: address !== undefined ? address : customer.address
    });

    res.json({
      message: 'Profil berhasil diperbarui',
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

// Upload avatar customer
router.post('/avatar', verifyToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'File tidak ditemukan' });

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan' });

    // Hapus avatar lama jika ada
    if (user.avatar) {
      const oldPath = path.join(__dirname, '..', user.avatar);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const avatarPath = `/uploads/products/${req.file.filename}`;
    await user.update({ avatar: avatarPath });

    res.json({ message: 'Foto profil berhasil diupload', avatar: avatarPath });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
