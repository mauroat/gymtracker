<template>
  <div class="page fade-in">
    <div class="page-header">
      <h2>Estadísticas</h2>
      <p class="text-muted text-sm">Progresión de pesos, volumen y PRs</p>
    </div>

    <!-- PRs -->
    <div class="section-title">🏆 Records personales</div>
    <div v-if="prs.length === 0" class="empty-state" style="padding:24px">
      <div>Aún no hay datos suficientes</div>
    </div>
    <div v-else class="prs-grid">
      <div v-for="pr in prs" :key="pr.exercise_id" class="pr-card">
        <div class="pr-exercise">{{ pr.exercise_name }}</div>
        <div class="pr-routine text-xs text-muted">{{ pr.routine_name }}</div>
        <div class="pr-weight">{{ pr.pr_weight }}<span class="pr-unit">kg</span></div>
        <div class="text-xs text-muted" v-if="pr.achieved_at">{{ formatDate(pr.achieved_at) }}</div>
      </div>
    </div>

    <!-- Weekly volume chart -->
    <div class="section-title" style="margin-top:32px">📊 Volumen semanal (kg·reps)</div>
    <div class="chart-card">
      <canvas ref="volumeCanvas" height="220"></canvas>
    </div>

    <!-- Exercise progress -->
    <div class="section-title" style="margin-top:32px">📈 Progresión por ejercicio</div>
    <div class="exercise-selector">
      <select v-model="selectedExerciseId" @change="loadExerciseChart">
        <option value="">— Seleccioná un ejercicio —</option>
        <optgroup v-for="r in routines" :key="r.id" :label="r.name">
          <option v-for="ex in r.exercises" :key="ex.id" :value="ex.id">{{ ex.name }}</option>
        </optgroup>
      </select>
    </div>
    <div class="chart-card" v-if="selectedExerciseId">
      <div v-if="exerciseData.length === 0" class="empty-state" style="padding:24px">
        <div>Sin datos para este ejercicio aún</div>
      </div>
      <canvas v-else ref="progressCanvas" height="220"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { api } from '../composables/api'
import {
  Chart,
  LineController, BarController,
  CategoryScale, LinearScale,
  PointElement, LineElement, BarElement,
  Tooltip, Legend, Filler
} from 'chart.js'

Chart.register(LineController, BarController, CategoryScale, LinearScale,
  PointElement, LineElement, BarElement, Tooltip, Legend, Filler)

const prs = ref([])
const routines = ref([])
const weeklyData = ref([])
const exerciseData = ref([])
const selectedExerciseId = ref('')
const volumeCanvas = ref(null)
const progressCanvas = ref(null)
let volumeChart = null
let progressChart = null

const formatDate = (d) => {
  if (!d) return ''
  return new Date(d + (d.includes('Z') ? '' : 'Z')).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'short', year: '2-digit'
  })
}

const chartDefaults = {
  color: '#a0a0a0',
  borderColor: '#2a2a2a',
}

const buildVolumeChart = () => {
  if (!volumeCanvas.value || weeklyData.value.length === 0) return
  if (volumeChart) volumeChart.destroy()

  const labels = weeklyData.value.map(w => w.week)
  const volumes = weeklyData.value.map(w => Math.round(w.total_volume || 0))

  volumeChart = new Chart(volumeCanvas.value, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Volumen total (kg×reps)',
        data: volumes,
        backgroundColor: 'rgba(232,244,34,0.25)',
        borderColor: '#e8f422',
        borderWidth: 1,
        borderRadius: 4,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: '#a0a0a0', font: { family: 'DM Sans' } } },
        tooltip: {
          backgroundColor: '#1c1c1c', borderColor: '#363636', borderWidth: 1,
          titleColor: '#f0f0f0', bodyColor: '#a0a0a0',
        }
      },
      scales: {
        x: { ticks: { color: '#606060' }, grid: { color: '#1c1c1c' } },
        y: { ticks: { color: '#606060' }, grid: { color: '#1c1c1c' } }
      }
    }
  })
}

const loadExerciseChart = async () => {
  if (!selectedExerciseId.value) return
  exerciseData.value = await api.getExerciseProgress(selectedExerciseId.value)
  await nextTick()
  buildProgressChart()
}

const buildProgressChart = () => {
  if (!progressCanvas.value || exerciseData.value.length === 0) return
  if (progressChart) progressChart.destroy()

  const labels = exerciseData.value.map(d => formatDate(d.session_date))
  const weights = exerciseData.value.map(d => d.max_weight)
  const volumes = exerciseData.value.map(d => Math.round(d.total_volume || 0))

  progressChart = new Chart(progressCanvas.value, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Peso máximo (kg)',
          data: weights,
          borderColor: '#e8f422',
          backgroundColor: 'rgba(232,244,34,0.08)',
          pointBackgroundColor: '#e8f422',
          pointRadius: 4,
          tension: 0.3,
          fill: true,
          yAxisID: 'y',
        },
        {
          label: 'Volumen total',
          data: volumes,
          borderColor: '#4ade80',
          backgroundColor: 'rgba(74,222,128,0.06)',
          pointBackgroundColor: '#4ade80',
          pointRadius: 3,
          tension: 0.3,
          fill: false,
          yAxisID: 'y2',
        }
      ]
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { labels: { color: '#a0a0a0', font: { family: 'DM Sans' } } },
        tooltip: {
          backgroundColor: '#1c1c1c', borderColor: '#363636', borderWidth: 1,
          titleColor: '#f0f0f0', bodyColor: '#a0a0a0',
        }
      },
      scales: {
        x: { ticks: { color: '#606060' }, grid: { color: '#1c1c1c' } },
        y: {
          ticks: { color: '#e8f422' }, grid: { color: '#1c1c1c' },
          title: { display: true, text: 'kg', color: '#e8f422' }
        },
        y2: {
          position: 'right', ticks: { color: '#4ade80' }, grid: { drawOnChartArea: false },
          title: { display: true, text: 'Volumen', color: '#4ade80' }
        }
      }
    }
  })
}

onMounted(async () => {
  const [p, r, w] = await Promise.all([
    api.getPRs(),
    api.getRoutines(),
    api.getWeeklyVolume()
  ])
  prs.value = p
  weeklyData.value = w

  // Load routines with exercises for selector
  const detailed = await Promise.all(r.map(rt => api.getRoutine(rt.id)))
  routines.value = detailed

  await nextTick()
  buildVolumeChart()
})
</script>

<style scoped>
.section-title {
  font-family: var(--font-display); font-size: 1rem; letter-spacing: 0.08em;
  color: var(--text2); text-transform: uppercase; margin-bottom: 12px;
}

.prs-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px;
}
.pr-card {
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: var(--radius2); padding: 14px;
}
.pr-exercise { font-size: 13px; font-weight: 500; margin-bottom: 2px; }
.pr-routine { margin-bottom: 8px; }
.pr-weight {
  font-family: var(--font-display); font-size: 2rem; color: var(--accent); line-height: 1;
}
.pr-unit { font-size: 1rem; margin-left: 2px; color: var(--text2); }

.chart-card {
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: var(--radius2); padding: 20px;
}

.exercise-selector { margin-bottom: 12px; max-width: 380px; }
</style>
