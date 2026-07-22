import { useState } from 'react'
import { useRaces } from '../../hooks/useRaces'
import { useAthletes } from '../../hooks/useAthletes'
import { useToast } from '../shared/Toast'
import { useAppStore } from '../../store'
import type { Race, RaceFormat, RacePriority, AthleteId } from '../../types'

const FORMAT_OPTIONS: { id: RaceFormat; label: string }[] = [
  { id: 'sprint', label: 'Sprint' },
  { id: 'olympic', label: 'Olympique' },
  { id: 'half_ironman', label: 'Half-Ironman' },
  { id: 'ironman', label: 'Ironman' },
  { id: 'other', label: 'Autre' },
]

const PRIORITY_CLS: Record<RacePriority, string> = {
  A: 'bg-amber-light text-amber-sport border-amber-mid',
  B: 'bg-teal-light text-teal border-teal-mid',
  C: 'bg-ocean-light text-ocean border-ocean-mid',
}

interface Draft {
  athlete_id: AthleteId | 'shared'
  name: string
  date: string
  format: RaceFormat
  priority: RacePriority
  target_time: string
  location: string
  goal_notes: string
}

const emptyDraft = (): Draft => ({
  athlete_id: 'shared', name: '', date: '', format: 'olympic', priority: 'B',
  target_time: '', location: '', goal_notes: '',
})

