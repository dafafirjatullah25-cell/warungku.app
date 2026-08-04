const express = require('express');
const router = express.Router();
const { User, Product, Order, OrderItem, Payment, Expense, DebtPayment } = require('../models');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { Op } = require('sequelize');
const upload = require('../utils/upload');
const path = require('path');
const fs = require('fs');

// All admin routes require authentication + admin role
router.use(verifyToken, isAdmin);

// ─── Dashboard Stats ───────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      todayOrders,
      totalRevenue,
      todayRevenue,
      totalProducts,
      totalCustomers,
      pendingOrders,
      recentOrders
    ] = await Promise.all([
      Order.count(),
      Order.count({ where: { createdAt: { [Op.gte]: today } } }),
      Order.sum('totalAmount', {
        where: {
          [Op.or]: [
            { paymentMethod: 'cash', status: 'delivered' },         // tunai: saat delivered
            { paymentMethod: 'online', paymentStatus: 'paid' }      // online: saat sudah dibayar
          ]
        }
      }),
      Order.sum('totalAmount', {
        where: {
          createdAt: { [Op.gte]: today },
          [Op.or]: [
            { paymentMethod: 'cash', status: 'delivered' },
            { paymentMethod: 'online', paymentStatus: 'paid' }
          ]
        }
      }),
      Product.count({ where: { isActive: true } }),
      User.count({ where: { role: 'customer', isVerified: true } }),
      Order.count({ where: { status: 'pending' } }),
      Order.findAll({
        limit: 5,
        order: [['createdAt', 'DESC']],
        include: [{ model: User, as: 'customer', attributes: ['name', 'email'] }]
      })
    ]);

    res.json({
      stats: {
        totalOrders,
        todayOrders,
        totalRevenue: totalRevenue || 0,
        todayRevenue: todayRevenue || 0,
        totalProducts,
        totalCustomers,
        pendingOrders
      },
      recentOrders
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Manage Orders ─────────────────────────────────────────────────
router.get('/orders', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = status ? { status } : {};

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        { model: User, as: 'customer', attributes: ['name', 'email', 'phone'], required: false },
        { model: OrderItem, as: 'items' },
        { model: Payment, as: 'payment' }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      orders: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Buat Pesanan Manual (Walk-in) ────────────────────────────────
router.post('/orders', async (req, res) => {
  try {
    const { items, notes, paymentMethod, customerName, paymentStatus } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Item pesanan tidak boleh kosong' });
    }

    // Hitung total dan validasi stok
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findByPk(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Produk ${item.productId} tidak ditemukan` });
      }
      if (!product.isActive) {
        return res.status(400).json({ message: `Produk "${product.name}" tidak aktif` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Stok "${product.name}" tidak cukup (tersedia: ${product.stock})`
        });
      }

      const subtotal = parseFloat(product.price) * item.quantity;
      totalAmount += subtotal;
      validatedItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        price: parseFloat(product.price),
        subtotal
      });
    }

    // Buat order walk-in (tanpa customerId)
    const orderNumber = `WLK-${Date.now()}`;
    const method = paymentMethod || 'cash';
    const order = await Order.create({
      orderNumber,
      customerId: null,
      customerName: customerName ? customerName.trim() : 'Pelanggan Walk-in',
      isWalkIn: true,
      totalAmount,
      paymentMethod: method,
      // Jika cash, bisa langsung set paid; jika admin tentukan status lain, ikuti
      paymentStatus: paymentStatus || (method === 'cash' ? 'paid' : 'unpaid'),
      status: 'delivered', // pesanan manual langsung selesai
      notes: notes || null
    });

    // Buat order items + kurangi stok
    for (const item of validatedItems) {
      await OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal
      });

      await Product.decrement('stock', {
        by: item.quantity,
        where: { id: item.productId }
      });
    }

    // Ambil order lengkap untuk response
    const fullOrder = await Order.findByPk(order.id, {
      include: [{ model: OrderItem, as: 'items' }]
    });

    res.status(201).json({
      message: 'Pesanan manual berhasil dibuat',
      order: fullOrder
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    // Hanya izinkan status pending, delivered, cancelled
    const allowedStatus = ['pending', 'delivered', 'cancelled'];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ message: 'Status tidak valid' });
    }

    const order = await Order.findByPk(req.params.id, {
      include: [{ model: OrderItem, as: 'items' }]
    });
    if (!order) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

    // Jangan proses kalau status sama
    if (order.status === status) {
      return res.status(400).json({ message: 'Status sudah sama' });
    }

    // Kalau di-cancel → kembalikan stok + hapus order
    if (status === 'cancelled' && order.status !== 'cancelled') {
      for (const item of order.items) {
        await Product.increment('stock', {
          by: item.quantity,
          where: { id: item.productId }
        });
      }
      // Hapus order dari database
      await order.destroy();
      return res.json({ message: 'Pesanan dibatalkan, stok dikembalikan, dan data dihapus' });
    }

    // Update status (untuk delivered, dll)
    await order.update({ status });
    res.json({ message: 'Status pesanan diperbarui', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Manage Customers ──────────────────────────────────────────────
router.get('/customers', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const where = { role: 'customer', isVerified: true };
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json({
      customers: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Hapus pelanggan (admin only)
router.delete('/customers/:id', async (req, res) => {
  try {
    const customer = await User.findOne({
      where: { id: req.params.id, role: 'customer' }
    });

    if (!customer) {
      return res.status(404).json({ message: 'Pelanggan tidak ditemukan' });
    }

    await customer.destroy();
    res.json({ message: 'Pelanggan berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reset password pelanggan (admin only)
router.put('/customers/:id/reset-password', async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password baru minimal 6 karakter' });
    }

    const customer = await User.findOne({
      where: { id: req.params.id, role: 'customer' }
    });

    if (!customer) {
      return res.status(404).json({ message: 'Pelanggan tidak ditemukan' });
    }

    // Hash password baru
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    await customer.update({ password: hashed });
    res.json({ message: `Password ${customer.name} berhasil direset` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Admin: Update Nama Sendiri ───────────────────────────────────
router.put('/profile/update-name', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Nama tidak boleh kosong' });
    }

    const admin = await User.findByPk(req.user.id);
    if (!admin) return res.status(404).json({ message: 'Admin tidak ditemukan' });

    await admin.update({ name: name.trim() });
    res.json({ message: 'Nama berhasil diperbarui', name: admin.name });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Admin: Ganti Password Sendiri ────────────────────────────────
router.put('/profile/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Password lama dan baru wajib diisi' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password baru minimal 6 karakter' });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'Password baru tidak boleh sama dengan yang lama' });
    }

    const admin = await User.findByPk(req.user.id);
    if (!admin) return res.status(404).json({ message: 'Admin tidak ditemukan' });

    const isValid = await admin.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(400).json({ message: 'Password lama salah' });
    }

    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    // Hapus semua token aktif — paksa login ulang di semua device
    await admin.update({ password: hashed, activeTokens: [] });

    res.json({ message: 'Password berhasil diubah. Silakan login ulang.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Admin: List semua akun admin ─────────────────────────────────
router.get('/admins', async (req, res) => {
  try {
    const admins = await User.findAll({
      where: { role: 'admin' },
      attributes: { exclude: ['password', 'otpCode', 'otpExpiry', 'activeTokens'] },
      order: [['createdAt', 'ASC']]
    });
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Admin: Tambah akun admin baru ────────────────────────────────
router.post('/admins', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nama, email, dan password wajib diisi' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password minimal 6 karakter' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'Email sudah digunakan' });
    }

    const admin = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role: 'admin',
      isVerified: true,
      isActive: true
    });

    res.status(201).json({
      message: `Admin "${admin.name}" berhasil ditambahkan`,
      admin: { id: admin.id, name: admin.name, email: admin.email, createdAt: admin.createdAt }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Admin: Hapus akun admin lain (superadmin only) ───────────────
router.delete('/admins/:id', async (req, res) => {
  try {
    const superadminEmail = process.env.SUPERADMIN_EMAIL;

    // Hanya superadmin yang boleh menghapus admin lain
    if (req.user.email !== superadminEmail) {
      return res.status(403).json({ message: 'Hanya superadmin yang dapat menghapus admin lain' });
    }

    // Tidak boleh hapus diri sendiri
    if (String(req.params.id) === String(req.user.id)) {
      return res.status(400).json({ message: 'Tidak bisa menghapus akun sendiri' });
    }

    const admin = await User.findOne({ where: { id: req.params.id, role: 'admin' } });
    if (!admin) return res.status(404).json({ message: 'Admin tidak ditemukan' });

    await admin.destroy();
    res.json({ message: `Admin "${admin.name}" berhasil dihapus` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.get('/reports/sales', async (req, res) => {
  try {
    const { startDate } = req.query;
    // Default endDate ke hari ini kalau tidak ada
    const endDateRaw = req.query.endDate || new Date().toISOString().split('T')[0];

    // Validasi rentang maksimal 31 hari
    if (startDate && endDateRaw) {
      const start = new Date(startDate);
      const end = new Date(endDateRaw);
      const diffMs = end - start;
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays > 31) {
        return res.status(400).json({ message: 'Rentang laporan maksimal 31 hari' });
      }
    }

    const where = {
      [Op.or]: [
        { paymentMethod: 'cash', status: 'delivered' },       // tunai: saat delivered
        { paymentMethod: 'online', paymentStatus: 'paid' }    // online: saat sudah dibayar
      ]
    };

    if (startDate && endDateRaw) {
      // Set endDate inklusif sampai 23:59:59
      const endInclusive = new Date(endDateRaw);
      endInclusive.setHours(23, 59, 59, 999);
      where.createdAt = {
        [Op.between]: [new Date(startDate), endInclusive]
      };
    }

    const orders = await Order.findAll({
      where,
      include: [
        { model: OrderItem, as: 'items' },
        { model: User, as: 'customer', attributes: ['name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);
    const totalOrders = orders.length;

    res.json({ orders, totalRevenue, totalOrders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Expenses (Pengeluaran Permanen) ───────────────────────────────

// Ambil semua pengeluaran (include cicilan untuk hutang)
router.get('/expenses', async (req, res) => {
  try {
    const expenses = await Expense.findAll({
      order: [['createdAt', 'ASC']],
      include: [
        {
          model: DebtPayment,
          as: 'payments',
          required: false,
          order: [['createdAt', 'ASC']]
        }
      ]
    });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Tambah pengeluaran baru (expense atau debt)
router.post('/expenses', async (req, res) => {
  try {
    const { label, nominal, type = 'expense', dueDate } = req.body;
    if (!label || !label.trim()) {
      return res.status(400).json({ message: 'Keterangan pengeluaran wajib diisi' });
    }
    if (nominal === undefined || nominal === null || isNaN(nominal)) {
      return res.status(400).json({ message: 'Nominal wajib diisi' });
    }
    if (!['expense', 'debt'].includes(type)) {
      return res.status(400).json({ message: 'Tipe tidak valid' });
    }
    const expense = await Expense.create({
      label: label.trim(),
      nominal: parseFloat(nominal),
      type,
      dueDate: type === 'debt' ? (dueDate || null) : null,
      isPaid: false,
      paidAt: null
    });
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Edit pengeluaran
router.put('/expenses/:id', async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Pengeluaran tidak ditemukan' });
    const { label, nominal, dueDate } = req.body;
    await expense.update({
      label: label ? label.trim() : expense.label,
      nominal: nominal !== undefined ? parseFloat(nominal) : expense.nominal,
      dueDate: dueDate !== undefined ? (dueDate || null) : expense.dueDate
    });
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Toggle lunas/belum lunas (khusus hutang)
router.put('/expenses/:id/toggle-paid', async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Data tidak ditemukan' });
    if (expense.type !== 'debt') {
      return res.status(400).json({ message: 'Hanya hutang yang bisa ditandai lunas' });
    }
    const newIsPaid = !expense.isPaid;

    // Jika ditandai lunas manual, set paidAmount = nominal
    // Jika batal lunas, kembalikan paidAmount ke total cicilan aktual
    let paidAmount = expense.paidAmount;
    if (newIsPaid) {
      // Tandai lunas → set paidAmount ke nominal supaya progress bar 100%
      paidAmount = expense.nominal;
    } else {
      // Batal lunas → hitung ulang dari cicilan yang ada
      const payments = await DebtPayment.findAll({ where: { expenseId: expense.id } });
      paidAmount = payments.reduce((s, p) => s + parseFloat(p.amount), 0);
    }

    await expense.update({
      isPaid: newIsPaid,
      paidAmount,
      paidAt: newIsPaid ? new Date() : null
    });
    // Kembalikan data lengkap dengan riwayat cicilan
    const updated = await Expense.findByPk(expense.id, {
      include: [{ model: DebtPayment, as: 'payments', order: [['createdAt', 'ASC']] }]
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Cicilan hutang: tambah pembayaran ────────────────────────────
router.post('/expenses/:id/pay', async (req, res) => {
  try {
    const { amount, note } = req.body;

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({ message: 'Jumlah cicilan harus lebih dari 0' });
    }

    const expense = await Expense.findByPk(req.params.id, {
      include: [{ model: DebtPayment, as: 'payments' }]
    });
    if (!expense) return res.status(404).json({ message: 'Hutang tidak ditemukan' });
    if (expense.type !== 'debt') return res.status(400).json({ message: 'Bukan hutang' });
    if (expense.isPaid) return res.status(400).json({ message: 'Hutang sudah lunas' });

    const cicilan = parseFloat(amount);
    const sisaHutang = parseFloat(expense.nominal) - parseFloat(expense.paidAmount);

    if (cicilan > sisaHutang) {
      return res.status(400).json({
        message: `Cicilan (${cicilan}) melebihi sisa hutang (${sisaHutang})`
      });
    }

    // Simpan riwayat cicilan
    await DebtPayment.create({
      expenseId: expense.id,
      amount: cicilan,
      note: note ? note.trim() : null
    });

    // Update total yang sudah dibayar
    const newPaidAmount = parseFloat(expense.paidAmount) + cicilan;
    const isNowPaid = newPaidAmount >= parseFloat(expense.nominal);

    await expense.update({
      paidAmount: newPaidAmount,
      isPaid: isNowPaid,
      paidAt: isNowPaid ? new Date() : null
    });

    // Ambil data terbaru dengan cicilan
    const updated = await Expense.findByPk(expense.id, {
      include: [{ model: DebtPayment, as: 'payments', order: [['createdAt', 'ASC']] }]
    });

    res.json({
      message: isNowPaid ? 'Hutang lunas!' : `Cicilan dicatat. Sisa: ${parseFloat(expense.nominal) - newPaidAmount}`,
      expense: updated
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Cicilan hutang: hapus cicilan tertentu ───────────────────────
router.delete('/expenses/:id/pay/:paymentId', async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Hutang tidak ditemukan' });

    const payment = await DebtPayment.findOne({
      where: { id: req.params.paymentId, expenseId: req.params.id }
    });
    if (!payment) return res.status(404).json({ message: 'Cicilan tidak ditemukan' });

    const refundAmount = parseFloat(payment.amount);
    await payment.destroy();

    // Recalculate paidAmount
    const remaining = await DebtPayment.findAll({ where: { expenseId: req.params.id } });
    const newPaidAmount = remaining.reduce((s, p) => s + parseFloat(p.amount), 0);
    const isNowPaid = newPaidAmount >= parseFloat(expense.nominal);

    await expense.update({
      paidAmount: newPaidAmount,
      isPaid: isNowPaid,
      paidAt: isNowPaid ? expense.paidAt : null
    });

    const updated = await Expense.findByPk(expense.id, {
      include: [{ model: DebtPayment, as: 'payments', order: [['createdAt', 'ASC']] }]
    });

    res.json({ message: 'Cicilan dihapus', expense: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Hapus pengeluaran
router.delete('/expenses/:id', async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Pengeluaran tidak ditemukan' });
    await expense.destroy();
    res.json({ message: 'Pengeluaran dihapus' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── Admin: Upload Avatar ──────────────────────────────────────────
router.post('/profile/avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'File tidak ditemukan' });

    const admin = await User.findByPk(req.user.id);
    if (!admin) return res.status(404).json({ message: 'Admin tidak ditemukan' });

    // Hapus avatar lama jika ada
    if (admin.avatar) {
      const oldPath = path.join(__dirname, '..', admin.avatar);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const avatarPath = `/uploads/products/${req.file.filename}`;
    await admin.update({ avatar: avatarPath });

    res.json({ message: 'Foto profil berhasil diupload', avatar: avatarPath });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
