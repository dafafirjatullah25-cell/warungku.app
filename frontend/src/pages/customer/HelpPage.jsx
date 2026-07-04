import React, { useState } from 'react';
import {
  HelpCircle, X, ShoppingBag, ShoppingCart, ClipboardList,
  User, CreditCard, Banknote, Download, ChevronDown, ChevronUp,
  CheckCircle, XCircle, Package, UserX
} from 'lucide-react';

const SECTIONS = [
  {
    icon: ShoppingBag,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    title: 'Halaman Produk',
    short: 'Lihat dan pilih barang yang ingin dibeli',
    steps: [
      'Buka halaman Produk dari menu atas',
      'Gunakan kotak pencarian untuk cari nama barang atau kategori',
      'Lihat harga dan stok yang tersedia di setiap kartu produk',
      'Klik tombol "Tambah" untuk memasukkan barang ke keranjang',
      'Bisa tambah barang yang sama berkali-kali, asal tidak melebihi stok',
    ],
    tips: 'Kalau tombol "Tambah" abu-abu dan tidak bisa diklik, berarti stok barang itu sudah habis.',
  },
  {
    icon: ShoppingCart,
    color: 'text-green-500',
    bg: 'bg-green-50',
    title: 'Keranjang Belanja',
    short: 'Periksa pesanan sebelum bayar',
    steps: [
      'Buka keranjang dari menu atas — angka kecil biru menunjukkan jumlah barang',
      'Tambah atau kurangi jumlah setiap barang dengan tombol + dan −',
      'Klik ikon sampah merah untuk hapus barang dari keranjang',
      'Isi catatan pesanan kalau ada permintaan khusus (opsional)',
      'Pilih cara bayar: Bayar Sekarang (online) atau Bayar Tunai',
      'Klik tombol pesan di paling bawah untuk konfirmasi',
    ],
    tips: 'Cek total harga di bagian bawah sebelum menekan tombol pesan. Total akan otomatis terhitung.',
  },
  {
    icon: CreditCard,
    color: 'text-purple-500',
    bg: 'bg-purple-50',
    title: 'Cara Bayar Online',
    short: 'QRIS, kartu, atau dompet digital',
    steps: [
      'Pilih "Bayar Sekarang" di keranjang',
      'Klik tombol biru "Bayar Sekarang"',
      'Jendela pembayaran akan terbuka otomatis',
      'Pilih metode: QRIS, transfer bank, kartu kredit/debit, atau e-wallet',
      'Ikuti instruksi di layar sampai muncul konfirmasi berhasil',
      'Pesanan otomatis tercatat setelah pembayaran sukses',
    ],
    tips: 'Jangan tutup jendela pembayaran sebelum selesai. Kalau tidak sengaja tertutup, cek halaman Pesanan — pesanan biasanya masih tercatat.',
  },
  {
    icon: Banknote,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    title: 'Cara Bayar Tunai',
    short: 'Bayar langsung saat barang diterima',
    steps: [
      'Pilih "Bayar Tunai" di keranjang',
      'Klik tombol hijau "Pesan & Bayar Tunai Nanti"',
      'Pesanan langsung dibuat tanpa perlu bayar sekarang',
      'Siapkan uang tunai sesuai total pesanan',
      'Bayar kepada kurir atau petugas saat barang diterima',
    ],
    tips: 'Metode tunai cocok kalau tidak punya dompet digital atau kartu. Tidak perlu koneksi internet saat bayar.',
  },
  {
    icon: ClipboardList,
    color: 'text-orange-500',
    bg: 'bg-orange-50',
    title: 'Riwayat Pesanan',
    short: 'Pantau status dan unduh bukti pesanan',
    steps: [
      'Buka halaman Pesanan dari menu atas',
      'Semua pesanan kamu tampil di sini, terbaru paling atas',
      'Kalau pesanan belum semua tampil, klik "Muat lebih banyak" di bawah',
      'Klik ikon unduh (⬇) di setiap pesanan untuk simpan bukti sebagai PDF',
      'Pesanan dengan status "Menunggu" masih bisa dibatalkan',
      'Klik "Batalkan" lalu konfirmasi — stok otomatis dikembalikan',
    ],
    tips: null,
    statuses: [
      { icon: CheckCircle, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Menunggu', desc: 'Pesanan diterima, sedang diproses' },
      { icon: Package, color: 'text-green-600', bg: 'bg-green-100', label: 'Dikirim', desc: 'Barang sedang dalam pengiriman' },
      { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100', label: 'Dibatalkan', desc: 'Pesanan telah dibatalkan' },
    ],
  },
  {
    icon: Download,
    color: 'text-indigo-500',
    bg: 'bg-indigo-50',
    title: 'Unduh Bukti Pesanan',
    short: 'Simpan sebagai PDF untuk arsip',
    steps: [
      'Buka halaman Pesanan',
      'Temukan pesanan yang ingin disimpan',
      'Klik ikon unduh (⬇) di pojok kanan atas kartu pesanan',
      'Tab baru akan terbuka dengan tampilan bukti pesanan',
      'Tekan Ctrl+P (Windows) atau Cmd+P (Mac) untuk cetak atau simpan',
      'Pilih "Save as PDF" di kolom printer untuk simpan sebagai file PDF',
    ],
    tips: 'Simpan bukti pesanan sebagai PDF untuk klaim garansi atau sebagai arsip belanja kamu.',
  },
  {
    icon: User,
    color: 'text-pink-500',
    bg: 'bg-pink-50',
    title: 'Profil Saya',
    short: 'Ubah nama, nomor HP, dan alamat',
    steps: [
      'Buka halaman Profil dari menu atas',
      'Klik tombol "Edit Profil"',
      'Ubah nama, nomor HP, atau alamat sesuai kebutuhan',
      'Klik "Simpan" untuk menyimpan perubahan',
      'Email tidak bisa diubah karena dipakai untuk login',
    ],
    tips: 'Pastikan nomor HP dan alamat selalu up to date supaya pesanan bisa dikirim ke tempat yang benar.',
  },
  {
    icon: UserX,
    color: 'text-red-500',
    bg: 'bg-red-50',
    title: 'Hapus Akun',
    short: 'Keluar permanen dari aplikasi ini',
    steps: [
      'Buka halaman Profil dari menu bawah (ikon orang)',
      'Scroll ke bawah, cari tombol merah "Hapus Akun Saya"',
      'Klik tombol tersebut — akan muncul jendela konfirmasi',
      'Baca pesan konfirmasi dengan teliti',
      'Klik "Ya, Hapus Akun" untuk melanjutkan',
      'Akun langsung terhapus dan kamu otomatis keluar dari aplikasi',
    ],
    tips: 'Kalau suatu saat ingin belanja lagi, kamu bisa daftar ulang kapan saja di halaman Daftar. Cukup masukkan nama, email, dan password baru.',
  },
];

function AccordionItem({ section }) {
  const [open, setOpen] = useState(false);
  const Icon = section.icon;

  return (
    <div className={`rounded-xl border transition-all ${open ? 'border-blue-200 dark:border-blue-700 shadow-sm' : 'border-gray-200 dark:border-gray-700'}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${section.bg} dark:bg-opacity-20`}>
          <Icon size={18} className={section.color} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{section.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{section.short}</p>
        </div>
        {open
          ? <ChevronUp size={16} className="text-blue-500 flex-shrink-0" />
          : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-0">
          <div className="ml-12 space-y-3">
            <ol className="space-y-2">
              {section.steps.map((step, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                  <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5 ${section.color.replace('text-', 'bg-')}`}>
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>

            {section.statuses && (
              <div className="mt-3 space-y-1.5">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status Pesanan</p>
                {section.statuses.map((s) => {
                  const SIcon = s.icon;
                  return (
                    <div key={s.label} className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${s.bg} ${s.color}`}>
                        {s.label}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{s.desc}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {section.tips && (
              <div className="mt-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2.5 flex gap-2">
                <span className="text-amber-500 flex-shrink-0 mt-0.5">💡</span>
                <p className="text-xs text-amber-800 dark:text-amber-300">{section.tips}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HelpModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Bantuan"
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-2.5 py-1.5 rounded-lg transition-colors"
      >
        <HelpCircle size={17} />
        <span className="hidden sm:inline">Bantuan</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div>
                <h2 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Panduan Penggunaan</h2>
                <p className="text-xs text-gray-400 mt-0.5">Klik bagian yang ingin kamu pelajari</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 p-1.5 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {SECTIONS.map((section) => (
                <AccordionItem key={section.title} section={section} />
              ))}
            </div>

            <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-b-2xl flex-shrink-0">
              <p className="text-xs text-center text-gray-400">
                Ada pertanyaan lain? Hubungi admin toko 😊
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
