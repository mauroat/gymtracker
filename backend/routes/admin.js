const express = require('express');
const router = express.Router();
const { db } = require('../db');

function adminAuth(req, res, next) {
  const key = process.env.ADMIN_KEY;
  if (!key) return res.status(403).json({ error: 'Admin no habilitado. Configurá ADMIN_KEY en Railway.' });
  const provided = req.headers['x-admin-key'] || req.query.key;
  if (provided !== key) return res.status(401).json({ error: 'Clave incorrecta' });
  next();
}

router.get('/', (req, res) => {
  if (!process.env.ADMIN_KEY) {
    return res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Admin</title>
    <style>body{font-family:system-ui;max-width:500px;margin:60px auto;padding:0 20px}
    .box{background:#fff3cd;border:1px solid #ffc107;border-radius:10px;padding:24px}
    code{background:#f1f1f1;padding:2px 6px;border-radius:4px}</style></head><body>
    <h2 style="margin-bottom:16px">Admin deshabilitado</h2>
    <div class="box"><p>Configurá <code>ADMIN_KEY=tu_clave_secreta</code> en Railway Variables y redesplegá.</p></div>
    </body></html>`);
  }

  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>GymTracker Admin</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f5;color:#1c1c1e}
.hdr{background:#1c1c1e;color:#fff;padding:13px 20px;display:flex;align-items:center;gap:10px}
.hdr h1{font-size:1rem;font-weight:600;flex:1}.badge{background:#ff3b30;color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:99px}
.kbar{background:#fff;border-bottom:1px solid #e5e5ea;padding:10px 20px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.kbar input{border:1px solid #e5e5ea;border-radius:8px;padding:7px 12px;font-size:13px;width:210px;outline:none}
.kbar input:focus{border-color:#007aff}
.tabs{background:#fff;border-bottom:1px solid #e5e5ea;display:flex;padding:0 16px;overflow-x:auto}
.tab{padding:11px 16px;font-size:14px;font-weight:500;color:#8e8e93;cursor:pointer;border-bottom:2px solid transparent;white-space:nowrap;transition:all .15s;user-select:none}
.tab:hover{color:#1c1c1e}.tab.active{color:#007aff;border-bottom-color:#007aff;font-weight:600}
.panel{display:none;padding:20px;max-width:980px;margin:0 auto}.panel.active{display:block}
.card{background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,.08);overflow:hidden;margin-bottom:16px}
.ch{padding:13px 18px;border-bottom:1px solid #f2f2f7;font-weight:600;font-size:14px}
.cb{padding:16px 18px}
lbl{font-size:11px;font-weight:700;color:#8e8e93;text-transform:uppercase;letter-spacing:.04em;display:block;margin-bottom:5px}
select,textarea{width:100%;border:1px solid #e5e5ea;border-radius:8px;padding:9px 12px;font-size:14px;font-family:inherit;outline:none;background:#fff;color:#1c1c1e}
select:focus,textarea:focus{border-color:#007aff;box-shadow:0 0 0 3px rgba(0,122,255,.1)}
textarea{font-family:'SF Mono','Fira Code',monospace;font-size:13px;resize:vertical;min-height:88px}
.btn{padding:9px 16px;border-radius:8px;border:none;font-size:13px;font-weight:600;cursor:pointer;transition:opacity .15s}
.btn:active{opacity:.75}.btn-p{background:#007aff;color:#fff}.btn-g{background:#34c759;color:#fff}.btn-s{background:#f2f2f7;color:#1c1c1e}
.btn-sm{padding:6px 12px;font-size:12px}
.tw{overflow-x:auto;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.06)}
table{width:100%;border-collapse:collapse;font-size:13px;background:#fff}
th{background:#f2f2f7;padding:9px 14px;text-align:left;font-size:11px;font-weight:700;color:#8e8e93;text-transform:uppercase;letter-spacing:.04em;border-bottom:1px solid #e5e5ea;white-space:nowrap}
td{padding:9px 14px;border-bottom:1px solid #f2f2f7;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
tr:last-child td{border-bottom:none}tr:hover td{background:#f9f9fb}
.nv{color:#c7c7cc;font-style:italic;font-size:11px}
.al{padding:11px 15px;border-radius:8px;font-size:13px;font-weight:500;margin-bottom:12px}
.al-ok{background:#d1f5e0;color:#1a7a3c}.al-err{background:#ffd5d5;color:#c0392b}.al-inf{background:#e8f0ff;color:#1246ac}
.arow{display:flex;align-items:flex-start;gap:10px}
.ari{font-size:1.5rem;padding-top:26px;color:#8e8e93;flex-shrink:0}
.rlist{display:flex;flex-direction:column;gap:6px;margin-top:8px;max-height:250px;overflow-y:auto}
.rchip{padding:10px 14px;border-radius:8px;border:2px solid #e5e5ea;cursor:pointer;font-size:13px;font-weight:500;display:flex;justify-content:space-between;align-items:center;transition:all .15s}
.rchip:hover{border-color:#007aff;background:#e8f0ff}.rchip.sel{border-color:#007aff;background:#e8f0ff;color:#007aff}
.cmeta{font-size:11px;color:#8e8e93;font-weight:400;margin-top:2px}
.emp{text-align:center;padding:24px;color:#8e8e93;font-size:13px}
.rmeta{font-size:12px;color:#8e8e93;margin-bottom:10px}.rmeta .cnt{color:#34c759;font-weight:700}
.fi{padding:8px;font-size:13px;border-radius:8px;border:1px solid #e5e5ea;width:100%;background:#fff}
</style>
</head>
<body>
<div class="hdr"><span>🏋️</span><h1>GymTracker Admin</h1><span class="badge">ADMIN</span></div>
<div class="kbar">
  <input type="password" id="akey" placeholder="Admin Key..." autocomplete="off" />
  <button class="btn btn-p btn-sm" onclick="connect()">Conectar</button>
  <span id="cst" style="font-size:12px"></span>
</div>
<div class="tabs">
  <div class="tab active" onclick="sw('copy')">📋 Copiar rutinas</div>
  <div class="tab" onclick="sw('users')">👤 Usuarios</div>
  <div class="tab" onclick="sw('import')">⬆ Importar</div>
  <div class="tab" onclick="sw('sql')">🔧 SQL</div>
</div>

<!-- COPY -->
<div id="tab-copy" class="panel active">
  <div id="calert"></div>
  <div class="card">
    <div class="ch">📋 Copiar rutina de un usuario a otro</div>
    <div class="cb">
      <div class="arow">
        <div style="flex:1">
          <div style="margin-bottom:10px"><lbl>Usuario origen</lbl>
            <select id="src" onchange="loadSrc()"><option value="">— Seleccioná —</option></select></div>
          <div id="rlist" class="rlist" style="display:none"></div>
        </div>
        <div class="ari">→</div>
        <div style="flex:1"><lbl>Usuario destino</lbl>
          <select id="dst" onchange="onDst()"><option value="">— Seleccioná —</option></select>
          <div id="cprev" style="margin-top:10px;display:none"></div>
        </div>
      </div>
      <div style="margin-top:16px;display:flex;gap:10px;align-items:center">
        <button class="btn btn-g" onclick="doCP()" id="cpbtn" disabled>✓ Copiar</button>
        <span id="cpst" style="font-size:13px;color:#8e8e93"></span>
      </div>
    </div>
  </div>
</div>

<!-- USERS -->
<div id="tab-users" class="panel">
  <div class="card"><div class="ch">👤 Usuarios</div>
    <div class="cb"><button class="btn btn-s btn-sm" onclick="loadUT()" style="margin-bottom:12px">↻ Actualizar</button>
      <div id="utbl"></div></div></div>
  <div class="card"><div class="ch">📋 Rutinas</div>
    <div class="cb">
      <div style="display:flex;gap:8px;margin-bottom:12px;align-items:flex-end">
        <div style="flex:1"><lbl>Filtrar</lbl><select id="rfilt" onchange="loadRT()"><option value="">Todos</option></select></div>
        <button class="btn btn-s btn-sm" onclick="loadRT()">Ver</button>
      </div>
      <div id="rtbl"></div></div></div>
</div>

<!-- IMPORT -->
<div id="tab-import" class="panel">
  <div id="ialert"></div>
  <div class="card">
    <div class="ch">⬆ Restaurar datos desde JSON export</div>
    <div class="cb">
      <p style="font-size:13px;color:#8e8e93;margin-bottom:16px">
        Subí un archivo JSON exportado desde la app (Stats → Exportar → JSON completo).
        Los datos se importan sin pisar lo que ya existe.
      </p>
      <div style="margin-bottom:14px"><lbl>Archivo JSON de backup</lbl>
        <input type="file" id="ifile" accept=".json" class="fi" /></div>
      <div id="iprev" style="display:none;margin-bottom:14px"></div>
      <button class="btn btn-g" onclick="doImp()" id="ibtn" disabled>⬆ Importar datos</button>
    </div>
  </div>
</div>

<!-- SQL -->
<div id="tab-sql" class="panel">
  <div class="card"><div class="ch">🗂️ Tablas</div>
    <div class="cb"><div id="tgrid" style="display:flex;flex-wrap:wrap;gap:8px"></div></div></div>
  <div class="card">
    <div class="ch">🔧 SQL <span style="font-size:11px;color:#8e8e93;font-weight:400;margin-left:6px">Ctrl+Enter para ejecutar</span></div>
    <div class="cb">
      <div style="margin-bottom:8px"><textarea id="sqin" placeholder="SELECT * FROM users LIMIT 10;" spellcheck="false"></textarea></div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-p btn-sm" onclick="runQ()">▶ Ejecutar</button>
        <button class="btn btn-s btn-sm" onclick="document.getElementById('sqin').value=''">Limpiar</button>
      </div>
      <div id="sqres" style="margin-top:16px"></div>
    </div>
  </div>
</div>

<script>
var AU=[], selR=null;
function K(){return document.getElementById('akey').value;}
async function AF(p,o){
  o=o||{};
  var r=await fetch(p,Object.assign({},o,{headers:Object.assign({'x-admin-key':K(),'Content-Type':'application/json'},o.headers||{})}));
  var d=await r.json(); if(!r.ok) throw new Error(d.error||'Error '+r.status); return d;
}
function sw(n){
  var ns=['copy','users','import','sql'];
  document.querySelectorAll('.tab').forEach(function(t,i){t.classList.toggle('active',ns[i]===n);});
  document.querySelectorAll('.panel').forEach(function(p){p.classList.remove('active');});
  var el=document.getElementById('tab-'+n); if(el) el.classList.add('active');
}
async function connect(){
  var s=document.getElementById('cst'); s.textContent='Conectando...'; s.style.color='#8e8e93';
  try{
    var d=await AF('/api/admin/users'); AU=d.users; fillSel(); loadTG();
    s.textContent='✓ Conectado — '+AU.length+' usuario(s)'; s.style.color='#34c759';
  }catch(e){s.textContent='✗ '+e.message; s.style.color='#ff3b30';}
}
function fillSel(){
  var o=AU.map(function(u){return '<option value="'+u.id+'">'+u.username+(u.display_name?' — '+u.display_name:'')+'</option>';}).join('');
  ['src','dst','rfilt'].forEach(function(id){
    var el=document.getElementById(id); if(!el) return;
    var pv=el.value;
    el.innerHTML=(id==='rfilt'?'<option value="">Todos</option>':'<option value="">— Seleccioná —</option>')+o;
    if(pv) el.value=pv;
  });
}
async function loadSrc(){
  var uid=document.getElementById('src').value; selR=null;
  document.getElementById('cprev').style.display='none';
  document.getElementById('cpbtn').disabled=true;
  var li=document.getElementById('rlist');
  if(!uid){li.style.display='none';return;}
  try{
    var d=await AF('/api/admin/routines?user_id='+uid);
    if(!d.routines.length){li.style.display='block';li.innerHTML='<div class="emp">Sin rutinas</div>';return;}
    li.style.display='block';
    li.innerHTML=d.routines.map(function(r){
      return '<div class="rchip" id="rc-'+r.id+'" onclick="selRt('+r.id+',\''+r.name.replace(/'/g,"\\'")+'\','+r.exercise_count+')">'
        +'<div><div>'+r.name+'</div><div class="cmeta">'+(r.day_label||'')+(r.day_label?' · ':'')+r.exercise_count+' ejercicios</div></div>'
        +'<span style="color:#c7c7cc">○</span></div>';
    }).join('');
  }catch(e){li.style.display='block';li.innerHTML='<div class="emp" style="color:#ff3b30">'+e.message+'</div>';}
}
function selRt(id,n,c){
  selR=id;
  document.querySelectorAll('.rchip').forEach(function(el){el.classList.remove('sel');el.querySelector('span').textContent='○';});
  var ch=document.getElementById('rc-'+id); if(ch){ch.classList.add('sel');ch.querySelector('span').textContent='●';}
  updPrev(); document.getElementById('cpbtn').disabled=!document.getElementById('dst').value;
}
function onDst(){updPrev(); document.getElementById('cpbtn').disabled=!selR||!document.getElementById('dst').value;}
function updPrev(){
  var did=document.getElementById('dst').value; var el=document.getElementById('cprev');
  if(!selR||!did){el.style.display='none';return;}
  var u=AU.find(function(x){return String(x.id)===String(did);});
  el.style.display='block'; el.innerHTML='<div class="al al-inf">Se copiará la rutina a <strong>@'+(u?u.username:did)+'</strong></div>';
}
async function doCP(){
  var did=document.getElementById('dst').value; if(!selR||!did) return;
  var btn=document.getElementById('cpbtn'); btn.disabled=true; btn.textContent='Copiando...';
  try{
    var d=await AF('/api/admin/copy-routine',{method:'POST',body:JSON.stringify({routine_id:selR,target_user_id:parseInt(did)})});
    document.getElementById('calert').innerHTML='<div class="al al-ok">✓ '+d.message+' — '+d.copied_exercises+' ejercicios, '+d.copied_templates+' series</div>';
    selR=null; document.querySelectorAll('.rchip').forEach(function(el){el.classList.remove('sel');el.querySelector('span').textContent='○';});
    document.getElementById('cprev').style.display='none';
  }catch(e){document.getElementById('calert').innerHTML='<div class="al al-err">✗ '+e.message+'</div>';}
  finally{btn.disabled=false; btn.textContent='✓ Copiar';}
}
async function loadUT(){
  try{var d=await AF('/api/admin/users'); document.getElementById('utbl').innerHTML=RT(d.users);}
  catch(e){document.getElementById('utbl').innerHTML='<div class="al al-err">'+e.message+'</div>';}
}
async function loadRT(){
  var uid=document.getElementById('rfilt').value;
  try{var d=await AF('/api/admin/routines'+(uid?'?user_id='+uid:'')); document.getElementById('rtbl').innerHTML=RT(d.routines);}
  catch(e){document.getElementById('rtbl').innerHTML='<div class="al al-err">'+e.message+'</div>';}
}
// Import tab
document.addEventListener('DOMContentLoaded',function(){
  var fi=document.getElementById('ifile');
  if(!fi) return;
  fi.addEventListener('change',async function(e){
    var f=e.target.files[0]; if(!f) return;
    var pv=document.getElementById('iprev'), bn=document.getElementById('ibtn');
    try{
      var tx=await f.text(); var dt=JSON.parse(tx);
      pv.style.display='block';
      pv.innerHTML='<div class="al al-inf"><strong>Listo para importar:</strong><br>'
        +'👤 Usuario: <strong>'+((dt.user&&dt.user.username)||'?')+'</strong> &nbsp;|&nbsp; '
        +'📋 Rutinas: <strong>'+((dt.routines&&dt.routines.length)||0)+'</strong> &nbsp;|&nbsp; '
        +'📅 Sesiones: <strong>'+((dt.sessions&&dt.sessions.length)||0)+'</strong></div>';
      bn.disabled=false; bn.dataset.json=tx;
    }catch(er){
      pv.style.display='block'; pv.innerHTML='<div class="al al-err">✗ JSON inválido: '+er.message+'</div>';
      bn.disabled=true;
    }
  });
});
async function doImp(){
  var btn=document.getElementById('ibtn'), json=btn.dataset.json;
  if(!json) return;
  btn.disabled=true; btn.textContent='Importando...';
  var al=document.getElementById('ialert');
  try{
    var d=await AF('/api/admin/import',{method:'POST',body:json}); var s=d.stats;
    al.innerHTML='<div class="al al-ok">✓ '+d.message+'<br>'+s.routinesCreated+' rutinas · '+s.exercisesCreated+' ejercicios · '+s.sessionsCreated+' sesiones · '+s.setsCreated+' series</div>';
    btn.textContent='✓ Importado';
  }catch(e){
    al.innerHTML='<div class="al al-err">✗ '+e.message+'</div>';
    btn.disabled=false; btn.textContent='⬆ Importar datos';
  }
}
async function loadTG(){
  try{
    var d=await AF('/api/admin/tables');
    var ic={users:'👤',routines:'📋',exercises:'💪',exercise_set_templates:'🔢',workout_sessions:'📅',session_sets:'📊'};
    document.getElementById('tgrid').innerHTML=d.tables.map(function(t){
      return '<div onclick="qs(\''+t.name+'\')" style="background:#f2f2f7;border-radius:8px;padding:8px 14px;cursor:pointer;font-size:13px;font-weight:500;display:inline-flex;align-items:center;gap:6px" onmouseover="this.style.background=\'#e5e5ea\'" onmouseout="this.style.background=\'#f2f2f7\'">'
        +(ic[t.name]||'🗂️')+' '+t.name+' <span style="color:#8e8e93;font-size:11px">'+t.count+'</span></div>';
    }).join('');
  }catch(e){}
}
function qs(n){document.getElementById('sqin').value='SELECT * FROM '+n+' LIMIT 50;'; sw('sql');}
async function runQ(){
  var sql=document.getElementById('sqin').value.trim(); if(!sql) return;
  var el=document.getElementById('sqres'); el.innerHTML='<div style="color:#8e8e93;font-size:13px">Ejecutando...</div>';
  try{
    var d=await AF('/api/admin/query',{method:'POST',body:JSON.stringify({sql:sql})});
    if(d.type==='select'){
      el.innerHTML='<div class="rmeta"><span class="cnt">'+d.rows.length+'</span> filas · '+d.duration+'ms</div>'+(d.rows.length?RT(d.rows):'<div class="emp">Sin resultados</div>');
    }else{el.innerHTML='<div class="al al-ok">✓ '+d.message+' · '+d.duration+'ms</div>';}
  }catch(e){el.innerHTML='<div class="al al-err">✗ '+e.message+'</div>';}
}
function RT(rows){
  if(!rows||!rows.length) return '<div class="emp">Sin datos</div>';
  var c=Object.keys(rows[0]);
  return '<div class="tw"><table><thead><tr>'+c.map(function(x){return '<th>'+x+'</th>';}).join('')+'</tr></thead><tbody>'
    +rows.map(function(r){return '<tr>'+c.map(function(k){return r[k]===null?'<td><span class="nv">null</span></td>':'<td title="'+String(r[k]).replace(/"/g,'&quot;')+'">'+String(r[k]).replace(/</g,'&lt;')+'</td>';}).join('')+'</tr>';}).join('')
    +'</tbody></table></div>';
}
document.getElementById('sqin').addEventListener('keydown',function(e){if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();runQ();}});
</script>
</body>
</html>`);
});

// ── API ───────────────────────────────────────────────────────────
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
    if (/^\s*(drop\s+table|drop\s+database|truncate|delete\s+from\s+sqlite_|pragma\s+foreign_keys\s*=)/i.test(sql))
      return res.status(400).json({ error: 'Operación no permitida.' });
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
    const { lastInsertRowid: newRId } = db.prepare(
      'INSERT INTO routines (user_id, name, description, day_label, position) VALUES (?, ?, ?, ?, ?)'
    ).run(target_user_id, routine.name, routine.description, routine.day_label, maxPos + 1);
    const insertEx = db.prepare('INSERT INTO exercises (routine_id, name, rest_seconds, notes, position) VALUES (?, ?, ?, ?, ?)');
    const insertTpl = db.prepare('INSERT INTO exercise_set_templates (exercise_id, set_number, target_weight_kg, target_reps) VALUES (?, ?, ?, ?)');
    let ce = 0, ct = 0;
    for (const ex of db.prepare('SELECT * FROM exercises WHERE routine_id = ? ORDER BY position').all(routine_id)) {
      const { lastInsertRowid: newExId } = insertEx.run(newRId, ex.name, ex.rest_seconds, ex.notes, ex.position);
      for (const tpl of db.prepare('SELECT * FROM exercise_set_templates WHERE exercise_id = ? ORDER BY set_number').all(ex.id)) {
        insertTpl.run(newExId, tpl.set_number, tpl.target_weight_kg, tpl.target_reps); ct++;
      }
      ce++;
    }
    res.json({ ok: true, message: `Rutina "${routine.name}" copiada a @${targetUser.username}`, new_routine_id: newRId, copied_exercises: ce, copied_templates: ct });
  } catch (e) { next(e); }
});

