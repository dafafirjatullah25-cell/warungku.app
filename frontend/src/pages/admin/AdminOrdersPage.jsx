import React, { useEffect, useState } from 'react';
import { Download, ChevronDown, ChevronUp, ShoppingBag, Plus, Trash2, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { formatHarga } from '../../utils/formatRupiah';
import { printOrder } from '../../utils/printOrder';

const STATUS_COLOR = {
  pending: 'bg-yellow-100 text-yellow-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700'
};

const STATUS_LABEL = {
  pending: 'Menunggu',
  delivered: 'Dikirim',
  cancelled: 'Dibatalkan'
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingId, setUpdatingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  // ── Modal Pesanan Manual ────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [walkInName, setWalkInName] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [manualPayment, setManualPayment] = useState('cash');
  const [submitting, setSubmitting] = useState(false);

  const fetchOrders = () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 20 });
    if (statusFilter) params.append('status', statusFilter);
    api.get(`/admin/orders?${params}`)
      .then(({ data }) => { setOrders(data.orders); setTotalPages(data.totalPages); })
      .catch(() => toast.error('Gagal memuat pesanan'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, [statusFilter, page]);

  // ── Fungsi Modal Manual Order ───────────────────────────────────
  const openModal = () => {
    setShowModal(true);
    setCartItems([]);
    setWalkInName('');
    setManualNotes('');
    setManualPayment('cash');
    setProductSearch('');
    if (products.length === 0) {
      setLoadingProducts(true);
      api.get('/products')
        .then(({ data }) => setProducts(Array.isArray(data) ? data : (data.products || [])))
        .catch(() => toast.error('Gagal memuat produk'))
        .finally(() => setLoadingProducts(false));
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setCartItems([]);
    setProductSearch('');
  };

  const addToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(c => c.product.id === product.id);
      if (existing) {
        return prev.map(c =>
          c.product.id === product.id
            ? { ...c, quantity: Math.min(c.quantity + 1, product.stock) }
            : c
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (productId, qty) => {
    if (qty < 1) { removeFromCart(productId); return; }
    setCartItems(prev =>
      prev.map(c =>
        c.product.id === productId
          ? { ...c, quantity: Math.min(qty, c.product.stock) }
          : c
      )
    );
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(c => c.product.id !== productId));
  };

  const cartTotal = cartItems.reduce((sum, c) => sum + parseFloat(c.product.price) * c.quantity, 0);

  const submitManualOrder = async () => {
    if (cartItems.length === 0) { toast.error('Pilih minimal satu produk'); return; }
    setSubmitting(true);
    try {
      await api.post('/admin/orders', {
        customerName: walkInName.trim() || 'Pelanggan Walk-in',
        items: cartItems.map(c => ({ productId: c.product.id, quantity: c.quantity })),
        paymentMethod: manualPayment,
        notes: manualNotes.trim() || null
      });
      toast.success('Pesanan manual berhasil dibuat!');
      closeModal();
      if (statusFilter === 'delivered' || statusFilter === '') fetchOrders();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Gagal membuat pesanan';
      console.error('Manual order error:', err.response?.data || err);
      toast.error(msg, { duration: 5000 });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.isActive && p.stock > 0 &&
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      await api.put(`/admin/orders/${id}/status`, { status });
      toast.success('Status diperbarui');
      if (status === 'cancelled' || status === 'delivered') {
        setOrders(prev => prev.filter(o => o.id !== id));
        if (expandedId === id) setExpandedId(null);
      } else {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui status');
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id);

  const formatDate = (d) => new Date(d).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Manajemen Pesanan</h1>
        <div className="flex gap-2 items-center">
          <button
            onClick={openModal}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-2 rounded-lg transition-colors font-medium"
          >
            <Plus size={15} />
            Pesanan Manual
          </button>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); setExpandedId(null); }}
            className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Semua Status</option>
            <option value="pending">Menunggu</option>
            <option value="delivered">Dikirim</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    {['', 'No. Pesanan', 'Pelanggan', 'Total', 'Pembayaran', 'Status', 'Waktu', 'Aksi'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const isExpanded = expandedId === order.id;
                    const items = order.items || [];
                    // Nama pelanggan: akun terdaftar atau walk-in
                    const custName = order.customer?.name || order.customerName || 'Walk-in';
                    const custEmail = order.customer?.email || null;

                    return (
                      <React.Fragment key={order.id}>
                        <tr
                          className={`border-b border-gray-100 dark:border-gray-700 cursor-pointer transition-colors ${
                            isExpanded
                              ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }`}
                          onClick={() => toggleExpand(order.id)}
                        >
                          <td className="pl-4 pr-2 py-3 text-gray-400 w-6">
                            {isExpanded ? <ChevronUp size={15} className="text-blue-500" /> : <ChevronDown size={15} />}
                          </td>

                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-800 dark:text-gray-200">{order.orderNumber}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              {items.length > 0 && (
                                <p className="text-xs text-gray-400">{items.length} item{items.length > 1 ? 's' : ''}</p>
                              )}
                              {order.isWalkIn && (
                                <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded font-medium">Walk-in</span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <p className="font-medium dark:text-gray-200">{custName}</p>
                            {custEmail && <p className="text-gray-400 text-xs">{custEmail}</p>}
                          </td>

                          <td className="px-4 py-3 text-blue-600 font-medium">{formatHarga(order.totalAmount)}</td>

                          <td className="px-4 py-3">
                            <div className="space-y-0.5">
                              <span className={`text-xs font-medium ${order.paymentMethod === 'cash' ? 'text-green-600' : 'text-blue-600'}`}>
                                {order.paymentMethod === 'cash' ? '💵 Tunai' : '💳 Online'}
                              </span>
                              {order.paymentMethod !== 'cash' && (
                                <p className={`text-xs ${order.paymentStatus === 'paid' ? 'text-green-500' : 'text-orange-400'}`}>
                                  {order.paymentStatus === 'paid' ? '✓ Sudah Dibayar' : '⏳ Belum Dibayar'}
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[order.status] || 'bg-gray-100 text-gray-600'}`}>
                              {STATUS_LABEL[order.status] || order.status}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                            {formatDate(order.createdAt)}
                          </td>

                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-1.5 flex-wrap">
                              {order.status === 'pending' && (
                                <button
                                  onClick={() => updateStatus(order.id, 'delivered')}
                                  disabled={updatingId === order.id}
                                  className="text-xs bg-green-500 hover:bg-green-600 text-white px-2.5 py-1 rounded-lg disabled:opacity-40 transition-colors"
                                >
                                  {updatingId === order.id ? '...' : '✓ Dikirim'}
                                </button>
                              )}
                              {(order.status === 'pending' || order.status === 'delivered') && (
                                <button
                                  onClick={() => {
                                    if (!window.confirm(`Batalkan pesanan ${order.orderNumber}?\nStok akan dikembalikan dan data dihapus.`)) return;
                                    updateStatus(order.id, 'cancelled');
                                  }}
                                  disabled={updatingId === order.id}
                                  className="text-xs bg-red-100 hover:bg-red-200 text-red-600 px-2.5 py-1 rounded-lg disabled:opacity-40 transition-colors"
                                >
                                  {updatingId === order.id ? '...' : '✕ Batal'}
                                </button>
                              )}
                              {order.status === 'delivered' && (
                                <span className="text-xs text-gray-400 italic">Selesai</span>
                              )}
                              <button
                                onClick={() => printOrder({ ...order, customerName: custName })}
                                title="Cetak struk pesanan"
                                className="text-xs bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 font-medium"
                              >
                                <Download size={11} />
                                Struk
                              </button>
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="border-b border-gray-100 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/10">
                            <td colSpan={8} className="px-8 py-4">
                              <div className="flex items-center gap-2 mb-3">
                                <ShoppingBag size={14} className="text-blue-500" />
                                <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                                  Detail Belanjaan — {custName}
                                </span>
                              </div>
                              {items.length === 0 ? (
                                <p className="text-xs text-gray-400 italic">Tidak ada item</p>
                              ) : (
                                <div className="bg-white dark:bg-gray-800 rounded-lg border border-blue-100 dark:border-gray-600 overflow-hidden">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="bg-gray-50 dark:bg-gray-700 border-b border-blue-100 dark:border-gray-600">
                                        <th className="text-left px-4 py-2 text-gray-500 dark:text-gray-400 font-medium">Nama Produk</th>
                                        <th className="text-center px-4 py-2 text-gray-500 dark:text-gray-400 font-medium">Qty</th>
                                        <th className="text-right px-4 py-2 text-gray-500 dark:text-gray-400 font-medium">Harga Satuan</th>
                                        <th className="text-right px-4 py-2 text-gray-500 dark:text-gray-400 font-medium">Subtotal</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                      {items.map((item, idx) => (
                                        <tr key={item.id || idx} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/20">
                                          <td className="px-4 py-2.5 font-medium text-gray-800 dark:text-gray-200">{item.productName}</td>
                                          <td className="px-4 py-2.5 text-center">
                                            <span className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full font-medium">
                                              ×{item.quantity}
                                            </span>
                                          </td>
                                          <td className="px-4 py-2.5 text-right text-gray-500 dark:text-gray-400">{formatHarga(item.price)}</td>
                                          <td className="px-4 py-2.5 text-right font-semibold text-gray-800 dark:text-gray-200">{formatHarga(item.subtotal)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                    <tfoot>
                                      <tr className="border-t-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                                        <td colSpan={3} className="px-4 py-2.5 text-right font-bold text-gray-700 dark:text-gray-300">Total</td>
                                        <td className="px-4 py-2.5 text-right font-bold text-blue-600">{formatHarga(order.totalAmount)}</td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                  {order.notes && (
                                    <div className="px-4 py-2.5 border-t border-blue-100 dark:border-gray-600 bg-yellow-50 dark:bg-yellow-900/20">
                                      <span className="text-xs text-yellow-700 dark:text-yellow-400">📝 Catatan: {order.notes}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
              {orders.length === 0 && <p className="text-center py-8 text-gray-400">Belum ada pesanan</p>}
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border dark:border-gray-600 dark:text-gray-300 dark:bg-gray-800 rounded-lg text-sm disabled:opacity-40">‹</button>
              <span className="px-3 py-1 text-sm dark:text-gray-300">Hal. {page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 border dark:border-gray-600 dark:text-gray-300 dark:bg-gray-800 rounded-lg text-sm disabled:opacity-40">›</button>
            </div>
          )}
        </>
      )}

      {/* ── Modal Pesanan Manual ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Buat Pesanan Manual</h2>
                <p className="text-xs text-gray-400 mt-0.5">Untuk pelanggan yang datang langsung ke toko</p>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
              {/* Kiri: pilih produk */}
              <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-3">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Cari produk..."
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-4 pb-3">
                  {loadingProducts ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-8">
                      {productSearch ? 'Produk tidak ditemukan' : 'Tidak ada produk tersedia'}
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {filteredProducts.map(p => {
                        const inCart = cartItems.find(c => c.product.id === p.id);
                        return (
                          <button
                            key={p.id}
                            onClick={() => addToCart(p)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors text-sm border ${
                              inCart
                                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700'
                                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-700'
                            }`}
                          >
                            <div>
                              <p className="font-medium text-gray-800 dark:text-gray-200">{p.name}</p>
                              <p className="text-xs text-gray-400">Stok: {p.stock} {p.unit || 'pcs'}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-blue-600">{formatHarga(p.price)}</p>
                              {inCart && (
                                <p className="text-xs text-blue-500">×{inCart.quantity} ditambah</p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Kanan: keranjang + info */}
              <div className="w-full md:w-72 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                  {/* Info pelanggan */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Nama Pelanggan <span className="text-gray-400 font-normal">(opsional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Walk-in Customer"
                      value={walkInName}
                      onChange={e => setWalkInName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Metode bayar */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Metode Pembayaran</label>
                    <select
                      value={manualPayment}
                      onChange={e => setManualPayment(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="cash">💵 Tunai</option>
                      <option value="qr_code">📱 QRIS</option>
                      <option value="credit_card">💳 Kartu Kredit/Debit</option>
                      <option value="online">🌐 Transfer Online</option>
                    </select>
                  </div>

                  {/* Keranjang */}
                  <div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                      Item Pesanan {cartItems.length > 0 && <span className="text-blue-500">({cartItems.length})</span>}
                    </p>
                    {cartItems.length === 0 ? (
                      <p className="text-xs text-gray-400 italic py-2">Belum ada produk dipilih</p>
                    ) : (
                      <div className="space-y-1.5">
                        {cartItems.map(c => (
                          <div key={c.product.id} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-lg px-2 py-1.5">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{c.product.name}</p>
                              <p className="text-xs text-gray-400">{formatHarga(c.product.price)}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button onClick={() => updateQty(c.product.id, c.quantity - 1)} className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600">−</button>
                              <input
                                type="number"
                                min={1}
                                max={c.product.stock}
                                value={c.quantity}
                                onChange={e => updateQty(c.product.id, parseInt(e.target.value) || 1)}
                                className="w-8 text-center text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                              />
                              <button onClick={() => updateQty(c.product.id, c.quantity + 1)} disabled={c.quantity >= c.product.stock} className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-40">+</button>
                            </div>
                            <button onClick={() => removeFromCart(c.product.id)} className="text-red-400 hover:text-red-600 p-0.5">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Catatan */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Catatan <span className="text-gray-400 font-normal">(opsional)</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Catatan tambahan..."
                      value={manualNotes}
                      onChange={e => setManualNotes(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>

                {/* Footer total + submit */}
                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</span>
                    <span className="text-lg font-bold text-blue-600">{formatHarga(cartTotal)}</span>
                  </div>
                  <button
                    onClick={submitManualOrder}
                    disabled={submitting || cartItems.length === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-medium text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />Memproses...</>
                    ) : (
                      <><Plus size={15} />Buat Pesanan</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
