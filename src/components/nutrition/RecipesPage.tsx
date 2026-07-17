import { useState } from 'react'
import { useBatchCooking } from '../../hooks/useBatchCooking'
import { useToast } from '../shared/Toast'
import { SEASON_LABELS } from '../../utils/season'
import type { Season } from '../../types'

const SEASON_OPTIONS: { id: Season | null; label: string }[] = [
  { id: null, label: 'Toutes saisons' },
  { id: 'spring', label: 'Printemps' },
  { id: 'summer', label: 'Été' },
  { id: 'autumn', label: 'Automne' },
  { id: 'winter', label: 'Hiver' },
]

const UNIT_OPTIONS = ['g', 'ml', 'unité', 'gousse', 'c.à.s', 'c.à.c', 'pincée']

interface IngrDraft {
  ingredient_name: string
  quantity_per_serving: string
  unit: string
  is_scalable: boolean
  unit_weight_g: string
}

const emptyIngr = (): IngrDraft => ({ ingredient_name: '', quantity_per_serving: '', unit: 'g', is_scalable: true, unit_weight_g: '' })

export default function RecipesPage() {
  const { recipes, recipesLoading, createRecipeMutation } = useBatchCooking()
  const { showToast } = useToast()

  const [name, setName] = useState('')
  const [instructions, setInstructions] = useState('')
  const [basePortions, setBasePortions] = useState('4')
  const [season, setSeason] = useState<Season | null>(null)
  const [recipeLink, setRecipeLink] = useState('')
  const [ingrs, setIngrs] = useState<IngrDraft[]>([emptyIngr()])

  const resetForm = () => {
    setName(''); setInstructions(''); setBasePortions('4'); setSeason(null)
    setRecipeLink(''); setIngrs([emptyIngr()])
  }

  const updateIngr = (i: number, patch: Partial<IngrDraft>) =>
    setIngrs((prev) => prev.map((x, idx) => idx === i ? { ...x, ...patch } : x))

  const canSubmit = name.trim()
    && Number(basePortions) > 0
    && ingrs.some((i) => i.ingredient_name.trim() && i.quantity_per_serving)

  const handleSubmit = () => {
    const payload = {
      name: name.trim(),
      instructions: instructions.trim() || undefined,
      base_portions: Number(basePortions),
      season,
      recipe_link: recipeLink.trim() || undefined,
      ingredients: ingrs
        .filter((i) => i.ingredient_name.trim() && i.quantity_per_serving)
        .map((i) => ({
          ingredient_name: i.ingredient_name.trim(),
          quantity_per_serving: Number(i.quantity_per_serving),
          unit: i.unit,
          is_scalable: i.is_scalable,
          unit_weight_g: i.unit_weight_g ? Number(i.unit_weight_g) : undefined,
        })),
    }
    createRecipeMutation.mutate(payload, {
      onSuccess: () => { showToast('Recette créée'); resetForm() },
      onError: () => showToast('Erreur lors de la création'),
    })
  }

  return (
    <div className="px-4 md:px-8 pt-6 pb-24 max-w-screen-xl mx-auto">
      <h1 className="text-[22px] font-bold tracking-tight mb-1">Recettes batch cooking</h1>
      <p className="text-[13px] text-[#6B7B6B] mb-5">Créer et consulter les recettes disponibles pour le batch cooking</p>

      {/* ── Form ─────────────────────────────────────────── */}
      <div className="bg-white border border-[#E4E8E4] rounded-card p-4 mb-6">
        <h2 className="text-[14px] font-bold mb-3">Nouvelle recette</h2>

        <label className="text-[12px] font-medium text-[#6B7B6B] block mb-1">Nom</label>
        <input value={name} onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2.5 rounded-[7px] border border-[#E4E8E4] text-[14px] mb-3" />

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-[12px] font-medium text-[#6B7B6B] block mb-1">Nombre de portions</label>
            <input type="number" min={1} value={basePortions} onChange={(e) => setBasePortions(e.target.value)}
              className="w-full px-3 py-2.5 rounded-[7px] border border-[#E4E8E4] text-[14px]" />
          </div>
          <div>
            <label className="text-[12px] font-medium text-[#6B7B6B] block mb-1">Saison</label>
            <select value={season ?? ''} onChange={(e) => setSeason((e.target.value || null) as Season | null)}
              className="w-full px-3 py-2.5 rounded-[7px] border border-[#E4E8E4] text-[14px] bg-white">
              {SEASON_OPTIONS.map((s) => <option key={s.id ?? 'none'} value={s.id ?? ''}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <label className="text-[12px] font-medium text-[#6B7B6B] block mb-1">Lien de la recette (optionnel)</label>
        <input value={recipeLink} onChange={(e) => setRecipeLink(e.target.value)} placeholder="https://..."
          className="w-full px-3 py-2.5 rounded-[7px] border border-[#E4E8E4] text-[14px] mb-3" />

        <label className="text-[12px] font-medium text-[#6B7B6B] block mb-1">Instructions</label>
        <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3}
          className="w-full px-3 py-2.5 rounded-[7px] border border-[#E4E8E4] text-[14px] resize-none mb-4" />

        <label className="text-[12px] font-medium text-[#6B7B6B] block mb-2">Ingrédients (quantité par portion)</label>
        {ingrs.map((ingr, i) => (
          <div key={i} className="grid grid-cols-12 gap-1.5 mb-1.5 items-center">
            <input value={ingr.ingredient_name} onChange={(e) => updateIngr(i, { ingredient_name: e.target.value })}
              placeholder="Ingrédient" className="col-span-4 px-2 py-2 rounded-[7px] border border-[#E4E8E4] text-[13px]" />
            <input value={ingr.quantity_per_serving} onChange={(e) => updateIngr(i, { quantity_per_serving: e.target.value })}
              placeholder="Qté/portion" type="number" className="col-span-2 px-2 py-2 rounded-[7px] border border-[#E4E8E4] text-[13px]" />
            <select value={ingr.unit} onChange={(e) => updateIngr(i, { unit: e.target.value })}
              className="col-span-2 px-2 py-2 rounded-[7px] border border-[#E4E8E4] text-[13px] bg-white">
              {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            <input value={ingr.unit_weight_g} onChange={(e) => updateIngr(i, { unit_weight_g: e.target.value })}
              placeholder="g/unité" type="number" className="col-span-2 px-2 py-2 rounded-[7px] border border-[#E4E8E4] text-[13px]" />
            <label className="col-span-1 flex items-center justify-center text-[10px] text-[#6B7B6B]">
              <input type="checkbox" checked={ingr.is_scalable} onChange={(e) => updateIngr(i, { is_scalable: e.target.checked })} />
            </label>
            <button onClick={() => setIngrs((p) => p.filter((_, idx) => idx !== i))}
              className="col-span-1 text-[#A8B8A8] hover:text-[#6B7B6B] text-[14px] bg-none border-none cursor-pointer">
              <i className="ti ti-x" />
            </button>
          </div>
        ))}
        <button onClick={() => setIngrs((p) => [...p, emptyIngr()])}
          className="w-full py-2 border border-dashed border-[#E4E8E4] rounded-[7px] text-[12px] text-[#6B7B6B] mb-4">
          <i className="ti ti-plus text-[12px] align-[-1px] mr-1" />Ajouter un ingrédient
        </button>

        <button onClick={handleSubmit} disabled={!canSubmit || createRecipeMutation.isLoading}
          className="w-full py-3.5 rounded-card bg-teal text-white text-[15px] font-semibold disabled:opacity-30">
          {createRecipeMutation.isLoading ? 'Création…' : 'Créer la recette'}
        </button>
      </div>

      {/* ── List ─────────────────────────────────────────── */}
      <h2 className="text-[14px] font-bold mb-3">Recettes existantes</h2>
      {recipesLoading && <p className="text-[13px] text-[#A8B8A8]">Chargement…</p>}
      <div className="flex flex-col gap-2">
        {recipes.map((r) => (
          <div key={r.id} className="bg-white border border-[#E4E8E4] rounded-card p-3.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[14px] font-semibold text-[#1A1E1A]">{r.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-light text-teal font-medium">
                {r.base_portions} portion{r.base_portions > 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#6B7B6B] mb-1">
              <span>{r.season ? SEASON_LABELS[r.season] : 'Toutes saisons'}</span>
              {r.recipe_link && (
                <a href={r.recipe_link} target="_blank" rel="noreferrer" className="text-ocean underline">Voir la recette</a>
              )}
            </div>
            <p className="text-[12px] text-[#A8B8A8]">
              {r.ingredients.map((i) => i.ingredient_name).join(', ')}
            </p>
          </div>
        ))}
        {!recipesLoading && !recipes.length && (
          <p className="text-[12px] text-[#A8B8A8] italic">Aucune recette pour l'instant.</p>
        )}
      </div>
    </div>
  )
}
