<template>
  <div class="page fade-in">

    <!-- Session detail view -->
    <template v-if="detail">
      <div class="page-header">
        <button class="btn btn-ghost btn-sm" style="padding-left:0;margin-bottom:8px" @click="detail = null">← Historial</button>
        <div class="flex justify-between items-start gap-2">
          <div>
            <h2 class="title-1">{{ detail.routine_name }}</h2>
            <div class="caption" style="margin-top:3px">
              {{ formatDateLong(detail.started_at) }}
              <span v-if="detail.finished_at"> · {{ duration(detail.started_at, detail.finished_at) }}</span>
              <span v-else class="badge badge-neutral" style="margin-left:6px">Sin finalizar</span>
            </div>
          </div>
          <button class="btn btn-danger btn-sm" @click="del(detail)">🗑</button>
        </div>
      </div>

      <!-- Summary chips -->
      <div class="summary-chips">
        <div class="chip-stat">
          <div class="chip-val">{{ groupedSets.length }}</div>
          <div class="chip-label">ejercicios</div>
        </div>
        <div class="chip-stat">
          <div class="chip-val">{{ detail.sets.length }}</div>
          <div class="chip-label">series</div>
        </div>
        <div class="chip-stat accent">
          <div class="chip-val">{{ totalVolume }}</div>
          <div class="chip-label">kg vol.</div>
        </div>
      </div>

      <!-- Exercises breakdown -->
      <div class="section-header">Series registradas</div>
      <div class="ex-detail-list">
        <div v-for="group in groupedSets" :key="group.exercise_id" class="ex-detail-card">
          <div class="ex-detail-name">{{ group.exercise_name }}</div>
          <div class="sets-table">
            <div class="sets-thead">
              <span>#</span><span>KG</span><span>Reps</span><span>RPE</span><span>Vol</span>
            </div>
            <div v-for="s in group.sets" :key="s.id" class="sets-trow">
              <span class="set-n">{{ s.set_number }}</span>
              <span>{{ s.weight_kg ?? '—' }}</span>
              <span>{{ s.reps_done ?? '—' }}</span>
              <span>{{ s.rpe ?? '—' }}</span>
              <span class="vol-cell">{{ s.weight_kg && s.reps_done ? Math.round(s.weight_kg * s.reps_done) : '—' }}</span>
            </div>
            <div class="sets-tfoot">
              <span></span>
              <span></span>
              <span>{{ group.sets.reduce((a,s) => a + (s.reps_done||0), 0) }} reps</span>
              <span></span>
              <span>{{ group.sets.reduce((a,s) => a + (s.weight_kg&&s.reps_done ? Math.round(s.weight_kg*s.reps_done) : 0), 0) }} kg</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Sessions list view -->
    <template v-else>
      <div class="page-header">
        <h2 class="title-1">Historial</h2>
        <div class="caption" style="margin-top:2px">{{ total }} sesiones registradas</div>
      </div>

      <div v-if="sessions.length === 0" class="empty-state">
        <div class="icon">📅</div>
        <div>No hay sesiones aún</div>
      </div>

      <div v-else class="list-card">
        <div v-for="s in sessions" :key="s.id" class="list-row" @click="openDetail(s)">
          <div class="list-row-icon" :style="{ background: s.finished_at ? 'var(--success-bg)' : 'var(--bg3)' }">
            {{ s.finished_at ? '✅' : '⏳' }}
          </div>
          <div class="list-row-body">
            <div class="list-row-title">{{ s.routine_name }}</div>
            <div class="list-row-sub">
              {{ formatDate(s.started_at) }}
              <span v-if="s.finished_at"> · {{ duration(s.started_at, s.finished_at) }}</span>
            </div>
          </div>
          <div style="color:var(--text4);font-size:1.1rem;flex-shrink:0">›</div>
        </div>
      </div>

      <div v-if="sessions.length < total" class="flex justify-center mt-4">
        <button class="btn btn-filled btn-sm" @click="loadMore">Cargar más</button>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '../composables/api'

const sessions = ref([])
const total = ref(0)
const offset = ref(0)
const detail = ref(null)

