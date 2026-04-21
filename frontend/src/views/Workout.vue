<template>
  <div class="page fade-in" v-if="routine">
    <div class="workout-header">
      <div>
        <div class="text-xs text-muted" style="text-transform:uppercase;letter-spacing:.06em">Sesión activa</div>
        <h2>{{ routine.name }}</h2>
        <div class="text-sm text-muted">{{ elapsedTime }} · {{ totalSetsLogged }}/{{ totalSetsPlanned }} series</div>
      </div>
      <button class="btn btn-primary" @click="finishWorkout">✓ Finalizar</button>
    </div>

    <!-- Progress bar -->
    <div class="progress-bar-track">
      <div class="progress-bar-fill" :style="{ width: progressPct + '%' }"></div>
    </div>

    <div class="exercises-workout">
      <div
        v-for="ex in routine.exercises"
        :key="ex.id"
        class="ex-card"
        :class="{ active: activeExId === ex.id, done: isExDone(ex) }"
      >
        <div class="ex-card-header" @click="toggleEx(ex.id)">
          <div class="ex-done-indicator">
            <span v-if="isExDone(ex)" class="done-check">✓</span>
            <span v-else class="ex-dot"></span>
          </div>
          <div class="ex-card-info">
            <div class="ex-card-name">{{ ex.name }}</div>
            <div class="text-xs text-muted">
              {{ ex.set_templates.length }} series · {{ formatRest(ex.rest_seconds) }} descanso
              <span v-if="ex.notes"> · {{ ex.notes }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="badge badge-accent" v-if="loggedSets(ex.id).length > 0">
              {{ loggedSets(ex.id).length }}/{{ ex.set_templates.length }}
            </span>
            <span class="chevron" :class="{ open: activeExId === ex.id }">›</span>
          </div>
        </div>

        <!-- Sets panel -->
        <div v-if="activeExId === ex.id" class="sets-panel">

          <!-- One row per set template -->
          <div class="sets-list">
            <div
              v-for="(tpl, idx) in ex.set_templates"
              :key="idx"
              class="set-row-workout"
              :class="{ logged: isSetLogged(ex.id, idx + 1), current: currentSetIndex(ex.id) === idx }"
            >
              <div class="set-index">{{ idx + 1 }}</div>

              <!-- Target hint -->
              <div class="set-target">
                <span v-if="tpl.target_weight_kg != null || tpl.target_reps != null" class="target-hint">
                  🎯 {{ tpl.target_weight_kg != null ? tpl.target_weight_kg + ' kg' : '—' }} × {{ tpl.target_reps ?? '—' }}
                </span>
                <span v-if="prForSet(ex.id)" class="pr-hint">
                  🏆 PR: {{ prForSet(ex.id) }} kg
                </span>
              </div>

              <!-- Input fields or logged values -->
              <div v-if="!isSetLogged(ex.id, idx + 1)" class="set-inputs">
                <div class="set-field">
                  <label>kg</label>
                  <input
                    type="number" step="0.5"
                    v-model.number="setInputs[ex.id][idx].weight_kg"
                    :placeholder="tpl.target_weight_kg ?? ''"
                    class="set-input"
                  />
                </div>
                <div class="set-field">
                  <label>reps</label>
                  <input
                    type="number"
                    v-model.number="setInputs[ex.id][idx].reps_done"
                    :placeholder="tpl.target_reps ?? ''"
                    class="set-input"
                  />
                </div>
                <div class="set-field">
                  <label>RPE</label>
                  <input
                    type="number" min="1" max="10"
                    v-model.number="setInputs[ex.id][idx].rpe"
                    placeholder="8"
                    class="set-input rpe-input"
                  />
                </div>
                <button class="btn btn-primary btn-sm" @click="logSet(ex, idx)">✓</button>
              </div>

              <!-- Already logged -->
              <div v-else class="set-logged">
                <span class="logged-val">{{ getLoggedSet(ex.id, idx + 1)?.weight_kg ?? '—' }} kg</span>
                <span class="logged-sep">×</span>
                <span class="logged-val">{{ getLoggedSet(ex.id, idx + 1)?.reps_done ?? '—' }}</span>
                <span v-if="getLoggedSet(ex.id, idx + 1)?.rpe" class="logged-rpe">RPE {{ getLoggedSet(ex.id, idx + 1).rpe }}</span>
                <button class="btn btn-danger btn-icon btn-sm" @click="unlogSet(ex.id, idx + 1)" title="Deshacer">↩</button>
              </div>
            </div>
          </div>

          <!-- Rest timer -->
          <div v-if="restTimer[ex.id] > 0" class="rest-timer">
            <div>
              <div class="rest-label text-xs text-muted">Descansando</div>
              <div class="rest-value font-display">{{ formatCountdown(restTimer[ex.id]) }}</div>
            </div>
            <button class="btn btn-ghost btn-sm" @click="clearTimer(ex.id)">Saltear</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../composables/api'

const route = useRoute()
const router = useRouter()

const routine = ref(null)
const sessionId = ref(null)
const allSets = ref([])
const activeExId = ref(null)
const setInputs = reactive({})   // setInputs[exId][setIndex] = { weight_kg, reps_done, rpe }
const restTimer = reactive({})
const timerIntervals = {}
const prs = ref([])
const startTime = ref(Date.now())
const elapsedTime = ref('0:00')
let clockInterval

const formatRest = (s) => s >= 60 ? `${Math.floor(s / 60)}min` : `${s}s`
const formatCountdown = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

const loggedSets = (exId) => allSets.value.filter(s => s.exercise_id === exId)
const getLoggedSet = (exId, setNum) => allSets.value.find(s => s.exercise_id === exId && s.set_number === setNum)
const isSetLogged = (exId, setNum) => !!getLoggedSet(exId, setNum)
const isExDone = (ex) => ex.set_templates.length > 0 && loggedSets(ex.id).length >= ex.set_templates.length

const currentSetIndex = (exId) => {
  const ex = routine.value?.exercises.find(e => e.id === exId)
  if (!ex) return 0
  return loggedSets(exId).length  // index of next set to log
}

const prForSet = (exId) => {
  const pr = prs.value.find(p => p.exercise_id === exId)
  return pr?.pr_weight ?? null
}

const totalSetsPlanned = computed(() =>
  (routine.value?.exercises || []).reduce((acc, ex) => acc + ex.set_templates.length, 0)
)
const totalSetsLogged = computed(() => allSets.value.length)
const progressPct = computed(() =>
  totalSetsPlanned.value ? Math.round((totalSetsLogged.value / totalSetsPlanned.value) * 100) : 0
)

const toggleEx = (id) => { activeExId.value = activeExId.value === id ? null : id }

const logSet = async (ex, idx) => {
  const input = setInputs[ex.id][idx]
  const tpl = ex.set_templates[idx]
  const set = await api.logSet(sessionId.value, {
    exercise_id: ex.id,
    set_number: idx + 1,
    weight_kg: input.weight_kg ?? tpl.target_weight_kg ?? null,
    reps_done: input.reps_done ?? tpl.target_reps ?? null,
    rpe: input.rpe || null,
  })
  allSets.value.push({ ...set, exercise_id: ex.id })

  // Start rest timer
  if (ex.rest_seconds > 0) {
    restTimer[ex.id] = ex.rest_seconds
    clearInterval(timerIntervals[ex.id])
    timerIntervals[ex.id] = setInterval(() => {
      if (restTimer[ex.id] <= 1) { restTimer[ex.id] = 0; clearInterval(timerIntervals[ex.id]) }
      else restTimer[ex.id]--
    }, 1000)
  }

  // Auto-advance to next set: prefill from last logged
  const nextIdx = idx + 1
  if (nextIdx < ex.set_templates.length) {
    setInputs[ex.id][nextIdx].weight_kg = input.weight_kg ?? tpl.target_weight_kg ?? null
    setInputs[ex.id][nextIdx].reps_done = null
    setInputs[ex.id][nextIdx].rpe = null
  }
}

const unlogSet = async (exId, setNum) => {
  const s = getLoggedSet(exId, setNum)
  if (!s) return
  await api.deleteSet(sessionId.value, s.id)
  allSets.value = allSets.value.filter(x => x.id !== s.id)
}

const clearTimer = (exId) => { restTimer[exId] = 0; clearInterval(timerIntervals[exId]) }

const finishWorkout = async () => {
  await api.finishSession(sessionId.value)
  router.push('/')
}

onMounted(async () => {
  routine.value = await api.getRoutine(route.params.routineId)

  if (route.query.session) {
    sessionId.value = parseInt(route.query.session)
    const sess = await api.getSession(sessionId.value)
    allSets.value = (sess.sets || []).map(s => ({ ...s }))
  } else {
    const sess = await api.startSession(route.params.routineId)
    sessionId.value = sess.id
    router.replace(`/workout/${route.params.routineId}?session=${sess.id}`)
  }

  // Init inputs per exercise and set
  for (const ex of routine.value.exercises) {
    setInputs[ex.id] = ex.set_templates.map(tpl => ({
      weight_kg: tpl.target_weight_kg ?? null,
      reps_done: tpl.target_reps ?? null,
      rpe: null,
    }))
    restTimer[ex.id] = 0
  }

  // Open first incomplete exercise
  const first = routine.value.exercises.find(ex => !isExDone(ex)) || routine.value.exercises[0]
  if (first) activeExId.value = first.id

  prs.value = await api.getPRs()

  clockInterval = setInterval(() => {
    const s = Math.floor((Date.now() - startTime.value) / 1000)
    elapsedTime.value = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }, 1000)
})

onUnmounted(() => {
  clearInterval(clockInterval)
  Object.values(timerIntervals).forEach(clearInterval)
})
</script>

<style scoped>
.workout-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }

