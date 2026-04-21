import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { api } from '../composables/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('gym_token') || null)
  const user = ref(JSON.parse(localStorage.getItem('gym_user') || 'null'))
  const theme = ref(localStorage.getItem('gym_theme') || 'light')

  const isLoggedIn = computed(() => !!token.value)

  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t)
  }
  applyTheme(theme.value)

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    localStorage.setItem('gym_theme', theme.value)
    applyTheme(theme.value)
  }

  async function login(username, password) {
    const res = await api.login({ username, password })
    token.value = res.token
    user.value = res.user
    localStorage.setItem('gym_token', res.token)
    localStorage.setItem('gym_user', JSON.stringify(res.user))
  }

  async function register(username, password, display_name) {
    const res = await api.register({ username, password, display_name })
    token.value = res.token
    user.value = res.user
    localStorage.setItem('gym_token', res.token)
    localStorage.setItem('gym_user', JSON.stringify(res.user))
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('gym_token')
    localStorage.removeItem('gym_user')
  }

  return { token, user, theme, isLoggedIn, login, register, logout, toggleTheme }
})
