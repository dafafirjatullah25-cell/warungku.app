import React, { useState, useEffect } from 'react';
import {
  BarChart2, Download, Plus, Trash2, Calculator, TrendingUp, TrendingDown,
  Pencil, Check, X, AlertTriangle, CreditCard, CheckCircle2, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { formatHarga, formatRupiah } from '../../utils/formatRupiah';

function HargaPreview({ value }) {
  const num = parseFloat(value) || 0;
  if (num <= 0) return null;
  const { formatted, keterangan } = formatRupiah(num);
  return (
    <p className="text-xs text-blue-500 mt-1">
      {formatted}{keterangan ? ` (${keterangan})` : ''}
    </p>
  );
}

function printReport(data, startDate, endDate) {
  const formatDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const formatDateShort = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const rowsHtml = data.orders.map((order, idx) => `
    <tr style="background:${idx % 2 === 0 ? '#fff' : '#f9fafb'}">
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;">${order.orderNumber}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;">${order.customer?.name || '-'}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatHarga(order.totalAmount)}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;">${formatDateShort(order.createdAt)}</td>
    </tr>`).join('');
  const html = `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"/>
<title>Laporan ${startDate} - ${endDate}</title>
<style>@media print{@page{margin:20mm}body{-webkit-print-color-adjust:exact}}*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:13px;color:#111;padding:32px;max-width:800px;margin:auto}.header{text-align:center;margin-bottom:24px;border-bottom:2px solid #111;padding-bottom:16px}.header h1{font-size:20px;font-weight:700}.summary{display:flex;gap:24px;margin-bottom:24px}.sc{flex:1;border:1px solid #e5e7eb;border-radius:8px;padding:16px;text-align:center}.sc label{display:block;font-size:11px;color:#888;text-transform:uppercase;margin-bottom:6px}.v{font-size:18px;font-weight:700}.vg{color:#16a34a}.vb{color:#2563eb}table{width:100%;border-collapse:collapse}thead tr{background:#f3f4f6}thead th{padding:10px;text-align:left;font-size:12px;color:#555;border-bottom:2px solid #e5e7eb}thead th:nth-child(3){text-align:right}.footer{margin-top:28px;text-align:center;font-size:11px;color:#888;border-top:1px dashed #ccc;padding-top:14px}</style>
</head><body>
<div class="header"><h1>LAPORAN PENJUALAN</h1><p>Periode: ${formatDate(startDate)} s/d ${formatDate(endDate)}</p></div>
<div class="summary">
  <div class="sc"><label>Total Pendapatan</label><div class="v vg">${formatHarga(data.totalRevenue)}</div></div>
  <div class="sc"><label>Total Pesanan</label><div class="v vb">${data.totalOrders}</div></div>
</div>
<table><thead><tr><th>No. Pesanan</th><th>Pelanggan</th><th style="text-align:right">Total</th><th>Tanggal</th></tr></thead>
<tbody>${rowsHtml}</tbody></table>
${data.orders.length === 0 ? '<p style="text-align:center;padding:32px;color:#9ca3af;">Tidak ada data</p>' : ''}
<div class="footer"><p>Dicetak pada ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p></div>
</body></html>`;
  const win = window.open('', '_blank', 'width=900,height=900');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

// ─── Download PDF Bukti Hutang ────────────────────────────────────
function downloadDebtPDF(debt) {
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';
  const fmtRp = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(parseFloat(n) || 0);

  const payments = (debt.payments || []);
  const cicilanTotal = payments.reduce((s, p) => s + parseFloat(p.amount), 0);
  // Kalau lunas via "Tandai Lunas" manual (tidak ada cicilan), total terbayar = nominal
  const totalPaid = debt.isPaid && cicilanTotal === 0 ? parseFloat(debt.nominal) : cicilanTotal;
  const sisa = parseFloat(debt.nominal) - totalPaid;

  const rowsHtml = payments.length > 0
    ? payments.map((p, i) => `
        <tr style="background:${i % 2 === 0 ? '#fff' : '#f9fafb'}">
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${i + 1}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${fmtDate(p.createdAt)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;color:#16a34a;">${fmtRp(p.amount)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${p.note || '-'}</td>
        </tr>`).join('')
    : debt.isPaid
      ? `<tr style="background:#f0fdf4">
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">1</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${fmtDate(debt.paidAt)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;color:#16a34a;">${fmtRp(debt.nominal)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">Dilunasi sekaligus</td>
        </tr>`
      : `<tr><td colspan="4" style="text-align:center;padding:16px;color:#9ca3af;">Belum ada cicilan</td></tr>`;

  const statusBadge = debt.isPaid
    ? `<span style="background:#dcfce7;color:#16a34a;padding:4px 12px;border-radius:99px;font-size:12px;font-weight:700;">✓ LUNAS</span>`
    : `<span style="background:#fff7ed;color:#ea580c;padding:4px 12px;border-radius:99px;font-size:12px;font-weight:700;">BELUM LUNAS</span>`;

  const html = `<!DOCTYPE html><html lang="id"><head><meta charset="UTF-8"/>
<title>Bukti Hutang - ${debt.label}</title>
<style>
  @media print { @page { margin: 20mm } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #111; padding: 32px; max-width: 700px; margin: auto; }
  .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #111; padding-bottom: 16px; }
  .header h1 { font-size: 20px; font-weight: 700; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
  .info-box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; }
  .info-box label { display: block; font-size: 11px; color: #888; text-transform: uppercase; margin-bottom: 4px; }
  .info-box .val { font-size: 16px; font-weight: 700; }
  .green { color: #16a34a; }
  .orange { color: #ea580c; }
  table { width: 100%; border-collapse: collapse; }
  thead tr { background: #f3f4f6; }
  thead th { padding: 10px 12px; text-align: left; font-size: 11px; color: #555; border-bottom: 2px solid #e5e7eb; }
  thead th:nth-child(3) { text-align: right; }
  .footer { margin-top: 28px; text-align: center; font-size: 11px; color: #888; border-top: 1px dashed #ccc; padding-top: 14px; }
  .summary { display: flex; justify-content: flex-end; margin-top: 12px; }
  .summary-box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; min-width: 240px; }
  .summary-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; }
  .summary-total { display: flex; justify-content: space-between; font-size: 15px; font-weight: 700; border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 4px; }
</style></head>
<body>
  <div class="header">
    <h1>BUKTI PENCATATAN HUTANG</h1>
    <p>Dicetak pada ${fmtDate(new Date())}</p>
  </div>
  <div class="info-grid">
    <div class="info-box">
      <label>Keterangan Hutang</label>
      <div class="val">${debt.label}</div>
    </div>
    <div class="info-box">
      <label>Status</label>
      <div style="margin-top:4px;">${statusBadge}</div>
    </div>
    <div class="info-box">
      <label>Total Hutang</label>
      <div class="val orange">${fmtRp(debt.nominal)}</div>
    </div>
    <div class="info-box">
      <label>Jatuh Tempo</label>
      <div class="val">${fmtDate(debt.dueDate)}</div>
    </div>
    ${debt.isPaid ? `<div class="info-box"><label>Tanggal Lunas</label><div class="val green">${fmtDate(debt.paidAt)}</div></div>` : ''}
  </div>
  <p style="font-weight:600;margin-bottom:8px;">Riwayat Cicilan</p>
  <table>
    <thead><tr>
      <th>#</th><th>Tanggal</th><th style="text-align:right">Jumlah</th><th>Catatan</th>
    </tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <div class="summary">
    <div class="summary-box">
      <div class="summary-row"><span>Total Hutang</span><span>${fmtRp(debt.nominal)}</span></div>
      <div class="summary-row"><span>Total Terbayar</span><span class="green">${fmtRp(totalPaid)}</span></div>
      <div class="summary-total"><span>Sisa</span><span class="${sisa > 0 ? 'orange' : 'green'}">${fmtRp(sisa)}</span></div>
    </div>
  </div>
  <div class="footer"><p>Dokumen ini dibuat otomatis oleh sistem kasir</p></div>
</body></html>`;

  const win = window.open('', '_blank', 'width=800,height=900');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

// ─── Helper: hitung selisih hari dari sekarang ke dueDate ─────────
function daysDiff(dueDate) {
  if (!dueDate) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const due = new Date(dueDate); due.setHours(0,0,0,0);
  return Math.ceil((due - today) / (1000 * 60 * 60 * 24));
}

function DebtWarningBanner({ debts }) {
  const overdueList = debts.filter(d => !d.isPaid && d.dueDate && daysDiff(d.dueDate) < 0);
  const dueSoonList = debts.filter(d => !d.isPaid && d.dueDate && daysDiff(d.dueDate) >= 0 && daysDiff(d.dueDate) <= 3);
  if (overdueList.length === 0 && dueSoonList.length === 0) return null;

  const fmtDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-2 mb-4">
      {overdueList.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={15} className="text-red-500 flex-shrink-0" />
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              Hutang Jatuh Tempo Terlewat!
            </p>
          </div>
          <div className="space-y-1">
            {overdueList.map(d => {
              const diff = Math.abs(daysDiff(d.dueDate));
              return (
                <div key={d.id} className="flex items-center justify-between text-xs text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 rounded-lg px-3 py-1.5">
                  <span className="font-medium truncate mr-2">{d.label}</span>
                  <span className="flex-shrink-0 font-bold">{formatHarga(d.nominal)} · telat {diff} hari (jatuh tempo {fmtDate(d.dueDate)})</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {dueSoonList.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={15} className="text-yellow-600 flex-shrink-0" />
            <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">
              Hutang Jatuh Tempo Dalam 3 Hari
            </p>
          </div>
          <div className="space-y-1">
            {dueSoonList.map(d => {
              const diff = daysDiff(d.dueDate);
              return (
                <div key={d.id} className="flex items-center justify-between text-xs text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg px-3 py-1.5">
                  <span className="font-medium truncate mr-2">{d.label}</span>
                  <span className="flex-shrink-0 font-bold">
                    {formatHarga(d.nominal)} · {diff === 0 ? 'hari ini!' : `${diff} hari lagi`} ({fmtDate(d.dueDate)})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Kalkulator Untung/Rugi ───────────────────────────────────────
function KalkulatorUntungRugi({ pendapatan }) {
  const [expenses, setExpenses] = useState([]);
  const [loadingExp, setLoadingExp] = useState(true);
  const [tab, setTab] = useState('expense'); // 'expense' | 'debt'

  // Form tambah pengeluaran
  const [newLabel, setNewLabel] = useState('');
  const [newNominal, setNewNominal] = useState('');
  // Form tambah hutang
  const [debtLabel, setDebtLabel] = useState('');
  const [debtNominal, setDebtNominal] = useState('');
  const [debtDueDate, setDebtDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  // Edit inline
  const [editId, setEditId] = useState(null);
  const [editLabel, setEditLabel] = useState('');
  const [editNominal, setEditNominal] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  const fetchExpenses = () => {
    setLoadingExp(true);
    api.get('/admin/expenses')
      .then(({ data }) => setExpenses(data))
      .catch(() => toast.error('Gagal memuat data'))
      .finally(() => setLoadingExp(false));
  };
  useEffect(() => { fetchExpenses(); }, []);

  const handleAdd = async (type) => {
    const label = type === 'expense' ? newLabel : debtLabel;
    const nominal = type === 'expense' ? newNominal : debtNominal;
    if (!label.trim()) { toast.error('Keterangan wajib diisi'); return; }
    if (!nominal || parseFloat(nominal) <= 0) { toast.error('Nominal wajib diisi'); return; }
    setSaving(true);
    try {
      const payload = { label: label.trim(), nominal: parseFloat(nominal), type };
      if (type === 'debt') payload.dueDate = debtDueDate || null;
      const { data } = await api.post('/admin/expenses', payload);
      setExpenses(prev => [...prev, data]);
      if (type === 'expense') { setNewLabel(''); setNewNominal(''); }
      else { setDebtLabel(''); setDebtNominal(''); setDebtDueDate(''); }
      toast.success(type === 'expense' ? 'Pengeluaran ditambahkan' : 'Hutang ditambahkan');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan');
    } finally { setSaving(false); }
  };

  const handleTogglePaid = async (id) => {
    try {
      const { data } = await api.put(`/admin/expenses/${id}/toggle-paid`);
      setExpenses(prev => prev.map(e => e.id === id ? data : e));
      toast.success(data.isPaid ? 'Hutang ditandai lunas' : 'Hutang ditandai belum lunas');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengubah status');
    }
  };

  // State cicilan
  const [cicilanId, setCicilanId] = useState(null); // id hutang yang sedang dibuka panel cicilan
  const [cicilanAmount, setCicilanAmount] = useState('');
  const [cicilanNote, setCicilanNote] = useState('');
  const [savingCicilan, setSavingCicilan] = useState(false);

  const handleBayarCicilan = async (debtId) => {
    if (!cicilanAmount || parseFloat(cicilanAmount) <= 0) {
      toast.error('Jumlah cicilan harus lebih dari 0'); return;
    }
    setSavingCicilan(true);
    try {
      const { data } = await api.post(`/admin/expenses/${debtId}/pay`, {
        amount: parseFloat(cicilanAmount),
        note: cicilanNote.trim() || null
      });
      setExpenses(prev => prev.map(e => e.id === debtId ? data.expense : e));
      setCicilanAmount('');
      setCicilanNote('');
      toast.success(data.message);
      if (data.expense.isPaid) setCicilanId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mencatat cicilan');
    } finally { setSavingCicilan(false); }
  };

  const handleHapusCicilan = async (debtId, paymentId) => {
    if (!window.confirm('Hapus cicilan ini?')) return;
    try {
      const { data } = await api.delete(`/admin/expenses/${debtId}/pay/${paymentId}`);
      setExpenses(prev => prev.map(e => e.id === debtId ? data.expense : e));
      toast.success('Cicilan dihapus');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus cicilan');
    }
  };

  const startEdit = (exp) => {
    setEditId(exp.id);
    setEditLabel(exp.label);
    setEditNominal(String(exp.nominal));
    setEditDueDate(exp.dueDate || '');
  };
  const cancelEdit = () => { setEditId(null); setEditLabel(''); setEditNominal(''); setEditDueDate(''); };

  const handleSaveEdit = async (id, type) => {
    if (!editLabel.trim()) { toast.error('Keterangan tidak boleh kosong'); return; }
    try {
      const payload = { label: editLabel.trim(), nominal: parseFloat(editNominal) || 0 };
      if (type === 'debt') payload.dueDate = editDueDate || null;
      const { data } = await api.put(`/admin/expenses/${id}`, payload);
      setExpenses(prev => prev.map(e => e.id === id ? data : e));
      cancelEdit();
      toast.success('Berhasil diperbarui');
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal memperbarui'); }
  };

  const handleDelete = async (id, label) => {
    if (!window.confirm(`Hapus "${label}"?`)) return;
    try {
      await api.delete(`/admin/expenses/${id}`);
      setExpenses(prev => prev.filter(e => e.id !== id));
      toast.success('Berhasil dihapus');
    } catch { toast.error('Gagal menghapus'); }
  };

  const expenseList = expenses.filter(e => e.type === 'expense');
  const debtList = expenses.filter(e => e.type === 'debt');
  const unpaidDebts = debtList.filter(d => !d.isPaid);

  const totalPengeluaran = expenseList.reduce((s, e) => s + parseFloat(e.nominal), 0);
  const totalHutangBelumLunas = unpaidDebts.reduce((s, e) => s + parseFloat(e.nominal), 0);
  const selisih = pendapatan - totalPengeluaran - totalHutangBelumLunas;
  const isUntung = selisih >= 0;

  const { formatted: fPendapatan } = formatRupiah(pendapatan);
  const { formatted: fPengeluaran } = formatRupiah(totalPengeluaran);
  const { formatted: fHutang } = formatRupiah(totalHutangBelumLunas);
  const { formatted: fSelisih, keterangan: kSelisih } = formatRupiah(Math.abs(selisih));

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
  const today = new Date(); today.setHours(0,0,0,0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 mt-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0">
          <Calculator size={18} className="text-purple-600" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Kalkulator Untung / Rugi</h2>
          <p className="text-xs text-gray-400">Data pengeluaran tersimpan permanen — tidak hilang saat ganti periode</p>
        </div>
      </div>

      {/* Warning banner hutang overdue / due soon */}
      <DebtWarningBanner debts={debtList} />

      {/* Pendapatan */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3 mb-5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <TrendingUp size={15} className="text-green-600" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">Pendapatan Periode Ini</span>
          </div>
          <p className="font-bold text-green-700 dark:text-green-400">{fPendapatan}</p>
        </div>
        {pendapatan === 0 && (
          <p className="text-xs text-green-600 mt-1.5 opacity-70">⚠ Tampilkan laporan di atas untuk mengisi pendapatan otomatis</p>
        )}
      </div>

      {/* Tab: Pengeluaran | Hutang */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg p-1 mb-4">
        <button
          onClick={() => setTab('expense')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'expense' ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <TrendingDown size={14} /> Pengeluaran
          {expenseList.length > 0 && <span className="text-xs bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-1.5 rounded-full">{expenseList.length}</span>}
        </button>
        <button
          onClick={() => setTab('debt')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'debt' ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
        >
          <CreditCard size={14} /> Hutang
          {unpaidDebts.length > 0 && <span className="text-xs bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 px-1.5 rounded-full">{unpaidDebts.length}</span>}
        </button>
      </div>

      {loadingExp ? (
        <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500" /></div>
      ) : (
        <>
          {/* ── TAB PENGELUARAN ── */}
          {tab === 'expense' && (
            <div className="space-y-2 mb-4">
              {expenseList.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">Belum ada pengeluaran. Tambahkan di bawah.</p>
              ) : expenseList.map(exp => (
                <div key={exp.id} className="border border-gray-100 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-700/50">
                  {editId === exp.id ? (
                    <div className="space-y-2">
                      <input type="text" value={editLabel} onChange={e => setEditLabel(e.target.value)} autoFocus
                        className="w-full border border-blue-300 dark:border-blue-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-gray-100" />
                      <input type="number" value={editNominal} onChange={e => setEditNominal(e.target.value)} min={0}
                        className="w-full border border-blue-300 dark:border-blue-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-gray-100" />
                      <HargaPreview value={editNominal} />
                      <div className="flex gap-2">
                        <button onClick={() => handleSaveEdit(exp.id, 'expense')} className="flex items-center gap-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"><Check size={12} /> Simpan</button>
                        <button onClick={cancelEdit} className="flex items-center gap-1 text-xs border border-gray-300 dark:border-gray-600 text-gray-500 px-3 py-1.5 rounded-lg"><X size={12} /> Batal</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{exp.label}</p>
                        <p className="text-sm text-red-500 font-semibold">{formatHarga(exp.nominal)}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button onClick={() => startEdit(exp)} className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"><Pencil size={13} /></button>
                        <button onClick={() => handleDelete(exp.id, exp.label)} className="p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 size={13} /></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Form tambah pengeluaran */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 mt-2">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-3 uppercase tracking-wide">+ Tambah Pengeluaran Baru</p>
                <div className="flex gap-2 flex-col sm:flex-row">
                  <input type="text" value={newLabel} onChange={e => setNewLabel(e.target.value)}
                    placeholder="Keterangan (cth: beli barang, listrik...)" onKeyDown={e => e.key === 'Enter' && handleAdd('expense')}
                    className="flex-1 border border-blue-200 dark:border-blue-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-700 dark:text-gray-100" />
                  <div className="sm:w-44">
                    <input type="number" value={newNominal} onChange={e => setNewNominal(e.target.value)}
                      placeholder="Nominal" min={0} onKeyDown={e => e.key === 'Enter' && handleAdd('expense')}
                      className="w-full border border-blue-200 dark:border-blue-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-700 dark:text-gray-100" />
                    <HargaPreview value={newNominal} />
                  </div>
                  <button onClick={() => handleAdd('expense')} disabled={saving}
                    className="flex items-center justify-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 sm:self-start">
                    <Plus size={14} /> {saving ? 'Menyimpan...' : 'Tambah'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB HUTANG ── */}
          {tab === 'debt' && (
            <div className="space-y-3 mb-4">
              {debtList.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">Belum ada hutang. Tambahkan di bawah.</p>
              ) : debtList.map(debt => {
                const diff = daysDiff(debt.dueDate);
                const isOverdue = !debt.isPaid && debt.dueDate && diff < 0;
                const isDueSoon = !debt.isPaid && debt.dueDate && diff >= 0 && diff <= 3;
                const nominal = parseFloat(debt.nominal);
                const paid = parseFloat(debt.paidAmount || 0);
                const sisa = nominal - paid;
                const pct = nominal > 0 ? Math.min(100, Math.round((paid / nominal) * 100)) : 0;
                const showCicilan = cicilanId === debt.id;
                return (
                  <div key={debt.id} className={`border rounded-xl overflow-hidden ${
                    debt.isPaid ? 'border-green-200 dark:border-green-800'
                    : isOverdue ? 'border-red-200 dark:border-red-800'
                    : isDueSoon ? 'border-yellow-200 dark:border-yellow-800'
                    : 'border-gray-200 dark:border-gray-700'
                  }`}>
                    {/* body kartu */}
                    <div className={`p-3 ${
                      debt.isPaid ? 'bg-green-50 dark:bg-green-900/10'
                      : isOverdue ? 'bg-red-50 dark:bg-red-900/10'
                      : isDueSoon ? 'bg-yellow-50 dark:bg-yellow-900/10'
                      : 'bg-gray-50 dark:bg-gray-700/50'
                    }`}>
                      {editId === debt.id ? (
                        <div className="space-y-2">
                          <input type="text" value={editLabel} onChange={e => setEditLabel(e.target.value)} autoFocus
                            className="w-full border border-blue-300 dark:border-blue-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-gray-100" />
                          <input type="number" value={editNominal} onChange={e => setEditNominal(e.target.value)} min={0}
                            className="w-full border border-blue-300 dark:border-blue-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-gray-100" />
                          <HargaPreview value={editNominal} />
                          <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Tanggal Jatuh Tempo</label>
                            <input type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)}
                              className="w-full border border-blue-300 dark:border-blue-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-gray-100" />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleSaveEdit(debt.id, 'debt')} className="flex items-center gap-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"><Check size={12} /> Simpan</button>
                            <button onClick={cancelEdit} className="flex items-center gap-1 text-xs border border-gray-300 dark:border-gray-600 text-gray-500 px-3 py-1.5 rounded-lg"><X size={12} /> Batal</button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {/* nama + badges + tombol edit/hapus */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className={`text-sm font-semibold ${debt.isPaid ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-100'}`}>{debt.label}</p>
                                {debt.isPaid && <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-full flex items-center gap-1"><CheckCircle2 size={10} /> Lunas</span>}
                                {isOverdue && <span className="text-xs bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle size={10} /> Telat {Math.abs(diff)} hari</span>}
                                {isDueSoon && <span className="text-xs bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400 px-1.5 py-0.5 rounded-full flex items-center gap-1"><Clock size={10} /> {diff === 0 ? 'Hari ini!' : `${diff} hari lagi`}</span>}
                              </div>
                              {debt.dueDate && <p className="text-xs text-gray-400 mt-0.5">Jatuh tempo: {fmtDate(debt.dueDate)}</p>}
                              {debt.isPaid && debt.paidAt && <p className="text-xs text-green-500 mt-0.5">Lunas: {fmtDate(debt.paidAt)}</p>}
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <button onClick={() => startEdit(debt)} className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"><Pencil size={13} /></button>
                              <button onClick={() => handleDelete(debt.id, debt.label)} className="p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 size={13} /></button>
                            </div>
                          </div>
                          {/* progress bar */}
                          <div className="mb-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500 dark:text-gray-400">Terbayar: <span className="font-semibold text-green-600">{formatHarga(paid)}</span></span>
                              <span className="text-gray-500 dark:text-gray-400">Sisa: <span className={`font-semibold ${sisa > 0 ? 'text-orange-500' : 'text-green-600'}`}>{formatHarga(sisa)}</span></span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div className={`h-2 rounded-full transition-all ${debt.isPaid ? 'bg-green-500' : isOverdue ? 'bg-red-500' : 'bg-orange-400'}`} style={{ width: `${pct}%` }} />
                            </div>
                            <div className="flex justify-between text-xs mt-0.5">
                              <span className="text-gray-400">Total: {formatHarga(nominal)}</span>
                              <span className={`font-semibold ${debt.isPaid ? 'text-green-600' : 'text-gray-500'}`}>{pct}%</span>
                            </div>
                          </div>
                          {/* tombol aksi */}
                          {!debt.isPaid ? (
                            <div className="flex gap-2 flex-wrap">
                              <button onClick={() => { setCicilanId(showCicilan ? null : debt.id); setCicilanAmount(''); setCicilanNote(''); }}
                                className="flex items-center gap-1 text-xs bg-orange-500 text-white px-2.5 py-1.5 rounded-lg hover:bg-orange-600 font-medium">
                                <Plus size={11} /> Bayar Cicilan
                              </button>
                              <button onClick={() => handleTogglePaid(debt.id)}
                                className="flex items-center gap-1 text-xs bg-green-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-green-700 font-medium">
                                <CheckCircle2 size={11} /> Tandai Lunas
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2 flex-wrap">
                              <button onClick={() => downloadDebtPDF(debt)}
                                className="flex items-center gap-1 text-xs bg-blue-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-blue-700 font-medium">
                                <Download size={11} /> Unduh Bukti
                              </button>
                              <button onClick={() => handleTogglePaid(debt.id)}
                                className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 px-2.5 py-1.5 rounded-lg hover:bg-gray-200 font-medium">
                                <X size={11} /> Batal Lunas
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {/* panel cicilan */}
                    {showCicilan && !debt.isPaid && editId !== debt.id && (
                      <div className="border-t border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 p-3 space-y-3">
                        <div className="flex gap-2 flex-col sm:flex-row">
                          <div className="flex-1">
                            <input type="number" value={cicilanAmount} onChange={e => setCicilanAmount(e.target.value)}
                              placeholder={`Jumlah cicilan (maks ${formatHarga(sisa)})`} min={1} max={sisa}
                              className="w-full border border-orange-300 dark:border-orange-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white dark:bg-gray-700 dark:text-gray-100" />
                            <HargaPreview value={cicilanAmount} />
                          </div>
                          <input type="text" value={cicilanNote} onChange={e => setCicilanNote(e.target.value)}
                            placeholder="Catatan (opsional)"
                            className="flex-1 border border-orange-300 dark:border-orange-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white dark:bg-gray-700 dark:text-gray-100" />
                          <button onClick={() => handleBayarCicilan(debt.id)} disabled={savingCicilan}
                            className="flex items-center justify-center gap-1 bg-orange-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 whitespace-nowrap">
                            <Check size={13} /> {savingCicilan ? 'Menyimpan...' : 'Catat'}
                          </button>
                        </div>
                        {debt.payments && debt.payments.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 mb-1.5">Riwayat Cicilan</p>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                              {[...debt.payments].reverse().map(p => (
                                <div key={p.id} className="flex items-center justify-between gap-2 bg-white dark:bg-gray-800 rounded-lg px-2.5 py-1.5 text-xs">
                                  <div className="flex-1 min-w-0">
                                    <span className="font-semibold text-green-600">{formatHarga(p.amount)}</span>
                                    {p.note && <span className="text-gray-400 ml-2 truncate">· {p.note}</span>}
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="text-gray-400">{fmtDate(p.createdAt)}</span>
                                    <button onClick={() => handleHapusCicilan(debt.id, p.id)} className="text-red-300 hover:text-red-500 transition-colors"><Trash2 size={11} /></button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Form tambah hutang */}
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded-xl p-4 mt-2">
                <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 mb-3 uppercase tracking-wide">+ Tambah Hutang Baru</p>
                <div className="space-y-2">
                  <input type="text" value={debtLabel} onChange={e => setDebtLabel(e.target.value)}
                    placeholder="Keterangan (cth: hutang ke supplier...)"
                    className="w-full border border-orange-200 dark:border-orange-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white dark:bg-gray-700 dark:text-gray-100" />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input type="number" value={debtNominal} onChange={e => setDebtNominal(e.target.value)}
                        placeholder="Nominal" min={0}
                        className="w-full border border-orange-200 dark:border-orange-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white dark:bg-gray-700 dark:text-gray-100" />
                      <HargaPreview value={debtNominal} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Tanggal Jatuh Tempo</label>
                      <input type="date" value={debtDueDate} onChange={e => setDebtDueDate(e.target.value)}
                        className="w-full border border-orange-200 dark:border-orange-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white dark:bg-gray-700 dark:text-gray-100" />
                    </div>
                  </div>
                  <button onClick={() => handleAdd('debt')} disabled={saving}
                    className="flex items-center justify-center gap-1.5 w-full bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">
                    <Plus size={14} /> {saving ? 'Menyimpan...' : 'Tambah Hutang'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Ringkasan */}
      <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">Total Pengeluaran</span>
          <span className="font-semibold text-red-500">{fPengeluaran}</span>
        </div>
        {totalHutangBelumLunas > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">Hutang Belum Lunas</span>
            <span className="font-semibold text-orange-500">{fHutang}</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">Total Pendapatan</span>
          <span className="font-semibold text-green-600">{fPendapatan}</span>
        </div>
        <div className={`flex justify-between items-center rounded-xl px-4 py-3 mt-2 ${isUntung ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
          <div className="flex items-center gap-2">
            {isUntung ? <TrendingUp size={18} className="text-green-600" /> : <TrendingDown size={18} className="text-red-500" />}
            <span className={`font-bold text-sm ${isUntung ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {isUntung ? '🎉 Untung' : '⚠ Rugi'}
            </span>
          </div>
          <div className="text-right">
            <p className={`font-bold text-lg ${isUntung ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {isUntung ? '+' : '-'}{fSelisih}
            </p>
            {kSelisih && <p className={`text-xs ${isUntung ? 'text-green-500' : 'text-red-400'}`}>({kSelisih})</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Halaman Laporan ──────────────────────────────────────────────
export default function ReportsPage() {
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: result } = await api.get(`/admin/reports/sales?startDate=${startDate}&endDate=${endDate}`);
      setData(result);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memuat laporan');
    } finally { setLoading(false); }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const pendapatan = data?.totalRevenue || 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Laporan Penjualan</h1>

      <form onSubmit={fetchReport} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 mb-6 flex items-end gap-4 flex-wrap">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Dari Tanggal</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Sampai Tanggal</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100" />
        </div>
        <button type="submit" disabled={loading}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50">
          <BarChart2 size={15} /> {loading ? 'Memuat...' : 'Tampilkan'}
        </button>
        {data && (
          <button type="button" onClick={() => printReport(data, startDate, endDate)}
            className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600">
            <Download size={15} /> Download PDF
          </button>
        )}
      </form>

      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Total Pendapatan</p>
              <p className="text-2xl font-bold text-green-600">{formatHarga(data.totalRevenue)}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Total Pesanan</p>
              <p className="text-2xl font-bold text-blue-600">{data.totalOrders}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    {['No. Pesanan', 'Pelanggan', 'Total', 'Tanggal'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {data.orders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 font-medium">{order.orderNumber}</td>
                      <td className="px-4 py-3">{order.customer?.name}</td>
                      <td className="px-4 py-3 text-green-600 font-medium">{formatHarga(order.totalAmount)}</td>
                      <td className="px-4 py-3 text-gray-400">{formatDate(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.orders.length === 0 && <p className="text-center py-8 text-gray-400">Tidak ada data pada periode ini</p>}
            </div>
          </div>
        </>
      )}

      <KalkulatorUntungRugi pendapatan={pendapatan} />
    </div>
  );
}
