const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'gymtracker-dev-secret-change-in-prod';

function signToken(userId) {
  // No expiry — user stays logged in until they log out
  return jwt.sign({ userId }, SECRET);
}

function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

function requireAuth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  try {
    const payload = verifyToken(header.slice(7));
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

module.exports = { signToken, verifyToken, requireAuth };
