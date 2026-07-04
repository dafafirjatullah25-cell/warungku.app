import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Plus, Pencil, Trash2, X, ImagePlus, Search, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { formatHarga } from '../../utils/formatRupiah';
import { imgUrl } from '../../utils/imgUrl';

const EMPTY_FORM = { name: '', description: '', price: '', stock: '', category: '', unit: 'pcs', sku: '' };

// Generate SKU otomatis: [3 huruf kategori]-[3 huruf nama]-[4 angka random]
// Contoh: BUK-BIG-4821, MIN-COC-7392
function generateSKU(name, category) {
  const clean = (str, len) =>
    (str || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, len).padEnd(len, 'X');
  const cat = clean(category, 3) || 'PRD';
  const nm  = clean(name, 3)     || 'PRD';
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `${cat}-${nm}-${rand}`;
}
const MAX_PHOTOS = 4;

const UNITS = [
  { value: 'pcs', label: 'Pcs (Satuan)' },
  { value: 'pack', label: 'Pack' },
  { value: 'dus', label: 'Dus / Karton' },
  { value: 'botol', label: 'Botol' },
  { value: 'kaleng', label: 'Kaleng' },
  { value: 'sachet', label: 'Sachet' },
  { value: 'kg', label: 'Kg' },
  { value: 'gram', label: 'Gram' },
  { value: 'liter', label: 'Liter' },
];

const inputCls = 'w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const selectCls = 'text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';

