const BASE = '/api'

async function req(method, url, body) {
  const res = await fetch(BASE + url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export const api = {
  // Routines
  getRoutines: () => req('GET', '/routines'),
  getRoutine: (id) => req('GET', `/routines/${id}`),
  createRoutine: (data) => req('POST', '/routines', data),
  updateRoutine: (id, data) => req('PUT', `/routines/${id}`, data),
  deleteRoutine: (id) => req('DELETE', `/routines/${id}`),

  // Exercises
  addExercise: (routineId, data) => req('POST', `/routines/${routineId}/exercises`, data),
  updateExercise: (routineId, exId, data) => req('PUT', `/routines/${routineId}/exercises/${exId}`, data),
  deleteExercise: (routineId, exId) => req('DELETE', `/routines/${routineId}/exercises/${exId}`),

  // Sessions
  getSessions: (limit = 20, offset = 0) => req('GET', `/sessions?limit=${limit}&offset=${offset}`),
  getSession: (id) => req('GET', `/sessions/${id}`),
  startSession: (routineId, notes = '') => req('POST', '/sessions', { routine_id: routineId, notes }),
  finishSession: (id) => req('PUT', `/sessions/${id}/finish`),
  deleteSession: (id) => req('DELETE', `/sessions/${id}`),

  // Sets
  logSet: (sessionId, data) => req('POST', `/sessions/${sessionId}/sets`, data),
  updateSet: (sessionId, setId, data) => req('PUT', `/sessions/${sessionId}/sets/${setId}`, data),
  deleteSet: (sessionId, setId) => req('DELETE', `/sessions/${sessionId}/sets/${setId}`),

  // Stats
  getExerciseProgress: (exerciseId) => req('GET', `/stats/exercise/${exerciseId}`),
  getWeeklyVolume: () => req('GET', '/stats/weekly-volume'),
  getPRs: () => req('GET', '/stats/prs'),
  getSummary: () => req('GET', '/stats/summary'),
}
