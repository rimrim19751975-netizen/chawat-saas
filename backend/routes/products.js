import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../config/database.js';
import { authBoutique } from '../middleware/auth.js';

const router = Router();

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
  const { nom, prix_min, prix_max, unite, stock, categorie_id } = req.body;
  const id = uuidv4();
  db.prepare(`INSERT INTO products (id, boutique_id, nom, prix_min, prix_max, unite, stock, categorie_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(id, req.boutiqueId, nom, prix_min, prix_max || prix_min, unite || 'kg', stock || 0, categorie_id || null);
  res.status(201).json({ id, nom });
});

router.put('/:id', authBoutique, (req, res) => {
  const db = getDb();
  const { nom, prix_min, prix_max, unite, stock, actif } = req.body;
  db.prepare(`UPDATE products SET nom=?, prix_min=?, prix_max=?, unite=?, stock=?, actif=? WHERE id=? AND boutique_id=?`)
    .run(nom, prix_min, prix_max, unite, stock, actif ?? 1, req.params.id, req.boutiqueId);
  res.json({ success: true });
});

router.delete('/:id', authBoutique, (req, res) => {
  const db = getDb();
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