function LowStockBanner({ products }) {
  const lowStock = products.filter(p => p.stock > 0 && p.stock < 10);
  const outOfStock = products.filter(p => p.stock === 0);
  if (lowStock.length === 0 && outOfStock.length === 0) return null;

  return (
    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="text-orange-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-orange-700 dark:text-orange-400 mb-2">
            Peringatan Stok
            {outOfStock.length > 0 && (
              <span className="ml-2 text-xs bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
                {outOfStock.length} habis
              </span>
            )}
            {lowStock.length > 0 && (
              <span className="ml-1 text-xs bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full">
                {lowStock.length} menipis
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {outOfStock.map(p => (
              <div key={p.id} className="flex items-center gap-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs px-2.5 py-1 rounded-lg">
                <span className="font-medium">{p.name}</span>
                <span className="bg-red-200 dark:bg-red-800 px-1.5 py-0.5 rounded font-bold">Habis</span>
              </div>
            ))}
            {lowStock.map(p => (
              <div key={p.id} className="flex items-center gap-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs px-2.5 py-1 rounded-lg">
                <span className="font-medium">{p.name}</span>
                <span className="bg-orange-200 dark:bg-orange-800 px-1.5 py-0.5 rounded font-bold">{p.stock} tersisa</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortPrice, setSortPrice] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const fileInputRef = useRef();
  const cameraInputRef = useRef();
  const totalPhotos = existingImages.length + newImageFiles.length;

  const fetchProducts = () => {
    api.get('/products')
      .then(({ data }) => setProducts(data))
      .catch(() => toast.error('Gagal memuat produk'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetchProducts(); }, []);

  const categories = useMemo(() => {
    const cats = products.map(p => p.category).filter(Boolean);
    return [...new Set(cats)].sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    let r = [...products];
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q)
      );
    }
    if (filterCategory) r = r.filter(p => p.category === filterCategory);
    if (sortPrice === 'asc') r.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    else if (sortPrice === 'desc') r.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    return r;
  }, [products, search, filterCategory, sortPrice]);

  const openCreate = () => {
    setEditProduct(null);
    setForm({ ...EMPTY_FORM, sku: generateSKU('', '') });
    setExistingImages([]); setNewImageFiles([]); setNewImagePreviews([]);
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditProduct(p);
    setForm({ name: p.name, description: p.description || '', price: p.price, stock: p.stock, category: p.category || '', unit: p.unit || 'pcs', sku: p.sku || '' });
    const imgs = (p.images && p.images.length > 0) ? p.images : (p.image ? [p.image] : []);
    setExistingImages(imgs); setNewImageFiles([]); setNewImagePreviews([]);
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const remaining = MAX_PHOTOS - totalPhotos;
    if (remaining <= 0) { toast.error(`Maksimal ${MAX_PHOTOS} foto`); return; }
    const toAdd = files.slice(0, remaining);
    if (toAdd.some(f => f.size > 2 * 1024 * 1024)) { toast.error('Ukuran setiap foto maksimal 2MB'); return; }
    setNewImageFiles(prev => [...prev, ...toAdd]);
    setNewImagePreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const removeExistingImage = (idx) => setExistingImages(prev => prev.filter((_, i) => i !== idx));
  const removeNewImage = (idx) => {
    URL.revokeObjectURL(newImagePreviews[idx]);
    setNewImageFiles(prev => prev.filter((_, i) => i !== idx));
    setNewImagePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (totalPhotos === 0) { toast.error('Minimal 1 foto produk wajib diupload'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
      fd.append('keepImages', JSON.stringify(existingImages));
      newImageFiles.forEach(f => fd.append('images', f));
      if (editProduct) {
        await api.put(`/products/${editProduct.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Produk diperbarui');
      } else {
        await api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Produk ditambahkan');
      }
      setShowModal(false); fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan produk');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Hapus produk ini?')) return;
    try { await api.delete(`/products/${id}`); toast.success('Produk dihapus'); fetchProducts(); }
    catch { toast.error('Gagal menghapus produk'); }
  };

  const stockBadgeCls = (stock) => {
    if (stock === 0) return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400';
    if (stock < 10) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400';
    return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Manajemen Produk</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus size={16} /> Tambah Produk
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      ) : (
        <div className="space-y-4">

          {/* Banner stok menipis — berdasarkan semua produk (bukan filtered) */}
          <LowStockBanner products={products} />

          {/* Tabel produk */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Filter Bar */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[180px]">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text" placeholder="Cari nama, kategori, SKU..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  className={`${inputCls} pl-9`}
                />
              </div>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className={selectCls}>
                <option value="">Semua Kategori</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <select value={sortPrice} onChange={e => setSortPrice(e.target.value)} className={selectCls}>
                <option value="">Urutkan Harga</option>
                <option value="asc">Harga: Termurah</option>
                <option value="desc">Harga: Termahal</option>
              </select>
              {(search || filterCategory || sortPrice) && (
                <button
                  onClick={() => { setSearch(''); setFilterCategory(''); setSortPrice(''); }}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 flex items-center gap-1 px-2"
                >
                  <X size={14} /> Reset
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    {['Foto', 'Nama', 'Kategori', 'Jenis', 'Harga', 'Stok', 'SKU', 'Aksi'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredProducts.map(p => (
                    <tr key={p.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${p.stock < 10 ? 'bg-orange-50/30 dark:bg-orange-900/5' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden relative">
                          {p.image
                            ? <img src={imgUrl(p.image)} alt={p.name} className="w-full h-full object-cover" />
                            : <span className="text-xl">📦</span>
                          }
                          {p.images && p.images.length > 1 && (
                            <span className="absolute bottom-0 right-0 bg-black/60 text-white text-[9px] px-1 rounded-tl">+{p.images.length}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                        <div className="flex items-center gap-1.5">
                          {p.name}
                          {p.stock < 10 && (
                            <AlertTriangle size={13} className={p.stock === 0 ? 'text-red-500' : 'text-orange-500'} />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{p.category || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                          {p.unit || 'pcs'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-blue-600 font-medium">{formatHarga(p.price)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stockBadgeCls(p.stock)}`}>
                          {p.stock === 0 ? '0 ⚠' : p.stock < 10 ? `${p.stock} ⚠` : p.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 dark:text-gray-500">{p.sku || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(p)} className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/40">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/40">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProducts.length === 0 && (
                <p className="text-center py-8 text-gray-400">
                  {products.length === 0 ? 'Belum ada produk' : 'Tidak ada produk yang cocok dengan filter'}
                </p>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Modal Tambah/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h2 className="font-bold text-lg text-gray-800 dark:text-gray-100">
                {editProduct ? 'Edit Produk' : 'Tambah Produk'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Upload Foto */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Foto Produk <span className="text-red-500">*</span>
                  </label>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${totalPhotos >= MAX_PHOTOS ? 'bg-red-100 text-red-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                    {totalPhotos}/{MAX_PHOTOS} foto
                  </span>
                </div>

                {totalPhotos > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {existingImages.map((img, idx) => (
                      <div key={`e${idx}`} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                        <img src={imgUrl(img)} alt="" className="w-full h-full object-cover" />
                        {idx === 0 && <span className="absolute top-1 left-1 bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded font-medium">Utama</span>}
                        <button type="button" onClick={() => removeExistingImage(idx)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    {newImagePreviews.map((preview, idx) => (
                      <div key={`n${idx}`} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                        <img src={preview} alt="" className="w-full h-full object-cover" />
                        {existingImages.length === 0 && idx === 0 && <span className="absolute top-1 left-1 bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded font-medium">Utama</span>}
                        <button type="button" onClick={() => removeNewImage(idx)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    {totalPhotos < MAX_PHOTOS && (
                      <button type="button" onClick={() => fileInputRef.current.click()}
                        className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors">
                        <Plus size={20} /><span className="text-[10px] mt-1">Tambah</span>
                      </button>
                    )}
                  </div>
                )}

                {totalPhotos === 0 && (
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center bg-gray-50 dark:bg-gray-700/50">
                    <ImagePlus size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Upload foto produk</p>
                    <p className="text-xs text-gray-400 mt-1">Min. 1 • Maks. {MAX_PHOTOS} • JPG, PNG, WEBP • 2MB</p>
                    <div className="flex gap-2 mt-3 justify-center">
                      <button type="button" onClick={() => fileInputRef.current.click()}
                        className="flex items-center gap-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded-lg px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50">
                        📁 Pilih File
                      </button>
                      <button type="button" onClick={() => cameraInputRef.current.click()}
                        className="md:hidden flex items-center gap-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded-lg px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                        📷 Kamera
                      </button>
                    </div>
                  </div>
                )}

                {totalPhotos > 0 && totalPhotos < MAX_PHOTOS && (
                  <div className="flex gap-2 mt-2">
                    <button type="button" onClick={() => fileInputRef.current.click()}
                      className="flex-1 flex items-center justify-center gap-1.5 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                      📁 Tambah Foto
                    </button>
                    <button type="button" onClick={() => cameraInputRef.current.click()}
                      className="md:hidden flex-1 flex items-center justify-center gap-1.5 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                      📷 Kamera
                    </button>
                  </div>
                )}

                <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" multiple onChange={handleImageChange} className="hidden" />
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="hidden" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Produk *</label>
                <input type="text" value={form.name} onChange={e => {
                  const name = e.target.value;
                  setForm(f => ({
                    ...f,
                    name,
                    // Auto-update SKU saat ngetik nama, tapi hanya kalau produk baru
                    sku: !editProduct ? generateSKU(name, f.category) : f.sku
                  }));
                }} className={inputCls} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kategori <span className="text-gray-400 font-normal">(cth: Makanan, Minuman)</span>
                </label>
                <input type="text" value={form.category} onChange={e => {
                  const category = e.target.value;
                  setForm(f => ({
                    ...f,
                    category,
                    // Auto-update SKU saat ngetik kategori, tapi hanya kalau produk baru
                    sku: !editProduct ? generateSKU(f.name, category) : f.sku
                  }));
                }} className={inputCls} placeholder="Makanan Instan, Minuman..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jenis *</label>
                <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className={inputCls}>
                  {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Harga *</label>
                  <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                    className={inputCls} required min={0} />
                  {form.price > 0 && <p className="text-xs text-blue-500 mt-1">{formatHarga(form.price)}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stok *</label>
                  <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })}
                    className={inputCls} required min={0} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SKU</label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.sku}
                    onChange={e => setForm({ ...form, sku: e.target.value.toUpperCase() })}
                    className={`${inputCls} pr-24 font-mono`}
                    placeholder="Otomatis terisi, bisa diedit"
                  />
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, sku: generateSKU(f.name, f.category) }))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-400 px-2 py-1 rounded-md transition-colors"
                    title="Generate ulang SKU"
                  >
                    🔄 Acak
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Format: KATEGORI-NAMA-ANGKA · bisa diedit manual</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deskripsi</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3} className={inputCls} placeholder="Deskripsi produk (opsional)" />
              </div>
              <button type="submit" disabled={saving}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {saving ? 'Menyimpan...' : editProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
