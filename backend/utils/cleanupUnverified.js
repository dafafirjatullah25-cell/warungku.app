const User = require('../models/User');
const { Op } = require('sequelize');

const cleanupUnverified = async () => {
  try {
    const deleted = await User.destroy({
      where: {
        isVerified: false,
        otpExpiry: { [Op.lt]: new Date() } // OTP sudah kadaluarsa
      }
    });

    if (deleted > 0) {
      console.log(`[Cleanup] ${deleted} akun belum terverifikasi dihapus`);
    }
  } catch (error) {
    console.error('[Cleanup] Gagal:', error.message);
  }
};

// Jalankan cleanup setiap 10 menit
const startCleanupJob = () => {
  console.log('[Cleanup] Auto-cleanup akun belum terverifikasi aktif (interval: 10 menit)');
  
  // Jalankan langsung saat server start
  cleanupUnverified();
  
  // Lalu setiap 10 menit
  setInterval(cleanupUnverified, 10 * 60 * 1000);
};

module.exports = { startCleanupJob, cleanupUnverified };
