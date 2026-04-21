<template>
  <div class="page fade-in">
    <div class="page-header">
      <h2>Historial</h2>
      <p class="text-muted text-sm">{{ total }} sesiones registradas</p>
    </div>

    <div v-if="sessions.length === 0" class="empty-state">
      <div class="icon">📅</div>
      <div>No hay sesiones aún</div>
    </div>

    <div class="sessions-list">
      <div v-for="s in sessions" :key="s.id" class="session-card">
        <div class="session-card-main">
          <div>
            <div class="session-routine-name">{{ s.routine_name }}</div>
            <div class="text-sm text-muted">{{ formatDate(s.started_at) }}</div>
            <div class="text-xs text-muted" v-if="s.finished_at">
              Duración: {{ duration(s.started_at, s.finished_at) }}
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="badge" :class="s.finished_at ? 'badge-accent' : 'badge-muted'">
              {{ s.finished_at ? 'Completada' : 'Sin finalizar' }}
            </span>
            <button class="btn btn-danger btn-icon btn-sm" @click="deleteSession(s)" title="Eliminar">🗑</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="sessions.length < total" class="flex" style="justify-content:center;margin-top:16px">
      <button class="btn btn-ghost" @click="loadMore">Cargar más</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../composables/api'

const sessions = ref([])
const total = ref(0)
const offset = ref(0)
const LIMIT = 20

const formatDate = (d) => {
  if (!d) return ''
  return new Date(d + (d.includes('Z') ? '' : 'Z')).toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
  })
}

const duration = (start, end) => {
  const diff = Math.floor((new Date(end + (end.includes('Z') ? '' : 'Z')) - new Date(start + (start.includes('Z') ? '' : 'Z'))) / 60000)
  return `${Math.floor(diff / 60)}h ${diff % 60}min`
}

const load = async () => {
  const res = await api.getSessions(LIMIT, offset.value)
  sessions.value = [...sessions.value, ...res.sessions]
  total.value = res.total
  offset.value += LIMIT
}

const loadMore = load

const deleteSession = async (s) => {
  if (!confirm('¿Eliminar esta sesión?')) return
  await api.deleteSession(s.id)
  sessions.value = sessions.value.filter(x => x.id !== s.id)
  total.value--
}

onMounted(load)
</script>

<style scoped>
.sessions-list { display: flex; flex-direction: column; gap: 8px; }
.session-card {
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: var(--radius2); padding: 16px;
}
.session-card-main { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.session-routine-name { font-weight: 500; font-size: 15px; margin-bottom: 4px; }
</style>
