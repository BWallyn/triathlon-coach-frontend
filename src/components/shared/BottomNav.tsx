import { useAppStore } from '../../store'

const TABS = [
  { id: 'dashboard', icon: 'ti-layout', label: 'Dashboard' },
  { id: 'plan', icon: 'ti-calendar-week', label: 'Planning' },
  { id: 'coach', icon: 'ti-sparkles', label: 'Coach IA' },
  { id: 'sante', icon: 'ti-heartbeat', label: 'Santé' },
  { id: 'food', icon: 'ti-chef-hat', label: 'Nutrition' },
  { id: 'courses', icon: 'ti-shopping-cart', label: 'Courses' },
] as const

export default function BottomNav() {
  const { activePage, setActivePage } = useAppStore()

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-[rgba(244,246,244,0.92)] backdrop-blur-md border-t border-[#E4E8E4]">
      <div className="flex max-w-lg mx-auto">
        {TABS.map((tab) => {
          const active = activePage === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActivePage(tab.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 pb-safe text-[10px] font-medium tracking-wide transition-colors ${
                active ? 'text-teal' : 'text-[#A8B8A8]'
              }`}
            >
              <i className={`ti ${tab.icon} text-[22px]`} />
              {tab.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
