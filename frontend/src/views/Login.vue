<template>
  <div class="login-page">
    <div class="login-box">
      <div class="login-hero">
        <div class="login-icon">💪</div>
        <h1 class="login-title">GymTracker</h1>
        <p class="login-sub">Tu entrenamiento, en orden.</p>
      </div>

      <div class="segmented" :style="{ gridTemplateColumns: '1fr 1fr' }">
        <button class="segmented-btn" :class="{ active: mode === 'login' }" @click="mode = 'login'">Ingresar</button>
        <button class="segmented-btn" :class="{ active: mode === 'register' }" @click="mode = 'register'">Registrarse</button>
      </div>

      <div class="login-form">
        <div v-if="mode === 'register'" class="field-group">
          <label class="field-label">Nombre</label>
          <input v-model="form.display_name" placeholder="Ej: Mauro" autocomplete="name" />
        </div>
        <div class="field-group">
          <label class="field-label">Usuario</label>
          <input v-model="form.username" placeholder="tu_usuario" autocomplete="username" />
        </div>
        <div class="field-group">
          <label class="field-label">Contraseña</label>
          <input v-model="form.password" type="password" placeholder="••••••" autocomplete="current-password" @keydown.enter="submit" />
        </div>

        <div v-if="error" class="error-banner">{{ error }}</div>

        <button class="btn btn-primary btn-wide" style="margin-top:4px" @click="submit" :disabled="loading">
          {{ loading ? 'Cargando...' : mode === 'login' ? 'Ingresar' : 'Crear cuenta' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useThemeStore } from '../stores/theme'

const router = useRouter()
const auth = useAuthStore()
useThemeStore() // init theme
const mode = ref('login')
const loading = ref(false)
const error = ref('')
const form = ref({ username: '', password: '', display_name: '' })

const submit = async () => {
  error.value = ''
  loading.value = true
  try {
    if (mode.value === 'login') await auth.login(form.value.username, form.value.password)
    else await auth.register(form.value.username, form.value.password, form.value.display_name)
    router.push('/')
  } catch (e) { error.value = e.message }
  finally { loading.value = false }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: var(--bg); padding: 24px 16px;
}
.login-box { width: 100%; max-width: 380px; display: flex; flex-direction: column; gap: 20px; }
.login-hero { text-align: center; padding: 12px 0; }
.login-icon { font-size: 3.5rem; margin-bottom: 12px; line-height: 1; }
.login-title { font-size: 2rem; font-weight: 700; letter-spacing: -0.03em; }
.login-sub { color: var(--text3); font-size: 1rem; margin-top: 4px; }
.login-form { display: flex; flex-direction: column; gap: 14px; }
.error-banner {
  background: var(--danger-bg); border-radius: var(--radius-sm);
  padding: 10px 14px; color: var(--danger); font-size: 0.875rem; font-weight: 500;
}
</style>
