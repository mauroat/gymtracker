<template>
  <div class="page fade-in">
    <div class="page-header">
      <div class="flex justify-between items-center">
        <div>
          <div class="caption" style="margin-bottom:2px">{{ greeting }}</div>
          <h1 class="large-title">{{ auth.user?.display_name || auth.user?.username }}</h1>
        </div>
        <div class="theme-btn" @click="themeStore.toggle()">
          {{ themeStore.theme === 'dark' ? '☀️' : '🌙' }}
        </div>
      </div>
    </div>

    <!-- Stats row -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-label">Este mes</div>
        <div class="stat-value">{{ summary.last30 }}</div>
        <div class="stat-sub">sesiones</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">90 días</div>
        <div class="stat-value">{{ summary.last90 }}</div>
        <div class="stat-sub">sesiones</div>
      </div>
      <div class="stat-card accent-card">
        <div class="stat-label">Sets totales</div>
        <div class="stat-value">{{ summary.totalSets }}</div>
        <div class="stat-sub">registrados</div>
      </div>
    </div>

    <!-- Quick start -->
    <div class="section-header">Comenzar</div>
    <div v-if="routines.length === 0" class="list-card">
      <div class="list-row" style="cursor:default">
        <div class="list-row-icon" style="background:var(--bg3)">📋</div>
        <div class="list-row-body">
          <div class="list-row-title">No tenés rutinas aún</div>
          <div class="list-row-sub">Creá tu primera rutina desde la pestaña Rutinas</div>
        </div>
        <RouterLink to="/routines" class="btn btn-primary btn-xs">Crear</RouterLink>
      </div>
    </div>
    <div v-else class="list-card">
      <div v-for="r in routines" :key="r.id" class="list-row" @click="startWorkout(r.id)">
        <div class="list-row-icon" style="background: var(--accent-bg)">💪</div>
        <div class="list-row-body">
          <div class="list-row-title">{{ r.name }}</div>
          <div class="list-row-sub">{{ r.day_label }}</div>
        </div>
        <div style="color: var(--accent); font-weight: 600; font-size: 0.875rem;">▶</div>
      </div>
    </div>

    <!-- Recent sessions -->
    <div class="section-header">Últimas sesiones</div>
    <div v-if="sessions.length === 0" class="empty-state" style="padding: 32px 0">
      <div class="icon">📭</div>
      <div>Aún no hay sesiones</div>
    </div>
    <div v-else class="list-card">
      <div v-for="s in sessions.slice(0,5)" :key="s.id" class="list-row">
        <div class="list-row-icon" style="background: var(--bg3)">📅</div>
        <div class="list-row-body">
          <div class="list-row-title">{{ s.routine_name }}</div>
          <div class="list-row-sub">{{ formatDate(s.started_at) }}</div>
        </div>
        <span class="badge" :class="s.finished_at ? 'badge-success' : 'badge-neutral'">
          {{ s.finished_at ? '✓' : '…' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../composables/api'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'

const router = useRouter()
const auth = useAuthStore()
const themeStore = useThemeStore()
const summary = ref({ last30:0, last90:0, totalSets:0, totalSessions:0 })
const routines = ref([])
const sessions = ref([])

const greeting = computed(() => {
  const h = new Date().getHours()
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
})
const formatDate = (d) => d ? new Date(d + (d.includes('Z') ? '' : 'Z')).toLocaleDateString('es-AR', { weekday:'short', day:'numeric', month:'short' }) : ''

const startWorkout = async (routineId) => {
  const session = await api.startSession(routineId)
  router.push(`/workout/${routineId}?session=${session.id}`)
}

onMounted(async () => {
  const [s, r, sess] = await Promise.all([api.getSummary(), api.getRoutines(), api.getSessions(5)])
  summary.value = s; routines.value = r; sessions.value = sess.sessions
})
</script>

<style scoped>
.stats-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 4px; }
.stat-card { background: var(--bg2); border-radius: var(--radius-lg); padding: 14px 12px; box-shadow: var(--shadow-sm); }
.accent-card { background: var(--accent); }
.accent-card .stat-label, .accent-card .stat-value, .accent-card .stat-sub { color: #fff; }
.stat-label { font-size: 0.6875rem; font-weight: 600; color: var(--text3); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px; }
.stat-value { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.03em; line-height: 1; }
.stat-sub   { font-size: 0.6875rem; color: var(--text3); margin-top: 2px; }
.theme-btn {
  width: 40px; height: 40px; border-radius: 50%; background: var(--bg2);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.2rem; cursor: pointer; box-shadow: var(--shadow-sm);
  -webkit-tap-highlight-color: transparent;
}
</style>
