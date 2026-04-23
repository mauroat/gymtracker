<template>
  <div class="page fade-in" v-if="routine">
    <!-- Header -->
    <div class="workout-top">
      <div class="workout-title-row">
        <div>
          <div class="caption">Sesión activa</div>
          <h2 class="title-2">{{ routine.name }}</h2>
          <div class="caption" style="margin-top:1px">{{ elapsedTime }} · {{ totalLogged }}/{{ totalPlanned }} series</div>
        </div>
        <button class="btn btn-primary" @click="finishWorkout">Finalizar</button>
      </div>
      <div class="progress-track mt-2">
        <div class="progress-fill" :style="{ width: pct + '%' }"></div>
      </div>
    </div>

    <div class="ex-workout-list">
      <div v-for="ex in routine.exercises" :key="ex.id"
        class="ex-workout-card" :class="{ active: openId === ex.id, done: isDone(ex) }">

        <div class="ex-workout-header" @click="toggle(ex.id)">
          <div class="done-dot">
            <span v-if="isDone(ex)" class="check-icon">✓</span>
            <span v-else class="dot-icon"></span>
          </div>
          <div class="ex-workout-info">
            <div class="ex-workout-name" :class="{ striked: isDone(ex) }">{{ ex.name }}</div>
            <div class="caption">{{ ex.set_templates.length }} series · {{ formatRest(ex.rest_seconds) }} descanso</div>
          </div>
          <div class="flex items-center gap-2">
            <span v-if="logged(ex.id).length" class="badge" :class="isDone(ex) ? 'badge-success' : 'badge-accent'">
              {{ logged(ex.id).length }}/{{ ex.set_templates.length }}
            </span>
            <div class="chevron-icon" :class="{ open: openId === ex.id }">›</div>
          </div>
        </div>

        <div v-if="openId === ex.id" class="sets-body">
          <div v-for="(tpl, i) in ex.set_templates" :key="i"
            class="set-item" :class="{ logged: isLogged(ex.id, i+1) }">

            <div class="set-top">
              <div class="set-num">{{ i+1 }}</div>
              <div class="set-hints">
                <span v-if="tpl.target_weight_kg != null || tpl.target_reps != null" class="hint-target">
                  🎯 {{ tpl.target_weight_kg != null ? tpl.target_weight_kg+'kg' : '—' }}×{{ tpl.target_reps ?? '—' }}
                </span>
                <span v-if="prMap[ex.id]" class="hint-pr">🏆 PR: {{ prMap[ex.id] }}kg</span>
              </div>
            </div>

            <div v-if="!isLogged(ex.id, i+1)" class="set-inputs">
              <div class="set-field"><label>kg</label>
                <input type="number" step="0.5" v-model.number="inputs[ex.id][i].weight_kg" :placeholder="tpl.target_weight_kg ?? ''" class="input-num" /></div>
              <div class="set-field"><label>reps</label>
                <input type="number" v-model.number="inputs[ex.id][i].reps_done" :placeholder="tpl.target_reps ?? ''" class="input-num" /></div>
              <div class="set-field"><label>RPE</label>
                <input type="number" min="1" max="10" v-model.number="inputs[ex.id][i].rpe" placeholder="8" class="input-num" style="width:52px" /></div>
              <button class="btn btn-primary btn-sm" @click="logSet(ex, i)">✓</button>
            </div>

            <div v-else class="set-logged">
              <span class="logged-kg">{{ getLogged(ex.id, i+1)?.weight_kg ?? '—' }}<small>kg</small></span>
              <span class="logged-sep">×</span>
              <span class="logged-reps">{{ getLogged(ex.id, i+1)?.reps_done ?? '—' }}</span>
              <span v-if="getLogged(ex.id,i+1)?.rpe" class="logged-rpe">RPE {{ getLogged(ex.id,i+1).rpe }}</span>
              <button class="btn btn-danger btn-icon-sm" style="margin-left:auto" @click="unlog(ex.id,i+1)">↩</button>
            </div>
          </div>

          <!-- Rest timer -->
          <div v-if="timers[ex.id] > 0" class="rest-box">
            <div><div class="caption">Descansando</div>
              <div class="rest-val">{{ fmt(timers[ex.id]) }}</div></div>
            <button class="btn btn-filled btn-sm" @click="clearTimer(ex.id)">Saltear</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Sesión activa banner (shown on other pages via App.vue) -->
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../composables/api'

