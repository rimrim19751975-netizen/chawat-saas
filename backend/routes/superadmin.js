import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../config/database.js';

const router = Router();

function authSuperAdmin(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'Non autorisé' });
  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    if (decoded.role !== 'super_admin') return res.status(403).json({ error: 'Accès interdit' });
    next();
  } catch { return res.status(401).json({ error: 'Token invalide' }); }
}

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const db = getDb();
  const admin = db.prepare('SELECT * FROM super_admins WHERE email = ?').get(email);
  if (!admin || !bcrypt.compareSync(password, admin.password)) {
    return res.status(401).json({ error: 'Identifiants incorrects' });
  }
  const token = jwt.sign({ adminId: admin.id, role: 'super_admin' }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

router.get('/boutiques', authSuperAdmin, (req, res) => {
  const db = getDb();
  const boutiques = db.prepare(`
    SELECT id, nom, slug, adresse, telephone, email, statut, abonnement_fin, date_creation
    FROM boutiques ORDER BY date_creation DESC
  `).all();

  for (const b of boutiques) {
    const count = db.prepare('SELECT COUNT(*) as c FROM orders WHERE boutique_id = ?').get(b.id);
    const revenue = db.prepare('SELECT COALESCE(SUM(total), 0) as t FROM orders WHERE boutique_id = ?').get(b.id);
    b.total_orders = count.c;
    b.total_revenue = revenue.t;
  }
  res.json(boutiques);
});

router.put('/boutiques/:id/valider', authSuperAdmin, (req, res) => {
  const db = getDb();
  const { duree_mois } = req.body;
  const mois = duree_mois || 1;
  const debut = new Date().toISOString();
  const fin = new Date();
  fin.setMonth(fin.getMonth() + mois);

  db.prepare(`UPDATE boutiques SET statut = 'actif', abonnement_fin = ? WHERE id = ?`)
    .run(fin.toISOString(), req.params.id);
  res.json({ success: true, date_fin: fin.toISOString() });
});

router.put('/boutiques/:id/rejeter', authSuperAdmin, (req, res) => {
  const db = getDb();
  db.prepare(`UPDATE boutiques SET statut = 'rejete' WHERE id = ?`).run(req.params.id);
  res.json({ success: true });
});

router.put('/boutiques/:id/suspendre', authSuperAdmin, (req, res) => {
  const db = getDb();
  db.prepare(`UPDATE boutiques SET statut = 'suspendu' WHERE id = ?`).run(req.params.id);
  res.json({ success: true });
});

router.get('/stats', authSuperAdmin, (req, res) => {
  const db = getDb();
  const total = db.prepare('SELECT COUNT(*) as c FROM boutiques').get();
  const actives = db.prepare("SELECT COUNT(*) as c FROM boutiques WHERE statut = 'actif'").get();
  const enAttente = db.prepare("SELECT COUNT(*) as c FROM boutiques WHERE statut = 'en_attente'").get();
  const revenu = db.prepare('SELECT COALESCE(SUM(total), 0) as t FROM orders').get();
  res.json({ total: total.c, actives: actives.c, en_attente: enAttente.c, revenu_total: revenu.t });
});

export default router;
