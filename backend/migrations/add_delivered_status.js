require('dotenv').config();
const sequelize = require('../config/database');

const run = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.query("ALTER TYPE \"enum_Orders_status\" ADD VALUE IF NOT EXISTS 'delivered'");
    console.log("Status 'delivered' berhasil ditambahkan ke enum");
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

run();
