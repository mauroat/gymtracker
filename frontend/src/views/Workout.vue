<template>
  <div class="page fade-in" v-if="routine">
    <div class="workout-header">
      <div>
        <div class="text-xs text-muted" style="text-transform:uppercase;letter-spacing:.06em">En curso</div>
        <h2>{{ routine.name }}</h2>
        <div class="text-sm text-muted">{{ elapsedTime }}</div>
      </div>
      <button class="btn btn-primary" @click="finishWorkout">✓ Finalizar</button>
    </div>

    <div class="exercises-workout">
      <div
        v-for="ex in routine.exercises"
        :key="ex.id"
        class="ex-workout-card"
        :class="{ active: activeExId === ex.id }"
      >
        <div class="ex-workout-header" @click="toggleEx(ex.id)">
          <div>
            <div class="ex-workout-name">{{ ex.name }}</div>
            <div class="ex-workout-meta text-xs text-muted">
              {{ ex.sets }} × {{ ex.reps }} · {{ formatRest(ex.rest_seconds) }}
              <span v-if="ex.notes"> · {{ ex.notes }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="badge badge-accent" v-if="loggedSets(ex.id).length > 0">
              {{ loggedSets(ex.id).length }}/{{ ex.sets }}
            </span>
            <span class="chevron" :class="{ open: activeExId === ex.id }">›</span>
          </div>
        </div>

        <!-- Sets panel -->
        <div v-if="activeExId === ex.id" class="sets-panel">
          <!-- Logged sets -->
          <div v-if="loggedSets(ex.id).length > 0" class="logged-sets">
            <div class="sets-table-header">
              <span>SERIE</span><span>KG</span><span>REPS</span><span>RPE</span><span></span>
            </div>
            <div v-for="s in loggedSets(ex.id)" :key="s.id" class="set-row">
              <span class="set-num">{{ s.set_number }}</span>
              <span>{{ s.weight_kg ?? '—' }}</span>
              <span>{{ s.reps_done ?? '—' }}</span>
              <span>{{ s.rpe ?? '—' }}</span>
              <button class="btn btn-danger btn-icon btn-sm" @click="deleteSet(s)">✕</button>
            </div>
          </div>

          <!-- Log new set form -->
          <div class="log-set-form">
            <div class="log-set-title text-xs" style="text-transform:uppercase;letter-spacing:.06em;color:var(--text2);margin-bottom:8px">
              Serie {{ loggedSets(ex.id).length + 1 }}
            </div>
            <div class="log-inputs">
              <div class="form-group">
                <label>KG</label>
                <input type="number" v-model.number="setForm[ex.id].weight_kg" placeholder="80" step="0.5" />
              </div>
              <div class="form-group">
                <label>Reps</label>
                <input type="number" v-model.number="setForm[ex.id].reps_done" placeholder="8" />
              </div>
              <div class="form-group">
                <label>RPE</label>
                <input type="number" v-model.number="setForm[ex.id].rpe" placeholder="8" min="1" max="10" />
              </div>
            </div>
            <!-- PR hint -->
            <div v-if="prHint(ex.id)" class="pr-hint text-xs">
              🏆 PR: {{ prHint(ex.id) }} kg · Superalo!
            </div>
            <button class="btn btn-primary" style="width:100%;margin-top:8px" @click="logSet(ex)">
              ✓ Registrar serie
            </button>

            <!-- Rest timer -->
            <div v-if="restTimer[ex.id]" class="rest-timer">
              <div class="rest-label text-xs text-muted">Descansando...</div>
              <div class="rest-value font-display">{{ formatCountdown(restTimer[ex.id]) }}</div>
              <button class="btn btn-ghost btn-sm" @click="clearTimer(ex.id)">Saltear</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../composables/api'

const route = useRoute()
const router = useRouter()

const routine = ref(null)
const sessionId = ref(null)
const allSets = ref([])
const activeExId = ref(null)
const setForm = reactive({})
const restTimer = reactive({})
const timerIntervals = {}
const startTime = ref(Date.now())
const elapsedTime = ref('0:00')
const prs = ref([])

let clockInterval

const formatRest = (s) => s >= 60 ? `${Math.floor(s / 60)}min` : `${s}s`

const loggedSets = (exId) => allSets.value.filter(s => s.exercise_id === exId)

const prHint = (exId) => {
  const pr = prs.value.find(p => p.exercise_id === exId)
  return pr?.pr_weight ?? null
}

const toggleEx = (exId) => {
  activeExId.value = activeExId.value === exId ? null : exId
}

const logSet = async (ex) => {
  const form = setForm[ex.id]
  const setNumber = loggedSets(ex.id).length + 1
  const set = await api.logSet(sessionId.value, {
    exercise_id: ex.id,
    set_number: setNumber,
    weight_kg: form.weight_kg || null,
    reps_done: form.reps_done || null,
    rpe: form.rpe || null,
  })
  allSets.value.push({ ...set, exercise_id: ex.id })

  // Start rest timer
  if (ex.rest_seconds > 0) {
    restTimer[ex.id] = ex.rest_seconds
    if (timerIntervals[ex.id]) clearInterval(timerIntervals[ex.id])
    timerIntervals[ex.id] = setInterval(() => {
      if (restTimer[ex.id] <= 1) {
        restTimer[ex.id] = 0
        clearInterval(timerIntervals[ex.id])
      } else {
        restTimer[ex.id]--
      }
    }, 1000)
  }
  // Reset weight/rpe but keep last values as suggestion
}

const deleteSet = async (s) => {
  await api.deleteSet(sessionId.value, s.id)
  allSets.value = allSets.value.filter(x => x.id !== s.id)
}

const clearTimer = (exId) => {
  restTimer[exId] = 0
  clearInterval(timerIntervals[exId])
}

const formatCountdown = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

const finishWorkout = async () => {
  await api.finishSession(sessionId.value)
  router.push('/')
}

onMounted(async () => {
  routine.value = await api.getRoutine(route.params.routineId)

  // Get or create session
  if (route.query.session) {
    sessionId.value = parseInt(route.query.session)
    const sess = await api.getSession(sessionId.value)
    allSets.value = sess.sets || []
  } else {
    const sess = await api.startSession(route.params.routineId)
    sessionId.value = sess.id
    router.replace(`/workout/${route.params.routineId}?session=${sess.id}`)
  }

  // Init set forms
  for (const ex of routine.value.exercises) {
    setForm[ex.id] = { weight_kg: null, reps_done: null, rpe: null }
    restTimer[ex.id] = 0
  }
  if (routine.value.exercises.length > 0) {
    activeExId.value = routine.value.exercises[0].id
  }

  // Load PRs
  prs.value = await api.getPRs()

  // Clock
  clockInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime.value) / 1000)
    const m = Math.floor(elapsed / 60)
    const s = elapsed % 60
    elapsedTime.value = `${m}:${String(s).padStart(2, '0')}`
  }, 1000)
})

