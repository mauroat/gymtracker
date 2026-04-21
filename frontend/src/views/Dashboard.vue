<template>
  <div class="page fade-in">
    <div class="page-header">
      <h1>Dashboard</h1>
      <p class="text-muted text-sm">{{ greeting }}, Mauro 💪</p>
    </div>

    <!-- Summary cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Sesiones este mes</div>
        <div class="stat-value">{{ summary.last30 }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Sesiones últimos 90 días</div>
        <div class="stat-value">{{ summary.last90 }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Sets registrados total</div>
        <div class="stat-value">{{ summary.totalSets }}</div>
      </div>
      <div class="stat-card accent">
        <div class="stat-label">Sesiones totales</div>
        <div class="stat-value">{{ summary.totalSessions }}</div>
      </div>
    </div>

    <!-- Quick start -->
    <div class="section-title">Comenzar entrenamiento</div>
    <div class="routines-grid">
      <div
        v-for="r in routines"
        :key="r.id"
        class="routine-quick-card"
        @click="startWorkout(r.id)"
      >
        <div class="routine-day">{{ r.day_label }}</div>
        <div class="routine-name">{{ r.name }}</div>
        <div class="routine-arrow">→</div>
      </div>
    </div>

    <!-- Recent sessions -->
    <div class="section-title" style="margin-top:32px">Últimas sesiones</div>
    <div v-if="sessions.length === 0" class="empty-state">
      <div class="icon">🏋️</div>
      <div>Aún no hay sesiones registradas</div>
    </div>
    <div v-else class="sessions-list">
      <div v-for="s in sessions.slice(0, 5)" :key="s.id" class="session-item">
        <div>
          <div class="session-routine">{{ s.routine_name }}</div>
          <div class="text-sm text-muted">{{ formatDate(s.started_at) }}</div>
        </div>
        <span class="badge" :class="s.finished_at ? 'badge-accent' : 'badge-muted'">
          {{ s.finished_at ? 'Completada' : 'En curso' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../composables/api'

const router = useRouter()
const summary = ref({ last30: 0, last90: 0, totalSets: 0, totalSessions: 0 })
const routines = ref([])
const sessions = ref([])

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Buen día'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
})

const formatDate = (d) => {
  if (!d) return ''
  return new Date(d + (d.includes('Z') ? '' : 'Z')).toLocaleDateString('es-AR', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}

const startWorkout = async (routineId) => {
  const session = await api.startSession(routineId)
  router.push(`/workout/${routineId}?session=${session.id}`)
}

onMounted(async () => {
  const [s, r, sess] = await Promise.all([
    api.getSummary(),
    api.getRoutines(),
    api.getSessions(5)
  ])
  summary.value = s
  routines.value = r
  sessions.value = sess.sessions
})
</script>

<style scoped>
.stats-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px;
  margin-bottom: 32px;
}
.stat-card {
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: var(--radius2); padding: 18px;
}
.stat-card.accent { border-color: var(--accent); background: var(--accent-dim); }
.stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text2); margin-bottom: 8px; }
.stat-value { font-family: var(--font-display); font-size: 2.5rem; color: var(--text); }
.stat-card.accent .stat-value { color: var(--accent); }

.section-title {
  font-family: var(--font-display); font-size: 1rem; letter-spacing: 0.08em;
  color: var(--text2); text-transform: uppercase; margin-bottom: 12px;
}

.routines-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
.routine-quick-card {
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: var(--radius2); padding: 16px;
  cursor: pointer; transition: all 0.15s;
  display: flex; flex-direction: column; gap: 4px;
}
.routine-quick-card:hover { border-color: var(--accent); background: var(--accent-dim); }
.routine-day { font-size: 11px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.06em; }
.routine-name { font-family: var(--font-display); font-size: 1.1rem; color: var(--text); }
.routine-arrow { color: var(--accent); font-size: 1.2rem; margin-top: 4px; }

.sessions-list { display: flex; flex-direction: column; gap: 8px; }
.session-item {
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 12px 16px;
  display: flex; justify-content: space-between; align-items: center;
}
.session-routine { font-weight: 500; font-size: 14px; }
</style>
