<template>
  <div class="page fade-in">
    <div class="page-header">
      <div class="flex justify-between items-center">
        <h2 class="title-1">Rutinas</h2>
        <button class="btn btn-primary btn-sm" @click="showCreate = true">+ Nueva</button>
      </div>
    </div>

    <!-- My routines -->
    <div class="section-header">Mis rutinas</div>
    <div v-if="routines.length === 0" class="empty-state" style="padding:28px 0">
      <div class="icon">📋</div>
      <div>No tenés rutinas aún</div>
      <button class="btn btn-primary btn-sm" @click="showCreate = true">Crear rutina</button>
    </div>
    <div v-else class="list-card" style="margin-bottom: 4px">
      <div v-for="r in routines" :key="r.id" class="list-row">
        <div class="list-row-icon" style="background: var(--accent-bg)">💪</div>
        <div class="list-row-body" @click="$router.push(`/routines/${r.id}`)">
          <div class="list-row-title">{{ r.name }}</div>
          <div class="list-row-sub">{{ r.day_label }}{{ r.description ? ' · ' + r.description : '' }}</div>
        </div>
        <button class="btn btn-secondary btn-xs" @click="$router.push(`/workout/${r.id}`)">▶</button>
      </div>
    </div>

    <!-- Suggested routines -->
    <div class="section-header">Catálogo sugerido</div>
    <div class="segmented" :style="{ gridTemplateColumns: `repeat(${categories.length}, 1fr)` }" style="margin-bottom:12px">
      <button
        v-for="cat in categories" :key="cat"
        class="segmented-btn" :class="{ active: activeCategory === cat }"
        @click="activeCategory = cat"
        style="font-size:0.75rem; padding: 7px 2px"
      >{{ cat.split('/')[0].trim() }}</button>
    </div>

    <div class="suggested-list">
      <div
        v-for="r in filteredSuggested" :key="r.id"
        class="suggested-card"
        @click="preview = r"
      >
        <div class="suggested-emoji" :style="{ background: r.color + '18' }">{{ r.emoji }}</div>
        <div class="suggested-body">
          <div class="suggested-name">{{ r.name }}</div>
          <div class="suggested-meta">{{ r.exercises.length }} ejercicios · {{ r.description }}</div>
        </div>
        <div style="color: var(--text4); font-size: 1.1rem;">›</div>
      </div>
    </div>

    <!-- Create modal -->
    <div v-if="showCreate" class="modal-backdrop" @click.self="showCreate = false">
      <div class="modal">
        <div class="modal-handle"></div>
        <div class="modal-title">Nueva rutina</div>
        <div class="flex-col gap-3">
          <div class="field-group"><label class="field-label">Nombre</label>
            <input v-model="form.name" placeholder="Ej: Pecho · Hombros" /></div>
          <div class="field-group"><label class="field-label">Etiqueta del día</label>
            <input v-model="form.day_label" placeholder="Ej: Día 1" /></div>
          <div class="field-group"><label class="field-label">Descripción (opcional)</label>
            <input v-model="form.description" placeholder="Ej: Tren superior empuje" /></div>
          <div class="flex gap-2 mt-2" style="justify-content:flex-end">
            <button class="btn btn-filled" @click="showCreate = false">Cancelar</button>
            <button class="btn btn-primary" @click="createRoutine" :disabled="!form.name">Crear</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview modal -->
    <div v-if="preview" class="modal-backdrop" @click.self="preview = null">
      <div class="modal">
        <div class="modal-handle"></div>
        <div class="preview-header">
          <div class="preview-emoji" :style="{ background: preview.color + '18' }">{{ preview.emoji }}</div>
          <div>
            <div class="modal-title" style="margin-bottom:2px">{{ preview.name }}</div>
            <div class="caption">{{ preview.description }}</div>
          </div>
        </div>

        <div class="section-header" style="padding-top:12px">Seleccioná los ejercicios a importar</div>
        <div class="preview-exercises">
          <label
            v-for="(ex, i) in preview.exercises" :key="i"
            class="ex-check-row"
            :class="{ checked: selectedExIds.has(i) }"
          >
            <input type="checkbox" :checked="selectedExIds.has(i)" @change="toggleEx(i)" hidden />
            <div class="ex-check-box">{{ selectedExIds.has(i) ? '✓' : '' }}</div>
            <div class="ex-check-body">
              <div class="ex-check-name">{{ ex.name }}</div>
              <div class="caption">{{ ex.sets.length }} series · {{ ex.rest }}s descanso{{ ex.notes ? ' · ' + ex.notes : '' }}</div>
            </div>
          </label>
        </div>

        <div class="flex gap-2 mt-3">
          <button class="btn btn-filled btn-sm" @click="selectAll">Todos</button>
          <button class="btn btn-filled btn-sm" @click="selectedExIds.clear()">Ninguno</button>
          <button class="btn btn-primary flex-1" @click="importRoutine" :disabled="selectedExIds.size === 0 || importing">
            {{ importing ? 'Importando…' : `Importar (${selectedExIds.size})` }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../composables/api'
import { SUGGESTED_ROUTINES, CATEGORIES } from '../data/suggestedRoutines'

const router = useRouter()
const routines = ref([])
const showCreate = ref(false)
const form = ref({ name: '', day_label: '', description: '' })
const preview = ref(null)
const selectedExIds = reactive(new Set())
const importing = ref(false)
const categories = CATEGORIES
const activeCategory = ref(categories[0])

const filteredSuggested = computed(() => SUGGESTED_ROUTINES.filter(r => r.category === activeCategory.value))

const load = async () => { routines.value = await api.getRoutines() }
const createRoutine = async () => {
  await api.createRoutine(form.value)
  form.value = { name: '', day_label: '', description: '' }
  showCreate.value = false; await load()
}

const toggleEx = (i) => { selectedExIds.has(i) ? selectedExIds.delete(i) : selectedExIds.add(i) }
const selectAll = () => { preview.value?.exercises.forEach((_, i) => selectedExIds.add(i)) }

const importRoutine = async () => {
  if (!preview.value) return
  importing.value = true
  try {
    const r = preview.value
    const routine = await api.createRoutine({ name: r.name, day_label: r.day_label, description: r.description })
    for (const idx of [...selectedExIds].sort()) {
      const ex = r.exercises[idx]
      await api.addExercise(routine.id, {
        name: ex.name, rest_seconds: ex.rest, notes: ex.notes,
        set_templates: ex.sets.map(s => ({ target_weight_kg: s.w, target_reps: s.r }))
      })
    }
    preview.value = null; selectedExIds.clear(); await load()
    router.push(`/routines/${routine.id}`)
  } finally { importing.value = false }
}

// watch preview to auto-select all
import { watch } from 'vue'
watch(preview, (p) => {
  selectedExIds.clear()
  if (p) p.exercises.forEach((_, i) => selectedExIds.add(i))
})

onMounted(load)
</script>

<style scoped>
.suggested-list { display: flex; flex-direction: column; gap: 8px; }
.suggested-card {
  background: var(--bg2); border-radius: var(--radius-lg); padding: 14px 16px;
  display: flex; align-items: center; gap: 12px;
  box-shadow: var(--shadow-sm); cursor: pointer;
  -webkit-tap-highlight-color: transparent; transition: opacity 0.1s;
}
.suggested-card:active { opacity: 0.7; }
.suggested-emoji {
  width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 1.4rem;
}
.suggested-body { flex: 1; min-width: 0; }
.suggested-name { font-size: 0.9375rem; font-weight: 600; margin-bottom: 2px; }
.suggested-meta { font-size: 0.8125rem; color: var(--text3); }

/* Preview */
.preview-header { display: flex; align-items: center; gap: 14px; margin-bottom: 4px; }
.preview-emoji { width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; }
.preview-exercises { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; }
.ex-check-row {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; border-radius: var(--radius-sm);
  background: var(--bg3); cursor: pointer;
  -webkit-tap-highlight-color: transparent; transition: background 0.1s;
}
.ex-check-row.checked { background: var(--accent-bg); }
.ex-check-box {
  width: 22px; height: 22px; border-radius: 6px; flex-shrink: 0;
  background: var(--bg4); border: 1.5px solid var(--border2);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; font-weight: 700; color: var(--accent);
  transition: all 0.15s;
}
.ex-check-row.checked .ex-check-box { background: var(--accent); border-color: var(--accent); color: #fff; }
.ex-check-body { flex: 1; min-width: 0; }
.ex-check-name { font-size: 0.9375rem; font-weight: 500; }
</style>
