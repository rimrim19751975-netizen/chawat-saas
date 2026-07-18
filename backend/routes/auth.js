import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../config/database.js';

const router = Router();

router.post('/boutique/login', (req, res) => {
  const { email, password } = req.body;
  const db = getDb();
  const boutique = db.prepare('SELECT * FROM boutiques WHERE email = ?').get(email);
  if (!boutique || !bcrypt.compareSync(password, boutique.password)) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  }
  if (boutique.statut === 'en_attente') {
    return res.status(403).json({ error: 'Votre compte est en attente de validation. Veuillez payer l\'abonnement.' });
  }
  if (boutique.statut === 'rejete') {
    return res.status(403).json({ error: 'Votre compte a été rejeté. Contactez le support.' });
  }
  if (boutique.statut === 'suspendu') {
    return res.status(403).json({ error: 'Votre compte a été suspendu. Contactez le support.' });
  }
  const token = jwt.sign(
    { boutiqueId: boutique.id, slug: boutique.slug, role: 'boutique' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({ token, boutique: { id: boutique.id, nom: boutique.nom, slug: boutique.slug, statut: boutique.statut, abonnement_fin: boutique.abonnement_fin } });
});

router.post('/boutique/register', (req, res) => {
  const { nom, slug, adresse, telephone, email, password } = req.body;
  const db = getDb();
  const exist = db.prepare('SELECT id FROM boutiques WHERE email = ? OR slug = ?').get(email, slug);
  if (exist) return res.status(400).json({ error: 'Email ou slug déjà utilisé' });

  const id = uuidv4();
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(`INSERT INTO boutiques (id, nom, slug, adresse, telephone, email, password, statut)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'en_attente')`).run(id, nom, slug, adresse, telephone, email, hash);

  res.status(201).json({ message: 'Votre compte a été créé. En attente de validation par l\'administrateur après paiement de l\'abonnement.' });
});

router.post('/client/register', (req, res) => {
  const { boutique_slug, nom, telephone, quartier, password } = req.body;
  const db = getDb();
  const boutique = db.prepare('SELECT id FROM boutiques WHERE slug = ?').get(boutique_slug);
  if (!boutique) return res.status(404).json({ error: 'Boutique introuvable' });

  const id = uuidv4();
  const hash = password ? bcrypt.hashSync(password, 10) : null;
  db.prepare(`INSERT INTO clients (id, boutique_id, nom, telephone, quartier, password)
    VALUES (?, ?, ?, ?, ?, ?)`).run(id, boutique.id, nom, telephone, quartier, hash);

  const token = jwt.sign({ clientId: id, boutiqueId: boutique.id, role: 'client' }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.status(201).json({ token, client: { id, nom, telephone, quartier } });
});

router.post('/client/login', (req, res) => {
  const { telephone, password, boutique_slug } = req.body;
  const db = getDb();
  const boutique = db.prepare('SELECT id FROM boutiques WHERE slug = ?').get(boutique_slug);
  if (!boutique) return res.status(404).json({ error: 'Boutique introuvable' });

  const client = db.prepare('SELECT * FROM clients WHERE telephone = ? AND boutique_id = ?').get(telephone, boutique.id);
  if (!client) return res.status(401).json({ error: 'Numéro non enregistré' });

  if (client.password && !bcrypt.compareSync(password, client.password)) {
    return res.status(401).json({ error: 'Mot de passe incorrect' });
  }

  const token = jwt.sign({ clientId: client.id, boutiqueId: boutique.id, role: 'client' }, process.env.JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, client: { id: client.id, nom: client.nom, telephone: client.telephone, quartier: client.quartier } });
});

export default router;
