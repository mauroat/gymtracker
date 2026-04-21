import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref(localStorage.getItem('gym_theme') || 'light')

  function apply(t) {
    document.documentElement.setAttribute('data-theme', t)
  }

  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  watch(theme, (t) => {
    localStorage.setItem('gym_theme', t)
    apply(t)
  }, { immediate: true })

  return { theme, toggle }
})
