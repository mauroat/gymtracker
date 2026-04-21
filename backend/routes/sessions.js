const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all sessions (paginated, latest first)
router.get('/', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;
  const sessions = db.prepare(`
    SELECT s.*, r.name as routine_name, r.day_label
    FROM workout_sessions s
    JOIN routines r ON r.id = s.routine_id
    ORDER BY s.started_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);
  const total = db.prepare('SELECT COUNT(*) as c FROM workout_sessions').get().c;
  res.json({ sessions, total });
});

// GET single session with sets
router.get('/:id', (req, res) => {
  const session = db.prepare(`
    SELECT s.*, r.name as routine_name
    FROM workout_sessions s
    JOIN routines r ON r.id = s.routine_id
    WHERE s.id = ?
  `).get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Not found' });

  session.sets = db.prepare(`
    SELECT ss.*, e.name as exercise_name
    FROM session_sets ss
    JOIN exercises e ON e.id = ss.exercise_id
    WHERE ss.session_id = ?
    ORDER BY ss.exercise_id, ss.set_number
  `).all(session.id);
  res.json(session);
});

// POST start a session
router.post('/', (req, res) => {
  const { routine_id, notes } = req.body;
  if (!routine_id) return res.status(400).json({ error: 'routine_id required' });
  const { lastInsertRowid } = db.prepare(
    'INSERT INTO workout_sessions (routine_id, notes) VALUES (?, ?)'
  ).run(routine_id, notes || '');
  res.json(db.prepare(`
    SELECT s.*, r.name as routine_name FROM workout_sessions s
    JOIN routines r ON r.id = s.routine_id WHERE s.id = ?
  `).get(lastInsertRowid));
});

// PUT finish a session
router.put('/:id/finish', (req, res) => {
  db.prepare("UPDATE workout_sessions SET finished_at = datetime('now') WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

// DELETE session
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM workout_sessions WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// POST log a set
router.post('/:id/sets', (req, res) => {
  const { exercise_id, set_number, weight_kg, reps_done, rpe, notes } = req.body;
  if (!exercise_id || !set_number) return res.status(400).json({ error: 'exercise_id and set_number required' });
  const { lastInsertRowid } = db.prepare(
    'INSERT INTO session_sets (session_id, exercise_id, set_number, weight_kg, reps_done, rpe, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(req.params.id, exercise_id, set_number, weight_kg ?? null, reps_done ?? null, rpe ?? null, notes || '');
  res.json(db.prepare('SELECT * FROM session_sets WHERE id = ?').get(lastInsertRowid));
});

// PUT update a set
router.put('/:sessionId/sets/:setId', (req, res) => {
  const { weight_kg, reps_done, rpe, notes } = req.body;
  db.prepare(
    'UPDATE session_sets SET weight_kg=?, reps_done=?, rpe=?, notes=? WHERE id=? AND session_id=?'
  ).run(weight_kg ?? null, reps_done ?? null, rpe ?? null, notes || '', req.params.setId, req.params.sessionId);
  res.json(db.prepare('SELECT * FROM session_sets WHERE id = ?').get(req.params.setId));
});

// DELETE a set
router.delete('/:sessionId/sets/:setId', (req, res) => {
  db.prepare('DELETE FROM session_sets WHERE id = ? AND session_id = ?').run(req.params.setId, req.params.sessionId);
  res.json({ ok: true });
});

module.exports = router;
