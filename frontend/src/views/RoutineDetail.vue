<template>
  <div class="page fade-in" v-if="routine">
    <div class="page-header">
      <button class="btn btn-ghost btn-sm" style="padding-left:0;margin-bottom:6px" @click="$router.back()">← Rutinas</button>
      <div class="flex justify-between items-start gap-2">
        <div>
          <h2 class="title-1">{{ routine.name }}</h2>
          <div class="caption" style="margin-top:2px">{{ routine.day_label }} · {{ routine.exercises?.length || 0 }} ejercicios</div>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-filled btn-sm" @click="showEditRoutine = true">✏</button>
          <RouterLink :to="`/workout/${routine.id}`" class="btn btn-primary btn-sm">▶ Iniciar</RouterLink>
        </div>
      </div>
    </div>

    <!-- Exercises -->
    <div class="section-header">Ejercicios</div>
    <div class="ex-list">
      <div v-for="(ex, idx) in routine.exercises" :key="ex.id" class="ex-card" :class="{ open: openId === ex.id }">
        <div class="ex-header" @click="toggle(ex.id)">
          <div class="ex-num">{{ idx + 1 }}</div>
          <div class="ex-info">
            <div class="ex-name">{{ ex.name }}</div>
            <div class="ex-chips">
              <span class="badge badge-accent">{{ ex.set_templates.length }} series</span>
              <span class="badge badge-neutral">{{ formatRest(ex.rest_seconds) }}</span>
            </div>
            <div class="tpl-pills" v-if="ex.set_templates.length">
              <span v-for="t in ex.set_templates" :key="t.id" class="pill">
                {{ t.target_weight_kg != null ? t.target_weight_kg+'kg' : '—' }}×{{ t.target_reps ?? '—' }}
              </span>
            </div>
          </div>
          <div class="flex gap-1">
            <button class="btn btn-danger btn-icon-sm" @click.stop="deleteEx(ex)">🗑</button>
            <div class="chevron-icon" :class="{ open: openId === ex.id }">›</div>
          </div>
        </div>

        <div v-if="openId === ex.id" class="ex-body">
          <div class="field-row">
            <div class="field-group flex-1"><label class="field-label">Nombre</label>
              <input v-model="ef[ex.id].name" /></div>
            <div class="field-group" style="width:90px"><label class="field-label">Descanso (s)</label>
              <input type="number" v-model.number="ef[ex.id].rest_seconds" /></div>
          </div>
          <div class="field-group"><label class="field-label">Notas</label>
            <input v-model="ef[ex.id].notes" placeholder="Técnica, RPE..." /></div>
          <button class="btn btn-filled btn-sm mt-2" @click="saveMeta(ex)">Guardar datos</button>

          <div class="divider mt-3 mb-2"></div>
          <div class="section-header" style="padding-top:0;margin-bottom:8px">Series objetivo</div>

          <div class="tpl-table" v-if="ef[ex.id].templates.length">
            <div class="tpl-head"><span>#</span><span>KG</span><span>REPS</span><span></span></div>
            <div v-for="(t,i) in ef[ex.id].templates" :key="i" class="tpl-row">
              <span class="tpl-num">{{ i+1 }}</span>
              <input type="number" class="input-num" v-model.number="t.target_weight_kg" placeholder="—" step="0.5" />
              <input type="number" class="input-num" v-model.number="t.target_reps" placeholder="—" />
              <button class="btn btn-danger btn-icon-sm" @click="ef[ex.id].templates.splice(i,1)">✕</button>
            </div>
          </div>
          <div class="flex gap-2 mt-2">
            <button class="btn btn-filled btn-sm" @click="ef[ex.id].templates.push({target_weight_kg:null,target_reps:null})">+ Serie</button>
            <button class="btn btn-primary btn-sm" @click="saveTpls(ex)">💾 Guardar series</button>
          </div>
        </div>
      </div>

      <div class="add-row" @click="showAdd = !showAdd">+ Agregar ejercicio</div>

      <div v-if="showAdd" class="ex-card" style="padding:16px">
        <div class="field-row">
          <div class="field-group flex-1"><label class="field-label">Nombre</label>
            <input v-model="addF.name" placeholder="Ej: Press inclinado" /></div>
          <div class="field-group" style="width:90px"><label class="field-label">Descanso (s)</label>
            <input type="number" v-model.number="addF.rest_seconds" /></div>
        </div>
        <div class="field-group mt-2"><label class="field-label">Notas</label>
          <input v-model="addF.notes" placeholder="Técnica..." /></div>

        <div class="section-header" style="padding-top:12px;margin-bottom:8px">Series objetivo</div>
        <div class="tpl-table" v-if="addF.templates.length">
          <div class="tpl-head"><span>#</span><span>KG</span><span>REPS</span><span></span></div>
          <div v-for="(t,i) in addF.templates" :key="i" class="tpl-row">
            <span class="tpl-num">{{ i+1 }}</span>
            <input type="number" class="input-num" v-model.number="t.target_weight_kg" placeholder="—" step="0.5" />
            <input type="number" class="input-num" v-model.number="t.target_reps" placeholder="—" />
            <button class="btn btn-danger btn-icon-sm" @click="addF.templates.splice(i,1)">✕</button>
          </div>
        </div>
        <button class="btn btn-filled btn-sm mt-2" @click="addF.templates.push({target_weight_kg:null,target_reps:null})">+ Serie</button>
        <div class="flex gap-2 mt-3" style="justify-content:flex-end">
          <button class="btn btn-filled btn-sm" @click="showAdd=false">Cancelar</button>
          <button class="btn btn-primary btn-sm" @click="addExercise" :disabled="!addF.name">Agregar</button>
        </div>
      </div>
    </div>

    <!-- Edit routine modal -->
    <div v-if="showEditRoutine" class="modal-backdrop" @click.self="showEditRoutine=false">
      <div class="modal">
        <div class="modal-handle"></div>
        <div class="modal-title">Editar rutina</div>
        <div class="flex-col gap-3">
          <div class="field-group"><label class="field-label">Nombre</label><input v-model="rf.name" /></div>
          <div class="field-group"><label class="field-label">Día</label><input v-model="rf.day_label" /></div>
          <div class="field-group"><label class="field-label">Descripción</label><input v-model="rf.description" /></div>
          <div class="flex gap-2 mt-2" style="justify-content:space-between">
            <button class="btn btn-danger btn-sm" @click="deleteRoutine">Eliminar</button>
            <div class="flex gap-2">
              <button class="btn btn-filled" @click="showEditRoutine=false">Cancelar</button>
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

