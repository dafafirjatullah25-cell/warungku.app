const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Product = require('../models/Product');
const { verifyToken } = require('../middleware/auth');

// Create order
router.post('/', verifyToken, async (req, res) => {
  try {
    const { items, notes, paymentMethod } = req.body;
    const customerId = req.user.id;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Order items cannot be empty' });
    }

    // Calculate total amount and validate stock
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findByPk(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.productId} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }

      const subtotal = product.price * item.quantity;
      totalAmount += subtotal;
      validatedItems.push({
        ...item,
        productName: product.name,
        price: product.price,
        subtotal
      });
    }

    // Create order
    const orderNumber = `ORD-${Date.now()}`;
    const order = await Order.create({
      orderNumber,
      customerId,
      totalAmount,
      paymentMethod: paymentMethod || 'cash',
      notes
    });

    // Create order items
    for (const item of validatedItems) {
      await OrderItem.create({
        orderId: order.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal
      });

      // Update product stock
      await Product.decrement('stock', {
        by: item.quantity,
        where: { id: item.productId }
      });
    }

    res.status(201).json({
      message: 'Order created successfully',
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: order.status,
        items: validatedItems
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get customer order history
router.get('/history/:customerId', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Order.findAndCountAll({
      where: { customerId: req.params.customerId },
      include: [{ model: OrderItem, as: 'items' }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      orders: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get order details
router.get('/:orderId', verifyToken, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.orderId, {
      include: [{ model: OrderItem }]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cancel order oleh pelanggan
router.put('/:orderId/cancel', verifyToken, async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.orderId, customerId: req.user.id },
      include: [{ model: OrderItem, as: 'items' }]
    });

    if (!order) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
    }

    // Hanya boleh cancel kalau masih pending
    if (order.status !== 'pending') {
      return res.status(400).json({
        message: `Pesanan tidak bisa dibatalkan karena statusnya sudah "${order.status}"`
      });
    }

    // Kembalikan stok semua item
    for (const item of order.items) {
      await Product.increment('stock', {
        by: item.quantity,
        where: { id: item.productId }
      });
    }

    // Hapus order dari database (bersih total)
    await order.destroy();

    res.json({ message: 'Pesanan berhasil dibatalkan dan stok telah dikembalikan' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
