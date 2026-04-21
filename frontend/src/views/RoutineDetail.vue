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

    <div class="exercises-list">
      <div v-for="(ex, idx) in routine.exercises" :key="ex.id" class="exercise-card">

        <!-- Header siempre visible -->
        <div class="ex-header" @click="toggleEx(ex.id)">
          <div class="ex-num">{{ idx + 1 }}</div>
          <div class="ex-header-body">
            <div class="ex-name">{{ ex.name }}</div>
            <div class="ex-meta-row">
              <span class="badge badge-accent">{{ ex.set_templates.length }} series</span>
              <span class="badge badge-muted">{{ formatRest(ex.rest_seconds) }} descanso</span>
              <span v-if="ex.notes" class="text-xs text-muted">{{ ex.notes }}</span>
            </div>
            <!-- Mini preview de templates -->
            <div class="templates-preview" v-if="ex.set_templates.length">
              <span
                v-for="t in ex.set_templates" :key="t.id"
                class="tpl-chip"
              >{{ t.target_weight_kg != null ? t.target_weight_kg + 'kg' : '—' }} × {{ t.target_reps ?? '—' }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button class="btn btn-danger btn-icon btn-sm" @click.stop="deleteEx(ex)" title="Eliminar">🗑</button>
            <span class="chevron" :class="{ open: openExId === ex.id }">›</span>
          </div>
        </div>

        <!-- Panel expandido: editar metadatos + templates de series -->
        <div v-if="openExId === ex.id" class="ex-edit-panel">
          <div class="edit-section">
            <div class="edit-section-title">Datos del ejercicio</div>
            <div class="edit-row">
              <div class="form-group" style="flex:2">
                <label>Nombre</label>
                <input v-model="editForms[ex.id].name" />
              </div>
              <div class="form-group">
                <label>Descanso (seg)</label>
                <input type="number" v-model.number="editForms[ex.id].rest_seconds" min="0" />
              </div>
            </div>
            <div class="form-group">
              <label>Notas</label>
              <input v-model="editForms[ex.id].notes" placeholder="Técnica, observaciones..." />
            </div>
            <button class="btn btn-ghost btn-sm mt-2" @click="saveExMeta(ex)">Guardar metadatos</button>
          </div>

          <hr />

          <!-- Series templates -->
          <div class="edit-section">
            <div class="edit-section-title" style="margin-bottom:12px">
              Series objetivo
              <span class="text-xs text-muted" style="margin-left:8px;text-transform:none;font-family:var(--font-body)">
                Definí el peso y reps objetivo por cada serie
              </span>
            </div>

            <div class="templates-table">
              <div class="templates-thead">
                <span>SERIE</span><span>KG OBJETIVO</span><span>REPS OBJETIVO</span><span></span>
              </div>
              <div
                v-for="(tpl, i) in editForms[ex.id].templates"
                :key="i"
                class="templates-row"
              >
                <span class="set-num-label">{{ i + 1 }}</span>
                <input
                  type="number" v-model.number="tpl.target_weight_kg"
                  placeholder="ej: 80" step="0.5" class="tpl-input"
                />
                <input
                  type="number" v-model.number="tpl.target_reps"
                  placeholder="ej: 8" class="tpl-input"
                />
                <button class="btn btn-danger btn-icon btn-sm" @click="removeTplRow(ex.id, i)">✕</button>
              </div>
            </div>

            <div class="flex gap-2 mt-2">
              <button class="btn btn-ghost btn-sm" @click="addTplRow(ex.id)">+ Agregar serie</button>
              <button class="btn btn-primary btn-sm" @click="saveTemplates(ex)">💾 Guardar series</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Agregar ejercicio -->
      <div class="add-card" @click="showAdd = !showAdd">+ Agregar ejercicio</div>
      <div v-if="showAdd" class="add-form card fade-in">
        <div class="edit-row">
          <div class="form-group" style="flex:2">
            <label>Nombre del ejercicio</label>
            <input v-model="addForm.name" placeholder="Ej: Press banca inclinado" />
          </div>
          <div class="form-group">
            <label>Descanso (seg)</label>
            <input type="number" v-model.number="addForm.rest_seconds" />
          </div>
        </div>
        <div class="form-group">
          <label>Notas</label>
          <input v-model="addForm.notes" placeholder="Técnica, RPE sugerido..." />
        </div>

        <!-- Inline template builder -->
        <div class="edit-section-title" style="margin: 12px 0 8px">Series objetivo</div>
        <div class="templates-table" v-if="addForm.templates.length">
          <div class="templates-thead"><span>SERIE</span><span>KG</span><span>REPS</span><span></span></div>
          <div v-for="(t, i) in addForm.templates" :key="i" class="templates-row">
            <span class="set-num-label">{{ i + 1 }}</span>
            <input type="number" v-model.number="t.target_weight_kg" placeholder="—" step="0.5" class="tpl-input" />
            <input type="number" v-model.number="t.target_reps" placeholder="—" class="tpl-input" />
            <button class="btn btn-danger btn-icon btn-sm" @click="addForm.templates.splice(i, 1)">✕</button>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" @click="addForm.templates.push({ target_weight_kg: null, target_reps: null })">
          + Serie
        </button>

        <div class="flex gap-2 mt-2" style="justify-content:flex-end">
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
          <div class="form-group"><label>Nombre</label><input v-model="routineForm.name" /></div>
          <div class="form-group"><label>Etiqueta del día</label><input v-model="routineForm.day_label" /></div>
          <div class="form-group"><label>Descripción</label><input v-model="routineForm.description" /></div>
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
import { ref, reactive, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { api } from '../composables/api'

const route = useRoute()
const router = useRouter()
const routine = ref(null)
const openExId = ref(null)
const showAdd = ref(false)
const showEditRoutine = ref(false)
const editForms = reactive({})
const routineForm = ref({})

const addForm = ref({ name: '', rest_seconds: 90, notes: '', templates: [] })

const formatRest = (s) => s >= 60 ? `${Math.floor(s / 60)}min ${s % 60 ? s % 60 + 's' : ''}`.trim() : `${s}s`

const load = async () => {
  routine.value = await api.getRoutine(route.params.id)
  routineForm.value = { name: routine.value.name, day_label: routine.value.day_label, description: routine.value.description }
  // Build edit forms for each exercise
  for (const ex of routine.value.exercises) {
    editForms[ex.id] = {
      name: ex.name,
      rest_seconds: ex.rest_seconds,
      notes: ex.notes || '',
      templates: ex.set_templates.map(t => ({ target_weight_kg: t.target_weight_kg, target_reps: t.target_reps }))
    }
  }
}

const toggleEx = (id) => { openExId.value = openExId.value === id ? null : id }

const addTplRow = (exId) => {
  editForms[exId].templates.push({ target_weight_kg: null, target_reps: null })
}
const removeTplRow = (exId, idx) => {
  editForms[exId].templates.splice(idx, 1)
}

const saveExMeta = async (ex) => {
  const f = editForms[ex.id]
  await api.updateExercise(routine.value.id, ex.id, { name: f.name, rest_seconds: f.rest_seconds, notes: f.notes })
  await load()
}

const saveTemplates = async (ex) => {
  const templates = editForms[ex.id].templates.map(t => ({
    target_weight_kg: t.target_weight_kg ?? null,
    target_reps: t.target_reps ?? null,
  }))
  await api.updateSetTemplates(routine.value.id, ex.id, templates)
  await load()
}

const deleteEx = async (ex) => {
  if (!confirm(`Eliminar "${ex.name}"?`)) return
  await api.deleteExercise(routine.value.id, ex.id)
  await load()
}

const addExercise = async () => {
  const { name, rest_seconds, notes, templates } = addForm.value
  await api.addExercise(routine.value.id, {
    name, rest_seconds, notes,
    set_templates: templates.map(t => ({ target_weight_kg: t.target_weight_kg ?? null, target_reps: t.target_reps ?? null }))
  })
  addForm.value = { name: '', rest_seconds: 90, notes: '', templates: [] }
  showAdd.value = false
  await load()
}

const saveRoutine = async () => {
  await api.updateRoutine(routine.value.id, routineForm.value)
  showEditRoutine.value = false
  await load()
}

const deleteRoutine = async () => {
  if (!confirm('¿Eliminar esta rutina? Se perderán todos los datos asociados.')) return
  await api.deleteRoutine(routine.value.id)
  router.push('/routines')
}

onMounted(load)
</script>

<style scoped>
.back-link { text-decoration: none; }
.back-link:hover { color: var(--text); }

.exercises-list { display: flex; flex-direction: column; gap: 8px; }

.exercise-card {
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: var(--radius2); overflow: hidden; transition: border-color 0.15s;
}

.ex-header {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 14px 16px; cursor: pointer;
}
.ex-header:hover { background: var(--bg3); }
.ex-num {
  font-family: var(--font-display); font-size: 1.6rem;
  color: var(--text3); min-width: 24px; line-height: 1; padding-top: 2px;
}
.ex-header-body { flex: 1; }
.ex-name { font-weight: 500; font-size: 15px; margin-bottom: 5px; }
.ex-meta-row { display: flex; flex-wrap: wrap; gap: 5px; align-items: center; margin-bottom: 6px; }

.templates-preview { display: flex; flex-wrap: wrap; gap: 4px; }
.tpl-chip {
  font-size: 11px; padding: 2px 7px; border-radius: 99px;
  background: var(--bg4); color: var(--text2);
  font-family: var(--font-body);
}

.chevron { font-size: 1.4rem; color: var(--text3); transition: transform 0.2s; }
.chevron.open { transform: rotate(90deg); }

.ex-edit-panel { border-top: 1px solid var(--border); background: var(--bg3); padding: 16px; }

.edit-section { margin-bottom: 4px; }
.edit-section-title {
  font-size: 11px; letter-spacing: 0.07em; text-transform: uppercase;
  color: var(--text3); margin-bottom: 10px; font-weight: 600;
}
.edit-row { display: flex; gap: 10px; }

/* Templates table */
.templates-table { margin-bottom: 8px; }
.templates-thead {
  display: grid; grid-template-columns: 44px 1fr 1fr 32px;
  font-size: 10px; letter-spacing: 0.06em; color: var(--text3);
  text-transform: uppercase; padding: 0 0 6px;
  border-bottom: 1px solid var(--border); margin-bottom: 4px;
}
.templates-row {
  display: grid; grid-template-columns: 44px 1fr 1fr 32px;
  gap: 6px; align-items: center; padding: 5px 0;
  border-bottom: 1px solid var(--border);
}
.set-num-label {
  font-family: var(--font-display); font-size: 1.2rem; color: var(--accent);
}
.tpl-input { padding: 5px 8px; font-size: 13px; }

.add-card {
  border: 1px dashed var(--border2); border-radius: var(--radius2);
  padding: 14px; text-align: center; cursor: pointer;
  color: var(--text3); font-size: 14px; transition: all 0.15s;
}
.add-card:hover { border-color: var(--accent); color: var(--accent); }
.add-form { display: flex; flex-direction: column; gap: 10px; }
</style>