router.post('/import', adminAuth, (req, res, next) => {
  try {
    const data = req.body;
    if (!data || !data.routines) return res.status(400).json({ error: 'JSON inválido.' });
    let usersCreated = 0, routinesCreated = 0, exercisesCreated = 0, sessionsCreated = 0, setsCreated = 0;
    const routineIdMap = {}, exerciseIdMap = {};
    if (data.user) {
      const ex = db.prepare('SELECT id FROM users WHERE username = ?').get(data.user.username);
      if (!ex) {
        db.prepare('INSERT OR IGNORE INTO users (id, username, password_hash, display_name, created_at) VALUES (?, ?, ?, ?, ?)')
          .run(data.user.id, data.user.username, '$2a$10$placeholder', data.user.display_name, data.user.created_at);
        usersCreated++;
      }
    }
    for (const r of (data.routines || [])) {
      const ex = db.prepare('SELECT id FROM routines WHERE user_id = ? AND name = ?').get(r.user_id, r.name);
      if (ex) { routineIdMap[r.id] = ex.id; continue; }
      const maxPos = db.prepare('SELECT MAX(position) as m FROM routines WHERE user_id = ?').get(r.user_id).m ?? -1;
      const { lastInsertRowid: nRId } = db.prepare(
        'INSERT INTO routines (user_id, name, description, day_label, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(r.user_id, r.name, r.description || '', r.day_label || '', maxPos + 1, r.created_at, r.updated_at);
      routineIdMap[r.id] = nRId; routinesCreated++;
      for (const e of (r.exercises || [])) {
        const pr = db.prepare('SELECT MAX(position) as m FROM exercises WHERE routine_id = ?').get(nRId);
        const { lastInsertRowid: nEId } = db.prepare(
          'INSERT INTO exercises (routine_id, name, rest_seconds, notes, position) VALUES (?, ?, ?, ?, ?)'
        ).run(nRId, e.name, e.rest_seconds || 90, e.notes || '', (pr && pr.m != null ? pr.m + 1 : 0));
        exerciseIdMap[e.id] = nEId; exercisesCreated++;
        for (const t of (e.set_templates || [])) {
          db.prepare('INSERT INTO exercise_set_templates (exercise_id, set_number, target_weight_kg, target_reps) VALUES (?, ?, ?, ?)')
            .run(nEId, t.set_number, t.target_weight_kg ?? null, t.target_reps ?? null);
        }
      }
    }
    for (const s of (data.sessions || [])) {
      const mRId = routineIdMap[s.routine_id]; if (!mRId) continue;
      const { lastInsertRowid: nSId } = db.prepare(
        'INSERT INTO workout_sessions (user_id, routine_id, notes, started_at, finished_at) VALUES (?, ?, ?, ?, ?)'
      ).run(s.user_id, mRId, s.notes || '', s.started_at, s.finished_at || null);
      sessionsCreated++;
      for (const st of (s.sets || [])) {
        const mEId = exerciseIdMap[st.exercise_id]; if (!mEId) continue;
        db.prepare('INSERT INTO session_sets (session_id, exercise_id, set_number, weight_kg, reps_done, rpe, notes, logged_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
          .run(nSId, mEId, st.set_number, st.weight_kg ?? null, st.reps_done ?? null, st.rpe ?? null, st.notes || '', st.logged_at);
        setsCreated++;
      }
    }
    res.json({ ok: true, message: 'Importación completada', stats: { usersCreated, routinesCreated, exercisesCreated, sessionsCreated, setsCreated } });
  } catch (e) { next(e); }
});

module.exports = router;
