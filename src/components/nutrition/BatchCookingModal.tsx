import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Modal from '../shared/Modal'
import { useWeek } from '../../hooks/useWeek'
import { useBatchCooking } from '../../hooks/useBatchCooking'
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

interface SlotState {
  portions: number
  presets: Preset[]
}

interface Props {
  open: boolean
  onClose: () => void
  onDone: () => void
}

export default function BatchCookingModal({ open, onClose, onDone }: Props) {
  const { dates } = useWeek()
  const { recipes, recipesLoading, createPlanMutation } = useBatchCooking()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [recipeId, setRecipeId] = useState<number | null>(null)
  const [slots, setSlots] = useState<Record<string, SlotState>>({})

  const reset = () => { setStep(1); setRecipeId(null); setSlots({}) }
  const handleClose = () => { reset(); onClose() }

  const slotKey = (dateKey: string, slot: Slot) => `${dateKey}|${slot}`

  const toggleSlot = (dateKey: string, slot: Slot) => {
    const key = slotKey(dateKey, slot)
    setSlots((prev) => {
      const next = { ...prev }
      if (next[key]) delete next[key]
      else next[key] = { portions: 1, presets: ['maintien'] }
      return next
    })
  }

  const setPortionCount = (key: string, count: 1 | 2) => {
    setSlots((prev) => {
      const current = prev[key]
      const presets = Array.from({ length: count }, (_, i) => current.presets[i] ?? 'maintien')
      return { ...prev, [key]: { portions: count, presets } }
    })
  }

  const setPreset = (key: string, index: number, preset: Preset) => {
    setSlots((prev) => {
      const current = prev[key]
      const presets = [...current.presets]
      presets[index] = preset
      return { ...prev, [key]: { ...current, presets } }
    })
  }

  const selectedCount = Object.keys(slots).length
  const canGoStep2 = recipeId !== null
  const canGoStep3 = selectedCount > 0
  const canSubmit = selectedCount > 0 && Object.values(slots).every((s) => s.presets.every(Boolean))

  const handleSubmit = () => {
    if (!recipeId) return
    const portions = Object.entries(slots).flatMap(([key, s]) => {
      const [date, slot] = key.split('|') as [string, Slot]
      return s.presets.map((preset) => ({ date, slot, preset }))
    })

    createPlanMutation.mutate(
      { recipe_id: recipeId, created_date: format(new Date(), 'yyyy-MM-dd'), portions },
      { onSuccess: () => { handleClose(); onDone() } },
    )
  }

  const optBase = 'px-3 py-2.5 rounded-[7px] border border-[#E4E8E4] text-[13px] font-medium cursor-pointer bg-[#F4F6F4] text-[#6B7B6B] text-left transition-all w-full'

  return (
    <Modal open={open} onClose={handleClose} title="Batch cooking">
      {step === 1 && (
        <>
          <p className="text-[12px] text-[#6B7B6B] mb-3">Choisis une recette à cuisiner en grande quantité.</p>
          {recipesLoading && <p className="text-[13px] text-[#A8B8A8]">Chargement…</p>}
          <div className="flex flex-col gap-2 mb-4">
            {recipes.map((r) => (
              <button key={r.id} onClick={() => setRecipeId(r.id)}
                className={`${optBase} ${recipeId === r.id ? 'bg-teal-light text-teal border-teal-mid' : ''}`}>
                {r.name}
              </button>
            ))}
            {!recipesLoading && !recipes.length && (
              <p className="text-[12px] text-[#A8B8A8] italic">Aucune recette batch pour l'instant.</p>
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
          <p className="text-[12px] text-[#6B7B6B] mb-3">Sélectionne les créneaux et le nombre de portions par créneau.</p>
          <div className="flex flex-col gap-2 mb-4">
            {dates.map((date) => {
              const dateKey = format(date, 'yyyy-MM-dd')
              const dayLabel = format(date, 'EEE d MMM', { locale: fr })
              return (
                <div key={dateKey} className="border border-[#E4E8E4] rounded-card p-2.5">
                  <p className="text-[12px] font-semibold text-[#1A1E1A] mb-2 capitalize">{dayLabel}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['lunch', 'dinner'] as Slot[]).map((slot) => {
                      const key = slotKey(dateKey, slot)
                      const active = !!slots[key]
                      return (
                        <div key={slot}>
                          <button onClick={() => toggleSlot(dateKey, slot)}
                            className={`${optBase} text-center ${active ? 'bg-teal-light text-teal border-teal-mid' : ''}`}>
                            {slot === 'lunch' ? 'Déjeuner' : 'Dîner'}
                          </button>
                          {active && (
                            <div className="flex gap-1.5 mt-1.5">
                              {[1, 2].map((n) => (
                                <button key={n} onClick={() => setPortionCount(key, n as 1 | 2)}
                                  className={`flex-1 py-1.5 rounded-[6px] border text-[11px] font-semibold cursor-pointer ${slots[key].portions === n ? 'bg-violet-light text-violet border-violet-mid' : 'bg-white text-[#6B7B6B] border-[#E4E8E4]'}`}>
                                  {n} portion{n > 1 ? 's' : ''}
                                </button>
                              ))}
                            </div>
                          )}
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
            {Object.entries(slots).map(([key, s]) => {
              const [dateStr, slot] = key.split('|') as [string, Slot]
              const dayLabel = format(new Date(dateStr + 'T12:00:00'), 'EEE d MMM', { locale: fr })
              return (
                <div key={key} className="border border-[#E4E8E4] rounded-card p-2.5">
                  <p className="text-[12px] font-semibold text-[#1A1E1A] mb-2 capitalize">
                    {dayLabel} — {slot === 'lunch' ? 'Déjeuner' : 'Dîner'}
                  </p>
                  {s.presets.map((preset, i) => (
                    <select key={i} value={preset} onChange={(e) => setPreset(key, i, e.target.value as Preset)}
                      className="w-full px-3 py-2 mb-1.5 rounded-[7px] border border-[#E4E8E4] text-[12px] bg-white">
                      {PRESET_OPTIONS.map((p) => <option key={p.id} value={p.id}>{`Portion ${i + 1} — ${p.label}`}</option>)}
                    </select>
                  ))}
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
