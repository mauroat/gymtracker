const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'gymtracker.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS routines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    day_label TEXT,
    position INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    routine_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    sets INTEGER DEFAULT 3,
    reps TEXT DEFAULT '8-12',
    rest_seconds INTEGER DEFAULT 90,
    notes TEXT,
    position INTEGER DEFAULT 0,
    FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS workout_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    routine_id INTEGER NOT NULL,
    notes TEXT,
    started_at TEXT DEFAULT (datetime('now')),
    finished_at TEXT,
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

// Seed default routines if empty
const count = db.prepare('SELECT COUNT(*) as c FROM routines').get();
if (count.c === 0) {
  const insertRoutine = db.prepare(
    'INSERT INTO routines (name, description, day_label, position) VALUES (?, ?, ?, ?)'
  );
  const insertExercise = db.prepare(
    'INSERT INTO exercises (routine_id, name, sets, reps, rest_seconds, notes, position) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );

  const seedData = [
    {
      name: 'Pecho · Hombros · Tríceps',
      description: 'Día 1 — Tren superior empuje',
      day_label: 'Día 1',
      exercises: [
        { name: 'Press banca con barra', sets: 4, reps: '6-8', rest: 180, notes: 'Movimiento principal — RPE 8-9', pos: 0 },
        { name: 'Press inclinado con mancuernas', sets: 3, reps: '10-12', rest: 90, notes: '', pos: 1 },
        { name: 'Aperturas en cable (polea baja)', sets: 3, reps: '12-15', rest: 60, notes: 'Contracción peak al final', pos: 2 },
        { name: 'Press militar con barra', sets: 4, reps: '8-10', rest: 90, notes: '', pos: 3 },
        { name: 'Elevaciones laterales en cable', sets: 3, reps: '12-15', rest: 60, notes: 'Unilateral, codo ligeramente flexionado', pos: 4 },
        { name: 'Fondos en paralelas', sets: 3, reps: '8-10', rest: 90, notes: 'Lastre si podés', pos: 5 },
        { name: 'Extensión tríceps en polea', sets: 3, reps: '10-12', rest: 60, notes: 'Serie descendente con press francés', pos: 6 },
      ],
    },
    {
      name: 'Espalda · Bíceps',
      description: 'Día 2 — Tren superior tracción',
      day_label: 'Día 2',
      exercises: [
        { name: 'Dominadas lastradas', sets: 4, reps: '5-7', rest: 180, notes: 'Barra fija, agarre prono', pos: 0 },
        { name: 'Remo con barra (pronado)', sets: 4, reps: '6-8', rest: 120, notes: 'Retracción escapular completa', pos: 1 },
        { name: 'Remo en polea baja (agarre neutro)', sets: 3, reps: '10-12', rest: 90, notes: '', pos: 2 },
        { name: 'Pullover en polea alta', sets: 3, reps: '12-15', rest: 60, notes: 'Foco en serrato y dorsal', pos: 3 },
        { name: 'Curl barra recta', sets: 3, reps: '8-10', rest: 90, notes: '', pos: 4 },
        { name: 'Curl martillo con mancuernas', sets: 3, reps: '10-12', rest: 60, notes: '', pos: 5 },
        { name: 'Curl en cable (unilateral)', sets: 2, reps: '15', rest: 45, notes: 'Pump final', pos: 6 },
      ],
    },
    {
      name: 'Piernas',
      description: 'Día 3 — Tren inferior fuerza',
      day_label: 'Día 3',
      exercises: [
        { name: 'Sentadilla con barra (back squat)', sets: 5, reps: '3-5', rest: 240, notes: 'RPE 8-9, progresión lineal', pos: 0 },
        { name: 'Peso muerto rumano', sets: 4, reps: '4-6', rest: 180, notes: 'Control excéntrico 3 seg', pos: 1 },
        { name: 'Prensa 45°', sets: 3, reps: '8-10', rest: 120, notes: '', pos: 2 },
        { name: 'Zancadas con mancuernas', sets: 3, reps: '10 c/lado', rest: 90, notes: 'Andando, paso largo', pos: 3 },
        { name: 'Curl femoral en máquina', sets: 3, reps: '10-12', rest: 90, notes: '', pos: 4 },
        { name: 'Elevación de gemelos de pie', sets: 4, reps: '12-15', rest: 60, notes: 'Pausa 1 seg arriba', pos: 5 },
      ],
    },
  ];

  for (let i = 0; i < seedData.length; i++) {
    const r = seedData[i];
    const { lastInsertRowid } = insertRoutine.run(r.name, r.description, r.day_label, i);
    for (const e of r.exercises) {
      insertExercise.run(lastInsertRowid, e.name, e.sets, e.reps, e.rest, e.notes, e.pos);
    }
  }
  console.log('✅ Default routines seeded');
}

module.exports = db;
