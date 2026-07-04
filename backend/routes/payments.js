const express = require('express');
const router = express.Router();
const midtransClient = require('midtrans-client');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const { verifyToken } = require('../middleware/auth');

// Initialize Midtrans
const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_ENVIRONMENT === 'production',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// Create payment token (for online payment)
router.post('/create-token', verifyToken, async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const parameter = {
      transaction_details: {
        order_id: order.orderNumber,
        gross_amount: order.totalAmount
      },
      credit_card: {
        secure: true
      }
    };

    const transaction = await snap.createTransaction(parameter);

    // Save payment record
    await Payment.create({
      orderId: order.id,
      amount: order.totalAmount,
      paymentMethod: 'online',
      transactionId: transaction.token,
      status: 'pending',
      response: transaction
    });

    res.json({
      message: 'Payment token created',
      token: transaction.token,
      redirectUrl: transaction.redirect_url
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify payment (webhook from Midtrans)
router.post('/verify', async (req, res) => {
  try {
    const { order_id, transaction_status, transaction_id } = req.body;

    const order = await Order.findOne({
      where: { orderNumber: order_id }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      // Tandai paymentStatus = paid, status tetap pending (tunggu admin deliver)
      await order.update({
        paymentStatus: 'paid'
      });

      const payment = await Payment.findOne({ where: { transactionId: transaction_id } });
      if (payment) await payment.update({ status: 'success' });

    } else if (transaction_status === 'deny' || transaction_status === 'expire' || transaction_status === 'cancel') {
      await order.update({ paymentStatus: 'failed' });

      const payment = await Payment.findOne({ where: { transactionId: transaction_id } });
      if (payment) await payment.update({ status: 'failed' });
    }

    res.json({ message: 'Payment verified' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get payment status
router.get('/:paymentId', verifyToken, async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
