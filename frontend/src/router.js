import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from './views/Dashboard.vue'
import Routines from './views/Routines.vue'
import RoutineDetail from './views/RoutineDetail.vue'
import Workout from './views/Workout.vue'
import History from './views/History.vue'
import Stats from './views/Stats.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Dashboard },
    { path: '/routines', component: Routines },
    { path: '/routines/:id', component: RoutineDetail },
    { path: '/workout/:routineId', component: Workout },
    { path: '/history', component: History },
    { path: '/stats', component: Stats },
  ]
})
