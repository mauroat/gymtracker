<template>
  <div class="page fade-in" v-if="routine">
    <div class="page-header flex justify-between items-center">
      <div>
        <RouterLink to="/routines" class="back-link text-sm text-muted">← Rutinas</RouterLink>
        <h2 style="margin-top:4px">{{ routine.name }}</h2>
        <p class="text-muted text-sm">{{ routine.day_label }} · {{ routine.exercises?.length || 0 }} ejercicios</p>
      </div>
      <div class="flex gap-2">
        <button class="btn btn-ghost btn-sm" @click="showEditRoutine = true">✏ Editar</button>
        <RouterLink :to="`/workout/${routine.id}`" class="btn btn-primary">▶ Iniciar</RouterLink>
      </div>
    </div>

    <!-- Exercises -->
    <div class="exercises-list">
      <div v-for="(ex, idx) in routine.exercises" :key="ex.id" class="exercise-card">
        <div class="ex-number">{{ idx + 1 }}</div>
        <div class="ex-body" v-if="editingId !== ex.id">
          <div class="ex-name">{{ ex.name }}</div>
          <div class="ex-meta">
            <span class="badge badge-accent">{{ ex.sets }} series</span>
            <span class="badge badge-muted">{{ ex.reps }} reps</span>
            <span class="badge badge-muted">{{ formatRest(ex.rest_seconds) }}</span>
          </div>
          <div v-if="ex.notes" class="text-xs text-muted" style="margin-top:4px">{{ ex.notes }}</div>
        </div>
        <div class="ex-body" v-else>
          <div class="edit-form">
            <input v-model="editForm.name" placeholder="Nombre" />
            <div class="edit-row">
              <div class="form-group">
                <label>Series</label>
                <input type="number" v-model.number="editForm.sets" min="1" max="10" />
              </div>
              <div class="form-group">
                <label>Reps</label>
                <input v-model="editForm.reps" placeholder="8-12" />
              </div>
              <div class="form-group">
                <label>Descanso (seg)</label>
                <input type="number" v-model.number="editForm.rest_seconds" min="0" />
              </div>
            </div>
            <input v-model="editForm.notes" placeholder="Notas (opcional)" />
            <div class="flex gap-2 mt-2">
              <button class="btn btn-ghost btn-sm" @click="editingId = null">Cancelar</button>
              <button class="btn btn-primary btn-sm" @click="saveExercise(ex)">Guardar</button>
            </div>
          </div>
        </div>
        <div class="ex-actions">
          <button class="btn btn-ghost btn-sm btn-icon" @click="startEdit(ex)" title="Editar">✏</button>
          <button class="btn btn-danger btn-sm btn-icon" @click="deleteEx(ex)" title="Eliminar">🗑</button>
        </div>
      </div>

      <!-- Add exercise -->
      <div class="add-exercise-card" @click="showAdd = !showAdd">
        <span>+ Agregar ejercicio</span>
      </div>
      <div v-if="showAdd" class="add-form card">
        <div class="form-group"><label>Nombre del ejercicio</label>
          <input v-model="addForm.name" placeholder="Ej: Press banca inclinado" />
        </div>
        <div class="edit-row">
          <div class="form-group"><label>Series</label>
            <input type="number" v-model.number="addForm.sets" min="1" max="10" />
          </div>
          <div class="form-group"><label>Reps</label>
            <input v-model="addForm.reps" placeholder="8-12" />
          </div>
          <div class="form-group"><label>Descanso (seg)</label>
            <input type="number" v-model.number="addForm.rest_seconds" />
          </div>
        </div>
        <div class="form-group"><label>Notas</label>
          <input v-model="addForm.notes" placeholder="Técnica, observaciones..." />
        </div>
        <div class="flex gap-2 mt-2">
          <button class="btn btn-ghost btn-sm" @click="showAdd = false">Cancelar</button>
          <button class="btn btn-primary btn-sm" @click="addExercise" :disabled="!addForm.name">Agregar</button>
        </div>
      </div>
    </div>

    <!-- Edit routine modal -->
    <div v-if="showEditRoutine" class="modal-backdrop" @click.self="showEditRoutine = false">
      <div class="modal">
        <div class="modal-header">
          <h3>Editar rutina</h3>
          <button class="btn btn-ghost btn-icon" @click="showEditRoutine = false">✕</button>
        </div>
        <div class="flex flex-col gap-3">
          <div class="form-group"><label>Nombre</label>
            <input v-model="routineEditForm.name" /></div>
          <div class="form-group"><label>Día</label>
            <input v-model="routineEditForm.day_label" /></div>
          <div class="form-group"><label>Descripción</label>
            <input v-model="routineEditForm.description" /></div>
          <div class="flex gap-2 mt-2" style="justify-content:space-between">
            <button class="btn btn-danger btn-sm" @click="deleteRoutine">Eliminar rutina</button>
            <div class="flex gap-2">
              <button class="btn btn-ghost" @click="showEditRoutine = false">Cancelar</button>
              <button class="btn btn-primary" @click="saveRoutine">Guardar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { api } from '../composables/api'

