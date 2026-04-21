const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all routines
router.get('/', (req, res) => {
  const routines = db.prepare('SELECT * FROM routines ORDER BY position, id').all();
  res.json(routines);
});

// GET single routine with exercises
router.get('/:id', (req, res) => {
  const routine = db.prepare('SELECT * FROM routines WHERE id = ?').get(req.params.id);
  if (!routine) return res.status(404).json({ error: 'Not found' });
  routine.exercises = db.prepare('SELECT * FROM exercises WHERE routine_id = ? ORDER BY position, id').all(routine.id);
  res.json(routine);
});

// POST create routine
router.post('/', (req, res) => {
  const { name, description, day_label } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const maxPos = db.prepare('SELECT MAX(position) as m FROM routines').get().m ?? -1;
  const { lastInsertRowid } = db.prepare(
    'INSERT INTO routines (name, description, day_label, position) VALUES (?, ?, ?, ?)'
  ).run(name, description || '', day_label || '', maxPos + 1);
  res.json(db.prepare('SELECT * FROM routines WHERE id = ?').get(lastInsertRowid));
});

// PUT update routine
router.put('/:id', (req, res) => {
  const { name, description, day_label } = req.body;
  db.prepare(
    'UPDATE routines SET name=?, description=?, day_label=?, updated_at=datetime("now") WHERE id=?'
  ).run(name, description, day_label, req.params.id);
  res.json(db.prepare('SELECT * FROM routines WHERE id = ?').get(req.params.id));
});

// DELETE routine
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM routines WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// --- Exercises ---

// POST add exercise to routine
router.post('/:id/exercises', (req, res) => {
  const { name, sets, reps, rest_seconds, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const maxPos = db.prepare('SELECT MAX(position) as m FROM exercises WHERE routine_id = ?').get(req.params.id).m ?? -1;
  const { lastInsertRowid } = db.prepare(
    'INSERT INTO exercises (routine_id, name, sets, reps, rest_seconds, notes, position) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(req.params.id, name, sets || 3, reps || '8-12', rest_seconds || 90, notes || '', maxPos + 1);
  res.json(db.prepare('SELECT * FROM exercises WHERE id = ?').get(lastInsertRowid));
});

// PUT update exercise
router.put('/:routineId/exercises/:exerciseId', (req, res) => {
  const { name, sets, reps, rest_seconds, notes } = req.body;
  db.prepare(
    'UPDATE exercises SET name=?, sets=?, reps=?, rest_seconds=?, notes=? WHERE id=? AND routine_id=?'
  ).run(name, sets, reps, rest_seconds, notes, req.params.exerciseId, req.params.routineId);
  res.json(db.prepare('SELECT * FROM exercises WHERE id = ?').get(req.params.exerciseId));
});

// DELETE exercise
router.delete('/:routineId/exercises/:exerciseId', (req, res) => {
  db.prepare('DELETE FROM exercises WHERE id = ? AND routine_id = ?').run(req.params.exerciseId, req.params.routineId);
  res.json({ ok: true });
});

module.exports = router;
