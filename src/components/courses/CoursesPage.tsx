import { useState } from 'react'
import { useMeals } from '../../hooks/useMeals'
import { useToast } from '../shared/Toast'
import type { Ingredient } from '../../types'

const CAT_MAP = (name: string): string => {
  const n = name.toLowerCase()
  if (/pâtes|riz|quinoa|pain|tortilla|lentill|patate|arborio/.test(n)) return 'Féculents'
  if (/poulet|bœuf|steak|saumon|thon|cabillaud|tofu/.test(n)) return 'Protéines'
  if (/épinard|brocoli|courgett|champignon|poivron|aubergine|haricot|salade|tomate|concombre|potiron|carotte/.test(n)) return 'Légumes'
  if (/avocat|citron|pomme|banane/.test(n)) return 'Fruits'
  if (/feta|parmesan|gruyère|chèvre|yaourt|lait|crème|beurre|œuf/.test(n)) return 'Laitiers & œufs'
  if (/boîte|conserve|bouillon|miso/.test(n)) return 'Conserves'
  return 'Condiments'
}

const CAT_ICON: Record<string, string> = {
  'Féculents': 'ti-grain', 'Protéines': 'ti-meat', 'Légumes': 'ti-plant',
  'Fruits': 'ti-apple', 'Laitiers & œufs': 'ti-egg', 'Conserves': 'ti-can', 'Condiments': 'ti-bottle',
}
const CAT_ORDER = ['Protéines', 'Féculents', 'Légumes', 'Fruits', 'Laitiers & œufs', 'Conserves', 'Condiments']

export default function CoursesPage() {
  const { meals } = useMeals()
  const { showToast } = useToast()
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [tab, setTab] = useState<'list' | 'export'>('list')

  // Build aggregated list
  const map: Record<string, { name: string; qtys: string[]; cat: string }> = {}
  meals.forEach((meal) => {
    meal.ingredients.forEach((ingr: Ingredient) => {
      const key = ingr.name.toLowerCase().trim()
      if (!map[key]) map[key] = { name: ingr.name, qtys: [], cat: CAT_MAP(ingr.name) }
      map[key].qtys.push(ingr.quantity)
    })
  })
  const items = Object.values(map)
  const bycat: Record<string, typeof items> = {}
  items.forEach((it) => { if (!bycat[it.cat]) bycat[it.cat] = []; bycat[it.cat].push(it) })

  const exportText = items.map((it) => `${it.name} — ${[...new Set(it.qtys)].join(' + ')}`).join('\n')

  const handleExport = () => {
    if (!items.length) { showToast('Aucun ingrédient à exporter'); return }
    window.location.href = 'shortcuts://run-shortcut?name=Liste%20de%20courses%20batch&input=text&text=' + encodeURIComponent(exportText)
    showToast('Ouverture de Raccourcis…')
  }

  return (
    <div className="max-w-lg mx-auto px-3.5 pt-4 pb-24">
      <h1 className="text-[22px] font-bold tracking-tight mb-1">Courses</h1>
      <p className="text-[13px] text-[#6B7B6B] mb-4">Générée depuis vos repas planifiés</p>

      <div className="flex gap-1.5 mb-4">
        {(['list', 'export'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-[7px] border text-[12px] font-medium cursor-pointer transition-all ${tab === t ? 'bg-teal-light text-teal border-teal-mid' : 'bg-white text-[#6B7B6B] border-[#E4E8E4]'}`}>
            <i className={`ti ${t === 'list' ? 'ti-list' : 'ti-device-mobile'} text-[13px] align-[-1px] mr-1`} />
            {t === 'list' ? 'Liste' : 'Exporter'}
          </button>
        ))}
      </div>

      {tab === 'list' && (
        <>
          {!items.length
            ? (
              <div className="text-center py-12 text-[#A8B8A8] text-[13px]">
                <i className="ti ti-shopping-cart text-[34px] block mb-2.5" />
                Planifie des repas dans l'onglet Nutrition<br />pour générer la liste de courses.
              </div>
            )
            : CAT_ORDER.filter((c) => bycat[c]).map((cat) => (
              <div key={cat} className="mb-5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#6B7B6B] uppercase tracking-wider mb-2">
                  <i className={`ti ${CAT_ICON[cat] ?? 'ti-package'} text-[14px]`} />
                  {cat}
                </div>
                {bycat[cat].map((it) => {
                  const key = it.name.toLowerCase().trim()
                  const done = !!checked[key]
                  return (
                    <div key={key} onClick={() => setChecked((p) => ({ ...p, [key]: !p[key] }))}
                      className={`flex items-center gap-2.5 px-3 py-2.5 bg-white border border-[#E4E8E4] rounded-card mb-1.5 cursor-pointer transition-opacity ${done ? 'opacity-40' : ''}`}>
                      <div className={`w-[18px] h-[18px] rounded-[5px] border flex items-center justify-center flex-shrink-0 transition-all ${done ? 'bg-teal border-teal text-white' : 'border-[#E4E8E4]'}`}>
                        {done && <i className="ti ti-check text-[11px]" />}
                      </div>
                      <span className={`flex-1 text-[13px] text-[#1A1E1A] ${done ? 'line-through' : ''}`}>{it.name}</span>
                      <span className="text-[12px] text-[#6B7B6B]">{[...new Set(it.qtys)].join(' + ')}</span>
                    </div>
                  )
                })}
              </div>
            ))}
        </>
      )}

      {tab === 'export' && (
        <div>
          <div className="bg-white border border-[#E4E8E4] rounded-card p-4 mb-4 text-[13px] text-[#6B7B6B] leading-relaxed">
            <b className="text-[#1A1E1A]">Export vers Rappels Apple</b><br /><br />
            Crée un raccourci nommé <code className="bg-[#F4F6F4] px-1.5 py-0.5 rounded text-[12px]">Liste de courses batch</code> dans l'app Raccourcis, configuré pour ajouter chaque ligne comme un rappel dans ta liste "Courses".<br /><br />
            Appuie ensuite sur le bouton ci-dessous :
          </div>

          <button onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-card border border-[#E4E8E4] bg-white text-[#1A1E1A] text-[13px] font-semibold mb-4">
            <i className="ti ti-device-mobile text-[15px]" />Ouvrir dans Raccourcis Apple
          </button>

          {exportText && (
            <div className="bg-white border border-[#E4E8E4] rounded-card p-4">
              <div className="text-[11px] font-semibold text-[#6B7B6B] uppercase tracking-wider mb-2">Aperçu</div>
              <pre className="text-[12px] text-[#6B7B6B] leading-7 whitespace-pre-wrap">{exportText}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
