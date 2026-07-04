# Triathlon coach frontend

Application React (Vite + TypeScript + Tailwind) pour TriCouple.

## Installation

```bash
cd tricouple-frontend
npm install
```

## Lancement (avec le backend démarré sur :8000)

```bash
npm run dev
```

L'app est disponible sur `http://localhost:5173`

Le proxy Vite redirige automatiquement `/api/*` → `http://localhost:8000/*`

## Stack

- **React 18** + TypeScript
- **Vite** — bundler ultra-rapide
- **Tailwind CSS** — utilitaire CSS
- **React Query** — cache & synchronisation serveur
- **Zustand** — état global léger (semaine courante, vue active)
- **date-fns** — manipulation des dates

## Structure

```
src/
├── api/           # Appels axios vers le backend
├── components/
│   ├── planning/  # PlanningPage + SessionModal
│   ├── nutrition/ # NutritionPage + MealModal
│   ├── courses/   # CoursesPage
│   └── shared/    # BottomNav, Modal, Toast
├── hooks/         # useWeek, useTraining, useMeals
├── store/         # Zustand (weekOffset, viewMode, activePage)
├── types/         # Types TypeScript partagés
├── App.tsx
└── main.tsx
```

## Fonctionnalités

- **Planning** : vue semaine scrollable, onglets Benji / Hélène / Ensemble, types de séances par discipline, barres de charge
- **Nutrition** : génération auto des repas selon la charge réelle du planning, édition manuelle
- **Courses** : liste agrégée par catégorie, cochable, export vers Raccourcis Apple
