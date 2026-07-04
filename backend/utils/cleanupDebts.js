const { Op } = require('sequelize');
const { Expense, DebtPayment } = require('../models');

const CLEANUP_AFTER_DAYS = 30;

const cleanupPaidDebts = async () => {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - CLEANUP_AFTER_DAYS);

    // Cari hutang yang sudah lunas dan dilunasi >30 hari lalu
    const paidDebts = await Expense.findAll({
      where: {
        type: 'debt',
        isPaid: true,
        paidAt: { [Op.lt]: cutoff }
      }
    });

    if (paidDebts.length === 0) return;

    for (const debt of paidDebts) {
      // Hapus cicilan dulu (cascade), lalu hapus hutangnya
      await DebtPayment.destroy({ where: { expenseId: debt.id } });
      await debt.destroy();
    }

    console.log(`[Cleanup Hutang] ${paidDebts.length} hutang lunas dihapus (lunas >${CLEANUP_AFTER_DAYS} hari lalu)`);
  } catch (error) {
    console.error('[Cleanup Hutang] Gagal:', error.message);
  }
};

const startDebtCleanupJob = () => {
  const INTERVAL_MS = 24 * 60 * 60 * 1000; // setiap 24 jam
  console.log(`[Cleanup Hutang] Auto-cleanup hutang lunas aktif (interval: 24 jam, threshold: ${CLEANUP_AFTER_DAYS} hari)`);
  cleanupPaidDebts();
  setInterval(cleanupPaidDebts, INTERVAL_MS);
};

module.exports = { startDebtCleanupJob, cleanupPaidDebts };