.progress-bar-track {
  height: 3px; background: var(--bg3); border-radius: 99px;
  margin-bottom: 20px; overflow: hidden;
}
.progress-bar-fill {
  height: 100%; background: var(--accent); border-radius: 99px;
  transition: width 0.4s ease;
}

.exercises-workout { display: flex; flex-direction: column; gap: 8px; }

.ex-card {
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: var(--radius2); overflow: hidden; transition: border-color 0.15s;
}
.ex-card.active { border-color: var(--accent); }
.ex-card.done { border-color: var(--success); opacity: 0.8; }
.ex-card.done .ex-card-name { text-decoration: line-through; color: var(--text2); }

.ex-card-header {
  display: flex; align-items: center; gap: 12px;
  padding: 13px 16px; cursor: pointer;
}
.ex-card-header:hover { background: var(--bg3); }

.ex-done-indicator { width: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.done-check { color: var(--success); font-size: 1rem; font-weight: 700; }
.ex-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--border2); display: block; }

.ex-card-info { flex: 1; }
.ex-card-name { font-weight: 500; font-size: 15px; margin-bottom: 2px; }
.chevron { font-size: 1.4rem; color: var(--text3); transition: transform 0.2s; }
.chevron.open { transform: rotate(90deg); }

.sets-panel { border-top: 1px solid var(--border); background: var(--bg3); padding: 12px 14px; }