onUnmounted(() => {
  clearInterval(clockInterval)
  Object.values(timerIntervals).forEach(clearInterval)
})
</script>

<style scoped>
.workout-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 24px;
}

.exercises-workout { display: flex; flex-direction: column; gap: 8px; }

.ex-workout-card {
  background: var(--bg2); border: 1px solid var(--border);
  border-radius: var(--radius2); overflow: hidden; transition: border-color 0.15s;
}
.ex-workout-card.active { border-color: var(--accent); }

.ex-workout-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 16px; cursor: pointer;
}
.ex-workout-header:hover { background: var(--bg3); }
.ex-workout-name { font-weight: 500; font-size: 15px; }
.ex-workout-meta { margin-top: 2px; }

.chevron { font-size: 1.4rem; color: var(--text3); transition: transform 0.2s; display: block; }
.chevron.open { transform: rotate(90deg); }

.sets-panel { border-top: 1px solid var(--border); padding: 16px; background: var(--bg3); }

.logged-sets { margin-bottom: 16px; }
.sets-table-header {
  display: grid; grid-template-columns: 40px 80px 80px 60px 32px;
  font-size: 10px; letter-spacing: 0.06em; color: var(--text3);
  padding: 0 0 6px; border-bottom: 1px solid var(--border);
  text-transform: uppercase;
}
.set-row {
  display: grid; grid-template-columns: 40px 80px 80px 60px 32px;
  align-items: center; padding: 6px 0;
  border-bottom: 1px solid var(--border); font-size: 14px;
}
.set-num { font-family: var(--font-display); font-size: 1.1rem; color: var(--accent); }

.log-inputs { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }

.pr-hint {
  background: var(--accent-dim); color: var(--accent);
  border-radius: var(--radius); padding: 6px 10px; margin-top: 6px;
}

.rest-timer {
  display: flex; align-items: center; gap: 12px;
  background: var(--bg4); border-radius: var(--radius);
  padding: 10px 14px; margin-top: 10px;
}
.rest-value { font-size: 1.8rem; color: var(--accent); }
</style>
