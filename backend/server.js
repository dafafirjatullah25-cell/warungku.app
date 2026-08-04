const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Load models with associations
require('./models');

const { startCleanupJob } = require('./utils/cleanupUnverified');
const { startArchiveJob } = require('./utils/archiveOrders');
const { startDebtCleanupJob } = require('./utils/cleanupDebts');

const app = express();

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' } // supaya gambar bisa diakses frontend
}));

// Rate limiter global — max 100 request per 15 menit per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Terlalu banyak request, coba lagi nanti' }
});

// Rate limiter ketat untuk login/register — max 10 percobaan per 15 menit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Terlalu banyak percobaan login, coba lagi dalam 15 menit' }
});

app.use(globalLimiter);

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:3001',
    'https://warungku-app-two.vercel.app',
    /\.vercel\.app$/,
    /\.trycloudflare\.com$/
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (product images)
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startCleanupJob();
  startArchiveJob();
  startDebtCleanupJob();
});

module.exports = app;
