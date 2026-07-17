import { useState } from 'react'
import { useBatchCooking } from '../../hooks/useBatchCooking'
import { useToast } from '../shared/Toast'
import { SEASON_LABELS } from '../../utils/season'
import type { BatchRecipe, Season } from '../../types'

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
  const { recipes, recipesLoading, createRecipeMutation, updateRecipeMutation, deleteRecipeMutation } = useBatchCooking()
  const { showToast } = useToast()

  const [editingId, setEditingId] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [instructions, setInstructions] = useState('')
  const [basePortions, setBasePortions] = useState('4')
  const [season, setSeason] = useState<Season | null>(null)
  const [recipeLink, setRecipeLink] = useState('')
  const [refKcal, setRefKcal] = useState('')
  const [refProtein, setRefProtein] = useState('')
  const [refCarbs, setRefCarbs] = useState('')
  const [refFat, setRefFat] = useState('')
  const [ingrs, setIngrs] = useState<IngrDraft[]>([emptyIngr()])

  const resetForm = () => {
    setEditingId(null)
    setName(''); setInstructions(''); setBasePortions('4'); setSeason(null)
    setRecipeLink(''); setRefKcal(''); setRefProtein(''); setRefCarbs(''); setRefFat('')
    setIngrs([emptyIngr()])
  }

  const startEdit = (r: BatchRecipe) => {
    setEditingId(r.id)
    setName(r.name)
    setInstructions(r.instructions ?? '')
    setBasePortions(String(r.base_portions))
    setSeason(r.season)
    setRecipeLink(r.recipe_link ?? '')
    setRefKcal(r.ref_kcal != null ? String(r.ref_kcal) : '')
    setRefProtein(r.ref_protein_g != null ? String(r.ref_protein_g) : '')
    setRefCarbs(r.ref_carbs_g != null ? String(r.ref_carbs_g) : '')
    setRefFat(r.ref_fat_g != null ? String(r.ref_fat_g) : '')
    setIngrs(r.ingredients.map((i) => ({
      ingredient_name: i.ingredient_name,
      quantity_per_serving: String(i.quantity_per_serving),
      unit: i.unit,
      is_scalable: i.is_scalable,
      unit_weight_g: i.unit_weight_g != null ? String(i.unit_weight_g) : '',
    })))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = (r: BatchRecipe) => {
    if (!window.confirm(`Supprimer la recette "${r.name}" ?`)) return
    deleteRecipeMutation.mutate(r.id, {
      onSuccess: () => {
        showToast('Recette supprimée')
        if (editingId === r.id) resetForm()
      },
      onError: (err: any) => {
        const detail = err?.response?.data?.detail
        showToast(detail ?? 'Impossible de supprimer cette recette')
      },
    })
  }

  const updateIngr = (i: number, patch: Partial<IngrDraft>) =>
    setIngrs((prev) => prev.map((x, idx) => idx === i ? { ...x, ...patch } : x))

  const canSubmit = name.trim()
    && Number(basePortions) > 0
    && ingrs.some((i) => i.ingredient_name.trim() && i.quantity_per_serving)

  const isSaving = createRecipeMutation.isLoading || updateRecipeMutation.isLoading

  const handleSubmit = () => {
    const payload = {
      name: name.trim(),
      instructions: instructions.trim() || undefined,
      base_portions: Number(basePortions),
      season,
      recipe_link: recipeLink.trim() || undefined,
      ref_kcal: refKcal !== '' ? Number(refKcal) : undefined,
      ref_protein_g: refProtein !== '' ? Number(refProtein) : undefined,
      ref_carbs_g: refCarbs !== '' ? Number(refCarbs) : undefined,
      ref_fat_g: refFat !== '' ? Number(refFat) : undefined,
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

    if (editingId) {
      updateRecipeMutation.mutate({ id: editingId, ...payload }, {
        onSuccess: () => { showToast('Recette mise à jour'); resetForm() },
        onError: () => showToast('Erreur lors de la mise à jour'),
      })
    } else {
      createRecipeMutation.mutate(payload, {
        onSuccess: () => { showToast('Recette créée'); resetForm() },
        onError: () => showToast('Erreur lors de la création'),
      })
    }
  }

  return (
    <div className="px-4 md:px-8 pt-6 pb-24 max-w-screen-xl mx-auto">
      <h1 className="text-[22px] font-bold tracking-tight mb-1">Recettes batch cooking</h1>
      <p className="text-[13px] text-[#6B7B6B] mb-5">Créer, modifier et consulter les recettes disponibles pour le batch cooking</p>

      {/* ── Form ─────────────────────────────────────────── */}
      <div className="bg-white border border-[#E4E8E4] rounded-card p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-bold">{editingId ? 'Modifier la recette' : 'Nouvelle recette'}</h2>
          {editingId && (
            <button onClick={resetForm} className="text-[12px] text-[#6B7B6B] underline bg-none border-none cursor-pointer">
              Annuler la modification
            </button>
          )}
        </div>

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

        <label className="text-[12px] font-medium text-[#6B7B6B] block mb-1">
          Macros de référence par portion <span className="text-[#A8B8A8] font-normal">(optionnel, informatif)</span>
        </label>
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div>
            <input type="number" min={0} value={refKcal} onChange={(e) => setRefKcal(e.target.value)} placeholder="Kcal"
              className="w-full px-2 py-2 rounded-[7px] border border-[#E4E8E4] text-[13px] text-center" />
            <p className="text-[10px] text-[#A8B8A8] text-center mt-1">Calories</p>
          </div>
          <div>
            <input type="number" min={0} value={refProtein} onChange={(e) => setRefProtein(e.target.value)} placeholder="g"
              className="w-full px-2 py-2 rounded-[7px] border border-[#E4E8E4] text-[13px] text-center" />
            <p className="text-[10px] text-[#A8B8A8] text-center mt-1">Protéines</p>
          </div>
          <div>
            <input type="number" min={0} value={refCarbs} onChange={(e) => setRefCarbs(e.target.value)} placeholder="g"
              className="w-full px-2 py-2 rounded-[7px] border border-[#E4E8E4] text-[13px] text-center" />
            <p className="text-[10px] text-[#A8B8A8] text-center mt-1">Glucides</p>
          </div>
          <div>
            <input type="number" min={0} value={refFat} onChange={(e) => setRefFat(e.target.value)} placeholder="g"
              className="w-full px-2 py-2 rounded-[7px] border border-[#E4E8E4] text-[13px] text-center" />
            <p className="text-[10px] text-[#A8B8A8] text-center mt-1">Lipides</p>
          </div>
        </div>

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

        <button onClick={handleSubmit} disabled={!canSubmit || isSaving}
          className="w-full py-3.5 rounded-card bg-teal text-white text-[15px] font-semibold disabled:opacity-30">
          {isSaving ? 'Enregistrement…' : editingId ? 'Mettre à jour la recette' : 'Créer la recette'}
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
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-light text-teal font-medium">
                  {r.base_portions} portion{r.base_portions > 1 ? 's' : ''}
                </span>
                <button onClick={() => startEdit(r)}
                  className="text-[#A8B8A8] hover:text-[#6B7B6B] text-[14px] bg-none border-none cursor-pointer p-0.5">
                  <i className="ti ti-edit" />
                </button>
                <button onClick={() => handleDelete(r)}
                  className="text-[#A8B8A8] hover:text-[#A32D2D] text-[14px] bg-none border-none cursor-pointer p-0.5">
                  <i className="ti ti-trash" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#6B7B6B] mb-1">
              <span>{r.season ? SEASON_LABELS[r.season] : 'Toutes saisons'}</span>
              {r.recipe_link && (
                <a href={r.recipe_link} target="_blank" rel="noreferrer" className="text-ocean underline">Voir la recette</a>
              )}
            </div>
            {(r.ref_kcal != null || r.ref_protein_g != null || r.ref_carbs_g != null || r.ref_fat_g != null) && (
              <div className="text-[11px] text-[#6B7B6B] mb-1">
                Réf/portion : {r.ref_kcal ?? '–'} kcal · P {r.ref_protein_g ?? '–'}g · G {r.ref_carbs_g ?? '–'}g · L {r.ref_fat_g ?? '–'}g
              </div>
            )}
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