const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { db } = require('../db');
const { signToken, requireAuth } = require('../auth');

// POST /api/auth/register
router.post('/register', (req, res, next) => {
  try {
    const { username, password, display_name } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    if (password.length < 6) return res.status(400).json({ error: 'Contraseña mínimo 6 caracteres' });

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username.toLowerCase().trim());
    if (existing) return res.status(409).json({ error: 'El usuario ya existe' });

    const hash = bcrypt.hashSync(password, 10);
    const { lastInsertRowid: userId } = db.prepare(
      'INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)'
    ).run(username.toLowerCase().trim(), hash, display_name || username);

    // No seeding — user builds their own routines

    const user = db.prepare('SELECT id, username, display_name, created_at FROM users WHERE id = ?').get(userId);
    const token = signToken(userId);
    res.json({ token, user });
  } catch (e) { next(e); }
});

// POST /api/auth/login
router.post('/login', (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Usuario y contraseña requeridos' });

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.toLowerCase().trim());
    if (!user) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });

    const token = signToken(user.id);
    res.json({
      token,
      user: { id: user.id, username: user.username, display_name: user.display_name, created_at: user.created_at }
    });
  } catch (e) { next(e); }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res, next) => {
  try {
    const user = db.prepare('SELECT id, username, display_name, created_at FROM users WHERE id = ?').get(req.userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (e) { next(e); }
});

module.exports = router;
