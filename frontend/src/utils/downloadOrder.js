// Fungsi download bukti pesanan untuk customer — format A4, buka dialog print/save PDF
import { formatHarga } from './formatRupiah';

export function downloadOrder(order, storeName = 'Warungku') {
  const formatDate = (d) => new Date(d).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const STATUS_LABEL = {
    pending: 'Menunggu',
    delivered: 'Selesai',
    cancelled: 'Dibatalkan'
  };

  const PAYMENT_LABEL = {
    cash: '💵 Tunai',
    qr_code: '📱 QRIS',
    credit_card: '💳 Kartu Kredit/Debit',
    online: '🌐 Transfer Online'
  };

  const custName = order.customer?.name || order.customerName || '-';
  const items = order.items || order.OrderItems || [];

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;">${item.productName}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatHarga(item.price)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">${formatHarga(item.subtotal)}</td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Bukti Pesanan - ${order.orderNumber}</title>
<style>
  @media print {
    @page { margin: 20mm; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none !important; }
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Arial, sans-serif;
    font-size: 13px;
    color: #111;
    background: #f9fafb;
    padding: 32px;
    max-width: 640px;
    margin: auto;
  }
  .card {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    overflow: hidden;
  }
  .header {
    background: linear-gradient(135deg, #059669, #0d9488);
    color: #fff;
    text-align: center;
    padding: 28px 24px 22px;
  }
  .header h1 { font-size: 26px; font-weight: 900; letter-spacing: 1px; margin-bottom: 4px; }
  .header p { font-size: 12px; opacity: 0.85; }
  .header .sub { font-size: 11px; opacity: 0.7; margin-top: 2px; }
  .body { padding: 24px; }
  .order-num {
    text-align: center;
    background: #f0fdf4;
    border: 1px dashed #6ee7b7;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 20px;
  }
  .order-num .label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em; }
  .order-num .value { font-size: 16px; font-weight: 800; color: #059669; margin-top: 2px; }
  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 20px;
  }
  .meta-item .label { font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 2px; }
  .meta-item .value { font-size: 13px; font-weight: 600; color: #1f2937; }
  .status-badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 99px;
    font-size: 11px;
    font-weight: 700;
  }
  .status-pending { background:#fef9c3; color:#854d0e; }
  .status-delivered { background:#dcfce7; color:#166534; }
  .status-cancelled { background:#fee2e2; color:#991b1b; }
  .section-title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #6b7280;
    margin-bottom: 8px;
  }
  table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
  thead tr { background: #f9fafb; }
  thead th {
    padding: 8px 10px;
    text-align: left;
    font-size: 11px;
    color: #6b7280;
    border-bottom: 2px solid #e5e7eb;
    font-weight: 600;
  }
  thead th:not(:first-child) { text-align: center; }
  thead th:last-child, thead th:nth-child(3) { text-align: right; }
  .total-row { border-top: 2px solid #059669; }
  .total-row td { padding: 12px 10px; font-weight: 800; font-size: 15px; }
  .total-row td:last-child { text-align: right; color: #059669; }
  .notes-box {
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 12px;
    color: #92400e;
    margin-top: 12px;
  }
  .footer {
    text-align: center;
    background: #f9fafb;
    border-top: 1px solid #e5e7eb;
    padding: 16px;
    font-size: 11px;
    color: #9ca3af;
    line-height: 1.8;
  }
  .btn-area { text-align: center; padding: 20px 0 8px; }
  .btn-download {
    background: linear-gradient(135deg, #059669, #0d9488);
    color: #fff; border: none;
    padding: 11px 30px; font-size: 14px; font-weight: bold;
    border-radius: 8px; cursor: pointer; margin-right: 8px;
    box-shadow: 0 2px 8px rgba(5,150,105,0.3);
  }
  .btn-download:hover { opacity: 0.9; }
  .btn-close {
    background: #f3f4f6; color: #374151; border: 1px solid #d1d5db;
    padding: 11px 20px; font-size: 14px; border-radius: 8px; cursor: pointer;
  }
  .btn-close:hover { background: #e5e7eb; }
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <h1>&#128717; ${storeName}</h1>
    <p>Bukti Pembelian</p>
    <p class="sub">Aplikasi Belanja Digital</p>
  </div>

  <div class="body">
    <div class="order-num">
      <div class="label">Nomor Pesanan</div>
      <div class="value">${order.orderNumber}</div>
    </div>

    <div class="meta-grid">
      <div class="meta-item">
        <div class="label">Tanggal</div>
        <div class="value">${formatDate(order.createdAt)}</div>
      </div>
      <div class="meta-item">
        <div class="label">Pelanggan</div>
        <div class="value">${custName}</div>
      </div>
      <div class="meta-item">
        <div class="label">Status</div>
        <div class="value">
          <span class="status-badge status-${order.status}">
            ${STATUS_LABEL[order.status] || order.status}
          </span>
        </div>
      </div>
      <div class="meta-item">
        <div class="label">Pembayaran</div>
        <div class="value">${PAYMENT_LABEL[order.paymentMethod] || order.paymentMethod}</div>
      </div>
    </div>

    <div class="section-title">Detail Pesanan</div>
    <table>
      <thead>
        <tr>
          <th>Produk</th>
          <th style="text-align:center">Qty</th>
          <th style="text-align:right">Harga</th>
          <th style="text-align:right">Subtotal</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
      <tfoot>
        <tr class="total-row">
          <td colspan="3" style="text-align:right">Total Pembayaran</td>
          <td>${formatHarga(order.totalAmount)}</td>
        </tr>
      </tfoot>
    </table>

    ${order.notes ? `<div class="notes-box">&#128221; <b>Catatan:</b> ${order.notes}</div>` : ''}
  </div>

  <div class="footer">
    <div>Terima kasih telah berbelanja di <b>${storeName}</b></div>
    <div>Simpan bukti ini sebagai tanda pembelian Anda</div>
    <div style="margin-top:4px;font-size:10px;">
      Dicetak: ${new Date().toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}
    </div>
  </div>
</div>

<div class="btn-area no-print">
  <button class="btn-download" onclick="window.print()">&#11015; Download / Cetak</button>
  <button class="btn-close" onclick="window.close()">Tutup</button>
</div>

</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank', 'width=700,height=800,scrollbars=yes');
  if (!win) {
    alert('Popup diblokir browser.\nKlik ikon di address bar dan izinkan popup, lalu coba lagi.');
    URL.revokeObjectURL(url);
    return;
  }
  win.addEventListener('load', () => URL.revokeObjectURL(url));
}
