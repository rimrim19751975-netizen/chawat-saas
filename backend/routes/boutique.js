import { Router } from 'express';
import { getDb } from '../config/database.js';
import { authBoutique } from '../middleware/auth.js';

const router = Router();

router.get('/public/:slug', (req, res) => {
  const db = getDb();
  const boutique = db.prepare("SELECT id, nom, slug, adresse, telephone, email FROM boutiques WHERE slug = ? AND statut = 'actif'").get(req.params.slug);
  if (!boutique) return res.status(404).json({ error: 'Boutique introuvable' });

  const categories = db.prepare('SELECT * FROM categories WHERE boutique_id = ?').all(boutique.id);
  res.json({ ...boutique, categories });
});

router.get('/me', authBoutique, (req, res) => {
  const db = getDb();
  const boutique = db.prepare('SELECT id, nom, slug, adresse, telephone, email, statut, abonnement_fin FROM boutiques WHERE id = ?').get(req.boutiqueId);
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_orders,
      SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as pending_orders,
      COALESCE(SUM(total), 0) as total_revenue
    FROM orders WHERE boutique_id = ?
  `).get(req.boutiqueId);
  res.json({ ...boutique, stats });
});

export default router;
