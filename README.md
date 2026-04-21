# 🏋️ GymTracker

App para seguimiento de rutinas de gimnasio. Stack: Vue 3 + Vite · Node.js + Express · SQLite.

## Desarrollo local

### 1. Backend
```bash
cd backend
npm install
node server.js
# Corre en http://localhost:3000
```

### 2. Frontend (en otra terminal)
```bash
cd frontend
npm install
npm run dev
# Corre en http://localhost:5173 con proxy a :3000
```

La base de datos SQLite se crea automáticamente en `data/gymtracker.db` con las 3 rutinas precargadas la primera vez.

---

## Deploy en Railway

### Opción A — desde GitHub (recomendada)

1. Subí el proyecto a un repo de GitHub
2. En [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo**
3. Seleccioná el repo. Railway detecta el `Dockerfile` automáticamente.
4. En la pestaña **Variables** del servicio, agregá:
   - `PORT` = `3000` (Railway ya lo setea, pero por las dudas)
5. En **Settings → Volumes**, creá un volumen persistente:
   - Mount path: `/data`
   - Esto asegura que el SQLite **no se pierda** entre deploys
6. Hacé deploy. En ~2 min la app está online.

### Opción B — Railway CLI

```bash
npm install -g @railway/cli
railway login
railway init        # dentro de la carpeta gymtracker/
railway up
```

### ⚠️ Volumen persistente (importante)

Sin el volumen, los datos se pierden en cada redeploy. Configurarlo es crucial:

Railway → tu servicio → **Volumes** → **Add Volume** → mount en `/data`

---

## Estructura del proyecto

```
gymtracker/
├── backend/
│   ├── server.js          # Entry point Express
│   ├── db.js              # SQLite + schema + seed
│   └── routes/
│       ├── routines.js    # CRUD rutinas y ejercicios
│       ├── sessions.js    # Log de sesiones y sets
│       └── stats.js       # Progresión, PRs, volumen
├── frontend/
│   ├── src/
│   │   ├── views/
│   │   │   ├── Dashboard.vue
│   │   │   ├── Routines.vue
│   │   │   ├── RoutineDetail.vue
│   │   │   ├── Workout.vue      # Tracking en vivo
│   │   │   ├── History.vue
│   │   │   └── Stats.vue        # Charts Chart.js
│   │   ├── composables/api.js   # Fetch wrapper
│   │   ├── router.js
│   │   ├── App.vue
│   │   └── style.css
│   └── vite.config.js
├── Dockerfile
├── railway.json
└── .dockerignore
```

## API endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/routines | Listar rutinas |
| GET | /api/routines/:id | Rutina con ejercicios |
| POST | /api/routines | Crear rutina |
| PUT | /api/routines/:id | Editar rutina |
| DELETE | /api/routines/:id | Eliminar rutina |
| POST | /api/routines/:id/exercises | Agregar ejercicio |
| PUT | /api/routines/:id/exercises/:eid | Editar ejercicio |
| DELETE | /api/routines/:id/exercises/:eid | Eliminar ejercicio |
| GET | /api/sessions | Listar sesiones (paginado) |
| POST | /api/sessions | Iniciar sesión |
| PUT | /api/sessions/:id/finish | Finalizar sesión |
| POST | /api/sessions/:id/sets | Registrar set |
| GET | /api/stats/prs | Records personales |
| GET | /api/stats/weekly-volume | Volumen por semana |
| GET | /api/stats/exercise/:id | Progresión ejercicio |
| GET | /api/stats/summary | Resumen general |
