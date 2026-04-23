const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'gymtracker.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Migrations: handle schema upgrades on existing DBs ──────────
function columnExists(table, column) {
  return db.prepare(`PRAGMA table_info(${table})`).all().some(c => c.name === column);
}
function tableExists(table) {
  return !!db.prepare('SELECT name FROM sqlite_master WHERE type=\'table\' AND name=?').get(table);
}

// v2→v3: add user_id to routines if missing
if (tableExists('routines') && !columnExists('routines', 'user_id')) {
  db.exec('ALTER TABLE routines ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1');
}
// v2→v3: add user_id to workout_sessions if missing
if (tableExists('workout_sessions') && !columnExists('workout_sessions', 'user_id')) {
  db.exec('ALTER TABLE workout_sessions ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1');
}
// v2→v3: create exercise_set_templates if missing, seed from old sets/reps columns
if (!tableExists('exercise_set_templates')) {
  db.exec(`
    CREATE TABLE exercise_set_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exercise_id INTEGER NOT NULL,
      set_number INTEGER NOT NULL,
      target_weight_kg REAL,
      target_reps INTEGER,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
    )
  `);
  const hasSets = tableExists('exercises') && columnExists('exercises', 'sets');
  const hasReps = tableExists('exercises') && columnExists('exercises', 'reps');
  if (hasSets && hasReps) {
    const exercises = db.prepare('SELECT id, sets, reps FROM exercises').all();
    const ins = db.prepare('INSERT INTO exercise_set_templates (exercise_id, set_number, target_weight_kg, target_reps) VALUES (?, ?, NULL, ?)');
    const parseReps = (r) => { if (!r) return null; const m = String(r).match(/\d+/); return m ? parseInt(m[0]) : null; };
    for (const ex of exercises) {
      const n = parseInt(ex.sets) || 3;
      for (let i = 1; i <= n; i++) ins.run(ex.id, i, parseReps(ex.reps));
    }
  }
}


db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS routines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    day_label TEXT,
    position INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    routine_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    rest_seconds INTEGER DEFAULT 90,
    notes TEXT,
    position INTEGER DEFAULT 0,
    FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS exercise_set_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exercise_id INTEGER NOT NULL,
    set_number INTEGER NOT NULL,
    target_weight_kg REAL,
    target_reps INTEGER,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS workout_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    routine_id INTEGER NOT NULL,
    notes TEXT,
    started_at TEXT DEFAULT (datetime('now')),
    finished_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS session_sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    exercise_id INTEGER NOT NULL,
    set_number INTEGER NOT NULL,
    weight_kg REAL,
    reps_done INTEGER,
    rpe INTEGER,
    notes TEXT,
    logged_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (session_id) REFERENCES workout_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
  );
