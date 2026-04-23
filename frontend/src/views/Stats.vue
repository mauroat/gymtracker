<template>
  <div class="page fade-in">
    <div class="page-header">
      <div class="flex justify-between items-center">
        <h2 class="title-1">Estadísticas</h2>
        <div class="flex gap-2">
          <button class="btn btn-filled btn-sm" @click="showExport = true">⬇ Exportar</button>
        </div>
      </div>
    </div>

    <!-- PRs -->
    <div class="section-header">Records personales</div>
    <div v-if="prs.length === 0" class="empty-state" style="padding:24px 0">
      <div class="icon">🏆</div><div>Sin datos aún — completá sesiones para ver tus PRs</div>
    </div>
    <div v-else class="pr-grid">
      <div v-for="pr in prs" :key="pr.exercise_id" class="pr-card">
        <div class="pr-weight">{{ pr.pr_weight }}<span class="pr-unit">kg</span></div>
        <div class="pr-name truncate">{{ pr.exercise_name }}</div>
        <div class="caption truncate">{{ pr.routine_name }}</div>
      </div>
    </div>

    <!-- Weekly volume -->
    <div class="section-header" style="margin-top:8px">Volumen semanal (kg × reps)</div>
    <div class="chart-card">
      <div v-if="!weeklyData.length" class="empty-state" style="padding:20px"><div>Sin datos aún</div></div>
      <canvas v-else ref="volCanvas" height="180"></canvas>
    </div>

    <!-- Exercise progress -->
    <div class="section-header" style="margin-top:8px">Progresión por ejercicio</div>
    <div class="field-group" style="margin-bottom:12px">
      <select v-model="selExId" @change="loadExChart">
        <option value="">— Seleccioná un ejercicio —</option>
        <optgroup v-for="r in routines" :key="r.id" :label="r.name">
          <option v-for="ex in r.exercises" :key="ex.id" :value="ex.id">{{ ex.name }}</option>
        </optgroup>
      </select>
    </div>
    <div v-if="selExId" class="chart-card">
      <div v-if="exData.length === 0" class="empty-state" style="padding:24px">
        <div>Sin datos para este ejercicio aún</div>
      </div>
      <canvas v-else ref="progCanvas" height="180"></canvas>
    </div>

    <!-- Export modal -->
    <div v-if="showExport" class="modal-backdrop" @click.self="showExport = false">
      <div class="modal">
        <div class="modal-handle"></div>
        <div class="modal-title">Exportar datos</div>

        <div class="export-options">
          <div class="export-card" @click="doExport('json')">
            <div class="export-icon">{ }</div>
            <div>
              <div class="export-title">JSON completo</div>
              <div class="caption">Rutinas, sesiones, series y PRs. Ideal para backup o migración.</div>
            </div>
            <div class="export-arrow">›</div>
          </div>

          <div class="export-card" @click="doExport('csv-sessions')">
            <div class="export-icon">📊</div>
            <div>
              <div class="export-title">CSV — Historial de sesiones</div>
              <div class="caption">Una fila por sesión con fecha, rutina y duración.</div>
            </div>
            <div class="export-arrow">›</div>
          </div>

          <div class="export-card" @click="doExport('csv-sets')">
            <div class="export-icon">📋</div>
            <div>
              <div class="export-title">CSV — Log de series</div>
              <div class="caption">Cada serie registrada: ejercicio, peso, reps, RPE y fecha.</div>
            </div>
            <div class="export-arrow">›</div>
          </div>

          <div class="export-card" @click="doExport('csv-prs')">
            <div class="export-icon">🏆</div>
            <div>
              <div class="export-title">CSV — Records personales</div>
              <div class="caption">PR por ejercicio con fecha de logro.</div>
            </div>
            <div class="export-arrow">›</div>
          </div>
        </div>

        <div v-if="exportLoading" class="export-loading">
          <div class="caption" style="text-align:center;padding:16px">Preparando exportación…</div>
        </div>

        <button class="btn btn-filled btn-wide mt-3" @click="showExport = false">Cerrar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { api } from '../composables/api'