const route = useRoute()
const router = useRouter()
const routine = ref(null)
const editingId = ref(null)
const editForm = ref({})
const showAdd = ref(false)
const showEditRoutine = ref(false)
const addForm = ref({ name: '', sets: 3, reps: '8-12', rest_seconds: 90, notes: '' })
const routineEditForm = ref({})

const load = async () => {
  routine.value = await api.getRoutine(route.params.id)
  routineEditForm.value = { name: routine.value.name, day_label: routine.value.day_label, description: routine.value.description }
}

const formatRest = (s) => s >= 60 ? `${Math.floor(s / 60)}min ${s % 60 > 0 ? s % 60 + 's' : ''}`.trim() : `${s}s`

const startEdit = (ex) => { editingId.value = ex.id; editForm.value = { ...ex } }

const saveExercise = async (ex) => {
  await api.updateExercise(routine.value.id, ex.id, editForm.value)
  editingId.value = null
  await load()
}

const deleteEx = async (ex) => {
  if (!confirm(`Eliminar "${ex.name}"?`)) return
  await api.deleteExercise(routine.value.id, ex.id)
  await load()
}

const addExercise = async () => {
  await api.addExercise(routine.value.id, addForm.value)
  addForm.value = { name: '', sets: 3, reps: '8-12', rest_seconds: 90, notes: '' }
  showAdd.value = false
  await load()
}

const saveRoutine = async () => {
  await api.updateRoutine(routine.value.id, routineEditForm.value)
  showEditRoutine.value = false
  await load()
}

const deleteRoutine = async () => {
  if (!confirm('¿Eliminar esta rutina? Se perderán los ejercicios asociados.')) return
  await api.deleteRoutine(routine.value.id)
  router.push('/routines')
}

onMounted(load)
</script>

<style scoped>
.back-link { text-decoration: none; display: inline-block; margin-bottom: 4px; }
.back-link:hover { color: var(--text); }

.exercises-list { display: flex; flex-direction: column; gap: 8px; }
.exercise-card {
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: var(--radius2); padding: 14px 16px;
  display: flex; gap: 14px; align-items: flex-start;
}
.ex-number {
  font-family: var(--font-display); font-size: 1.4rem;
  color: var(--text3); min-width: 24px; padding-top: 2px;
}
.ex-body { flex: 1; }
.ex-name { font-weight: 500; font-size: 15px; margin-bottom: 6px; }
.ex-meta { display: flex; flex-wrap: wrap; gap: 6px; }
.ex-actions { display: flex; gap: 4px; }

.edit-form { display: flex; flex-direction: column; gap: 8px; }
.edit-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }

.add-exercise-card {
  border: 1px dashed var(--border2); border-radius: var(--radius2);
  padding: 14px; text-align: center; cursor: pointer;
  color: var(--text3); font-size: 14px; transition: all 0.15s;
}
.add-exercise-card:hover { border-color: var(--accent); color: var(--accent); }
.add-form { margin-top: -4px; display: flex; flex-direction: column; gap: 10px; }
</style>
