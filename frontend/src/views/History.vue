<template>
  <div class="page fade-in">
    <div class="page-header">
      <h2 class="title-1">Historial</h2>
      <div class="caption" style="margin-top:2px">{{ total }} sesiones registradas</div>
    </div>

    <div v-if="sessions.length === 0" class="empty-state">
      <div class="icon">📅</div><div>No hay sesiones aún</div>
    </div>

    <div class="list-card" v-else>
      <div v-for="s in sessions" :key="s.id" class="list-row">
        <div class="list-row-icon" :style="{ background: s.finished_at ? 'var(--success-bg)' : 'var(--bg3)' }">
          {{ s.finished_at ? '✅' : '⏳' }}
        </div>
        <div class="list-row-body">
          <div class="list-row-title">{{ s.routine_name }}</div>
          <div class="list-row-sub">{{ formatDate(s.started_at) }}{{ s.finished_at ? ' · ' + duration(s.started_at, s.finished_at) : '' }}</div>
        </div>
        <button class="btn btn-danger btn-icon-sm" @click="del(s)">🗑</button>
      </div>
    </div>

    <div v-if="sessions.length < total" class="flex justify-center mt-4">
      <button class="btn btn-filled btn-sm" @click="loadMore">Cargar más</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../composables/api'
const sessions = ref([]); const total = ref(0); const offset = ref(0)
const formatDate = (d) => d ? new Date(d+(d.includes('Z')?'':'Z')).toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : ''
const duration = (a, b) => { const m = Math.floor((new Date(b+(b.includes('Z')?'':'Z')) - new Date(a+(a.includes('Z')?'':'Z')))/60000); return `${Math.floor(m/60)}h ${m%60}min` }
const load = async () => { const r = await api.getSessions(20, offset.value); sessions.value = [...sessions.value, ...r.sessions]; total.value = r.total; offset.value += 20 }
const loadMore = load
const del = async (s) => { if (!confirm('¿Eliminar esta sesión?')) return; await api.deleteSession(s.id); sessions.value = sessions.value.filter(x=>x.id!==s.id); total.value-- }
onMounted(load)
</script>
