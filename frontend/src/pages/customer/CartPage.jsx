import React, { useState } from 'react';
import { Minus, Plus, Trash2, ShoppingBag, CreditCard, Banknote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '../../context/CartContext';
import api from '../../api/axios';
import { formatHarga, formatRupiah } from '../../utils/formatRupiah';
import { imgUrl } from '../../utils/imgUrl';

export default function CartPage() {
  const { items, removeItem, updateQty, clearCart, total } = useCart();
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCheckout = async () => {
    if (items.length === 0) return;
    if (!paymentMethod) {
      toast.error('Pilih metode pembayaran terlebih dahulu');
      return;
    }
    setLoading(true);
    try {
      const orderPayload = {
        items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
        notes,
        paymentMethod
      };
      const { data: orderData } = await api.post('/orders', orderPayload);

      if (paymentMethod === 'cash') {
        toast.success('Pesanan dibuat! Silakan bayar tunai saat pengiriman.');
        clearCart();
        navigate('/orders');
        return;
      }

      const { data: paymentData } = await api.post('/payments/create-token', {
        orderId: orderData.order.id
      });

      if (!window.snap) {
        toast.error('Payment gateway belum dikonfigurasi. Hubungi admin.');
        return;
      }

      window.snap.pay(paymentData.token, {
        onSuccess: () => { toast.success('Pembayaran berhasil!'); clearCart(); navigate('/orders'); },
        onPending: () => { toast('Pembayaran pending, cek pesanan Anda.', { icon: '⏳' }); clearCart(); navigate('/orders'); },
        onError: () => toast.error('Pembayaran gagal'),
        onClose: () => toast('Pembayaran dibatalkan', { icon: '❌' })
      });
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.includes('unauthorized') || msg.includes('Midtrans')) {
        toast.error('Payment gateway belum dikonfigurasi. Isi Midtrans key di backend/.env');
      } else {
        toast.error(msg || 'Gagal membuat pesanan');
      }
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) return (
    <div className="flex flex-col items-center justify-center py-24 text-gray-400">
      <ShoppingBag size={48} className="mb-3 opacity-30" />
      <p className="text-lg font-medium">Keranjang kosong</p>
      <p className="text-sm">Tambahkan produk dari halaman toko</p>
    </div>
  );

  const { formatted: totalFormatted, keterangan: totalKet } = formatRupiah(total);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-5">Keranjang Belanja</h1>

      <div className="space-y-3 mb-5">
        {items.map((item) => (
          <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            {/* Baris atas: gambar + nama + hapus */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                {item.image
                  ? <img src={imgUrl(item.image)} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                  : <span className="text-xl">📦</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 dark:text-gray-100 truncate text-sm">{item.name}</p>
                <p className="text-blue-600 text-sm font-semibold">{formatHarga(item.price)}</p>
              </div>
              <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 p-1 flex-shrink-0">
                <Trash2 size={16} />
              </button>
            </div>

            {/* Baris bawah: qty controls + subtotal */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => updateQty(item.id, item.quantity - 1)}
                  className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200">
                  <Minus size={13} />
                </button>
                <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                <button
                  onClick={() => {
                    if (item.quantity >= item.stock) { toast.error(`Stok hanya ${item.stock}`); return; }
                    updateQty(item.id, item.quantity + 1);
                  }}
                  disabled={item.quantity >= item.stock}
                  className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed">
                  <Plus size={13} />
                </button>
              </div>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{formatHarga(item.price * item.quantity)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Catatan pesanan (opsional)..."
          rows={2}
          className="w-full border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
        />

        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Metode Pembayaran</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setPaymentMethod('online')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${paymentMethod === 'online' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'}`}>
              <CreditCard size={24} className={paymentMethod === 'online' ? 'text-blue-600' : 'text-gray-400'} />
              <div className="text-center">
                <p className={`text-sm font-semibold ${paymentMethod === 'online' ? 'text-blue-600' : 'text-gray-700 dark:text-gray-200'}`}>Bayar Sekarang</p>
                <p className="text-xs text-gray-400 mt-0.5">QRIS, Kartu, E-wallet</p>
              </div>
              {paymentMethod === 'online' && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Dipilih ✓</span>}
            </button>
            <button onClick={() => setPaymentMethod('cash')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${paymentMethod === 'cash' ? 'border-green-500 bg-green-50 dark:bg-green-900/30' : 'border-gray-200 dark:border-gray-700 hover:border-green-300'}`}>
              <Banknote size={24} className={paymentMethod === 'cash' ? 'text-green-600' : 'text-gray-400'} />
              <div className="text-center">
                <p className={`text-sm font-semibold ${paymentMethod === 'cash' ? 'text-green-600' : 'text-gray-700 dark:text-gray-200'}`}>Bayar Tunai</p>
                <p className="text-xs text-gray-400 mt-0.5">Bayar saat diterima</p>
              </div>
              {paymentMethod === 'cash' && <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">Dipilih ✓</span>}
            </button>
          </div>
        </div>

        <div className="flex justify-between items-end pt-2 border-t border-gray-100 dark:border-gray-700">
          <span className="text-gray-600 dark:text-gray-300 font-medium">Total</span>
          <div className="text-right">
            <p className="text-xl font-bold text-blue-600">{totalFormatted}</p>
            {totalKet && <p className="text-xs text-gray-400">({totalKet})</p>}
          </div>
        </div>

        <button
          onClick={handleCheckout}
          disabled={loading || !paymentMethod}
          className={`w-full py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${paymentMethod === 'cash' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
        >
          {loading ? 'Memproses...' : !paymentMethod ? 'Pilih Metode Pembayaran' : paymentMethod === 'cash' ? '💵 Pesan & Bayar Tunai Nanti' : '💳 Bayar Sekarang'}
        </button>
      </div>
    </div>
  );
}