`);

function seedRoutinesForUser(userId) {
  const insertRoutine = db.prepare(
    'INSERT INTO routines (user_id, name, description, day_label, position) VALUES (?, ?, ?, ?, ?)'
  );
  const insertExercise = db.prepare(
    'INSERT INTO exercises (routine_id, name, rest_seconds, notes, position) VALUES (?, ?, ?, ?, ?)'
  );
  const insertTemplate = db.prepare(
    'INSERT INTO exercise_set_templates (exercise_id, set_number, target_weight_kg, target_reps) VALUES (?, ?, ?, ?)'
  );

  const seedData = [
    {
      name: 'Pecho · Hombros · Tríceps', description: 'Tren superior empuje', day_label: 'Día 1',
      exercises: [
        { name: 'Press banca con barra', rest: 180, notes: 'Movimiento principal — RPE 8-9', pos: 0,
          sets: [{w:null,r:6},{w:null,r:6},{w:null,r:8},{w:null,r:8}] },
        { name: 'Press inclinado con mancuernas', rest: 90, notes: '', pos: 1,
          sets: [{w:null,r:10},{w:null,r:10},{w:null,r:12}] },
        { name: 'Aperturas en cable (polea baja)', rest: 60, notes: 'Contracción peak al final', pos: 2,
          sets: [{w:null,r:12},{w:null,r:15},{w:null,r:15}] },
        { name: 'Press militar con barra', rest: 90, notes: '', pos: 3,
          sets: [{w:null,r:8},{w:null,r:8},{w:null,r:10},{w:null,r:10}] },
        { name: 'Elevaciones laterales en cable', rest: 60, notes: 'Unilateral', pos: 4,
          sets: [{w:null,r:12},{w:null,r:15},{w:null,r:15}] },
        { name: 'Fondos en paralelas', rest: 90, notes: 'Lastre si podés', pos: 5,
          sets: [{w:null,r:8},{w:null,r:8},{w:null,r:10}] },
        { name: 'Extensión tríceps en polea', rest: 60, notes: 'Serie descendente con press francés', pos: 6,
          sets: [{w:null,r:10},{w:null,r:10},{w:null,r:12}] },
      ],
    },
    {
      name: 'Espalda · Bíceps', description: 'Tren superior tracción', day_label: 'Día 2',
      exercises: [
        { name: 'Dominadas lastradas', rest: 180, notes: 'Agarre prono', pos: 0,
          sets: [{w:null,r:5},{w:null,r:5},{w:null,r:7},{w:null,r:7}] },
        { name: 'Remo con barra (pronado)', rest: 120, notes: 'Retracción escapular completa', pos: 1,
          sets: [{w:null,r:6},{w:null,r:6},{w:null,r:8},{w:null,r:8}] },
        { name: 'Remo en polea baja (agarre neutro)', rest: 90, notes: '', pos: 2,
          sets: [{w:null,r:10},{w:null,r:10},{w:null,r:12}] },
        { name: 'Pullover en polea alta', rest: 60, notes: 'Foco en serrato y dorsal', pos: 3,
          sets: [{w:null,r:12},{w:null,r:15},{w:null,r:15}] },
        { name: 'Curl barra recta', rest: 90, notes: '', pos: 4,
          sets: [{w:null,r:8},{w:null,r:8},{w:null,r:10}] },
        { name: 'Curl martillo con mancuernas', rest: 60, notes: '', pos: 5,
          sets: [{w:null,r:10},{w:null,r:10},{w:null,r:12}] },
        { name: 'Curl en cable (unilateral)', rest: 45, notes: 'Pump final', pos: 6,
          sets: [{w:null,r:15},{w:null,r:15}] },
      ],
    },
    {
      name: 'Piernas', description: 'Tren inferior fuerza', day_label: 'Día 3',
      exercises: [
        { name: 'Sentadilla con barra (back squat)', rest: 240, notes: 'RPE 8-9, progresión lineal', pos: 0,
          sets: [{w:null,r:3},{w:null,r:3},{w:null,r:5},{w:null,r:5},{w:null,r:5}] },
        { name: 'Peso muerto rumano', rest: 180, notes: 'Control excéntrico 3 seg', pos: 1,
          sets: [{w:null,r:4},{w:null,r:4},{w:null,r:6},{w:null,r:6}] },
        { name: 'Prensa 45°', rest: 120, notes: '', pos: 2,
          sets: [{w:null,r:8},{w:null,r:10},{w:null,r:10}] },
        { name: 'Zancadas con mancuernas', rest: 90, notes: 'Andando, paso largo', pos: 3,
          sets: [{w:null,r:10},{w:null,r:10},{w:null,r:10}] },
        { name: 'Curl femoral en máquina', rest: 90, notes: '', pos: 4,
          sets: [{w:null,r:10},{w:null,r:10},{w:null,r:12}] },
        { name: 'Elevación de gemelos de pie', rest: 60, notes: 'Pausa 1 seg arriba', pos: 5,
          sets: [{w:null,r:12},{w:null,r:12},{w:null,r:15},{w:null,r:15}] },
      ],
    },
  ];

  for (let i = 0; i < seedData.length; i++) {
    const r = seedData[i];
    const { lastInsertRowid: routineId } = insertRoutine.run(userId, r.name, r.description, r.day_label, i);
    for (const e of r.exercises) {
      const { lastInsertRowid: exId } = insertExercise.run(routineId, e.name, e.rest, e.notes, e.pos);
      for (let s = 0; s < e.sets.length; s++) {
        insertTemplate.run(exId, s + 1, e.sets[s].w, e.sets[s].r);
      }
    }
  }
}

module.exports = { db, seedRoutinesForUser };
