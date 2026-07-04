# 🛒 Kasir App

Aplikasi kasir modern dengan fitur admin panel, customer ordering, dan payment Midtrans.

## Tech Stack
- **Backend**: Node.js + Express + Sequelize
- **Frontend**: React + Vite + Tailwind CSS
- **Database**: PostgreSQL
- **Payment**: Midtrans (QRIS, kartu kredit, e-wallet)

---

## 🚀 Setup & Menjalankan

### 1. Persiapan Database (PostgreSQL)
```sql
CREATE DATABASE kasir_app;
```

### 2. Backend Setup
```bash
cd backend
npm install

# Salin .env.example ke .env lalu isi konfigurasi
copy .env.example .env

# Jalankan migrasi + buat admin default
npm run migrate

# Jalankan server
npm run dev
```

Server backend berjalan di `http://localhost:5000`

**Default admin:** `admin@kasir.com` / `admin123`

### 3. Frontend Setup
```bash
cd frontend
npm install

# Salin .env.example ke .env lalu isi Midtrans client key
copy .env.example .env

# Jalankan frontend
npm run dev
```

Frontend berjalan di `http://localhost:3000`

---

## 📁 Struktur Project

```
├── backend/
│   ├── config/         # Konfigurasi database
│   ├── middleware/      # Auth middleware (JWT)
│   ├── migrations/      # Script migrasi DB
│   ├── models/          # Sequelize models + associations
│   └── routes/          # API routes
│       ├── auth.js      # Register / Login
│       ├── products.js  # CRUD produk
│       ├── orders.js    # Buat & lihat pesanan
│       ├── payments.js  # Midtrans payment
│       ├── customers.js # Profil customer
│       └── admin.js     # Dashboard & laporan admin
│
└── frontend/
    └── src/
        ├── api/         # Axios instance
        ├── context/     # AuthContext, CartContext
        ├── layouts/     # CustomerLayout, AdminLayout
        └── pages/
            ├── LoginPage / RegisterPage
            ├── customer/  # Shop, Cart, Orders
            └── admin/     # Dashboard, Products, Orders, Customers, Reports
```

---

## 🔑 API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/auth/register` | Daftar akun baru |
| POST | `/api/auth/login` | Login |
| GET | `/api/products` | Daftar produk |
| POST | `/api/orders` | Buat pesanan |
| POST | `/api/payments/create-token` | Generate token Midtrans |
| POST | `/api/payments/verify` | Webhook Midtrans |
| GET | `/api/admin/dashboard` | Statistik admin |
| GET | `/api/admin/orders` | Semua pesanan (admin) |
| GET | `/api/admin/reports/sales` | Laporan penjualan |

---

## 💳 Midtrans Setup

1. Daftar di [https://midtrans.com](https://midtrans.com)
2. Ambil **Server Key** dan **Client Key** dari dashboard Midtrans
3. Isi di `backend/.env` dan `frontend/.env`
4. Untuk development, gunakan environment `sandbox`
5. Set webhook URL di Midtrans: `https://yourdomain.com/api/payments/verify`
