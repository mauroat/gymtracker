<template>
  <div class="app-layout">
    <!-- Sidebar: desktop only -->
    <nav v-if="!isAuthPage" class="sidebar">
      <div class="sidebar-logo">
        <span class="logo-mark">💪</span>
        <span class="logo-name">GymTracker</span>
      </div>
      <div class="sidebar-nav">
        <RouterLink v-for="tab in tabs" :key="tab.to" :to="tab.to"
          class="sidebar-item" :class="{ active: isActive(tab.to) }">
          <span class="sidebar-icon">{{ tab.icon }}</span>
          <span>{{ tab.label }}</span>
        </RouterLink>
      </div>
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="avatar">{{ avatarLetter }}</div>
          <div class="user-text">
            <div class="user-name truncate">{{ auth.user?.display_name || auth.user?.username }}</div>
            <div class="user-handle truncate">@{{ auth.user?.username }}</div>
          </div>
        </div>
        <div class="sidebar-actions">
          <button class="icon-btn" @click="themeStore.toggle()" :title="themeStore.theme === 'dark' ? 'Modo día' : 'Modo noche'">
            {{ themeStore.theme === 'dark' ? '☀️' : '🌙' }}
          </button>
          <button class="icon-btn" @click="logout" title="Cerrar sesión">⏏</button>
        </div>
      </div>
    </nav>

    <!-- Main content -->
    <main class="main-content">
      <RouterView />
    </main>

    <!-- Bottom tab bar: mobile only -->
    <nav v-if="!isAuthPage" class="tab-bar">
      <RouterLink v-for="tab in tabs" :key="tab.to" :to="tab.to"
        class="tab-item" :class="{ active: isActive(tab.to) }">
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
      </RouterLink>
    </nav>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useThemeStore } from './stores/theme'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const themeStore = useThemeStore()

const isAuthPage = computed(() => route.path === '/login')
const avatarLetter = computed(() => (auth.user?.display_name || auth.user?.username || '?')[0].toUpperCase())

const tabs = [
  { to: '/',         icon: '⚡', label: 'Inicio'   },
  { to: '/routines', icon: '📋', label: 'Rutinas'  },
  { to: '/history',  icon: '📅', label: 'Historial'},
  { to: '/stats',    icon: '📈', label: 'Stats'    },
]

const isActive = (to) => to === '/' ? route.path === '/' : route.path.startsWith(to)
const logout = () => { auth.logout(); router.push('/login') }
</script>

<style scoped>
.app-layout { display: flex; min-height: 100vh; background: var(--bg); }

/* ── Sidebar (desktop) ────── */
.sidebar {
  display: none;
  width: 240px; min-width: 240px; flex-shrink: 0;
  background: var(--bg2); border-right: 1px solid var(--separator);
  flex-direction: column; padding: 20px 0 0;
  position: sticky; top: 0; height: 100vh;
}
@media (min-width: 768px) { .sidebar { display: flex; } }

.sidebar-logo {
  display: flex; align-items: center; gap: 10px;
  padding: 0 20px 20px; border-bottom: 1px solid var(--separator); margin-bottom: 12px;
}
.logo-mark { font-size: 1.4rem; }
.logo-name  { font-size: 1.1rem; font-weight: 700; letter-spacing: -0.02em; color: var(--text); }

.sidebar-nav { display: flex; flex-direction: column; gap: 2px; padding: 0 10px; flex: 1; }
.sidebar-item {
  display: flex; align-items: center; gap: 10px; padding: 10px 12px;
  border-radius: var(--radius-sm); color: var(--text2); text-decoration: none;
  font-size: 0.9375rem; font-weight: 500; transition: all 0.15s;
}
.sidebar-item:hover { background: var(--bg3); color: var(--text); }
.sidebar-item.active { background: var(--accent-bg); color: var(--accent); font-weight: 600; }
.sidebar-icon { font-size: 1.1rem; width: 22px; text-align: center; }

.sidebar-footer {
  padding: 12px 14px calc(14px + var(--safe-bottom));
  border-top: 1px solid var(--separator);
}
.sidebar-user { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.avatar {
  width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
  background: var(--accent-bg); color: var(--accent);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.875rem; font-weight: 700;
}
.user-text { flex: 1; min-width: 0; }
.user-name  { font-size: 0.875rem; font-weight: 600; }
.user-handle { font-size: 0.75rem; color: var(--text3); }
.sidebar-actions { display: flex; gap: 6px; }
.icon-btn {
  background: var(--bg3); border: none; border-radius: var(--radius-sm);
  padding: 7px 9px; cursor: pointer; font-size: 1rem;
  transition: background 0.15s; -webkit-tap-highlight-color: transparent;
}
.icon-btn:active { background: var(--bg4); }

/* ── Main ────── */
.main-content { flex: 1; min-width: 0; }
@media (min-width: 768px) { .main-content { height: 100vh; overflow-y: auto; } }
</style>
