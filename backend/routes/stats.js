const express = require('express');
const router = express.Router();
const db = require('../db');

// GET progress for a specific exercise (weight over time)
router.get('/exercise/:exerciseId', (req, res) => {
  const rows = db.prepare(`
    SELECT
      ss.logged_at,
      MAX(ss.weight_kg) as max_weight,
      AVG(ss.weight_kg) as avg_weight,
      MAX(ss.reps_done) as max_reps,
      SUM(ss.weight_kg * ss.reps_done) as total_volume,
      ws.started_at as session_date
    FROM session_sets ss
    JOIN workout_sessions ws ON ws.id = ss.session_id
    WHERE ss.exercise_id = ? AND ss.weight_kg IS NOT NULL
    GROUP BY ws.id
    ORDER BY ws.started_at ASC
    LIMIT 50
  `).all(req.params.exerciseId);
  res.json(rows);
});

// GET weekly volume summary
router.get('/weekly-volume', (req, res) => {
  const rows = db.prepare(`
    SELECT
      strftime('%Y-W%W', ws.started_at) as week,
      SUM(ss.weight_kg * ss.reps_done) as total_volume,
      COUNT(DISTINCT ws.id) as sessions_count,
      COUNT(ss.id) as total_sets
    FROM session_sets ss
    JOIN workout_sessions ws ON ws.id = ss.session_id
    WHERE ss.weight_kg IS NOT NULL AND ss.reps_done IS NOT NULL
    GROUP BY week
    ORDER BY week ASC
    LIMIT 16
  `).all();
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
    WHERE ss.weight_kg IS NOT NULL
    GROUP BY e.id
    ORDER BY r.position, e.position
  `).all();
  res.json(rows);
});

// GET sessions count last 30/90 days
router.get('/summary', (req, res) => {
  const last30 = db.prepare(`
    SELECT COUNT(*) as c FROM workout_sessions
    WHERE started_at >= datetime('now', '-30 days')
  `).get().c;
  const last90 = db.prepare(`
    SELECT COUNT(*) as c FROM workout_sessions
    WHERE started_at >= datetime('now', '-90 days')
  `).get().c;
  const totalSets = db.prepare('SELECT COUNT(*) as c FROM session_sets').get().c;
  const totalSessions = db.prepare('SELECT COUNT(*) as c FROM workout_sessions').get().c;
  res.json({ last30, last90, totalSets, totalSessions });
});

module.exports = router;
