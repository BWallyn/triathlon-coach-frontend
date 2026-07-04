import { useState, useEffect } from 'react'
import Modal from '../shared/Modal'
import type { Meal, Ingredient } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  meal?: Meal
  dateKey: string
  slot: 'lunch' | 'dinner'
  dateLabel: string
  onSave: (payload: { id?: number; date: string; slot: string; name: string; ingredients: Omit<Ingredient, 'id'>[] }) => void
}

export default function MealModal({ open, onClose, meal, dateKey, slot, dateLabel, onSave }: Props) {
  const [name, setName] = useState('')
  const [ingrs, setIngrs] = useState<{ name: string; quantity: string }[]>([{ name: '', quantity: '' }])

  useEffect(() => {
    if (open) {
      setName(meal?.name ?? '')
      setIngrs(meal?.ingredients.map((i) => ({ name: i.name, quantity: i.quantity })) ?? [{ name: '', quantity: '' }])
    }
  }, [open, meal])

  const slotLabel = slot === 'lunch' ? 'Déjeuner' : 'Dîner'

  const handleSave = () => {
    if (!name.trim()) return
    onSave({ id: meal?.id, date: dateKey, slot, name: name.trim(), ingredients: ingrs.filter((i) => i.name.trim()) })
    onClose()
  }

  const updateIngr = (i: number, field: 'name' | 'quantity', val: string) => {
    setIngrs((prev) => prev.map((x, idx) => idx === i ? { ...x, [field]: val } : x))
  }

  return (
    <Modal open={open} onClose={onClose} title={`${slotLabel} — ${dateLabel}`}>
      <div className="mb-4">
        <label className="text-[12px] font-medium text-[#6B7B6B] block mb-2">Nom du plat</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Riz aux légumes rôtis"
          className="w-full px-3 py-2.5 rounded-[7px] border border-[#E4E8E4] text-[14px] bg-white text-[#1A1E1A] focus:outline-none focus:border-teal-mid"
        />
      </div>

      <div className="mb-3">
        <label className="text-[12px] font-medium text-[#6B7B6B] block mb-2">Ingrédients</label>
        {ingrs.map((ingr, i) => (
          <div key={i} className="flex gap-1.5 mb-1.5 items-center">
            <input
              value={ingr.name}
              onChange={(e) => updateIngr(i, 'name', e.target.value)}
              placeholder="Ingrédient"
              className="flex-1 px-3 py-2 rounded-[7px] border border-[#E4E8E4] text-[13px] bg-white focus:outline-none focus:border-teal-mid"
            />
            <input
              value={ingr.quantity}
              onChange={(e) => updateIngr(i, 'quantity', e.target.value)}
              placeholder="Qté"
              className="w-20 px-3 py-2 rounded-[7px] border border-[#E4E8E4] text-[13px] bg-white focus:outline-none focus:border-teal-mid"
            />
            <button
              onClick={() => setIngrs((p) => p.filter((_, idx) => idx !== i))}
              className="text-[#A8B8A8] hover:text-[#6B7B6B] text-[15px] bg-none border-none cursor-pointer px-1"
            >
              <i className="ti ti-x" />
            </button>
          </div>
        ))}
        <button
          onClick={() => setIngrs((p) => [...p, { name: '', quantity: '' }])}
          className="w-full py-2 border border-dashed border-[#E4E8E4] rounded-[7px] text-[12px] text-[#6B7B6B] hover:bg-[#F4F6F4] cursor-pointer bg-none"
        >
          <i className="ti ti-plus text-[12px] align-[-1px] mr-1" />Ajouter un ingrédient
        </button>
      </div>

      <button
        onClick={handleSave}
        disabled={!name.trim()}
        className="w-full py-3.5 rounded-card bg-teal text-white text-[15px] font-semibold mt-2 disabled:opacity-30"
      >
        Enregistrer
      </button>
      <button onClick={onClose} className="w-full py-3 mt-2 rounded-card border border-[#E4E8E4] text-[14px] text-[#6B7B6B]">
        Annuler
      </button>
    </Modal>
  )
}
