const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth } = require('../auth');

router.use(requireAuth);

// Helper: attach exercises+templates to a routine
function withExercises(routine) {
  const exercises = db.prepare(
    'SELECT * FROM exercises WHERE routine_id = ? ORDER BY position, id'
  ).all(routine.id);
  for (const ex of exercises) {
    ex.set_templates = db.prepare(
      'SELECT * FROM exercise_set_templates WHERE exercise_id = ? ORDER BY set_number'
    ).all(ex.id);
  }
  routine.exercises = exercises;
  return routine;
}

// GET all routines for current user
router.get('/', (req, res, next) => {
  try {
    const routines = db.prepare(
      'SELECT * FROM routines WHERE user_id = ? ORDER BY position, id'
    ).all(req.userId);
    res.json(routines);
  } catch (e) { next(e); }
});

// GET single routine with exercises + templates
router.get('/:id', (req, res, next) => {
  try {
    const routine = db.prepare('SELECT * FROM routines WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!routine) return res.status(404).json({ error: 'Not found' });
    res.json(withExercises(routine));
  } catch (e) { next(e); }
});

// POST create routine
router.post('/', (req, res, next) => {
  try {
    const { name, description, day_label } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const row = db.prepare('SELECT MAX(position) as m FROM routines WHERE user_id = ?').get(req.userId);
    const maxPos = (row && row.m != null) ? row.m : -1;
    const { lastInsertRowid } = db.prepare(
      'INSERT INTO routines (user_id, name, description, day_label, position) VALUES (?, ?, ?, ?, ?)'
    ).run(req.userId, name, description || '', day_label || '', maxPos + 1);
    res.json(db.prepare('SELECT * FROM routines WHERE id = ?').get(lastInsertRowid));
  } catch (e) { next(e); }
});

// PUT update routine
router.put('/:id', (req, res, next) => {
  try {
    const { name, description, day_label } = req.body;
    const r = db.prepare('SELECT id FROM routines WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!r) return res.status(404).json({ error: 'Not found' });
    db.prepare(
      'UPDATE routines SET name=?, description=?, day_label=?, updated_at=datetime("now") WHERE id=?'
    ).run(name, description, day_label, req.params.id);
    res.json(db.prepare('SELECT * FROM routines WHERE id = ?').get(req.params.id));
  } catch (e) { next(e); }
});

// DELETE routine
router.delete('/:id', (req, res, next) => {
  try {
    const r = db.prepare('SELECT id FROM routines WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!r) return res.status(404).json({ error: 'Not found' });
    db.prepare('DELETE FROM routines WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ── Exercises ──────────────────────────────────────────────────────

// POST add exercise to routine
router.post('/:id/exercises', (req, res, next) => {
  try {
    const routine = db.prepare('SELECT id FROM routines WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!routine) return res.status(404).json({ error: 'Not found' });

    const { name, rest_seconds, notes, set_templates } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });

    const posRow = db.prepare('SELECT MAX(position) as m FROM exercises WHERE routine_id = ?').get(req.params.id);
    const maxPos = (posRow && posRow.m != null) ? posRow.m : -1;
    const { lastInsertRowid: exId } = db.prepare(
      'INSERT INTO exercises (routine_id, name, rest_seconds, notes, position) VALUES (?, ?, ?, ?, ?)'
    ).run(req.params.id, name, rest_seconds || 90, notes || '', maxPos + 1);

    const insertTpl = db.prepare(
      'INSERT INTO exercise_set_templates (exercise_id, set_number, target_weight_kg, target_reps) VALUES (?, ?, ?, ?)'
    );
    const templates = Array.isArray(set_templates) ? set_templates : [];
    for (let i = 0; i < templates.length; i++) {
      insertTpl.run(exId, i + 1, templates[i].target_weight_kg ?? null, templates[i].target_reps ?? null);
    }

    const ex = db.prepare('SELECT * FROM exercises WHERE id = ?').get(exId);
    ex.set_templates = db.prepare('SELECT * FROM exercise_set_templates WHERE exercise_id = ? ORDER BY set_number').all(exId);
    res.json(ex);
  } catch (e) { next(e); }
});

// PUT update exercise metadata
router.put('/:routineId/exercises/:exId', (req, res, next) => {
  try {
    const routine = db.prepare('SELECT id FROM routines WHERE id = ? AND user_id = ?').get(req.params.routineId, req.userId);
    if (!routine) return res.status(404).json({ error: 'Not found' });
    const { name, rest_seconds, notes } = req.body;
    db.prepare(
      'UPDATE exercises SET name=?, rest_seconds=?, notes=? WHERE id=? AND routine_id=?'
    ).run(name, rest_seconds, notes, req.params.exId, req.params.routineId);
    res.json(db.prepare('SELECT * FROM exercises WHERE id = ?').get(req.params.exId));
  } catch (e) { next(e); }
});

// PUT replace set templates for an exercise
router.put('/:routineId/exercises/:exId/templates', (req, res, next) => {
  try {
    const routine = db.prepare('SELECT id FROM routines WHERE id = ? AND user_id = ?').get(req.params.routineId, req.userId);
    if (!routine) return res.status(404).json({ error: 'Not found' });
    const { set_templates } = req.body;
    if (!Array.isArray(set_templates)) return res.status(400).json({ error: 'set_templates must be array' });
    db.prepare('DELETE FROM exercise_set_templates WHERE exercise_id = ?').run(req.params.exId);
    const insert = db.prepare(
      'INSERT INTO exercise_set_templates (exercise_id, set_number, target_weight_kg, target_reps) VALUES (?, ?, ?, ?)'
    );
    for (let i = 0; i < set_templates.length; i++) {
      insert.run(req.params.exId, i + 1, set_templates[i].target_weight_kg ?? null, set_templates[i].target_reps ?? null);
    }
    res.json(db.prepare('SELECT * FROM exercise_set_templates WHERE exercise_id = ? ORDER BY set_number').all(req.params.exId));
  } catch (e) { next(e); }
});

// DELETE exercise
router.delete('/:routineId/exercises/:exId', (req, res, next) => {
  try {
    const routine = db.prepare('SELECT id FROM routines WHERE id = ? AND user_id = ?').get(req.params.routineId, req.userId);
    if (!routine) return res.status(404).json({ error: 'Not found' });
    db.prepare('DELETE FROM exercises WHERE id = ? AND routine_id = ?').run(req.params.exId, req.params.routineId);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
