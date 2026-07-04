const User = require('./User');
const Product = require('./Product');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Payment = require('./Payment');
const Expense = require('./Expense');
const DebtPayment = require('./DebtPayment');
const ArchivedOrder = require('./ArchivedOrder');

// Associations
User.hasMany(Order, { foreignKey: 'customerId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'customerId', as: 'customer' });

Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

Product.hasMany(OrderItem, { foreignKey: 'productId', as: 'orderItems' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

Order.hasOne(Payment, { foreignKey: 'orderId', as: 'payment' });
Payment.belongsTo(Order, { foreignKey: 'orderId' });

// Debt cicilan
Expense.hasMany(DebtPayment, { foreignKey: 'expenseId', as: 'payments', onDelete: 'CASCADE', hooks: true });
DebtPayment.belongsTo(Expense, { foreignKey: 'expenseId' });

module.exports = { User, Product, Order, OrderItem, Payment, Expense, DebtPayment, ArchivedOrder };
