const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');
const { verifyToken, isAdmin } = require('../middleware/auth');
const upload = require('../utils/upload');

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { isActive: true },
      order: [['createdAt', 'DESC']]
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create product (admin only) — terima max 4 foto
router.post('/', [verifyToken, isAdmin], upload.array('images', 4), async (req, res) => {
  try {
    const { name, description, price, stock, category, sku, unit } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Minimal 1 foto produk wajib diupload' });
    }

    const images = req.files.map(f => `/uploads/products/${f.filename}`);
    const image = images[0]; // foto utama (pertama)

    const product = await Product.create({
      name, description, price, stock, category, sku, unit, image, images
    });

    res.status(201).json({ message: 'Produk berhasil ditambahkan', product });
  } catch (error) {
    if (req.files) req.files.forEach(f => fs.unlink(f.path, () => {}));
    res.status(500).json({ message: error.message });
  }
});

// Update product (admin only)
router.put('/:id', [verifyToken, isAdmin], upload.array('images', 4), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const { name, description, price, stock, category, sku, isActive, unit, keepImages } = req.body;

    // keepImages: JSON string array dari gambar lama yang mau dipertahankan
    let keptImages = [];
    try {
      keptImages = keepImages ? JSON.parse(keepImages) : (product.images || []);
    } catch {
      keptImages = product.images || [];
    }

    // Gambar lama yang dihapus (tidak ada di keepImages) → hapus file fisik
    const oldImages = product.images || [];
    const removedImages = oldImages.filter(img => !keptImages.includes(img));
    removedImages.forEach(img => {
      const filePath = path.join(__dirname, '..', img);
      if (fs.existsSync(filePath)) fs.unlink(filePath, () => {});
    });

    // Gabung: gambar lama yang dipertahankan + gambar baru
    const newImages = req.files ? req.files.map(f => `/uploads/products/${f.filename}`) : [];
    const allImages = [...keptImages, ...newImages].slice(0, 4); // max 4

    const image = allImages[0] || product.image; // foto utama

    await product.update({
      name: name || product.name,
      description: description !== undefined ? description : product.description,
      price: price || product.price,
      stock: stock !== undefined ? stock : product.stock,
      category: category !== undefined ? category : product.category,
      sku: sku !== undefined ? sku : product.sku,
      unit: unit !== undefined ? unit : product.unit,
      isActive: isActive !== undefined ? isActive : product.isActive,
      image,
      images: allImages
    });

    res.json({ message: 'Produk berhasil diperbarui', product });
  } catch (error) {
    if (req.files) req.files.forEach(f => fs.unlink(f.path, () => {}));
    res.status(500).json({ message: error.message });
  }
});

// Delete product (admin only)
router.delete('/:id', [verifyToken, isAdmin], async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    await product.update({ isActive: false });
    res.json({ message: 'Produk berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
