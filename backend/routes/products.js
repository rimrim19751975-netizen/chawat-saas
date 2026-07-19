import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getDb } from '../config/database.js';
import { authBoutique } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  }
});

const router = Router();

router.post('/upload', authBoutique, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error: 'Fichier invalide (max 5Mo, JPEG/PNG/WebP)' });
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier envoyé' });
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  });
});

router.get('/single/:id', (req, res) => {
  const db = getDb();
  const product = db.prepare(`
    SELECT p.*, c.nom as categorie_nom, b.nom as boutique_nom, b.slug as boutique_slug, b.telephone as boutique_telephone, b.adresse as boutique_adresse
    FROM products p
    LEFT JOIN categories c ON c.id = p.categorie_id
    LEFT JOIN boutiques b ON b.id = p.boutique_id
    WHERE p.id = ? AND p.actif = 1
  `).get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Produit introuvable' });
  res.json(product);
});

router.get('/:slug', (req, res) => {
  const db = getDb();
  const boutique = db.prepare('SELECT id FROM boutiques WHERE slug = ?').get(req.params.slug);
  if (!boutique) return res.status(404).json({ error: 'Boutique introuvable' });

  const products = db.prepare(`
    SELECT p.*, c.nom as categorie_nom
    FROM products p
    LEFT JOIN categories c ON c.id = p.categorie_id
    WHERE p.boutique_id = ? AND p.actif = 1
    ORDER BY c.nom, p.nom
  `).all(boutique.id);

  const categories = db.prepare('SELECT * FROM categories WHERE boutique_id = ?').all(boutique.id);
  res.json({ products, categories });
});

router.post('/', authBoutique, (req, res) => {
  const db = getDb();
  const { nom, prix_min, prix_max, unite, stock, categorie_id, image_url } = req.body;
  const id = uuidv4();
  db.prepare(`INSERT INTO products (id, boutique_id, nom, prix_min, prix_max, unite, stock, categorie_id, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, req.boutiqueId, nom, prix_min, prix_max || prix_min, unite || 'kg', stock || 0, categorie_id || null, image_url || null);
  res.status(201).json({ id, nom });
});

router.put('/:id', authBoutique, (req, res) => {
  const db = getDb();
  const { nom, prix_min, prix_max, unite, stock, actif, image_url } = req.body;
  if (image_url !== undefined) {
    const old = db.prepare('SELECT image_url FROM products WHERE id=? AND boutique_id=?').get(req.params.id, req.boutiqueId);
    if (old?.image_url && image_url && old.image_url !== image_url) {
      const oldPath = path.join(__dirname, '..', old.image_url);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    db.prepare(`UPDATE products SET nom=?, prix_min=?, prix_max=?, unite=?, stock=?, actif=?, image_url=? WHERE id=? AND boutique_id=?`)
      .run(nom, prix_min, prix_max, unite, stock, actif ?? 1, image_url || null, req.params.id, req.boutiqueId);
  } else {
    db.prepare(`UPDATE products SET nom=?, prix_min=?, prix_max=?, unite=?, stock=?, actif=? WHERE id=? AND boutique_id=?`)
      .run(nom, prix_min, prix_max, unite, stock, actif ?? 1, req.params.id, req.boutiqueId);
  }
  res.json({ success: true });
});

router.delete('/:id', authBoutique, (req, res) => {
  const db = getDb();
  const product = db.prepare('SELECT image_url FROM products WHERE id=? AND boutique_id=?').get(req.params.id, req.boutiqueId);
  if (product?.image_url) {
    const imgPath = path.join(__dirname, '..', product.image_url);
    if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
  }
  db.prepare('DELETE FROM products WHERE id=? AND boutique_id=?').run(req.params.id, req.boutiqueId);
  res.json({ success: true });
});

router.get('/categories/all', authBoutique, (req, res) => {
  const db = getDb();
  const categories = db.prepare('SELECT * FROM categories WHERE boutique_id = ?').all(req.boutiqueId);
  res.json(categories);
});

router.post('/categories', authBoutique, (req, res) => {
  const db = getDb();
  const { nom } = req.body;
  const result = db.prepare('INSERT INTO categories (boutique_id, nom) VALUES (?, ?)').run(req.boutiqueId, nom);
  res.status(201).json({ id: result.lastInsertRowid, nom });
});

router.delete('/categories/:id', authBoutique, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM categories WHERE id=? AND boutique_id=?').run(req.params.id, req.boutiqueId);
  res.json({ success: true });
});

router.get('/my', authBoutique, (req, res) => {
  const db = getDb();
  const products = db.prepare(`
    SELECT p.*, c.nom as categorie_nom
    FROM products p LEFT JOIN categories c ON c.id = p.categorie_id
    WHERE p.boutique_id = ? ORDER BY c.nom, p.nom
  `).all(req.boutiqueId);
  res.json(products);
});

export default router;
