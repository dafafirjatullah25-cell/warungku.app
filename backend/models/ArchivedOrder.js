const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Tabel arsip untuk pesanan delivered yang sudah > 30 hari
// Struktur sama dengan Orders tapi tidak ada relasi aktif
const ArchivedOrder = sequelize.define('ArchivedOrder', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true
    // Tidak pakai defaultValue — ID diambil dari order asli
  },
  orderNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  customerName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  customerEmail: {
    type: DataTypes.STRING,
    allowNull: true
  },
  totalAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'delivered'
  },
  paymentMethod: {
    type: DataTypes.STRING
  },
  paymentStatus: {
    type: DataTypes.STRING
  },
  notes: {
    type: DataTypes.TEXT
  },
  // Snapshot items dalam JSON supaya tidak perlu join
  itemsSnapshot: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  // Tanggal order asli
  orderedAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  // Tanggal diarsipkan
  archivedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false,
  tableName: 'ArchivedOrders',
  indexes: [
    { fields: ['customerId'] },
    { fields: ['orderedAt'] },
    { fields: ['archivedAt'] }
  ]
});

module.exports = ArchivedOrder;
