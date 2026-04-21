const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth } = require('../auth');

router.use(requireAuth);

// GET progress for a specific exercise
router.get('/exercise/:exerciseId', (req, res) => {
  // Verify exercise belongs to user's routine
  const ex = db.prepare(`
    SELECT e.id FROM exercises e
    JOIN routines r ON r.id = e.routine_id
    WHERE e.id = ? AND r.user_id = ?
  `).get(req.params.exerciseId, req.userId);
  if (!ex) return res.status(404).json({ error: 'Not found' });

  const rows = db.prepare(`
    SELECT
      MAX(ss.weight_kg) as max_weight,
      AVG(ss.weight_kg) as avg_weight,
      MAX(ss.reps_done) as max_reps,
      SUM(ss.weight_kg * ss.reps_done) as total_volume,
      ws.started_at as session_date
    FROM session_sets ss
    JOIN workout_sessions ws ON ws.id = ss.session_id
    WHERE ss.exercise_id = ? AND ss.weight_kg IS NOT NULL AND ws.user_id = ?
    GROUP BY ws.id
    ORDER BY ws.started_at ASC
    LIMIT 60
  `).all(req.params.exerciseId, req.userId);
  res.json(rows);
});

// GET weekly volume
router.get('/weekly-volume', (req, res) => {
  const rows = db.prepare(`
    SELECT
      strftime('%Y-W%W', ws.started_at) as week,
      SUM(ss.weight_kg * ss.reps_done) as total_volume,
      COUNT(DISTINCT ws.id) as sessions_count,
      COUNT(ss.id) as total_sets
    FROM session_sets ss
    JOIN workout_sessions ws ON ws.id = ss.session_id
    WHERE ss.weight_kg IS NOT NULL AND ss.reps_done IS NOT NULL AND ws.user_id = ?
    GROUP BY week
    ORDER BY week ASC
    LIMIT 16
  `).all(req.userId);
  res.json(rows);
});

// GET PRs per exercise
router.get('/prs', (req, res) => {
  const rows = db.prepare(`
    SELECT
      e.id as exercise_id,
      e.name as exercise_name,
      r.name as routine_name,
      MAX(ss.weight_kg) as pr_weight,
      ss.reps_done as pr_reps,
      MAX(ws.started_at) as achieved_at
    FROM session_sets ss
    JOIN exercises e ON e.id = ss.exercise_id
    JOIN routines r ON r.id = e.routine_id
    JOIN workout_sessions ws ON ws.id = ss.session_id
    WHERE ss.weight_kg IS NOT NULL AND ws.user_id = ? AND r.user_id = ?
    GROUP BY e.id
    ORDER BY r.position, e.position
  `).all(req.userId, req.userId);
  res.json(rows);
});

// GET summary stats
router.get('/summary', (req, res) => {
  const last30 = db.prepare(`SELECT COUNT(*) as c FROM workout_sessions WHERE user_id = ? AND started_at >= datetime('now', '-30 days')`).get(req.userId).c;
  const last90 = db.prepare(`SELECT COUNT(*) as c FROM workout_sessions WHERE user_id = ? AND started_at >= datetime('now', '-90 days')`).get(req.userId).c;
  const totalSets = db.prepare(`SELECT COUNT(*) as c FROM session_sets ss JOIN workout_sessions ws ON ws.id = ss.session_id WHERE ws.user_id = ?`).get(req.userId).c;
  const totalSessions = db.prepare('SELECT COUNT(*) as c FROM workout_sessions WHERE user_id = ?').get(req.userId).c;
  res.json({ last30, last90, totalSets, totalSessions });
});

module.exports = router;
