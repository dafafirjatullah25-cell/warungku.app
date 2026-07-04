// Fungsi print struk format thermal printer
// Menggunakan Blob URL supaya tidak di-redirect oleh Vite dev server
import { formatHarga } from './formatRupiah';

export function printOrder(order, storeName = 'Warungku') {
  const formatDate = (d) => new Date(d).toLocaleDateString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const PAYMENT_LABEL = {
    cash: 'Tunai',
    qr_code: 'QRIS',
    credit_card: 'Kartu Kredit/Debit',
    online: 'Transfer Online'
  };

  const STATUS_LABEL = {
    pending: 'Menunggu',
    delivered: 'Selesai',
    cancelled: 'Dibatalkan'
  };

  const custName = order.customer?.name || order.customerName || 'Umum';
  const items = order.items || order.OrderItems || [];

  const itemsRows = items.map(item => `
    <tr>
      <td colspan="2" style="padding:3px 0 1px 0;font-weight:bold;">${item.productName}</td>
    </tr>
    <tr>
      <td style="padding:1px 0 5px 0;color:#555;">${item.quantity} x ${formatHarga(item.price)}</td>
      <td style="padding:1px 0 5px 0;text-align:right;font-weight:bold;">${formatHarga(item.subtotal)}</td>
    </tr>`
  ).join('');

  const notesRow = order.notes
    ? `<tr><td colspan="2" style="padding-top:6px;font-size:10px;color:#555;border-top:1px dashed #000;"><b>Catatan:</b> ${order.notes}</td></tr>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Struk - ${order.orderNumber}</title>
<style>
  @media print {
    @page { width: 80mm; margin: 4mm 3mm; }
    .no-print { display: none !important; }
  }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    color: #000;
    background: #fff;
    width: 302px;
    margin: 0 auto;
    padding: 12px 8px;
  }
  .center { text-align: center; }
  .store-name { font-size: 20px; font-weight: 900; letter-spacing: 1px; margin-bottom: 3px; }
  .store-sub { font-size: 10px; color: #555; }
  .divider-dash { border: none; border-top: 1px dashed #000; margin: 6px 0; }
  .divider-solid { border: none; border-top: 2px solid #000; margin: 6px 0; }
  .info-table { width: 100%; border-collapse: collapse; font-size: 11px; margin: 4px 0; }
  .info-table td { padding: 2px 0; vertical-align: top; }
  .info-table td:first-child { width: 44%; color: #555; }
  .items-table { width: 100%; border-collapse: collapse; font-size: 11px; }
  .total-table { width: 100%; border-collapse: collapse; }
  .total-row td { font-size: 14px; font-weight: 900; padding: 4px 0; }
  .total-row td:last-child { text-align: right; }
  .footer { text-align: center; font-size: 10px; color: #555; margin-top: 8px; line-height: 1.7; }
  .btn-area { text-align: center; padding: 20px 0 8px; }
  .btn-print {
    background: #059669; color: #fff; border: none;
    padding: 10px 28px; font-size: 14px; font-weight: bold;
    border-radius: 8px; cursor: pointer; margin-right: 8px;
  }
  .btn-print:hover { background: #047857; }
  .btn-close {
    background: #f3f4f6; color: #374151; border: 1px solid #d1d5db;
    padding: 10px 20px; font-size: 14px; border-radius: 8px; cursor: pointer;
  }
  .btn-close:hover { background: #e5e7eb; }
</style>
</head>
<body>

<div class="center">
  <div class="store-name">&#128717; ${storeName}</div>
  <div class="store-sub">Aplikasi Belanja Digital</div>
</div>

<hr class="divider-dash"/>

<table class="info-table">
  <tr><td>No. Struk</td><td><b>${order.orderNumber}</b></td></tr>
  <tr><td>Tanggal</td><td>${formatDate(order.createdAt)}</td></tr>
  <tr><td>Pelanggan</td><td>${custName}</td></tr>
  <tr><td>Status</td><td>${STATUS_LABEL[order.status] || order.status}</td></tr>
  <tr><td>Pembayaran</td><td>${PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod}</td></tr>
</table>

<hr class="divider-solid"/>

<table class="items-table">
  <tbody>
    ${itemsRows}
    ${notesRow}
  </tbody>
</table>

<hr class="divider-solid"/>

<table class="total-table">
  <tr class="total-row">
    <td>TOTAL</td>
    <td>${formatHarga(order.totalAmount)}</td>
  </tr>
</table>

<hr class="divider-dash"/>

<div class="footer">
  <div>Terima kasih sudah berbelanja!</div>
  <div>di <b>${storeName}</b></div>
  <div style="font-size:9px;color:#aaa;margin-top:3px;">
    Dicetak: ${new Date().toLocaleDateString('id-ID', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}
  </div>
</div>

<div class="btn-area no-print">
  <button class="btn-print" onclick="window.print()">&#128424; Cetak Struk</button>
  <button class="btn-close" onclick="window.close()">Tutup</button>
</div>

</body>
</html>`;

  // Gunakan Blob URL — tidak bisa di-redirect oleh Vite
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const win = window.open(url, '_blank', 'width=400,height=650,scrollbars=yes');
  if (!win) {
    alert('Popup diblokir browser.\nKlik ikon di address bar dan izinkan popup, lalu coba lagi.');
    URL.revokeObjectURL(url);
    return;
  }

  // Bersihkan URL setelah jendela selesai load
  win.addEventListener('load', () => {
    URL.revokeObjectURL(url);
  });
}
