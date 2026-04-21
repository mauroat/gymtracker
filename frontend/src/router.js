import { createRouter, createWebHistory } from 'vue-router'
import Login from './views/Login.vue'
import Dashboard from './views/Dashboard.vue'
import Routines from './views/Routines.vue'
import RoutineDetail from './views/RoutineDetail.vue'
import Workout from './views/Workout.vue'
import History from './views/History.vue'
import Stats from './views/Stats.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: Login, meta: { public: true } },
    { path: '/', component: Dashboard },
    { path: '/routines', component: Routines },
    { path: '/routines/:id', component: RoutineDetail },
    { path: '/workout/:routineId', component: Workout },
    { path: '/history', component: History },
    { path: '/stats', component: Stats },
  ]
})

router.beforeEach((to) => {
  const token = localStorage.getItem('gym_token')
  if (!to.meta.public && !token) {
    return '/login'
  }
  if (to.path === '/login' && token) {
    return '/'
  }
})

export default router
