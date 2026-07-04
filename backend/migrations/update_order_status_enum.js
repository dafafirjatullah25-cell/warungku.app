require('dotenv').config();
const sequelize = require('../config/database');

const run = async () => {
  try {
    await sequelize.authenticate();

    // Bersihkan sisa migrasi sebelumnya jika ada
    await sequelize.query(`DROP TYPE IF EXISTS "enum_Orders_status_old";`).catch(() => {});

    // 1. Ubah semua 'paid' → 'pending'
    await sequelize.query(`UPDATE "Orders" SET "status" = 'pending' WHERE "status" = 'paid';`);

    // 2. Drop default
    await sequelize.query(`ALTER TABLE "Orders" ALTER COLUMN "status" DROP DEFAULT;`);

    // 3. Ganti tipe kolom ke text sementara
    await sequelize.query(`ALTER TABLE "Orders" ALTER COLUMN "status" TYPE text USING "status"::text;`);

    // 4. Hapus enum lama
    await sequelize.query(`DROP TYPE IF EXISTS "enum_Orders_status";`);

    // 5. Buat enum baru
    await sequelize.query(`CREATE TYPE "enum_Orders_status" AS ENUM('pending', 'delivered', 'cancelled');`);

    // 6. Set kolom ke enum baru
    await sequelize.query(`
      ALTER TABLE "Orders"
        ALTER COLUMN "status" TYPE "enum_Orders_status"
        USING "status"::"enum_Orders_status";
    `);

    // 7. Set default
    await sequelize.query(`ALTER TABLE "Orders" ALTER COLUMN "status" SET DEFAULT 'pending';`);

    console.log('Berhasil! Status sekarang: pending, delivered, cancelled');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

run();
