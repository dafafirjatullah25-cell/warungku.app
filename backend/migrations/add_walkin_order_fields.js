/**
 * Migration: Tambah kolom walk-in order ke tabel Orders
 * - customerName: nama pelanggan walk-in (tanpa akun)
 * - isWalkIn: flag pesanan manual oleh admin
 * - customerId: ubah jadi nullable (untuk walk-in)
 *
 * Jalankan: node migrations/add_walkin_order_fields.js
 */

const sequelize = require('../config/database');
const { QueryInterface, DataTypes } = require('sequelize');
const qi = sequelize.getQueryInterface();

const migrate = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const tableDesc = await qi.describeTable('Orders');

    // Tambah customerName jika belum ada
    if (!tableDesc.customerName) {
      await qi.addColumn('Orders', 'customerName', {
        type: DataTypes.STRING,
        allowNull: true
      });
      console.log('✓ Kolom customerName ditambahkan');
    } else {
      console.log('- customerName sudah ada, skip');
    }

    // Tambah isWalkIn jika belum ada
    if (!tableDesc.isWalkIn) {
      await qi.addColumn('Orders', 'isWalkIn', {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
      });
      console.log('✓ Kolom isWalkIn ditambahkan');
    } else {
      console.log('- isWalkIn sudah ada, skip');
    }

    // Buat customerId nullable jika masih NOT NULL
    if (tableDesc.customerId && !tableDesc.customerId.allowNull) {
      await qi.changeColumn('Orders', 'customerId', {
        type: DataTypes.UUID,
        allowNull: true
      });
      console.log('✓ customerId diubah menjadi nullable');
    } else {
      console.log('- customerId sudah nullable, skip');
    }

    console.log('\nMigrasi walk-in order selesai!');
    process.exit(0);
  } catch (error) {
    console.error('Migrasi gagal:', error);
    process.exit(1);
  }
};

migrate();
