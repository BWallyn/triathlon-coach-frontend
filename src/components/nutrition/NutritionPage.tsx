import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useWeek } from '../../hooks/useWeek'
import { useMeals } from '../../hooks/useMeals'
import { useTraining, computeCharge } from '../../hooks/useTraining'
import { useToast } from '../shared/Toast'
import MealModal from './MealModal'
import type { Meal, Charge } from '../../types'
import BatchCookingModal from './BatchCookingModal'
import { useAppStore } from '../../store'

const CHARGE_LABEL: Record<Charge, string> = { high: 'Charge élevée', med: 'Charge modérée', low: 'Charge légère', rest: 'Repos' }
const CHARGE_CLS: Record<Charge, string> = {
  high: 'bg-amber-light text-amber-sport border-amber-mid',
  med: 'bg-teal-light text-teal border-teal-mid',
  low: 'bg-[#F4F6F4] text-[#6B7B6B] border-[#E4E8E4]',
  rest: 'bg-[#FCEBEB] text-[#A32D2D] border-[#F5C6C6]',
}

const DAYS_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

export default function NutritionPage() {
  const { dates } = useWeek()
  const { mealFor, generateMutation, saveMutation } = useMeals()
  const { sessionsByDate } = useTraining()
  const { showToast } = useToast()
  const [openDays, setOpenDays] = useState<Set<string>>(new Set())
  const [editCtx, setEditCtx] = useState<{ dateKey: string; slot: 'lunch' | 'dinner'; meal?: Meal; label: string } | null>(null)
  const [batchModalOpen, setBatchModalOpen] = useState(false)
  const { setActivePage } = useAppStore()

  const toggle = (key: string) =>
    setOpenDays((p) => { const s = new Set(p); s.has(key) ? s.delete(key) : s.add(key); return s })

  return (
    <div className="px-4 md:px-8 pt-6 pb-24 max-w-screen-xl mx-auto">
      <h1 className="text-[22px] font-bold tracking-tight mb-1">Nutrition</h1>
      <p className="text-[13px] text-[#6B7B6B] mb-4">Repas adaptés à la charge d'entraînement</p>

      <div className="flex items-center gap-2 bg-teal-light border border-teal-mid rounded-card px-3 py-2.5 mb-4 text-[12px] text-teal">
        <i className="ti ti-link text-[16px] flex-shrink-0" />
        La charge de chaque jour est calculée depuis votre planning d'entraînement.
      </div>

      <button
        onClick={() => {
          generateMutation.mutate(undefined, {
            onSuccess: () => { showToast('Repas générés selon la charge') },
          })
        }}
        disabled={generateMutation.isLoading}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-card border border-teal-mid bg-teal-light text-teal text-[13px] font-semibold mb-4 disabled:opacity-50"
      >
        {generateMutation.isLoading
          ? <><span className="inline-block w-3.5 h-3.5 border-2 border-teal-mid border-t-teal rounded-full animate-spin" /> Calcul de la charge…</>
          : <><i className="ti ti-sparkles text-[15px]" />Générer les repas selon la charge</>}
      </button>
      <button
        onClick={() => setBatchModalOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-card border border-violet-mid bg-violet-light text-violet text-[13px] font-semibold mb-4"
      >
        <i className="ti ti-cooker text-[15px]" />Batch cooking
      </button>
      <button
        onClick={() => setActivePage('recipes')}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-card border border-[#E4E8E4] bg-white text-[#1A1E1A] text-[13px] font-semibold mb-4"
      >
        <i className="ti ti-book-2 text-[15px]" />Gérer les recettes
      </button>

      <div className="flex flex-col gap-2">
        {dates.map((date, idx) => {
          const key = format(date, 'yyyy-MM-dd')
          const sB = sessionsByDate(key, 'B')
          const sH = sessionsByDate(key, 'H')
          const charge = computeCharge(sB, sH)
          const lunch = mealFor(key, 'lunch')
          const dinner = mealFor(key, 'dinner')
          const isOpen = openDays.has(key)
          const dayLabel = format(date, 'EEEE d MMMM', { locale: fr })

          return (
            <div key={key} className="bg-white border border-[#E4E8E4] rounded-card overflow-hidden">
              <button
                onClick={() => toggle(key)}
                className="w-full flex items-center justify-between px-3.5 py-3 cursor-pointer bg-none border-none text-left hover:bg-[#F4F6F4]"
              >
                <span className="text-[13px] font-semibold text-[#1A1E1A] flex items-center gap-2">
                  <i className={`ti ${isOpen ? 'ti-chevron-up' : 'ti-chevron-down'} text-[13px] text-[#A8B8A8]`} />
                  {DAYS_FR[idx]} {format(date, 'd')}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${CHARGE_CLS[charge]}`}>
                  {CHARGE_LABEL[charge]}
                </span>
              </button>

              {isOpen && (
                <div className="px-3.5 pb-3">
                  {(['lunch', 'dinner'] as const).map((slot) => {
                    const meal = slot === 'lunch' ? lunch : dinner
                    const slotLabel = slot === 'lunch' ? 'Déjeuner' : 'Dîner'
                    return (
                      <div key={slot} className="flex items-center gap-2 py-2 border-t border-[#F4F6F4]">
                        <span className="text-[11px] text-[#A8B8A8] uppercase tracking-wider font-medium w-14 flex-shrink-0">{slotLabel}</span>
                        {meal
                            ? (
                                <span className="flex-1 text-[13px] text-[#1A1E1A]">
                                {meal.name}
                                {meal.batch_plan_id
                                    ? <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-violet-light text-violet">🍲 Batch</span>
                                    : <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-ocean-light text-ocean">{meal.ingredients.length} ingr.</span>}
                                {meal.portions && meal.portions.length > 0 && (
                                    <span className="block text-[11px] text-[#6B7B6B] mt-0.5">
                                    {meal.portions.map((p, i) => `P${i + 1}: ${p.kcal}kcal / ${p.protein_g}g prot`).join(' · ')}
                                    </span>
                                )}
                                </span>
                            )
                            : <span className="flex-1 text-[13px] text-[#A8B8A8] italic">Non planifié</span>}
                        <button
                          onClick={() => setEditCtx({ dateKey: key, slot, meal, label: dayLabel })}
                          className="text-[#A8B8A8] hover:text-[#6B7B6B] text-[14px] bg-none border-none cursor-pointer p-1"
                        >
                          <i className="ti ti-edit" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {editCtx && (
        <MealModal
          open={!!editCtx}
          onClose={() => setEditCtx(null)}
          meal={editCtx.meal}
          dateKey={editCtx.dateKey}
          slot={editCtx.slot}
          dateLabel={editCtx.label}
          onSave={(payload) => {
            saveMutation.mutate(payload, { onSuccess: () => showToast('Repas enregistré') })
          }}
        />
      )}

      <BatchCookingModal
        open={batchModalOpen}
        onClose={() => setBatchModalOpen(false)}
        onDone={() => showToast('Plan batch cooking créé')}
      />
    </div>
  )
}
