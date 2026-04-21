<template>
  <div class="app-layout" :class="{ 'no-sidebar': isLoginPage }">
    <nav v-if="!isLoginPage" class="sidebar">
      <div class="sidebar-logo">
        <span class="logo-text">GYM</span>
        <span class="logo-accent">TRACKER</span>
      </div>
      <div class="sidebar-nav">
        <RouterLink to="/" class="nav-item" :class="{ active: $route.path === '/' }">
          <span class="nav-icon">⚡</span><span>Dashboard</span>
        </RouterLink>
        <RouterLink to="/routines" class="nav-item" :class="{ active: $route.path.startsWith('/routine') }">
          <span class="nav-icon">📋</span><span>Rutinas</span>
        </RouterLink>
        <RouterLink to="/history" class="nav-item" :class="{ active: $route.path === '/history' }">
          <span class="nav-icon">📅</span><span>Historial</span>
        </RouterLink>
        <RouterLink to="/stats" class="nav-item" :class="{ active: $route.path === '/stats' }">
          <span class="nav-icon">📈</span><span>Estadísticas</span>
        </RouterLink>
      </div>
      <div class="sidebar-footer">
        <div class="user-chip">
          <div class="user-avatar">{{ avatarLetter }}</div>
          <div class="user-info">
            <div class="user-name">{{ auth.user?.display_name || auth.user?.username }}</div>
            <div class="user-username text-xs text-muted">@{{ auth.user?.username }}</div>
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" @click="logout" title="Cerrar sesión">⏏</button>
      </div>
    </nav>
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const isLoginPage = computed(() => route.path === '/login')
const avatarLetter = computed(() => {
  const name = auth.user?.display_name || auth.user?.username || '?'
  return name[0].toUpperCase()
})

const logout = () => {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.app-layout { display: flex; min-height: 100vh; }
.app-layout.no-sidebar { display: block; }

.sidebar {
  width: 220px; min-width: 220px;
  background: var(--bg2); border-right: 1px solid var(--border);
  display: flex; flex-direction: column;
  padding: 24px 0 0;
  position: sticky; top: 0; height: 100vh;
}

.sidebar-logo {
  padding: 0 20px 24px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 16px;
  font-family: var(--font-display); font-size: 1.5rem;
  letter-spacing: 0.1em; line-height: 1;
}
.logo-text { color: var(--text); }
.logo-accent { color: var(--accent); margin-left: 4px; }

.sidebar-nav { display: flex; flex-direction: column; gap: 2px; padding: 0 8px; flex: 1; }

.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: var(--radius);
  color: var(--text2); text-decoration: none;
  font-size: 14px; font-weight: 500; transition: all 0.15s;
}
.nav-item:hover { background: var(--bg3); color: var(--text); }
.nav-item.active { background: var(--accent-dim); color: var(--accent); }
.nav-icon { font-size: 16px; }

.sidebar-footer {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 12px 16px;
  border-top: 1px solid var(--border); margin-top: auto;
}
.user-chip { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.user-avatar {
  width: 30px; height: 30px; border-radius: 50%;
  background: var(--accent-dim); color: var(--accent);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display); font-size: 1rem;
  flex-shrink: 0;
}
.user-info { min-width: 0; }
.user-name { font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.main-content { flex: 1; overflow-y: auto; background: var(--bg); }

@media (max-width: 640px) {
  .app-layout { flex-direction: column; }
  .sidebar { width: 100%; height: auto; position: static; flex-direction: row; padding: 0; }
  .sidebar-logo { display: none; }
  .sidebar-nav { flex-direction: row; padding: 0; width: 100%; flex: unset; }
  .sidebar-footer { display: none; }
  .nav-item { flex: 1; justify-content: center; padding: 12px 4px; flex-direction: column; gap: 2px; font-size: 10px; }
  .nav-icon { font-size: 20px; }
}
</style>