import {
  Chart, LineController, BarController, CategoryScale, LinearScale,
  PointElement, LineElement, BarElement, Tooltip, Legend, Filler
} from 'chart.js'

Chart.register(LineController, BarController, CategoryScale, LinearScale,
  PointElement, LineElement, BarElement, Tooltip, Legend, Filler)

const prs = ref([]); const routines = ref([]); const weeklyData = ref([])
const exData = ref([]); const selExId = ref(''); const volCanvas = ref(null); const progCanvas = ref(null)
const showExport = ref(false); const exportLoading = ref(false)
let volChart = null; let progChart = null

const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark'
const tickColor = () => isDark() ? '#8e8e93' : '#8e8e93'
const gridColor = () => isDark() ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
const tooltipOpts = () => ({
  backgroundColor: isDark()?'#1c1c1e':'#ffffff', borderColor: isDark()?'#3a3a3c':'#e5e5ea',
  borderWidth:1, titleColor: isDark()?'#fff':'#1c1c1e', bodyColor:'#8e8e93', padding:10, cornerRadius:8
})
const fmtDate = d => d ? new Date(d+(d.includes('Z')?'':'Z')).toLocaleDateString('es-AR',{day:'numeric',month:'short'}) : ''

const buildVolChart = () => {
  if (!volCanvas.value || !weeklyData.value.length) return
  if (volChart) volChart.destroy()
  volChart = new Chart(volCanvas.value, {
    type:'bar',
    data:{ labels: weeklyData.value.map(w=>w.week),
      datasets:[{ label:'Volumen', data: weeklyData.value.map(w=>Math.round(w.total_volume||0)),
        backgroundColor:'rgba(0,122,255,0.2)', borderColor:'#007aff', borderWidth:1, borderRadius:4 }] },
    options:{ responsive:true, plugins:{ legend:{display:false}, tooltip:tooltipOpts() },
      scales:{ x:{ticks:{color:tickColor(),font:{size:11}},grid:{color:gridColor()}},
               y:{ticks:{color:tickColor(),font:{size:11}},grid:{color:gridColor()}} } }
  })
}

const loadExChart = async () => {
  if (!selExId.value) return
  exData.value = await api.getExerciseProgress(selExId.value)
  await nextTick(); buildProgChart()
}

const buildProgChart = () => {
  if (!progCanvas.value || !exData.value.length) return
  if (progChart) progChart.destroy()
  progChart = new Chart(progCanvas.value, {
    type:'line',
    data:{ labels: exData.value.map(d=>fmtDate(d.session_date)),
      datasets:[
        { label:'Peso máx (kg)', data: exData.value.map(d=>d.max_weight),
          borderColor:'#007aff', backgroundColor:'rgba(0,122,255,0.08)',
          pointBackgroundColor:'#007aff', pointRadius:4, tension:0.3, fill:true, yAxisID:'y' },
        { label:'Volumen', data: exData.value.map(d=>Math.round(d.total_volume||0)),
          borderColor:'#34c759', backgroundColor:'transparent',
          pointBackgroundColor:'#34c759', pointRadius:3, tension:0.3, fill:false, yAxisID:'y2' }
      ] },
    options:{ responsive:true, interaction:{mode:'index',intersect:false},
      plugins:{ legend:{labels:{color:tickColor(),font:{size:11}}}, tooltip:tooltipOpts() },
      scales:{
        x:{ticks:{color:tickColor(),font:{size:11}},grid:{color:gridColor()}},
        y:{ticks:{color:'#007aff',font:{size:11}},grid:{color:gridColor()},title:{display:true,text:'kg',color:'#007aff',font:{size:10}}},
        y2:{position:'right',ticks:{color:'#34c759',font:{size:11}},grid:{drawOnChartArea:false},title:{display:true,text:'Vol',color:'#34c759',font:{size:10}}}
      } }
  })
}

