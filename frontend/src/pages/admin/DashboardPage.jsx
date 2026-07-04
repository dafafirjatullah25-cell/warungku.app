import React, { useEffect, useState } from 'react';
import { ShoppingBag, TrendingUp, Package, Users, Clock, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { formatHarga } from '../../utils/formatRupiah';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard'),
      api.get('/products')
    ])
      .then(([dashRes, prodRes]) => {
        setData(dashRes.data);
        const low = prodRes.data.filter(p => p.stock < 10).sort((a, b) => a.stock - b.stock);
        setLowStockProducts(low);
      })
      .catch(() => toast.error('Gagal memuat dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  const { stats, recentOrders } = data;

  const STATUS_COLOR = {
    pending: 'bg-yellow-100 text-yellow-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700'
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={TrendingUp} label="Pendapatan Hari Ini" value={formatHarga(stats.todayRevenue)} color="bg-green-500" />
        <StatCard icon={ShoppingBag} label="Pesanan Hari Ini" value={stats.todayOrders} color="bg-blue-500" />
        <StatCard icon={Package} label="Total Produk" value={stats.totalProducts} color="bg-purple-500" />
        <StatCard icon={Users} label="Total Pelanggan" value={stats.totalCustomers} color="bg-orange-500" />
      </div>

      {/* ── Widget Stok Menipis ── */}
      {lowStockProducts.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-orange-500" />
            <h2 className="font-semibold text-orange-700 dark:text-orange-400 text-sm">
              Stok Perlu Diperhatikan
            </h2>
            <span className="text-xs bg-orange-200 dark:bg-orange-800 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full font-medium ml-auto">
              {lowStockProducts.length} produk
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {lowStockProducts.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-orange-100 dark:border-orange-800/50">
                <span className="text-sm text-gray-700 dark:text-gray-200 font-medium truncate mr-2">{p.name}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                  p.stock === 0
                    ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                    : p.stock <= 5
                    ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400'
                    : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400'
                }`}>
                  {p.stock === 0 ? 'Habis' : `${p.stock} tersisa`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">Ringkasan</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400 text-sm">Total Pendapatan (Delivered)</span>
              <span className="font-semibold text-green-600">{formatHarga(stats.totalRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400 text-sm">Total Semua Pesanan</span>
              <span className="font-semibold dark:text-gray-100">{stats.totalOrders}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1">
                <Clock size={14} /> Pesanan Pending
              </span>
              <span className="font-semibold text-yellow-600">{stats.pendingOrders}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">Pesanan Terbaru</h2>
          <div className="space-y-3">
            {recentOrders.length === 0
              ? <p className="text-sm text-gray-400">Belum ada pesanan</p>
              : recentOrders.map((order) => (
                <div key={order.id} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium dark:text-gray-200">{order.orderNumber}</p>
                    <p className="text-xs text-gray-400">{order.customer?.name}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[order.status] || 'bg-gray-100'}`}>
                    {order.status}
                  </span>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}
