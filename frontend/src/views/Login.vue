<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-logo">
        <span>GYM</span><span class="accent">TRACKER</span>
      </div>

      <div class="tabs">
        <button :class="{ active: mode === 'login' }" @click="mode = 'login'">Ingresar</button>
        <button :class="{ active: mode === 'register' }" @click="mode = 'register'">Registrarse</button>
      </div>

      <form class="login-form" @submit.prevent="submit">
        <div v-if="mode === 'register'" class="form-group">
          <label>Nombre</label>
          <input v-model="form.display_name" placeholder="Ej: Mauro" autocomplete="name" />
        </div>
        <div class="form-group">
          <label>Usuario</label>
          <input v-model="form.username" placeholder="tu_usuario" autocomplete="username" required />
        </div>
        <div class="form-group">
          <label>Contraseña</label>
          <input v-model="form.password" type="password" placeholder="••••••" autocomplete="current-password" required />
        </div>

        <div v-if="error" class="error-msg">{{ error }}</div>

        <button type="submit" class="btn btn-primary" style="width:100%;margin-top:8px" :disabled="loading">
          {{ loading ? 'Cargando...' : mode === 'login' ? 'Ingresar' : 'Crear cuenta' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const mode = ref('login')
const loading = ref(false)
const error = ref('')
const form = ref({ username: '', password: '', display_name: '' })

const submit = async () => {
  error.value = ''
  loading.value = true
  try {
    if (mode.value === 'login') {
      await auth.login(form.value.username, form.value.password)
    } else {
      await auth.register(form.value.username, form.value.password, form.value.display_name)
    }
    router.push('/')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: var(--bg);
  background-image: repeating-linear-gradient(
    0deg, transparent, transparent 39px,
    var(--border) 39px, var(--border) 40px
  ),
  repeating-linear-gradient(
    90deg, transparent, transparent 39px,
    var(--border) 39px, var(--border) 40px
  );
}

.login-card {
  background: var(--bg2); border: 1px solid var(--border2);
  border-radius: var(--radius2); padding: 36px 32px;
  width: 100%; max-width: 380px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.5);
  animation: fadeIn 0.25s ease;
}

.login-logo {
  font-family: var(--font-display); font-size: 2rem;
  letter-spacing: 0.1em; margin-bottom: 28px; text-align: center;
}
.accent { color: var(--accent); margin-left: 4px; }

.tabs {
  display: grid; grid-template-columns: 1fr 1fr;
  background: var(--bg3); border-radius: var(--radius);
  padding: 3px; margin-bottom: 24px; gap: 3px;
}
.tabs button {
  background: transparent; border: none; padding: 8px;
  border-radius: calc(var(--radius) - 2px); color: var(--text2);
  font-family: var(--font-body); font-size: 13px; font-weight: 500;
  cursor: pointer; transition: all 0.15s;
}
.tabs button.active { background: var(--bg4); color: var(--text); }

.login-form { display: flex; flex-direction: column; gap: 14px; }

.error-msg {
  background: var(--danger-dim); border: 1px solid var(--danger);
  border-radius: var(--radius); padding: 8px 12px;
  color: var(--danger); font-size: 13px;
}
</style>
