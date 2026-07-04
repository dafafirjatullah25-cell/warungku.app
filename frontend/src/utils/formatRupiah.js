/**
 * Format angka ke Rupiah dengan titik pemisah ribuan
 * + keterangan juta/miliar/triliun
 * Contoh: 1000000 → "Rp 1.000.000 (1 Juta)"
 */
export const formatRupiah = (n) => {
  const num = parseFloat(n) || 0;
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(num);

  let keterangan = '';
  if (num >= 1_000_000_000_000) {
    const val = (num / 1_000_000_000_000).toFixed(num % 1_000_000_000_000 === 0 ? 0 : 2);
    keterangan = `${val} Triliun`;
  } else if (num >= 1_000_000_000) {
    const val = (num / 1_000_000_000).toFixed(num % 1_000_000_000 === 0 ? 0 : 2);
    keterangan = `${val} Miliar`;
  } else if (num >= 1_000_000) {
    const val = (num / 1_000_000).toFixed(num % 1_000_000 === 0 ? 0 : 2);
    keterangan = `${val} Juta`;
  }

  return { formatted, keterangan };
};

/**
 * Tampilkan harga lengkap dengan keterangan
 * Contoh: "Rp 1.000.000 (1 Juta)"
 */
export const formatHarga = (n) => {
  const { formatted, keterangan } = formatRupiah(n);
  return keterangan ? `${formatted} (${keterangan})` : formatted;
};
