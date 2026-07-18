import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../config/database.js';
import { authBoutique, authClient } from '../middleware/auth.js';

const router = Router();

router.post('/', (req, res) => {
  const { boutique_slug, client_nom, client_telephone, client_quartier, items, note } = req.body;
  const db = getDb();

  const boutique = db.prepare('SELECT id, nom FROM boutiques WHERE slug = ?').get(boutique_slug);
  if (!boutique) return res.status(404).json({ error: 'Boutique introuvable' });

  const orderId = uuidv4();
  let total = 0;

  const insertItem = db.prepare(`INSERT INTO order_items (order_id, product_id, product_nom, quantite, prix_unitaire) VALUES (?, ?, ?, ?, ?)`);

  const insertOrder = db.prepare(`INSERT INTO orders (id, boutique_id, client_nom, client_telephone, client_quartier, total, note, statut)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'en_attente')`);

  for (const item of items) {
    let prix = item.prix_unitaire;
    if (item.product_id) {
      const product = db.prepare('SELECT * FROM products WHERE id = ? AND boutique_id = ?').get(item.product_id, boutique.id);
      if (product) {
        prix = item.prix_unitaire || product.prix_min;
      }
    }
    total += prix * item.quantite;
  }

  const txn = db.transaction(() => {
    insertOrder.run(orderId, boutique.id, client_nom, client_telephone, client_quartier, total, note || null);
    for (const item of items) {
      let prix = item.prix_unitaire;
      let nom = item.product_nom || 'Produit';
      let pid = null;
      if (item.product_id) {
        const product = db.prepare('SELECT * FROM products WHERE id = ? AND boutique_id = ?').get(item.product_id, boutique.id);
        if (product) {
          prix = item.prix_unitaire || product.prix_min;
          nom = product.nom;
          pid = product.id;
        }
      }
      insertItem.run(orderId, pid, nom, item.quantite, prix);
    }
  });

  txn();
  res.status(201).json({ id: orderId, total, statut: 'en_attente', message: 'Commande enregistrée avec succès !' });
});

router.get('/boutique', authBoutique, (req, res) => {
  const db = getDb();
  const orders = db.prepare(`
    SELECT * FROM orders WHERE boutique_id = ? ORDER BY date_creation DESC
  `).all(req.boutiqueId);

  for (const order of orders) {
    order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  }
  res.json(orders);
});

router.get('/client', authClient, (req, res) => {
  const db = getDb();
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.clientId);
  if (!client) return res.status(404).json({ error: 'Client introuvable' });

  const orders = db.prepare(`
    SELECT * FROM orders WHERE boutique_id = ? AND client_nom = ? AND client_telephone = ?
    ORDER BY date_creation DESC
  `).all(req.boutiqueId, client.nom, client.telephone);

  for (const order of orders) {
    order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
  }
  res.json(orders);
});

router.put('/:id/statut', authBoutique, (req, res) => {
  const db = getDb();
  const { statut } = req.body;
  const data = statut === 'livre' ? { statut, date_livraison: new Date().toISOString() } : { statut };
  db.prepare(`UPDATE orders SET statut=?, date_livraison=? WHERE id=? AND boutique_id=?`)
    .run(data.statut, data.date_livraison || null, req.params.id, req.boutiqueId);
  res.json({ success: true });
});

export default router;
