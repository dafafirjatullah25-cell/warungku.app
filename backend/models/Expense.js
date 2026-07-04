const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Expense = sequelize.define('Expense', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  label: {
    type: DataTypes.STRING,
    allowNull: false
  },
  nominal: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0
  },
  // 'expense' = pengeluaran biasa, 'debt' = hutang
  type: {
    type: DataTypes.ENUM('expense', 'debt'),
    allowNull: false,
    defaultValue: 'expense'
  },
  // Tanggal jatuh tempo (hanya untuk hutang)
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    defaultValue: null
  },
  // Status lunas (hanya untuk hutang)
  isPaid: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  // Total sudah dibayar (akumulasi cicilan)
  paidAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0
  },
  // Tanggal lunas aktual
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  }
}, {
  timestamps: true,
  tableName: 'Expenses'
});

module.exports = Expense;
