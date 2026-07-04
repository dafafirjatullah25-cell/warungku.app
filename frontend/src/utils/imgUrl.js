/**
 * Buat URL lengkap untuk gambar produk dari backend.
 * Baca dari VITE_BACKEND_URL di .env supaya bisa diakses dari HP.
 *
 * Cara pakai: imgUrl(product.image)
 * Contoh hasil: "http://192.168.1.5:5000/uploads/products/foto.jpg"
 */
const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const imgUrl = (path) => {
  if (!path) return null;
  // Kalau sudah URL lengkap (http/https), langsung return
  if (path.startsWith('http')) return path;
  return `${BACKEND}${path}`;
};