.sets-list { display: flex; flex-direction: column; gap: 6px; }

.set-row-workout {
  background: var(--bg4); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 10px 12px;
  display: flex; flex-direction: column; gap: 6px;
  transition: border-color 0.15s;
}
.set-row-workout.current { border-color: var(--accent); }
.set-row-workout.logged { border-color: var(--success); background: var(--success-dim); }

.set-index {
  font-family: var(--font-display); font-size: 1.2rem; color: var(--accent);
  line-height: 1; margin-bottom: 2px;
}

.set-target { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.target-hint { font-size: 12px; color: var(--text2); }
.pr-hint { font-size: 12px; color: var(--accent); }

.set-inputs {
  display: flex; align-items: flex-end; gap: 8px; flex-wrap: wrap;
}
.set-field { display: flex; flex-direction: column; gap: 3px; }
.set-field label { font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: var(--text3); }
.set-input { width: 72px; padding: 6px 8px; font-size: 14px; text-align: center; }
.rpe-input { width: 56px; }

.set-logged {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.logged-val { font-family: var(--font-display); font-size: 1.3rem; color: var(--success); }
.logged-sep { color: var(--text3); }
.logged-rpe { font-size: 12px; color: var(--text3); background: var(--bg4); padding: 2px 6px; border-radius: 99px; }

.rest-timer {
  display: flex; align-items: center; justify-content: space-between;
  background: var(--bg2); border: 1px solid var(--border2);
  border-radius: var(--radius); padding: 10px 14px; margin-top: 10px;
}
.rest-label { font-size: 10px; text-transform: uppercase; letter-spacing: .06em; }
.rest-value { font-size: 2rem; color: var(--accent); line-height: 1; }
</style>