const formatDate = (d) => {
  if (!d) return ''
  return new Date(d + (d.includes('Z') ? '' : 'Z')).toLocaleDateString('es-AR', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}

const formatDateLong = (d) => {
  if (!d) return ''
  return new Date(d + (d.includes('Z') ? '' : 'Z')).toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

const duration = (a, b) => {
  const m = Math.floor(
    (new Date(b + (b.includes('Z') ? '' : 'Z')) - new Date(a + (a.includes('Z') ? '' : 'Z'))) / 60000
  )
  if (m < 60) return `${m} min`
  return `${Math.floor(m / 60)}h ${m % 60}min`
}

const groupedSets = computed(() => {
  if (!detail.value?.sets) return []
  const map = {}
  for (const s of detail.value.sets) {
    if (!map[s.exercise_id]) {
      map[s.exercise_id] = { exercise_id: s.exercise_id, exercise_name: s.exercise_name, sets: [] }
    }
    map[s.exercise_id].sets.push(s)
  }
  return Object.values(map)
})

const totalVolume = computed(() => {
  if (!detail.value?.sets) return 0
  return detail.value.sets.reduce((a, s) =>
    a + (s.weight_kg && s.reps_done ? Math.round(s.weight_kg * s.reps_done) : 0), 0
  )
})

const load = async () => {
  const res = await api.getSessions(20, offset.value)
  sessions.value = [...sessions.value, ...res.sessions]
  total.value = res.total
  offset.value += 20
}

const loadMore = load

const openDetail = async (s) => {
  detail.value = await api.getSession(s.id)
}

const del = async (s) => {
  if (!confirm('¿Eliminar esta sesión?')) return
  await api.deleteSession(s.id)
  if (detail.value?.id === s.id) detail.value = null
  sessions.value = sessions.value.filter(x => x.id !== s.id)
  total.value--
}

onMounted(load)
</script>

<style scoped>
/* Summary chips */
.summary-chips {
  display: grid; grid-template-columns: 1fr 1fr 1fr;
  gap: 10px; margin-bottom: 4px;
}
.chip-stat {
  background: var(--bg2); border-radius: var(--radius-lg);
  padding: 14px 12px; text-align: center; box-shadow: var(--shadow-sm);
}
.chip-stat.accent { background: var(--accent); }
.chip-val { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.03em; line-height: 1; }
.chip-label { font-size: 0.6875rem; color: var(--text3); margin-top: 3px; text-transform: uppercase; letter-spacing: .04em; font-weight: 600; }
.chip-stat.accent .chip-val,
.chip-stat.accent .chip-label { color: #fff; }

/* Exercise detail */
.ex-detail-list { display: flex; flex-direction: column; gap: 10px; }
.ex-detail-card {
  background: var(--bg2); border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm); overflow: hidden;
}
.ex-detail-name {
  font-size: 0.9375rem; font-weight: 600;
  padding: 13px 16px 10px; border-bottom: 1px solid var(--separator);
}

/* Sets table */
.sets-table { padding: 0 16px 12px; }
.sets-thead {
  display: grid; grid-template-columns: 28px 1fr 1fr 60px 1fr;
  padding: 8px 0 5px; border-bottom: 1px solid var(--separator);
  font-size: 0.6875rem; font-weight: 700; color: var(--text4);
  text-transform: uppercase; letter-spacing: .04em;
}
.sets-trow {
  display: grid; grid-template-columns: 28px 1fr 1fr 60px 1fr;
  padding: 8px 0; border-bottom: 1px solid var(--separator);
  font-size: 0.875rem; align-items: center;
}
.sets-trow:last-of-type { border-bottom: none; }
.sets-tfoot {
  display: grid; grid-template-columns: 28px 1fr 1fr 60px 1fr;
  padding: 7px 0 0; border-top: 1px solid var(--separator);
  font-size: 0.75rem; font-weight: 700; color: var(--text2);
}
.set-n { font-weight: 700; color: var(--accent); }
.vol-cell { color: var(--text3); font-size: 0.8125rem; }
</style>
