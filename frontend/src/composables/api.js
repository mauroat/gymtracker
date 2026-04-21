const BASE = '/api'

function getToken() {
  return localStorage.getItem('gym_token')
}

async function req(method, url, body) {
  const token = getToken()
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(BASE + url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 401) {
    localStorage.removeItem('gym_token')
    localStorage.removeItem('gym_user')
    window.location.href = '/login'
    return
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error desconocido' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  // Auth
  register: (data) => req('POST', '/auth/register', data),
  login: (data) => req('POST', '/auth/login', data),
  me: () => req('GET', '/auth/me'),

  // Routines
  getRoutines: () => req('GET', '/routines'),
  getRoutine: (id) => req('GET', `/routines/${id}`),
  createRoutine: (data) => req('POST', '/routines', data),
  updateRoutine: (id, data) => req('PUT', `/routines/${id}`, data),
  deleteRoutine: (id) => req('DELETE', `/routines/${id}`),

  // Exercises
  addExercise: (routineId, data) => req('POST', `/routines/${routineId}/exercises`, data),
  updateExercise: (routineId, exId, data) => req('PUT', `/routines/${routineId}/exercises/${exId}`, data),
  updateSetTemplates: (routineId, exId, templates) =>
    req('PUT', `/routines/${routineId}/exercises/${exId}/templates`, { set_templates: templates }),
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
  getExerciseProgress: (exId) => req('GET', `/stats/exercise/${exId}`),
  getWeeklyVolume: () => req('GET', '/stats/weekly-volume'),
  getPRs: () => req('GET', '/stats/prs'),
  getSummary: () => req('GET', '/stats/summary'),
}
