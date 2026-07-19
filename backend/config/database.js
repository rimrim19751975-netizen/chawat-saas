import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'chawat.db');

let db;

export function getDb() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
    seedData();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS boutiques (
      id TEXT PRIMARY KEY,
      nom TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      adresse TEXT,
      telephone TEXT,
      email TEXT,
      password TEXT NOT NULL,
      statut TEXT DEFAULT 'en_attente',
      abonnement_fin TEXT,
      date_creation TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS super_admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      boutique_id TEXT NOT NULL,
      nom TEXT NOT NULL,
      FOREIGN KEY (boutique_id) REFERENCES boutiques(id)
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      boutique_id TEXT NOT NULL,
      nom TEXT NOT NULL,
      prix_min REAL NOT NULL,
      prix_max REAL,
      unite TEXT DEFAULT 'pièce',
      stock INTEGER DEFAULT 0,
      categorie_id INTEGER,
      image_url TEXT,
      actif INTEGER DEFAULT 1,
      FOREIGN KEY (boutique_id) REFERENCES boutiques(id),
      FOREIGN KEY (categorie_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      boutique_id TEXT NOT NULL,
      nom TEXT NOT NULL,
      telephone TEXT NOT NULL,
      quartier TEXT NOT NULL,
      password TEXT,
      date_creation TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (boutique_id) REFERENCES boutiques(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      boutique_id TEXT NOT NULL,
      client_id TEXT,
      client_nom TEXT NOT NULL,
      client_telephone TEXT NOT NULL,
      client_quartier TEXT NOT NULL,
      statut TEXT DEFAULT 'en_attente',
      total REAL,
      note TEXT,
      date_creation TEXT DEFAULT (datetime('now')),
      date_livraison TEXT,
      FOREIGN KEY (boutique_id) REFERENCES boutiques(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      product_id TEXT,
      product_nom TEXT NOT NULL,
      quantite REAL NOT NULL,
      prix_unitaire REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );
  `);
}

function seedData() {
  const adminExist = db.prepare('SELECT COUNT(*) as c FROM super_admins').get();
  if (adminExist.c === 0) {
    const adminHash = bcrypt.hashSync('admin2026', 10);
    db.prepare('INSERT INTO super_admins (email, password) VALUES (?, ?)').run('admin@chawat.mr', adminHash);
    console.log('Super admin créé: admin@chawat.mr');
  }

  const count = db.prepare('SELECT COUNT(*) as c FROM boutiques').get();
  if (count.c > 0) return;

  const hash = bcrypt.hashSync('admin123', 10);
  const boutiqueId = uuidv4();

  db.prepare(`INSERT INTO boutiques (id, nom, slug, adresse, telephone, email, password, statut)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'actif')`).run(boutiqueId, 'Chawat Boucherie', 'chawat', 'Nouakchott, Tevragh Zeina', '+222 22 14 92 82', 'contact@chawat.mr', hash);

  const catViande = db.prepare(`INSERT INTO categories (boutique_id, nom) VALUES (?, ?)`).run(boutiqueId, 'Viandes').lastInsertRowid;
  const catPoulet = db.prepare(`INSERT INTO categories (boutique_id, nom) VALUES (?, ?)`).run(boutiqueId, 'Poulets').lastInsertRowid;

  const insertProduct = db.prepare(`INSERT INTO products (id, boutique_id, nom, prix_min, prix_max, unite, stock, categorie_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  insertProduct.run(uuidv4(), boutiqueId, 'Viande de bœuf - Filet', 500, 500, 'kg', 50, catViande);
  insertProduct.run(uuidv4(), boutiqueId, 'Viande de bœuf - Plat de côtes', 300, 300, 'kg', 50, catViande);
  insertProduct.run(uuidv4(), boutiqueId, 'Viande de bœuf - Viande hachée', 250, 250, 'kg', 30, catViande);
  insertProduct.run(uuidv4(), boutiqueId, 'Viande de bœuf - Mélange (prix selon pièce)', 200, 500, 'kg', 100, catViande);
  insertProduct.run(uuidv4(), boutiqueId, 'Poulet entier', 350, 350, 'pièce', 20, catPoulet);
  insertProduct.run(uuidv4(), boutiqueId, 'Poulet - Cuisses', 300, 300, 'kg', 20, catPoulet);
  insertProduct.run(uuidv4(), boutiqueId, 'Poulet - Ailes', 250, 250, 'kg', 20, catPoulet);

  console.log('Base de données initialisée avec les données de démo.');
}
