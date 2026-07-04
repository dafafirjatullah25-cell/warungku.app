const { Op } = require('sequelize');
const { Order, OrderItem, User, ArchivedOrder } = require('../models');

const ARCHIVE_AFTER_DAYS = 30; // arsipkan pesanan delivered setelah 30 hari

const archiveDeliveredOrders = async () => {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - ARCHIVE_AFTER_DAYS);

    // Cari pesanan delivered yang sudah lewat batas waktu
    const oldOrders = await Order.findAll({
      where: {
        status: 'delivered',
        updatedAt: { [Op.lt]: cutoff }
      },
      include: [
        { model: OrderItem, as: 'items' },
        { model: User, as: 'customer', attributes: ['name', 'email'] }
      ]
    });

    if (oldOrders.length === 0) return;

    let archived = 0;
    for (const order of oldOrders) {
      // Cek apakah sudah pernah diarsipkan (jaga duplikat)
      const alreadyArchived = await ArchivedOrder.findByPk(order.id);
      if (alreadyArchived) {
        await order.destroy(); // sudah ada di arsip, hapus saja dari tabel aktif
        continue;
      }

      // Salin ke tabel arsip dengan snapshot items
      await ArchivedOrder.create({
        id: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        customerName: order.customer?.name || null,
        customerEmail: order.customer?.email || null,
        totalAmount: order.totalAmount,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        notes: order.notes,
        itemsSnapshot: (order.items || []).map(item => ({
          productName: item.productName,
          quantity: item.quantity,
          price: parseFloat(item.price),
          subtotal: parseFloat(item.subtotal)
        })),
        orderedAt: order.createdAt,
        archivedAt: new Date()
      });

      // Hapus dari tabel aktif (cascade hapus OrderItems & Payment juga)
      await order.destroy();
      archived++;
    }

    if (archived > 0) {
      console.log(`[Archive] ${archived} pesanan delivered diarsipkan (>${ARCHIVE_AFTER_DAYS} hari)`);
    }
  } catch (error) {
    console.error('[Archive] Gagal:', error.message);
  }
};

// Jalankan setiap 6 jam
const startArchiveJob = () => {
  const INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 jam
  console.log(`[Archive] Auto-archive pesanan delivered aktif (interval: 6 jam, threshold: ${ARCHIVE_AFTER_DAYS} hari)`);

  // Jalankan sekali saat server start
  archiveDeliveredOrders();

  // Lalu setiap 6 jam
  setInterval(archiveDeliveredOrders, INTERVAL_MS);
};

module.exports = { startArchiveJob, archiveDeliveredOrders, ARCHIVE_AFTER_DAYS };