const route = useRoute(); const router = useRouter()
const routine = ref(null); const sessionId = ref(null); const allSets = ref([])
const openId = ref(null); const inputs = reactive({}); const timers = reactive({}); const tIntervals = {}
const prMap = ref({}); const startTime = ref(Date.now()); const elapsedTime = ref('0:00'); let clock

const STORAGE_KEY = 'gym_active_session'

const formatRest = s => s >= 60 ? `${Math.floor(s/60)}min` : `${s}s`
const fmt = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`
const logged = exId => allSets.value.filter(s => s.exercise_id === exId)
const getLogged = (exId, n) => allSets.value.find(s => s.exercise_id === exId && s.set_number === n)
const isLogged = (exId, n) => !!getLogged(exId, n)
const isDone = ex => ex.set_templates.length > 0 && logged(ex.id).length >= ex.set_templates.length
const totalPlanned = computed(() => (routine.value?.exercises||[]).reduce((a,ex)=>a+ex.set_templates.length,0))
const totalLogged = computed(() => allSets.value.length)
const pct = computed(() => totalPlanned.value ? Math.round(totalLogged.value/totalPlanned.value*100) : 0)
const toggle = id => { openId.value = openId.value === id ? null : id }

// Persist active session so tab switches don't lose it
function saveActiveSession() {
  if (sessionId.value) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      sessionId: sessionId.value,
      routineId: route.params.routineId,
      startTime: startTime.value,
    }))
  }
}
function clearActiveSession() {
  localStorage.removeItem(STORAGE_KEY)
}

const logSet = async (ex, i) => {
  const inp = inputs[ex.id][i]; const tpl = ex.set_templates[i]
  const set = await api.logSet(sessionId.value, {
    exercise_id: ex.id, set_number: i+1,
    weight_kg: inp.weight_kg ?? tpl.target_weight_kg ?? null,
    reps_done: inp.reps_done ?? tpl.target_reps ?? null,
    rpe: inp.rpe || null,
  })
  allSets.value.push({...set, exercise_id: ex.id})
  if (ex.rest_seconds > 0) {
    timers[ex.id] = ex.rest_seconds; clearInterval(tIntervals[ex.id])
    tIntervals[ex.id] = setInterval(() => { if(timers[ex.id]<=1){timers[ex.id]=0;clearInterval(tIntervals[ex.id])}else timers[ex.id]-- }, 1000)
  }
  const next = i+1
  if (next < ex.set_templates.length) {
    inputs[ex.id][next].weight_kg = inp.weight_kg ?? tpl.target_weight_kg ?? null
    inputs[ex.id][next].reps_done = null; inputs[ex.id][next].rpe = null
  }
}
const unlog = async (exId, n) => { const s=getLogged(exId,n); if(!s) return; await api.deleteSet(sessionId.value,s.id); allSets.value=allSets.value.filter(x=>x.id!==s.id) }
const clearTimer = id => { timers[id]=0; clearInterval(tIntervals[id]) }

const finishWorkout = async () => {
  await api.finishSession(sessionId.value)
  clearActiveSession()
  router.push('/')
}

onMounted(async () => {
  const routineId = route.params.routineId

  // Determine session: from URL param, localStorage, or create new
  let sid = route.query.session ? parseInt(route.query.session) : null

  if (!sid) {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Only restore if same routine
        if (String(parsed.routineId) === String(routineId)) {
          sid = parsed.sessionId
          startTime.value = parsed.startTime || Date.now()
        }
      } catch {}
    }
  }

  routine.value = await api.getRoutine(routineId)

  if (sid) {
    // Verify session still exists and isn't finished
    try {
      const sess = await api.getSession(sid)
      if (sess && !sess.finished_at) {
        sessionId.value = sid
        allSets.value = (sess.sets||[]).map(s=>({...s}))
      } else {
        // Session finished or not found — start fresh
        sid = null
      }
    } catch {
      sid = null
    }
  }

  if (!sid) {
    const sess = await api.startSession(routineId)
    sessionId.value = sess.id
    startTime.value = Date.now()
  }

  // Always sync URL and localStorage
  router.replace(`/workout/${routineId}?session=${sessionId.value}`)
  saveActiveSession()

  // Init inputs
  for (const ex of routine.value.exercises) {
    inputs[ex.id] = ex.set_templates.map(t => ({
      weight_kg: t.target_weight_kg ?? null,
      reps_done: t.target_reps ?? null,
      rpe: null,
    }))
    timers[ex.id] = 0
  }

  // Prefill weight from last logged set (already in allSets)
  for (const ex of routine.value.exercises) {
    const exSets = allSets.value.filter(s => s.exercise_id === ex.id)
    const nextIdx = exSets.length
    if (nextIdx < ex.set_templates.length && nextIdx > 0) {
      const lastSet = exSets[nextIdx - 1]
      inputs[ex.id][nextIdx].weight_kg = lastSet.weight_kg
    }
  }

  // Open first incomplete
  const first = routine.value.exercises.find(ex => !isDone(ex)) || routine.value.exercises[0]
  if (first) openId.value = first.id

  prMap.value = Object.fromEntries((await api.getPRs()).map(p => [p.exercise_id, p.pr_weight]))

  clock = setInterval(() => {
    const s=Math.floor((Date.now()-startTime.value)/1000)
    elapsedTime.value=`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`
  }, 1000)
})

onUnmounted(() => { clearInterval(clock); Object.values(tIntervals).forEach(clearInterval) })
</script>

<style scoped>
.workout-top { margin-bottom: 16px; }
.workout-title-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.ex-workout-list { display: flex; flex-direction: column; gap: 8px; }
.ex-workout-card { background: var(--bg2); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); overflow: hidden; transition: box-shadow 0.15s; }
.ex-workout-card.active { box-shadow: 0 0 0 2px var(--accent), var(--shadow-md); }
.ex-workout-card.done { opacity: 0.75; }
.ex-workout-header { display: flex; align-items: center; gap: 10px; padding: 13px 14px; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.ex-workout-header:active { background: var(--bg3); }
.done-dot { width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.check-icon { color: var(--success); font-size: 1rem; font-weight: 700; }
.dot-icon { width: 9px; height: 9px; border-radius: 50%; background: var(--bg5); display: block; }
.ex-workout-info { flex: 1; min-width: 0; }
.ex-workout-name { font-size: 0.9375rem; font-weight: 600; }
.ex-workout-name.striked { text-decoration: line-through; color: var(--text3); }
.chevron-icon { font-size: 1.4rem; color: var(--text4); transition: transform 0.2s; }
.chevron-icon.open { transform: rotate(90deg); }
.sets-body { border-top: 1px solid var(--separator); background: var(--bg3); padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; }
.set-item { background: var(--bg2); border-radius: var(--radius-sm); padding: 10px 12px; display: flex; flex-direction: column; gap: 7px; transition: background 0.15s; }
.set-item.logged { background: var(--success-bg); }
.set-top { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.set-num { font-size: 1.1rem; font-weight: 700; color: var(--accent); min-width: 18px; }
.set-hints { display: flex; gap: 10px; flex-wrap: wrap; }
.hint-target, .hint-pr { font-size: 0.8125rem; color: var(--text3); }
.hint-pr { color: var(--warning); }
.set-inputs { display: flex; align-items: flex-end; gap: 8px; flex-wrap: wrap; }
.set-field { display: flex; flex-direction: column; gap: 3px; }
.set-field label { font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: var(--text4); }
.set-logged { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.logged-kg { font-size: 1.375rem; font-weight: 700; color: var(--success); letter-spacing: -0.02em; }
.logged-kg small { font-size: 0.75rem; font-weight: 500; margin-left: 1px; }
.logged-sep { color: var(--text4); }
.logged-reps { font-size: 1.375rem; font-weight: 700; color: var(--success); }
.logged-rpe { font-size: 0.75rem; background: var(--bg4); padding: 2px 8px; border-radius: 99px; color: var(--text3); }
.rest-box { display: flex; align-items: center; justify-content: space-between; background: var(--accent-bg); border-radius: var(--radius-sm); padding: 10px 14px; margin-top: 2px; }
.rest-val { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.03em; color: var(--accent); line-height: 1; }
</style>
