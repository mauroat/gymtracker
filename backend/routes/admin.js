const express = require('express');
const router = express.Router();
const { db } = require('../db');

// ── Auth middleware ───────────────────────────────────────────────
function adminAuth(req, res, next) {
  const key = process.env.ADMIN_KEY;
  if (!key) return res.status(403).json({ error: 'Admin no habilitado. Configurá ADMIN_KEY en Railway.' });
  const provided = req.headers['x-admin-key'] || req.query.key;
  if (provided !== key) return res.status(401).json({ error: 'Clave incorrecta' });
  next();
}

// ── HTML Panel ────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const hasKey = !!process.env.ADMIN_KEY;
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>GymTracker Admin</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;color:#1c1c1e;min-height:100vh}
.header{background:#1c1c1e;color:#fff;padding:14px 20px;display:flex;align-items:center;gap:12px}
.header h1{font-size:1rem;font-weight:600;flex:1}
.badge{background:#ff3b30;color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px;letter-spacing:.04em}
.key-bar{background:#fff;border-bottom:1px solid #e5e5ea;padding:10px 20px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.key-bar input{border:1px solid #e5e5ea;border-radius:8px;padding:7px 12px;font-size:13px;width:220px}
.key-bar input:focus{outline:none;border-color:#007aff}
#connStatus{font-size:12px}
.tabs{background:#fff;border-bottom:1px solid #e5e5ea;display:flex;padding:0 20px;gap:0}
.tab{padding:11px 18px;font-size:14px;font-weight:500;color:#8e8e93;cursor:pointer;border-bottom:2px solid transparent;transition:all .15s;white-space:nowrap}
.tab:hover{color:#1c1c1e}
.tab.active{color:#007aff;border-bottom-color:#007aff;font-weight:600}
.panel{display:none;padding:20px;max-width:1100px;margin:0 auto}
.panel.active{display:block}
/* Cards */
.card{background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.08);overflow:hidden;margin-bottom:16px}
.card-header{padding:14px 18px;border-bottom:1px solid #f2f2f7;font-weight:600;font-size:14px;display:flex;align-items:center;gap:8px}
.card-body{padding:16px 18px}
/* Forms */
label{font-size:11px;font-weight:700;color:#8e8e93;text-transform:uppercase;letter-spacing:.04em;display:block;margin-bottom:5px}
select,input[type=text],input[type=number],textarea{width:100%;border:1px solid #e5e5ea;border-radius:8px;padding:9px 12px;font-size:14px;font-family:inherit;background:#fff;color:#1c1c1e}
select:focus,input:focus,textarea:focus{outline:none;border-color:#007aff;box-shadow:0 0 0 3px rgba(0,122,255,.1)}
textarea{font-family:'SF Mono','Fira Code',monospace;font-size:13px;resize:vertical;min-height:90px}
.form-row{display:grid;gap:12px;margin-bottom:12px}
.form-row.cols-2{grid-template-columns:1fr 1fr}
.form-row.cols-3{grid-template-columns:1fr 1fr 1fr}
/* Buttons */
.btn{padding:9px 18px;border-radius:8px;border:none;font-size:13px;font-weight:600;cursor:pointer;transition:opacity .15s;white-space:nowrap}
.btn:active{opacity:.75}
.btn-primary{background:#007aff;color:#fff}
.btn-success{background:#34c759;color:#fff}
.btn-danger{background:#ff3b30;color:#fff}
.btn-secondary{background:#f2f2f7;color:#1c1c1e}
.btn-sm{padding:6px 12px;font-size:12px}
/* Tables */
.tbl-wrap{overflow-x:auto;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.06)}
table{width:100%;border-collapse:collapse;font-size:13px;background:#fff}
th{background:#f2f2f7;padding:9px 14px;text-align:left;font-size:11px;font-weight:700;color:#8e8e93;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid #e5e5ea;white-space:nowrap}
td{padding:9px 14px;border-bottom:1px solid #f2f2f7;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
tr:last-child td{border-bottom:none}
tr:hover td{background:#f9f9fb}
.null{color:#c7c7cc;font-style:italic;font-size:11px}
/* Alerts */
.alert{padding:11px 15px;border-radius:8px;font-size:13px;font-weight:500;margin-bottom:12px}
.alert-ok{background:#d1f5e0;color:#1a7a3c}
.alert-err{background:#ffd5d5;color:#c0392b}
.alert-info{background:#e8f0ff;color:#1246ac}
/* Copy flow */
.arrow-row{display:flex;align-items:flex-end;gap:10px}
.arrow-icon{font-size:1.5rem;padding-bottom:10px;color:#8e8e93;flex-shrink:0}
.routine-list{display:flex;flex-direction:column;gap:6px;margin-top:8px;max-height:260px;overflow-y:auto}
.routine-chip{padding:10px 14px;border-radius:8px;border:2px solid #e5e5ea;cursor:pointer;font-size:13px;font-weight:500;transition:all .15s;display:flex;justify-content:space-between;align-items:center}
.routine-chip:hover{border-color:#007aff;background:#e8f0ff}
.routine-chip.selected{border-color:#007aff;background:#e8f0ff;color:#007aff}
.chip-meta{font-size:11px;color:#8e8e93;font-weight:400}
.empty-state{text-align:center;padding:32px;color:#8e8e93;font-size:13px}
/* Meta */
.result-meta{font-size:12px;color:#8e8e93;margin-bottom:10px}
.count{color:#34c759;font-weight:700}
/* Disabled overlay */
.disabled-overlay{background:#fff3cd;border:1px solid #ffc107;border-radius:10px;padding:20px;text-align:center;color:#856404}
.disabled-overlay code{background:rgba(0,0,0,.08);padding:2px 6px;border-radius:4px;font-size:13px}
</style>
</head>
<body>

<div class="header">
  <span>🏋️</span>
  <h1>GymTracker Admin</h1>
  <span class="badge">ADMIN</span>
</div>

${!hasKey ? `<div style="padding:20px"><div class="disabled-overlay">
  <h3 style="margin-bottom:10px">⚠️ Admin deshabilitado</h3>
  <p>Configurá <code>ADMIN_KEY=tu_clave_secreta</code> en Railway → Variables y redesplegá.</p>
</div></div>` : `
<div class="key-bar">
  <input type="password" id="adminKey" placeholder="Admin Key..." autocomplete="off" />
  <button class="btn btn-primary btn-sm" onclick="connect()">Conectar</button>
  <span id="connStatus" style="color:#8e8e93"></span>
</div>

<div class="tabs">
  <div class="tab active" onclick="switchTab('copy')">📋 Copiar rutinas</div>
  <div class="tab" onclick="switchTab('users')">👤 Usuarios</div>
  <div class="tab" onclick="switchTab('import')">⬆ Importar</div>
  <div class="tab" onclick="switchTab('sql')">🔧 SQL</div>
</div>

<!-- ── TAB: Copy Routines ── -->
<div id="tab-copy" class="panel active">
  <div id="copyAlert"></div>
  <div class="card">
    <div class="card-header">📋 Copiar rutina de un usuario a otro</div>
    <div class="card-body">
      <div class="arrow-row">
        <div style="flex:1">
          <div class="form-row">
            <div>
              <label>Usuario origen</label>
              <select id="srcUser" onchange="loadSrcRoutines()">
                <option value="">— Seleccioná usuario —</option>
              </select>
            </div>
          </div>
          <div id="srcRoutineList" class="routine-list" style="display:none"></div>
        </div>
        <div class="arrow-icon">→</div>
        <div style="flex:1">
          <label>Usuario destino</label>
          <select id="dstUser">
            <option value="">— Seleccioná usuario —</option>
          </select>
          <div id="copyPreview" style="margin-top:12px;display:none"></div>
        </div>
      </div>
      <div style="margin-top:16px;display:flex;gap:8px;align-items:center">
        <button class="btn btn-success" onclick="copyRoutine()" id="copyBtn" disabled>✓ Copiar rutina</button>
        <span id="copyStatus" style="font-size:13px;color:#8e8e93"></span>
      </div>
    </div>
  </div>
</div>

<!-- ── TAB: Users ── -->
<div id="tab-users" class="panel">
  <div class="card">
    <div class="card-header">👤 Usuarios registrados</div>
    <div class="card-body">
      <button class="btn btn-secondary btn-sm" onclick="loadUsersTable()">↻ Actualizar</button>
      <div id="usersTable" style="margin-top:12px"></div>
    </div>
  </div>
  <div class="card">
    <div class="card-header">📋 Rutinas por usuario</div>
    <div class="card-body">
      <div style="display:flex;gap:8px;margin-bottom:12px;align-items:flex-end">
        <div style="flex:1">
          <label>Filtrar por usuario</label>
          <select id="routineFilterUser" onchange="loadRoutinesTable()">
            <option value="">Todos</option>
          </select>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="loadRoutinesTable()">↻ Ver</button>
      </div>
      <div id="routinesTable"></div>
    </div>
  </div>
</div>


<!-- ── TAB: Import ── -->
<div id="tab-import" class="panel">
  <div id="importAlert"></div>
  <div class="card">
    <div class="card-header">⬆ Restaurar datos desde JSON export</div>
    <div class="card-body">
      <p style="font-size:13px;color:var(--text3,#8e8e93);margin-bottom:14px">
        Subí un archivo JSON exportado desde Stats → Exportar. Las rutinas y sesiones se importan sin pisar datos existentes.
      </p>
      <div style="margin-bottom:12px">
        <label>Archivo JSON</label>
        <input type="file" id="importFile" accept=".json" style="padding:8px;font-size:13px;border-radius:8px;border:1px solid #e5e5ea;width:100%" />
      </div>
      <div id="importPreview" style="display:none;margin-bottom:12px"></div>
      <button class="btn btn-success" onclick="doImport()" id="importBtn" disabled>⬆ Importar datos</button>
    </div>
  </div>
</div>

<!-- ── TAB: SQL ── -->
<div id="tab-sql" class="panel">
  <div class="card">
    <div class="card-header">🗂️ Tablas</div>
    <div class="card-body">
      <div id="tablesGrid" style="display:flex;flex-wrap:wrap;gap:8px"></div>
    </div>
  </div>
  <div class="card">
    <div class="card-header">🔧 SQL Console</div>
    <div class="card-body">
      <div style="margin-bottom:8px">
        <label>Query (Ctrl+Enter para ejecutar)</label>
        <textarea id="sqlInput" placeholder="SELECT * FROM users LIMIT 10;" spellcheck="false"></textarea>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary btn-sm" onclick="runQuery()">▶ Ejecutar</button>
        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('sqlInput').value=''">Limpiar</button>
      </div>
      <div id="sqlResults" style="margin-top:16px"></div>
    </div>
  </div>
</div>

<script>
let selectedRoutineId = null;
let allUsers = [];

function key() { return document.getElementById('adminKey').value; }

async function apiFetch(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: { 'x-admin-key': key(), 'Content-Type': 'application/json', ...(opts.headers||{}) }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error ' + res.status);
  return data;
}

function switchTab(name) {
  document.querySelectorAll('.tab').forEach((t,i) => {
    const names = ['copy','users','import','sql'];
    t.classList.toggle('active', names[i] === name);
  });
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
}

async function connect() {
  const status = document.getElementById('connStatus');
  status.textContent = 'Conectando...';
  status.style.color = '#8e8e93';
  try {
    const data = await apiFetch('/api/admin/users');
    allUsers = data.users;
    populateUserSelects();
    loadTablesGrid();
    status.textContent = '✓ Conectado — ' + allUsers.length + ' usuario(s)';
    status.style.color = '#34c759';
  } catch(e) {
    status.textContent = '✗ ' + e.message;
    status.style.color = '#ff3b30';
  }
}

function populateUserSelects() {
  const opts = allUsers.map(u => \`<option value="\${u.id}">\${u.username}\${u.display_name ? ' — ' + u.display_name : ''}</option>\`).join('');
  ['srcUser','dstUser','routineFilterUser'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const prev = el.value;
    el.innerHTML = (id === 'routineFilterUser' ? '<option value="">Todos</option>' : '<option value="">— Seleccioná usuario —</option>') + opts;
    if (prev) el.value = prev;
  });
}

async function loadSrcRoutines() {
  const userId = document.getElementById('srcUser').value;
  selectedRoutineId = null;
  updateCopyPreview();
  document.getElementById('copyBtn').disabled = true;
  const listEl = document.getElementById('srcRoutineList');
  if (!userId) { listEl.style.display = 'none'; return; }
  try {
    const data = await apiFetch('/api/admin/routines?user_id=' + userId);
    if (!data.routines.length) {
      listEl.style.display = 'block';
      listEl.innerHTML = '<div class="empty-state">Este usuario no tiene rutinas</div>';
      return;
    }
    listEl.style.display = 'block';
    listEl.innerHTML = data.routines.map(r => \`
      <div class="routine-chip" id="rc-\${r.id}" onclick="selectRoutine(\${r.id}, '\${r.name.replace(/'/g,"\\\\'")}', \${r.exercise_count})">
        <div>
          <div>\${r.name}</div>
          <div class="chip-meta">\${r.day_label || ''}\${r.day_label ? ' · ' : ''}\${r.exercise_count} ejercicios</div>
        </div>
        <span style="font-size:1.2rem;color:#c7c7cc">○</span>
      </div>
    \`).join('');
  } catch(e) {
    listEl.style.display = 'block';
    listEl.innerHTML = '<div class="empty-state" style="color:#ff3b30">' + e.message + '</div>';
  }
}

function selectRoutine(id, name, count) {
  selectedRoutineId = id;
  document.querySelectorAll('.routine-chip').forEach(el => {
    el.classList.remove('selected');
    el.querySelector('span').textContent = '○';
  });
  const chip = document.getElementById('rc-' + id);
  if (chip) { chip.classList.add('selected'); chip.querySelector('span').textContent = '●'; }
  updateCopyPreview();
  document.getElementById('copyBtn').disabled = !document.getElementById('dstUser').value;
}

function updateCopyPreview() {
  const dstId = document.getElementById('dstUser').value;
  const previewEl = document.getElementById('copyPreview');
  if (!selectedRoutineId || !dstId) { previewEl.style.display = 'none'; return; }
  const dstUser = allUsers.find(u => String(u.id) === String(dstId));
  previewEl.style.display = 'block';
  previewEl.innerHTML = \`<div class="alert alert-info">Se copiará la rutina seleccionada a <strong>@\${dstUser?.username}</strong></div>\`;
}

document.addEventListener('change', e => {
  if (e.target.id === 'dstUser') {
    updateCopyPreview();
    document.getElementById('copyBtn').disabled = !selectedRoutineId || !e.target.value;
  }
});

async function copyRoutine() {
  const dstId = document.getElementById('dstUser').value;
  if (!selectedRoutineId || !dstId) return;
  const btn = document.getElementById('copyBtn');
  btn.disabled = true; btn.textContent = 'Copiando...';
  const alertEl = document.getElementById('copyAlert');
  try {
    const data = await apiFetch('/api/admin/copy-routine', {
      method: 'POST',
      body: JSON.stringify({ routine_id: selectedRoutineId, target_user_id: parseInt(dstId) })
    });
    alertEl.innerHTML = \`<div class="alert alert-ok">✓ \${data.message} — \${data.copied_exercises} ejercicios, \${data.copied_templates} series copiadas</div>\`;
    // Reset selection
    selectedRoutineId = null;
    document.querySelectorAll('.routine-chip').forEach(el => { el.classList.remove('selected'); el.querySelector('span').textContent = '○'; });
    document.getElementById('copyPreview').style.display = 'none';
  } catch(e) {
    alertEl.innerHTML = \`<div class="alert alert-err">✗ \${e.message}</div>\`;
  } finally {
    btn.disabled = false; btn.textContent = '✓ Copiar rutina';
  }
}

// ── Users tab ──
async function loadUsersTable() {
  const el = document.getElementById('usersTable');
  try {
    const data = await apiFetch('/api/admin/users');
    el.innerHTML = renderTable(data.users);
  } catch(e) { el.innerHTML = '<div class="alert alert-err">' + e.message + '</div>'; }
}

async function loadRoutinesTable() {
  const userId = document.getElementById('routineFilterUser').value;
  const el = document.getElementById('routinesTable');
  try {
    const data = await apiFetch('/api/admin/routines' + (userId ? '?user_id=' + userId : ''));
    el.innerHTML = renderTable(data.routines);
  } catch(e) { el.innerHTML = '<div class="alert alert-err">' + e.message + '</div>'; }
}

// ── SQL tab ──
async function loadTablesGrid() {
  try {
    const data = await apiFetch('/api/admin/tables');
    const ICONS = {users:'👤',routines:'📋',exercises:'💪',exercise_set_templates:'🔢',workout_sessions:'📅',session_sets:'📊'};
    document.getElementById('tablesGrid').innerHTML = data.tables.map(t => \`
      <div onclick="document.getElementById('sqlInput').value='SELECT * FROM \${t.name} LIMIT 50;';switchTab('sql')"
        style="background:#f2f2f7;border-radius:8px;padding:8px 14px;cursor:pointer;font-size:13px;font-weight:500;display:flex;align-items:center;gap:6px;transition:background .1s"
        onmouseover="this.style.background='#e5e5ea'" onmouseout="this.style.background='#f2f2f7'">
        \${ICONS[t.name]||'🗂️'} \${t.name} <span style="color:#8e8e93;font-size:11px">\${t.count}</span>
      </div>
    \`).join('');
  } catch(e) {}
}

async function runQuery() {
  const sql = document.getElementById('sqlInput').value.trim();
  if (!sql) return;
  const el = document.getElementById('sqlResults');
  el.innerHTML = '<div style="color:#8e8e93;font-size:13px">Ejecutando...</div>';
  try {
    const data = await apiFetch('/api/admin/query', { method:'POST', body: JSON.stringify({ sql }) });
    if (data.type === 'select') {
      el.innerHTML = '<div class="result-meta"><span class="count">' + data.rows.length + '</span> filas · ' + data.duration + 'ms</div>'
        + (data.rows.length ? '<div class="tbl-wrap">' + renderTable(data.rows) + '</div>' : '<div class="empty-state">Sin resultados</div>');
    } else {
      el.innerHTML = '<div class="alert alert-ok">✓ ' + data.message + ' · ' + data.duration + 'ms</div>';
    }
  } catch(e) { el.innerHTML = '<div class="alert alert-err">✗ ' + e.message + '</div>'; }
}

function renderTable(rows) {
  if (!rows || !rows.length) return '<div class="empty-state">Sin datos</div>';
  const cols = Object.keys(rows[0]);
  return '<div class="tbl-wrap"><table><thead><tr>' + cols.map(c => '<th>' + c + '</th>').join('') + '</tr></thead><tbody>'
    + rows.map(row => '<tr>' + cols.map(c =>
        row[c] === null ? '<td><span class="null">null</span></td>'
        : '<td title="' + String(row[c]).replace(/"/g,'&quot;') + '">' + String(row[c]).replace(/</g,'&lt;') + '</td>'
      ).join('') + '</tr>').join('') + '</tbody></table></div>';
}


// ── Import tab JS ──
document.getElementById('importFile').addEventListener('change', async function(e) {
  var file = e.target.files[0];
  if (!file) return;
  try {
    var text = await file.text();
    var data = JSON.parse(text);
    var preview = document.getElementById('importPreview');
    preview.style.display = 'block';
    preview.innerHTML = '<div class="alert alert-info"><strong>Listo para importar:</strong><br>'
      + '👤 Usuario: <strong>' + (data.user && data.user.username || '?') + '</strong> &nbsp;|&nbsp; '
      + '📋 Rutinas: <strong>' + (data.routines && data.routines.length || 0) + '</strong> &nbsp;|&nbsp; '
      + '📅 Sesiones: <strong>' + (data.sessions && data.sessions.length || 0) + '</strong></div>';
    var btn = document.getElementById('importBtn');
    btn.disabled = false;
    btn.dataset.json = text;
  } catch(err) {
    document.getElementById('importPreview').style.display = 'block';
    document.getElementById('importPreview').innerHTML = '<div class="alert alert-err">Archivo JSON inválido</div>';
    document.getElementById('importBtn').disabled = true;
  }
});

async function doImport() {
  var btn = document.getElementById('importBtn');
  var json = btn.dataset.json;
  if (!json) return;
  btn.disabled = true; btn.textContent = 'Importando...';
  var alertEl = document.getElementById('importAlert');
  try {
    var data = await apiFetch('/api/admin/import', { method: 'POST', body: json });
    var s = data.stats;
    alertEl.innerHTML = '<div class="alert alert-ok">✓ ' + data.message
      + ' — ' + s.routinesCreated + ' rutinas, ' + s.exercisesCreated + ' ejercicios, '
      + s.sessionsCreated + ' sesiones, ' + s.setsCreated + ' series importadas</div>';
  } catch(e) {
    alertEl.innerHTML = '<div class="alert alert-err">✗ ' + e.message + '</div>';
  } finally {
    btn.disabled = false; btn.textContent = '⬆ Importar datos';
  }
}

document.getElementById('sqlInput').addEventListener('keydown', e => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); runQuery(); }
});
</script>
`}
</body>
</html>`);
});

// ── API endpoints ─────────────────────────────────────────────────

router.get('/tables', adminAuth, (req, res, next) => {
  try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
    res.json({ tables: tables.map(t => ({ name: t.name, count: db.prepare(`SELECT COUNT(*) as c FROM "${t.name}"`).get().c })) });
  } catch (e) { next(e); }
});

router.get('/users', adminAuth, (req, res, next) => {
  try {
    res.json({ users: db.prepare('SELECT id, username, display_name, created_at FROM users ORDER BY id').all() });
  } catch (e) { next(e); }
});

router.get('/routines', adminAuth, (req, res, next) => {
  try {
    const { user_id } = req.query;
    const routines = user_id
      ? db.prepare('SELECT r.*, (SELECT COUNT(*) FROM exercises WHERE routine_id=r.id) as exercise_count FROM routines r WHERE r.user_id=? ORDER BY r.position').all(user_id)
      : db.prepare('SELECT r.*, u.username, (SELECT COUNT(*) FROM exercises WHERE routine_id=r.id) as exercise_count FROM routines r JOIN users u ON u.id=r.user_id ORDER BY r.user_id, r.position').all();
    res.json({ routines });
  } catch (e) { next(e); }
});

router.post('/query', adminAuth, (req, res, next) => {
  try {
    const { sql } = req.body;
    if (!sql) return res.status(400).json({ error: 'SQL requerido' });
    const forbidden = /^\s*(drop\s+table|drop\s+database|truncate|delete\s+from\s+sqlite_|pragma\s+foreign_keys\s*=)/i;
    if (forbidden.test(sql)) return res.status(400).json({ error: 'Operación no permitida.' });
    const start = Date.now();
    if (/^\s*select\s/i.test(sql)) {
      res.json({ type: 'select', rows: db.prepare(sql).all(), duration: Date.now() - start });
    } else {
      const info = db.prepare(sql).run();
      res.json({ type: 'write', message: `OK — ${info.changes} fila(s) afectada(s)`, changes: info.changes, duration: Date.now() - start });
    }
  } catch (e) { next(e); }
});

router.post('/copy-routine', adminAuth, (req, res, next) => {
  try {
    const { routine_id, target_user_id } = req.body;
    if (!routine_id || !target_user_id) return res.status(400).json({ error: 'routine_id y target_user_id son requeridos' });

    const routine = db.prepare('SELECT * FROM routines WHERE id = ?').get(routine_id);
    if (!routine) return res.status(404).json({ error: 'Rutina no encontrada' });
    const targetUser = db.prepare('SELECT id, username FROM users WHERE id = ?').get(target_user_id);
    if (!targetUser) return res.status(404).json({ error: 'Usuario destino no encontrado' });

    const maxPos = db.prepare('SELECT MAX(position) as m FROM routines WHERE user_id = ?').get(target_user_id).m ?? -1;
    const { lastInsertRowid: newRoutineId } = db.prepare(
      'INSERT INTO routines (user_id, name, description, day_label, position) VALUES (?, ?, ?, ?, ?)'
    ).run(target_user_id, routine.name, routine.description, routine.day_label, maxPos + 1);

    const exercises = db.prepare('SELECT * FROM exercises WHERE routine_id = ? ORDER BY position').all(routine_id);
    const insertEx = db.prepare('INSERT INTO exercises (routine_id, name, rest_seconds, notes, position) VALUES (?, ?, ?, ?, ?)');
    const insertTpl = db.prepare('INSERT INTO exercise_set_templates (exercise_id, set_number, target_weight_kg, target_reps) VALUES (?, ?, ?, ?)');

    let copiedExercises = 0, copiedTemplates = 0;
    for (const ex of exercises) {
      const { lastInsertRowid: newExId } = insertEx.run(newRoutineId, ex.name, ex.rest_seconds, ex.notes, ex.position);
      for (const tpl of db.prepare('SELECT * FROM exercise_set_templates WHERE exercise_id = ? ORDER BY set_number').all(ex.id)) {
        insertTpl.run(newExId, tpl.set_number, tpl.target_weight_kg, tpl.target_reps);
        copiedTemplates++;
      }
      copiedExercises++;
    }

    res.json({
      ok: true,
      message: `Rutina "${routine.name}" copiada a @${targetUser.username}`,
      new_routine_id: newRoutineId,
      copied_exercises: copiedExercises,
      copied_templates: copiedTemplates,
    });
  } catch (e) { next(e); }
});

module.exports = router;

// POST /api/admin/import  — restore a full JSON export
router.post('/import', adminAuth, (req, res, next) => {
  try {
    const data = req.body;
    if (!data?.routines || !data?.sessions) {
      return res.status(400).json({ error: 'JSON inválido. Debe ser un export completo de GymTracker.' });
    }

    let usersCreated = 0, routinesCreated = 0, exercisesCreated = 0, sessionsCreated = 0, setsCreated = 0;

    // Import users (skip if username already exists)
    if (data.user) {
      const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(data.user.username);
      if (!existing) {
        db.prepare('INSERT OR IGNORE INTO users (id, username, password_hash, display_name, created_at) VALUES (?, ?, ?, ?, ?)')
          .run(data.user.id, data.user.username, '$2a$10$placeholder', data.user.display_name, data.user.created_at);
        usersCreated++;
      }
    }

    // Map old IDs → new IDs in case of conflicts
    const routineIdMap = {};
    const exerciseIdMap = {};
    const sessionIdMap = {};

    for (const r of (data.routines || [])) {
      // Check if this routine already exists (same user_id + name)
      const existing = db.prepare('SELECT id FROM routines WHERE user_id = ? AND name = ?').get(r.user_id, r.name);
      if (existing) { routineIdMap[r.id] = existing.id; continue; }

      const maxPos = db.prepare('SELECT MAX(position) as m FROM routines WHERE user_id = ?').get(r.user_id).m ?? -1;
      const { lastInsertRowid: newRId } = db.prepare(
        'INSERT INTO routines (user_id, name, description, day_label, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(r.user_id, r.name, r.description || '', r.day_label || '', maxPos + 1, r.created_at, r.updated_at);
      routineIdMap[r.id] = newRId;
      routinesCreated++;

      for (const ex of (r.exercises || [])) {
        const posRow = db.prepare('SELECT MAX(position) as m FROM exercises WHERE routine_id = ?').get(newRId);
        const exPos = (posRow && posRow.m != null) ? posRow.m + 1 : 0;
        const { lastInsertRowid: newExId } = db.prepare(
          'INSERT INTO exercises (routine_id, name, rest_seconds, notes, position) VALUES (?, ?, ?, ?, ?)'
        ).run(newRId, ex.name, ex.rest_seconds || 90, ex.notes || '', exPos);
        exerciseIdMap[ex.id] = newExId;
        exercisesCreated++;

        for (const tpl of (ex.set_templates || [])) {
          db.prepare('INSERT INTO exercise_set_templates (exercise_id, set_number, target_weight_kg, target_reps) VALUES (?, ?, ?, ?)')
            .run(newExId, tpl.set_number, tpl.target_weight_kg ?? null, tpl.target_reps ?? null);
        }
      }
    }

    for (const s of (data.sessions || [])) {
      const mappedRoutineId = routineIdMap[s.routine_id];
      if (!mappedRoutineId) continue; // skip orphan sessions

      const { lastInsertRowid: newSId } = db.prepare(
        'INSERT INTO workout_sessions (user_id, routine_id, notes, started_at, finished_at) VALUES (?, ?, ?, ?, ?)'
      ).run(s.user_id, mappedRoutineId, s.notes || '', s.started_at, s.finished_at || null);
      sessionIdMap[s.id] = newSId;
      sessionsCreated++;

      for (const set of (s.sets || [])) {
        const mappedExId = exerciseIdMap[set.exercise_id];
        if (!mappedExId) continue;
        db.prepare(
          'INSERT INTO session_sets (session_id, exercise_id, set_number, weight_kg, reps_done, rpe, notes, logged_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).run(newSId, mappedExId, set.set_number, set.weight_kg ?? null, set.reps_done ?? null, set.rpe ?? null, set.notes || '', set.logged_at);
        setsCreated++;
      }
    }

    res.json({
      ok: true,
      message: 'Importación completada',
      stats: { usersCreated, routinesCreated, exercisesCreated, sessionsCreated, setsCreated }
    });
  } catch (e) { next(e); }
});
