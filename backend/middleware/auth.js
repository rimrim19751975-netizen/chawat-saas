import jwt from 'jsonwebtoken';

export function authBoutique(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Non autorisé' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.boutiqueId = decoded.boutiqueId;
    req.boutiqueSlug = decoded.slug;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalide' });
  }
}

export function authClient(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Non autorisé' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.clientId = decoded.clientId;
    req.boutiqueId = decoded.boutiqueId;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalide' });
  }
}
