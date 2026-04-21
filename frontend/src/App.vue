<template>
  <div class="app-layout">
    <nav class="sidebar">
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
    </nav>
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 220px;
  min-width: 220px;
  background: var(--bg2);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 24px 0;
  position: sticky;
  top: 0;
  height: 100vh;
}

.sidebar-logo {
  padding: 0 20px 24px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 16px;
  font-family: var(--font-display);
  font-size: 1.5rem;
  letter-spacing: 0.1em;
  line-height: 1;
}
.logo-text { color: var(--text); }
.logo-accent { color: var(--accent); margin-left: 4px; }

.sidebar-nav { display: flex; flex-direction: column; gap: 2px; padding: 0 8px; }

.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: var(--radius);
  color: var(--text2); text-decoration: none;
  font-size: 14px; font-weight: 500;
  transition: all 0.15s;
}
.nav-item:hover { background: var(--bg3); color: var(--text); }
.nav-item.active { background: var(--accent-dim); color: var(--accent); }
.nav-icon { font-size: 16px; }

.main-content {
  flex: 1;
  overflow-y: auto;
  background: var(--bg);
}

@media (max-width: 640px) {
  .app-layout { flex-direction: column; }
  .sidebar {
    width: 100%; height: auto; position: static;
    flex-direction: row; padding: 0;
  }
  .sidebar-logo { display: none; }
  .sidebar-nav { flex-direction: row; padding: 0; width: 100%; }
  .nav-item { flex: 1; justify-content: center; padding: 12px 4px; flex-direction: column; gap: 2px; font-size: 10px; }
  .nav-icon { font-size: 20px; }
}
</style>
