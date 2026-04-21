<template>
  <div class="page fade-in">
    <div class="page-header flex justify-between items-center">
      <div>
        <h2>Rutinas</h2>
        <p class="text-muted text-sm">Editá tus días de entrenamiento</p>
      </div>
      <button class="btn btn-primary" @click="showCreate = true">+ Nueva rutina</button>
    </div>

    <div class="routines-list">
      <div v-for="r in routines" :key="r.id" class="routine-card">
        <div class="routine-card-header">
          <div>
            <div class="text-xs text-muted" style="text-transform:uppercase;letter-spacing:.06em">{{ r.day_label }}</div>
            <div class="routine-card-title">{{ r.name }}</div>
            <div v-if="r.description" class="text-sm text-muted" style="margin-top:2px">{{ r.description }}</div>
          </div>
          <div class="flex gap-2">
            <RouterLink :to="`/routines/${r.id}`" class="btn btn-ghost btn-sm">Editar</RouterLink>
            <RouterLink :to="`/workout/${r.id}`" class="btn btn-primary btn-sm">▶ Iniciar</RouterLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Create modal -->
    <div v-if="showCreate" class="modal-backdrop" @click.self="showCreate = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Nueva rutina</h3>
          <button class="btn btn-ghost btn-icon" @click="showCreate = false">✕</button>
        </div>
        <div class="flex flex-col gap-3">
          <div class="form-group">
            <label>Nombre</label>
            <input v-model="form.name" placeholder="Ej: Pecho · Hombros" />
          </div>
          <div class="form-group">
            <label>Etiqueta del día</label>
            <input v-model="form.day_label" placeholder="Ej: Día 1" />
          </div>
          <div class="form-group">
            <label>Descripción (opcional)</label>
            <input v-model="form.description" placeholder="Ej: Tren superior empuje" />
          </div>
          <div class="flex gap-2 mt-2" style="justify-content:flex-end">
            <button class="btn btn-ghost" @click="showCreate = false">Cancelar</button>
            <button class="btn btn-primary" @click="createRoutine" :disabled="!form.name">Crear</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '../composables/api'

const routines = ref([])
const showCreate = ref(false)
const form = ref({ name: '', day_label: '', description: '' })

const load = async () => { routines.value = await api.getRoutines() }

const createRoutine = async () => {
  await api.createRoutine(form.value)
  form.value = { name: '', day_label: '', description: '' }
  showCreate.value = false
  await load()
}

onMounted(load)
</script>

<style scoped>
.routines-list { display: flex; flex-direction: column; gap: 10px; }
.routine-card {
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: var(--radius2); padding: 18px 20px;
  transition: border-color 0.15s;
}
.routine-card:hover { border-color: var(--border2); }
.routine-card-header { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.routine-card-title { font-family: var(--font-display); font-size: 1.3rem; }
</style>
