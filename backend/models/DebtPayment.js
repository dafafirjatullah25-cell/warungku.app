const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Riwayat cicilan per hutang
const DebtPayment = sequelize.define('DebtPayment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  expenseId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Expenses',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  note: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  }
}, {
  timestamps: true,
  tableName: 'DebtPayments',
  indexes: [
    { fields: ['expenseId'] }
  ]
});

module.exports = DebtPayment;