const route = useRoute(); const router = useRouter()
const routine = ref(null); const openId = ref(null); const showAdd = ref(false); const showEditRoutine = ref(false)
const ef = reactive({}); const rf = ref({}); const addF = ref({ name:'', rest_seconds:90, notes:'', templates:[] })
const formatRest = s => s >= 60 ? `${Math.floor(s/60)}min` : `${s}s`

const load = async () => {
  routine.value = await api.getRoutine(route.params.id)
  rf.value = { name: routine.value.name, day_label: routine.value.day_label, description: routine.value.description }
  for (const ex of routine.value.exercises) {
    ef[ex.id] = { name: ex.name, rest_seconds: ex.rest_seconds, notes: ex.notes||'',
      templates: ex.set_templates.map(t => ({ target_weight_kg: t.target_weight_kg, target_reps: t.target_reps })) }
  }
}
const toggle = id => { openId.value = openId.value === id ? null : id }
const saveMeta = async ex => { await api.updateExercise(routine.value.id, ex.id, ef[ex.id]); await load() }
const saveTpls = async ex => { await api.updateSetTemplates(routine.value.id, ex.id, ef[ex.id].templates.map(t=>({target_weight_kg:t.target_weight_kg??null,target_reps:t.target_reps??null}))); await load() }
const deleteEx = async ex => { if(!confirm(`Eliminar "${ex.name}"?`)) return; await api.deleteExercise(routine.value.id, ex.id); await load() }
const addExercise = async () => { await api.addExercise(routine.value.id,{name:addF.value.name,rest_seconds:addF.value.rest_seconds,notes:addF.value.notes,set_templates:addF.value.templates}); addF.value={name:'',rest_seconds:90,notes:'',templates:[]}; showAdd.value=false; await load() }
const saveRoutine = async () => { await api.updateRoutine(routine.value.id, rf.value); showEditRoutine.value=false; await load() }
const deleteRoutine = async () => { if(!confirm('¿Eliminar esta rutina?')) return; await api.deleteRoutine(routine.value.id); router.push('/routines') }
onMounted(load)
</script>

<style scoped>
.ex-list { display: flex; flex-direction: column; gap: 8px; }
.ex-card { background: var(--bg2); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); overflow: hidden; }
.ex-header { display: flex; align-items: flex-start; gap: 10px; padding: 13px 14px; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ex-header:active { background: var(--bg3); }
.ex-num { font-size: 1.25rem; font-weight: 700; color: var(--text4); min-width: 22px; padding-top: 1px; }
.ex-info { flex: 1; min-width: 0; }
.ex-name { font-size: 0.9375rem; font-weight: 600; margin-bottom: 5px; }
.ex-chips { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 5px; }
.tpl-pills { display: flex; flex-wrap: wrap; gap: 4px; }
.pill { font-size: 0.6875rem; }
.chevron-icon { font-size: 1.4rem; color: var(--text4); transition: transform 0.2s; padding-top: 2px; }
.chevron-icon.open { transform: rotate(90deg); }
.ex-body { border-top: 1px solid var(--separator); padding: 14px; display: flex; flex-direction: column; gap: 10px; background: var(--bg3); }
.field-row { display: flex; gap: 10px; }
.tpl-table { margin-bottom: 4px; }
.tpl-head { display: grid; grid-template-columns: 28px 1fr 1fr 28px; gap: 6px; padding-bottom: 5px; border-bottom: 1px solid var(--separator); }
.tpl-head span { font-size: 0.6875rem; font-weight: 600; color: var(--text4); text-transform: uppercase; letter-spacing: .04em; }
.tpl-row { display: grid; grid-template-columns: 28px 1fr 1fr 28px; gap: 6px; align-items: center; padding: 5px 0; border-bottom: 1px solid var(--separator); }
.tpl-num { font-size: 1rem; font-weight: 700; color: var(--accent); }
.add-row { padding: 14px 16px; text-align: center; color: var(--accent); font-weight: 600; font-size: 0.9375rem; background: var(--bg2); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); cursor: pointer; -webkit-tap-highlight-color: transparent; }
.add-row:active { opacity: 0.7; }
</style>