// ── Export helpers ──────────────────────────────────────────────────
function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function toCSV(rows, headers) {
  const escape = v => {
    if (v == null) return ''
    const s = String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n')
}

const doExport = async (format) => {
  exportLoading.value = true
  try {
    const data = await api.exportData()
    const ts = new Date().toISOString().slice(0,10)

    if (format === 'json') {
      downloadFile(JSON.stringify(data, null, 2), `gymtracker-export-${ts}.json`, 'application/json')

    } else if (format === 'csv-sessions') {
      const rows = data.sessions.map(s => ({
        id: s.id,
        rutina: s.routine_name,
        fecha_inicio: s.started_at,
        fecha_fin: s.finished_at || '',
        duracion_min: s.finished_at
          ? Math.round((new Date(s.finished_at) - new Date(s.started_at)) / 60000)
          : '',
        series_registradas: s.sets.length,
      }))
      downloadFile(toCSV(rows, ['id','rutina','fecha_inicio','fecha_fin','duracion_min','series_registradas']),
        `gymtracker-sesiones-${ts}.csv`, 'text/csv')

    } else if (format === 'csv-sets') {
      const rows = []
      for (const s of data.sessions) {
        for (const set of s.sets) {
          rows.push({
            sesion_id: s.id,
            rutina: s.routine_name,
            fecha: s.started_at,
            ejercicio: set.exercise_name,
            serie: set.set_number,
            peso_kg: set.weight_kg ?? '',
            reps: set.reps_done ?? '',
            rpe: set.rpe ?? '',
          })
        }
      }
      downloadFile(toCSV(rows, ['sesion_id','rutina','fecha','ejercicio','serie','peso_kg','reps','rpe']),
        `gymtracker-series-${ts}.csv`, 'text/csv')

    } else if (format === 'csv-prs') {
      downloadFile(
        toCSV(data.personal_records, ['exercise_name','routine_name','pr_weight','achieved_at']),
        `gymtracker-prs-${ts}.csv`, 'text/csv'
      )
    }

    showExport.value = false
  } finally {
    exportLoading.value = false
  }
}

onMounted(async () => {
  const [p, r, w] = await Promise.all([api.getPRs(), api.getRoutines(), api.getWeeklyVolume()])
  prs.value = p; weeklyData.value = w
  routines.value = await Promise.all(r.map(rt => api.getRoutine(rt.id)))
  await nextTick(); buildVolChart()
})
</script>

<style scoped>
.pr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; margin-bottom: 4px; }
.pr-card { background: var(--bg2); border-radius: var(--radius-lg); padding: 14px 12px; box-shadow: var(--shadow-sm); }
.pr-weight { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.03em; color: var(--accent); line-height: 1; margin-bottom: 4px; }
.pr-unit { font-size: 1rem; font-weight: 500; color: var(--text3); margin-left: 2px; }
.pr-name { font-size: 0.8125rem; font-weight: 600; margin-bottom: 2px; }
.chart-card { background: var(--bg2); border-radius: var(--radius-lg); padding: 16px; box-shadow: var(--shadow-sm); }

/* Export */
.export-options { display: flex; flex-direction: column; gap: 8px; }
.export-card {
  display: flex; align-items: center; gap: 12px;
  background: var(--bg3); border-radius: var(--radius-sm); padding: 14px;
  cursor: pointer; -webkit-tap-highlight-color: transparent; transition: opacity 0.1s;
}
.export-card:active { opacity: 0.7; }
.export-icon { font-size: 1.5rem; width: 36px; text-align: center; flex-shrink: 0; }
.export-card > div:nth-child(2) { flex: 1; min-width: 0; }
.export-title { font-size: 0.9375rem; font-weight: 600; margin-bottom: 2px; }
.export-arrow { color: var(--text4); font-size: 1.2rem; flex-shrink: 0; }
</style>
