<template>
  <div class="page fade-in">
    <div class="page-header"><h2 class="title-1">Estadísticas</h2></div>

    <!-- PRs -->
    <div class="section-header">Records personales</div>
    <div v-if="prs.length === 0" class="empty-state" style="padding:24px 0"><div class="icon">🏆</div><div>Sin datos aún</div></div>
    <div v-else class="pr-grid">
      <div v-for="pr in prs" :key="pr.exercise_id" class="pr-card">
        <div class="pr-weight">{{ pr.pr_weight }}<span class="pr-unit">kg</span></div>
        <div class="pr-name truncate">{{ pr.exercise_name }}</div>
        <div class="caption truncate">{{ pr.routine_name }}</div>
      </div>
    </div>

    <!-- Weekly volume -->
    <div class="section-header" style="margin-top:8px">Volumen semanal</div>
    <div class="chart-card">
      <canvas ref="volCanvas" height="180"></canvas>
    </div>

    <!-- Exercise progress -->
    <div class="section-header" style="margin-top:8px">Progresión</div>
    <div class="field-group" style="margin-bottom:12px">
      <select v-model="selExId" @change="loadExChart">
        <option value="">— Seleccioná un ejercicio —</option>
        <optgroup v-for="r in routines" :key="r.id" :label="r.name">
          <option v-for="ex in r.exercises" :key="ex.id" :value="ex.id">{{ ex.name }}</option>
        </optgroup>
      </select>
    </div>
    <div v-if="selExId" class="chart-card">
      <div v-if="exData.length === 0" class="empty-state" style="padding:24px"><div>Sin datos para este ejercicio</div></div>
      <canvas v-else ref="progCanvas" height="180"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { api } from '../composables/api'
import { Chart, LineController, BarController, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler } from 'chart.js'
Chart.register(LineController, BarController, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler)

const prs = ref([]); const routines = ref([]); const weeklyData = ref([])
const exData = ref([]); const selExId = ref(''); const volCanvas = ref(null); const progCanvas = ref(null)
let volChart = null; let progChart = null

const isDark = () => document.documentElement.getAttribute('data-theme') === 'dark'
const gridColor = () => isDark() ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
const tickColor = () => isDark() ? '#8e8e93' : '#8e8e93'
const tooltipOpts = () => ({ backgroundColor: isDark()?'#1c1c1e':'#ffffff', borderColor: isDark()?'#3a3a3c':'#e5e5ea', borderWidth:1, titleColor: isDark()?'#fff':'#1c1c1e', bodyColor: '#8e8e93', padding:10, cornerRadius:8 })

const fmtDate = d => d ? new Date(d+(d.includes('Z')?'':'Z')).toLocaleDateString('es-AR',{day:'numeric',month:'short'}) : ''

const buildVolChart = () => {
  if (!volCanvas.value || !weeklyData.value.length) return
  if (volChart) volChart.destroy()
  volChart = new Chart(volCanvas.value, {
    type:'bar',
    data:{ labels: weeklyData.value.map(w=>w.week), datasets:[{ label:'Volumen', data: weeklyData.value.map(w=>Math.round(w.total_volume||0)), backgroundColor: 'rgba(0,122,255,0.2)', borderColor:'#007aff', borderWidth:1, borderRadius:4 }] },
    options:{ responsive:true, plugins:{ legend:{display:false}, tooltip: tooltipOpts() }, scales:{ x:{ticks:{color:tickColor(),font:{size:11}},grid:{color:gridColor()}}, y:{ticks:{color:tickColor(),font:{size:11}},grid:{color:gridColor()}} } }
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
        { label:'Peso máx (kg)', data: exData.value.map(d=>d.max_weight), borderColor:'#007aff', backgroundColor:'rgba(0,122,255,0.08)', pointBackgroundColor:'#007aff', pointRadius:4, tension:0.3, fill:true, yAxisID:'y' },
        { label:'Volumen', data: exData.value.map(d=>Math.round(d.total_volume||0)), borderColor:'#34c759', backgroundColor:'transparent', pointBackgroundColor:'#34c759', pointRadius:3, tension:0.3, fill:false, yAxisID:'y2' }
      ] },
    options:{ responsive:true, interaction:{mode:'index',intersect:false}, plugins:{ legend:{labels:{color:tickColor(),font:{size:11}}}, tooltip:tooltipOpts() },
      scales:{ x:{ticks:{color:tickColor(),font:{size:11}},grid:{color:gridColor()}}, y:{ticks:{color:'#007aff',font:{size:11}},grid:{color:gridColor()},title:{display:true,text:'kg',color:'#007aff',font:{size:10}}}, y2:{position:'right',ticks:{color:'#34c759',font:{size:11}},grid:{drawOnChartArea:false},title:{display:true,text:'Vol',color:'#34c759',font:{size:10}}} } }
  })
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
</style>
