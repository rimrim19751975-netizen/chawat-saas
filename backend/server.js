import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import boutiqueRoutes from './routes/boutique.js';
import superAdminRoutes from './routes/superadmin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/boutique', boutiqueRoutes);
app.use('/api/superadmin', superAdminRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendPath));
app.get('*', (req, res) => res.sendFile(path.join(frontendPath, 'index.html')));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Chawat SaaS running on http://localhost:${PORT}`);
});