export default function RacesPage() {
  const { athleteNames } = useAthletes()
  const { races, isLoading, createMutation, updateMutation, deleteMutation } = useRaces()
  const { showToast } = useToast()
  const { setActivePage } = useAppStore()

  const [editingId, setEditingId] = useState<number | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft())

  const resetForm = () => { setEditingId(null); setDraft(emptyDraft()) }

  const startEdit = (r: Race) => {
    setEditingId(r.id)
    setDraft({
      athlete_id: r.athlete_id ?? 'shared',
      name: r.name, date: r.date, format: r.format, priority: r.priority,
      target_time: r.target_time ?? '', location: r.location ?? '', goal_notes: r.goal_notes ?? '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const canSubmit = draft.name.trim() && draft.date

  const handleSubmit = () => {
    const payload = {
      athlete_id: draft.athlete_id === 'shared' ? null : draft.athlete_id,
      name: draft.name.trim(),
      date: draft.date,
      format: draft.format,
      priority: draft.priority,
      target_time: draft.target_time.trim() || undefined,
      location: draft.location.trim() || undefined,
      goal_notes: draft.goal_notes.trim() || undefined,
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload }, {
        onSuccess: () => { showToast('Course mise à jour'); resetForm() },
      })
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => { showToast('Course ajoutée'); resetForm() },
      })
    }
  }

  const handleDelete = (r: Race) => {
    if (!window.confirm(`Supprimer "${r.name}" ?`)) return
    deleteMutation.mutate(r.id, {
      onSuccess: () => { showToast('Course supprimée'); if (editingId === r.id) resetForm() },
    })
  }

  const isSaving = createMutation.isLoading || updateMutation.isLoading

  return (
    <div className="px-4 md:px-8 pt-6 pb-24 max-w-screen-xl mx-auto">
      <button onClick={() => setActivePage('coach')} className="text-[12px] text-[#6B7B6B] mb-3 bg-none border-none cursor-pointer flex items-center gap-1">
        <i className="ti ti-chevron-left text-[13px]" />Retour au Coach IA
      </button>
      <h1 className="text-[22px] font-bold tracking-tight mb-1">Courses</h1>
      <p className="text-[13px] text-[#6B7B6B] mb-5">Tes objectifs de saison — le coach IA s'appuie dessus pour bâtir le planning</p>

      <div className="bg-white border border-[#E4E8E4] rounded-card p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-bold">{editingId ? 'Modifier la course' : 'Nouvelle course'}</h2>
          {editingId && (
            <button onClick={resetForm} className="text-[12px] text-[#6B7B6B] underline bg-none border-none cursor-pointer">
              Annuler
            </button>
          )}
        </div>

        <label className="text-[12px] font-medium text-[#6B7B6B] block mb-1">Nom de la course</label>
        <input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          placeholder="Ex: Half de Nice"
          className="w-full px-3 py-2.5 rounded-[7px] border border-[#E4E8E4] text-[14px] mb-3" />

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-[12px] font-medium text-[#6B7B6B] block mb-1">Date</label>
            <input type="date" value={draft.date} onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-[7px] border border-[#E4E8E4] text-[14px]" />
          </div>
          <div>
            <label className="text-[12px] font-medium text-[#6B7B6B] block mb-1">Format</label>
            <select value={draft.format} onChange={(e) => setDraft((d) => ({ ...d, format: e.target.value as RaceFormat }))}
              className="w-full px-3 py-2.5 rounded-[7px] border border-[#E4E8E4] text-[14px] bg-white">
              {FORMAT_OPTIONS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-[12px] font-medium text-[#6B7B6B] block mb-1">Pour qui ?</label>
            <select value={draft.athlete_id} onChange={(e) => setDraft((d) => ({ ...d, athlete_id: e.target.value as AthleteId | 'shared' }))}
              className="w-full px-3 py-2.5 rounded-[7px] border border-[#E4E8E4] text-[14px] bg-white">
              <option value="shared">Les deux</option>
              <option value="B">{athleteNames.B}</option>
              <option value="H">{athleteNames.H}</option>
            </select>
          </div>
          <div>
            <label className="text-[12px] font-medium text-[#6B7B6B] block mb-1">Priorité</label>
            <select value={draft.priority} onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value as RacePriority }))}
              className="w-full px-3 py-2.5 rounded-[7px] border border-[#E4E8E4] text-[14px] bg-white">
              <option value="A">A — course objectif</option>
              <option value="B">B — course intermédiaire</option>
              <option value="C">C — course d'entraînement</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-[12px] font-medium text-[#6B7B6B] block mb-1">Temps visé (optionnel)</label>
            <input value={draft.target_time} onChange={(e) => setDraft((d) => ({ ...d, target_time: e.target.value }))}
              placeholder="Ex: 5h30"
              className="w-full px-3 py-2.5 rounded-[7px] border border-[#E4E8E4] text-[14px]" />
          </div>
          <div>
            <label className="text-[12px] font-medium text-[#6B7B6B] block mb-1">Lieu (optionnel)</label>
            <input value={draft.location} onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-[7px] border border-[#E4E8E4] text-[14px]" />
          </div>
        </div>

        <label className="text-[12px] font-medium text-[#6B7B6B] block mb-1">Notes / objectif (optionnel)</label>
        <textarea value={draft.goal_notes} onChange={(e) => setDraft((d) => ({ ...d, goal_notes: e.target.value }))} rows={2}
          className="w-full px-3 py-2.5 rounded-[7px] border border-[#E4E8E4] text-[14px] resize-none mb-4" />

        <button onClick={handleSubmit} disabled={!canSubmit || isSaving}
          className="w-full py-3.5 rounded-card bg-teal text-white text-[15px] font-semibold disabled:opacity-30">
          {isSaving ? 'Enregistrement…' : editingId ? 'Mettre à jour' : 'Ajouter la course'}
        </button>
      </div>

      <h2 className="text-[14px] font-bold mb-3">Courses enregistrées</h2>
      {isLoading && <p className="text-[13px] text-[#A8B8A8]">Chargement…</p>}
      <div className="flex flex-col gap-2">
        {races.map((r) => (
          <div key={r.id} className="bg-white border border-[#E4E8E4] rounded-card p-3.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[14px] font-semibold text-[#1A1E1A]">{r.name}</span>
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${PRIORITY_CLS[r.priority]}`}>
                  {r.priority}
                </span>
                <button onClick={() => startEdit(r)} className="text-[#A8B8A8] hover:text-[#6B7B6B] text-[14px] bg-none border-none cursor-pointer p-0.5">
                  <i className="ti ti-edit" />
                </button>
                <button onClick={() => handleDelete(r)} className="text-[#A8B8A8] hover:text-[#A32D2D] text-[14px] bg-none border-none cursor-pointer p-0.5">
                  <i className="ti ti-trash" />
                </button>
              </div>
            </div>
            <p className="text-[11px] text-[#6B7B6B]">
              {r.date} · {FORMAT_OPTIONS.find((f) => f.id === r.format)?.label} · {r.athlete_id ? athleteNames[r.athlete_id] : 'Les deux'}
              {r.target_time ? ` · objectif ${r.target_time}` : ''}
            </p>
            {r.location && <p className="text-[11px] text-[#A8B8A8] mt-0.5">{r.location}</p>}
            {r.goal_notes && <p className="text-[12px] text-[#6B7B6B] mt-1">{r.goal_notes}</p>}
          </div>
        ))}
        {!isLoading && !races.length && <p className="text-[12px] text-[#A8B8A8] italic">Aucune course pour l'instant.</p>}
      </div>
    </div>
  )
}
