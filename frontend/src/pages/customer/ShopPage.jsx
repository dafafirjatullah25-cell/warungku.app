import React, { useEffect, useState, useMemo } from 'react';
import { ShoppingCart, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { useCart } from '../../context/CartContext';
import { formatHarga } from '../../utils/formatRupiah';
import { imgUrl } from '../../utils/imgUrl';

// Komponen carousel kecil untuk kartu produk
function ProductImages({ images, name }) {
  const [idx, setIdx] = useState(0);
  const imgs = images && images.length > 0 ? images : null;

  if (!imgs) return (
    <div className="h-40 bg-gray-100 rounded-t-xl flex items-center justify-center">
      <span className="text-4xl">📦</span>
    </div>
  );

  return (
    <div className="h-40 bg-gray-100 rounded-t-xl relative overflow-hidden group">
      <img src={imgUrl(imgs[idx])} alt={name} className="h-full w-full object-cover rounded-t-xl" />
      {imgs.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); setIdx(i => (i - 1 + imgs.length) % imgs.length); }}
            className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); setIdx(i => (i + 1) % imgs.length); }}
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight size={14} />
          </button>
          {/* Dot indicator */}
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
            {imgs.map((_, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); setIdx(i); }}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortPrice, setSortPrice] = useState('');
  const { addItem, items } = useCart();

  useEffect(() => {
    api.get('/products')
      .then(({ data }) => setProducts(data))
      .catch(() => toast.error('Gagal memuat produk'))
      .finally(() => setLoading(false));
  }, []);

  // Daftar kategori unik
  const categories = useMemo(() => {
    const cats = products.map(p => p.category).filter(Boolean);
    return [...new Set(cats)].sort();
  }, [products]);

  // Filter + search + sort
  const filtered = useMemo(() => {
    let result = [...products];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      );
    }

    if (filterCategory) {
      result = result.filter(p => p.category === filterCategory);
    }

    if (sortPrice === 'asc') {
      result.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (sortPrice === 'desc') {
      result.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    }

    return result;
  }, [products, search, filterCategory, sortPrice]);

  const hasFilter = search || filterCategory || sortPrice;

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div>
      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[160px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
        {/* Filter Kategori */}
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Semua Kategori</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        {/* Sort Harga */}
        <select
          value={sortPrice}
          onChange={e => setSortPrice(e.target.value)}
          className="text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Urutkan Harga</option>
          <option value="asc">Termurah</option>
          <option value="desc">Termahal</option>
        </select>
        {/* Reset */}
        {hasFilter && (
          <button
            onClick={() => { setSearch(''); setFilterCategory(''); setSortPrice(''); }}
            className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1 px-2"
          >
            <X size={14} /> Reset
          </button>
        )}
        <span className="text-sm text-gray-500 ml-auto">{filtered.length} produk</span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-12">
          {products.length === 0 ? 'Belum ada produk.' : 'Produk tidak ditemukan.'}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <div key={product.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
              <ProductImages images={product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : [])} name={product.name} />
              <div className="p-3">
                <p className="text-xs text-blue-500 font-medium uppercase tracking-wide">{product.category}</p>
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm mt-0.5 truncate">{product.name}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded">{product.unit || 'pcs'}</span>
                </div>
                <p className="text-blue-600 font-bold mt-1 text-sm leading-tight">{formatHarga(product.price)}</p>
                <p className="text-xs text-gray-400 mt-0.5">Stok: {product.stock}</p>
                <button
                  onClick={() => {
                    const inCart = items.find(i => i.id === product.id);
                    const currentQty = inCart ? inCart.quantity : 0;
                    if (currentQty >= product.stock) {
                      toast.error(`Stok hanya ${product.stock}`);
                      return;
                    }
                    addItem(product);
                    toast.success(`${product.name} ditambahkan`);
                  }}
                  disabled={product.stock === 0}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 bg-blue-600 text-white text-xs py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ShoppingCart size={13} />
                  {product.stock === 0 ? 'Habis' : 'Tambah'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
