import { useAppStore } from './store'
import BottomNav from './components/shared/BottomNav'
import { ToastProvider } from './components/shared/Toast'
import DashboardPage from './components/dashboard/DashboardPage'
import PlanningPage from './components/planning/PlanningPage'
import NutritionPage from './components/nutrition/NutritionPage'
import CoursesPage from './components/courses/CoursesPage'
import SantePage from './components/health/SantePage'
import RecipesPage from './components/nutrition/RecipesPage'
import CoachPage from './components/coach/CoachPage'
import RacesPage from './components/coach/RacesPage'

export default function App() {
  const activePage = useAppStore((s) => s.activePage)

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#F4F6F4]">
        {activePage === 'dashboard' && <DashboardPage />}
        {activePage === 'plan' && <PlanningPage />}
        {activePage === 'food' && <NutritionPage />}
        {activePage === 'courses' && <CoursesPage />}
        {activePage === 'sante' && <SantePage />}
        {activePage === 'recipes' && <RecipesPage />}
        {activePage === 'coach' && <CoachPage />}
        {activePage === 'races' && <RacesPage />}
        <BottomNav />
      </div>
    </ToastProvider>
  )
}