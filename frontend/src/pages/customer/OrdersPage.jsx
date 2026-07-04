import React, { useEffect, useState } from 'react';
import { ClipboardList, X, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { formatHarga } from '../../utils/formatRupiah';
import { downloadOrder } from '../../utils/downloadOrder';

const STATUS_LABEL = {
  pending: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-700' },
  delivered: { label: 'Dikirim', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Dibatalkan', color: 'bg-red-100 text-red-700' }
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchOrders = (pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true);
    api.get(`/orders/history/${user.id}?page=${pageNum}&limit=10`)
      .then(({ data }) => {
        if (append) {
          setOrders(prev => [...prev, ...data.orders]);
        } else {
          setOrders(data.orders);
        }
        setHasMore(pageNum < data.totalPages);
        setPage(pageNum);
      })
      .catch(() => toast.error('Gagal memuat pesanan'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(1); }, [user.id]);

  const loadMore = () => fetchOrders(page + 1, true);

  const handleCancel = async (order) => {
    const confirmed = window.confirm(
      `Batalkan pesanan ${order.orderNumber}?\n\nStok produk akan dikembalikan.`
    );
    if (!confirmed) return;

    setCancellingId(order.id);
    try {
      await api.put(`/orders/${order.id}/cancel`);
      toast.success('Pesanan berhasil dibatalkan');
      // Hapus dari list lokal langsung
      setOrders(prev => prev.filter(o => o.id !== order.id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal membatalkan pesanan');
    } finally {
      setCancellingId(null);
    }
  };

  const handleDownload = (order) => {
    const orderWithCustomer = {
      ...order,
      customer: order.customer || { name: user.name, email: user.email }
    };
    downloadOrder(orderWithCustomer);
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  if (orders.length === 0) return (
    <div className="flex flex-col items-center justify-center py-24 text-gray-400">
      <ClipboardList size={48} className="mb-3 opacity-30" />
      <p className="text-lg font-medium">Belum ada pesanan</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-5">Riwayat Pesanan</h1>
      <div className="space-y-4">
        {orders.map((order) => {
          const st = STATUS_LABEL[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-600' };
          const canCancel = order.status === 'pending';

          return (
            <div key={order.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">{order.orderNumber}</p>
                  <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${st.color}`}>
                    {st.label}
                  </span>
                  {/* Tombol download bukti pesanan */}
                  <button
                    onClick={() => handleDownload(order)}
                    title="Download bukti pesanan"
                    className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors"
                  >
                    <Download size={12} />
                    <span className="hidden sm:inline">Unduh</span>
                  </button>
                  {/* Tombol cancel — hanya untuk status pending */}
                  {canCancel && (
                    <button
                      onClick={() => handleCancel(order)}
                      disabled={cancellingId === order.id}
                      className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 px-2 py-1 rounded-lg border border-red-200 dark:border-red-800 transition-colors disabled:opacity-40"
                    >
                      <X size={12} />
                      {cancellingId === order.id ? 'Membatalkan...' : 'Batalkan'}
                    </button>
                  )}
                </div>
              </div>

              {/* Items */}
              {order.items?.map((item) => (
                <div key={item.id} className="flex justify-between text-sm text-gray-600 dark:text-gray-300 py-1 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <span>{item.productName} × {item.quantity}</span>
                  <span>{formatHarga(item.subtotal)}</span>
                </div>
              ))}

              {/* Footer */}
              <div className="flex justify-between mt-3 font-bold">
                <span>Total</span>
                <span className="text-blue-600">{formatHarga(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between mt-1 text-sm text-gray-500 dark:text-gray-400">
                <span>Pembayaran</span>
                <span className={order.paymentMethod === 'cash' ? 'text-green-600 font-medium' : 'text-blue-600 font-medium'}>
                  {order.paymentMethod === 'cash' ? '💵 Tunai' : '💳 Online'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tombol muat lebih banyak */}
      {hasMore && (
        <div className="flex justify-center mt-6">
          <button
            onClick={loadMore}
            className="px-6 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-gray-400 transition-colors shadow-sm"
          >
            Muat lebih banyak
          </button>
        </div>
      )}
    </div>
  );
}
