import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Modal from '../shared/Modal'
import { useWeek } from '../../hooks/useWeek'
import { useBatchCooking } from '../../hooks/useBatchCooking'
import { SEASON_LABELS } from '../../utils/season'
import type { Preset, Slot } from '../../types'

const PRESET_OPTIONS: { id: Preset; label: string }[] = [
  { id: 'reduction_agressive', label: 'Réduction agressive (-30%)' },
  { id: 'reduction_moderee', label: 'Réduction modérée (-20%)' },
  { id: 'reduction_legere', label: 'Réduction légère (-10%)' },
  { id: 'maintien', label: 'Maintien' },
  { id: 'masse_legere', label: 'Prise de masse légère (+10%)' },
  { id: 'masse_moderee', label: 'Prise de masse modérée (+20%)' },
  { id: 'masse_agressive', label: 'Prise de masse agressive (+30%)' },
]

interface PortionSlot { date: string; slot: Slot; preset: Preset }

interface Props { open: boolean; onClose: () => void; onDone: () => void }

export default function BatchCookingModal({ open, onClose, onDone }: Props) {
  const { dates } = useWeek()
  const { recipes, recipesLoading, seasonFilter, setSeasonFilter, createPlanMutation } = useBatchCooking()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [recipeId, setRecipeId] = useState<number | null>(null)
  const [assignments, setAssignments] = useState<PortionSlot[]>([])

  const recipe = recipes.find((r) => r.id === recipeId)
  // Nombre de portions "de base" de la recette — purement informatif, ne
  // contraint plus le nombre de portions qu'on peut assigner : les quantités
  // d'ingrédients sont définies par portion (quantity_per_serving), donc
  // n'importe quel nombre de portions se calcule correctement.
  const basePortions = recipe?.base_portions ?? 0
  const selectedPortions = assignments.length

  const reset = () => { setStep(1); setRecipeId(null); setAssignments([]) }
  const handleClose = () => { reset(); onClose() }

  const countFor = (dateKey: string, slot: Slot) =>
    assignments.filter((a) => a.date === dateKey && a.slot === slot).length

  const addPortion = (dateKey: string, slot: Slot) => {
    setAssignments((p) => [...p, { date: dateKey, slot, preset: 'maintien' }])
  }

  const removeOnePortion = (dateKey: string, slot: Slot) => {
    setAssignments((p) => {
      const idx = [...p].reverse().findIndex((a) => a.date === dateKey && a.slot === slot)
      if (idx === -1) return p
      const realIdx = p.length - 1 - idx
      return p.filter((_, i) => i !== realIdx)
    })
  }

  const setPresetAt = (index: number, preset: Preset) =>
    setAssignments((p) => p.map((a, i) => i === index ? { ...a, preset } : a))

  const canGoStep2 = recipeId !== null
  const canGoStep3 = selectedPortions > 0
  const canSubmit = selectedPortions > 0

  const handleSubmit = () => {
    if (!recipeId) return
    createPlanMutation.mutate(
      { recipe_id: recipeId, created_date: format(new Date(), 'yyyy-MM-dd'), portions: assignments },
      { onSuccess: () => { handleClose(); onDone() } },
    )
  }

  const optBase = 'px-3 py-2.5 rounded-[7px] border border-[#E4E8E4] text-[13px] font-medium cursor-pointer bg-[#F4F6F4] text-[#6B7B6B] text-left transition-all w-full'

  return (
    <Modal open={open} onClose={handleClose} title="Batch cooking">
      {step === 1 && (
        <>
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {(['all', 'spring', 'summer', 'autumn', 'winter'] as const).map((s) => (
              <button key={s} onClick={() => setSeasonFilter(s)}
                className={`px-2.5 py-1 rounded-full border text-[11px] font-medium cursor-pointer ${seasonFilter === s ? 'bg-teal text-white border-teal' : 'bg-white text-[#6B7B6B] border-[#E4E8E4]'}`}>
                {s === 'all' ? 'Toutes saisons' : SEASON_LABELS[s]}
              </button>
            ))}
          </div>
          <p className="text-[12px] text-[#6B7B6B] mb-3">Choisis une recette à cuisiner en grande quantité.</p>
          {recipesLoading && <p className="text-[13px] text-[#A8B8A8]">Chargement…</p>}
          <div className="flex flex-col gap-2 mb-4">
            {recipes.map((r) => (
              <button key={r.id} onClick={() => setRecipeId(r.id)}
                className={`${optBase} ${recipeId === r.id ? 'bg-teal-light text-teal border-teal-mid' : ''}`}>
                <div className="flex justify-between items-center">
                  <span>{r.name}</span>
                  <span className="text-[10px] text-[#A8B8A8]">{r.base_portions} portions (base)</span>
                </div>
              </button>
            ))}
            {!recipesLoading && !recipes.length && (
              <p className="text-[12px] text-[#A8B8A8] italic">Aucune recette batch pour cette saison.</p>
            )}
          </div>
          <button onClick={() => setStep(2)} disabled={!canGoStep2}
            className="w-full py-3.5 rounded-card bg-teal text-white text-[15px] font-semibold disabled:opacity-30">
            Continuer
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <p className="text-[12px] text-[#6B7B6B] mb-1">
            Cette recette est prévue pour <b>{basePortions}</b> portion{basePortions > 1 ? 's' : ''} à la base,
            mais choisis-en autant que tu veux — les quantités d'ingrédients s'adaptent automatiquement.
          </p>
          <p className="text-[12px] font-semibold mb-3 text-teal">
            {selectedPortions === 0
              ? 'Aucune portion sélectionnée pour le moment'
              : `${selectedPortions} portion${selectedPortions > 1 ? 's' : ''} sélectionnée${selectedPortions > 1 ? 's' : ''}`}
          </p>
          <div className="flex flex-col gap-2 mb-4">
            {dates.map((date) => {
              const dateKey = format(date, 'yyyy-MM-dd')
              const dayLabel = format(date, 'EEE d MMM', { locale: fr })
              return (
                <div key={dateKey} className="border border-[#E4E8E4] rounded-card p-2.5">
                  <p className="text-[12px] font-semibold text-[#1A1E1A] mb-2 capitalize">{dayLabel}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['lunch', 'dinner'] as Slot[]).map((slot) => {
                      const count = countFor(dateKey, slot)
                      return (
                        <div key={slot} className="flex items-center justify-between border border-[#E4E8E4] rounded-[7px] px-2 py-1.5">
                          <span className="text-[12px] text-[#6B7B6B]">{slot === 'lunch' ? 'Déjeuner' : 'Dîner'}</span>
                          <div className="flex items-center gap-2">
                            <button onClick={() => removeOnePortion(dateKey, slot)} disabled={count === 0}
                              className="w-6 h-6 rounded-full border border-[#E4E8E4] text-[#6B7B6B] disabled:opacity-30 cursor-pointer bg-white">−</button>
                            <span className="text-[12px] font-semibold w-4 text-center">{count}</span>
                            <button onClick={() => addPortion(dateKey, slot)}
                              className="w-6 h-6 rounded-full border border-teal-mid text-teal cursor-pointer bg-white">+</button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
          <button onClick={() => setStep(3)} disabled={!canGoStep3}
            className="w-full py-3.5 rounded-card bg-teal text-white text-[15px] font-semibold disabled:opacity-30">
            Continuer
          </button>
          <button onClick={() => setStep(1)} className="w-full py-3 mt-2 rounded-card border border-[#E4E8E4] text-[14px] text-[#6B7B6B]">
            Retour
          </button>
        </>
      )}

      {step === 3 && (
        <>
          <p className="text-[12px] text-[#6B7B6B] mb-3">Choisis un preset pour chaque portion.</p>
          <div className="flex flex-col gap-3 mb-4">
            {assignments.map((a, i) => {
              const dayLabel = format(new Date(a.date + 'T12:00:00'), 'EEE d MMM', { locale: fr })
              return (
                <div key={i} className="border border-[#E4E8E4] rounded-card p-2.5">
                  <p className="text-[12px] font-semibold text-[#1A1E1A] mb-2 capitalize">
                    {dayLabel} — {a.slot === 'lunch' ? 'Déjeuner' : 'Dîner'} — Portion {i + 1}
                  </p>
                  <select value={a.preset} onChange={(e) => setPresetAt(i, e.target.value as Preset)}
                    className="w-full px-3 py-2 rounded-[7px] border border-[#E4E8E4] text-[12px] bg-white">
                    {PRESET_OPTIONS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </div>
              )
            })}
          </div>
          <button onClick={handleSubmit} disabled={!canSubmit || createPlanMutation.isLoading}
            className="w-full py-3.5 rounded-card bg-teal text-white text-[15px] font-semibold disabled:opacity-30">
            {createPlanMutation.isLoading ? 'Création…' : 'Valider le plan'}
          </button>
          <button onClick={() => setStep(2)} className="w-full py-3 mt-2 rounded-card border border-[#E4E8E4] text-[14px] text-[#6B7B6B]">
            Retour
          </button>
        </>
      )}
    </Modal>
  )
}
