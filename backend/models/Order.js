const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  orderNumber: {
    type: DataTypes.STRING,
    unique: true
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: true   // nullable untuk pesanan manual walk-in
  },
  customerName: {
    type: DataTypes.STRING,
    allowNull: true   // nama pelanggan walk-in (tanpa akun)
  },
  isWalkIn: {
    type: DataTypes.BOOLEAN,
    defaultValue: false  // flag pesanan manual oleh admin
  },
  totalAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'delivered', 'cancelled'),
    defaultValue: 'pending'
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'qr_code', 'credit_card', 'online'),
    defaultValue: 'cash'
  },
  paymentStatus: {
    type: DataTypes.ENUM('unpaid', 'paid', 'failed'),
    defaultValue: 'unpaid'
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['customerId'] },
    { fields: ['status'] },
    { fields: ['createdAt'] },
    // Index komposit untuk query admin orders (filter status + sort date)
    { fields: ['status', 'createdAt'] },
    // Index komposit untuk query revenue (paymentMethod + status)
    { fields: ['paymentMethod', 'status'] },
    { fields: ['paymentMethod', 'paymentStatus'] },
    // Index untuk laporan per tanggal
    { fields: ['createdAt', 'status'] }
  ]
});

module.exports = Order;
