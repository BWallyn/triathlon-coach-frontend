import { useState } from 'react'
import { format, addDays } from 'date-fns'
import { useWeek } from '../../hooks/useWeek'
import { useCoach } from '../../hooks/useCoach'
import { useRaces } from '../../hooks/useRaces'
import { useTraining } from '../../hooks/useTraining'
import { useAthletes } from '../../hooks/useAthletes'
import { useToast } from '../shared/Toast'
import { useAppStore } from '../../store'
import type { TrainingPlanSession, AthleteId, Discipline } from '../../types'

const DAYS_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const DISC_LABEL: Record<Discipline, string> = { swim: 'Natation', bike: 'Vélo', run: 'Run', strength: 'Muscu' }
const DISC_ICON: Record<Discipline, string> = { swim: 'ti-wave-sine', bike: 'ti-bike', run: 'ti-run', strength: 'ti-barbell' }

const LOAD_OPTIONS = [
  { id: 'légère', label: 'Légère' },
  { id: 'modérée', label: 'Modérée' },
  { id: 'chargée', label: 'Chargée' },
]

export default function CoachPage() {
  const { dates, weekStart, weekEnd, label } = useWeek()
  const { athleteNames } = useAthletes()
  const { races } = useRaces()
  const { planMutation } = useCoach()
  const { addMutation } = useTraining()
  const { showToast } = useToast()
  const { setActivePage } = useAppStore()

  const [goal, setGoal] = useState('')
  const [loadLevel, setLoadLevel] = useState('modérée')
  const [constraints, setConstraints] = useState('')
  const [maxSessions, setMaxSessions] = useState('10')
  const [accepted, setAccepted] = useState<Set<string>>(new Set())

  const plan = planMutation.data

  const nextRaces = races.filter((r) => r.date >= format(new Date(), 'yyyy-MM-dd')).slice(0, 3)

  const handleGenerate = () => {
    setAccepted(new Set())
    planMutation.mutate(
      {
        week_start: weekStart,
        week_end: weekEnd,
        goal: goal.trim() || undefined,
        load_level: loadLevel,
        constraints: constraints.trim() || 'Aucune',
        max_sessions: Number(maxSessions) || 10,
      },
      { onError: () => showToast("Erreur lors de la génération du plan") },
    )
  }

  const sessionKey = (dayIdx: number, sIdx: number) => `${dayIdx}-${sIdx}`

  const toggleAccepted = (key: string) =>
    setAccepted((p) => { const s = new Set(p); s.has(key) ? s.delete(key) : s.add(key); return s })

  const dateForDay = (dayLabel: string) => {
    const idx = DAYS_FR.indexOf(dayLabel)
    return idx >= 0 ? format(dates[idx], 'yyyy-MM-dd') : format(addDays(dates[0], 0), 'yyyy-MM-dd')
  }

  const handleAcceptSelected = () => {
    if (!plan) return
    let count = 0
    plan.days.forEach((day, dayIdx) => {
      const dateKey = dateForDay(day.day)
      day.sessions.forEach((s: TrainingPlanSession, sIdx: number) => {
        const key = sessionKey(dayIdx, sIdx)
        if (!accepted.has(key)) return
        const athletes: AthleteId[] = s.athlete === 'both' ? ['B', 'H'] : [s.athlete as AthleteId]
        athletes.forEach((athlete_id) => {
          addMutation.mutate({ athlete_id, date: dateKey, discipline: s.discipline, kind: s.kind, duration: s.duration })
          count++
        })
      })
    })
    showToast(`${count} séance${count > 1 ? 's' : ''} ajoutée${count > 1 ? 's' : ''} au planning`)
    setAccepted(new Set())
  }

  const acceptAll = () => {
    if (!plan) return
    const all = new Set<string>()
    plan.days.forEach((day, dayIdx) => day.sessions.forEach((_, sIdx) => all.add(sessionKey(dayIdx, sIdx))))
    setAccepted(all)
  }

  return (
    <div className="px-4 md:px-8 pt-6 pb-24 max-w-screen-xl mx-auto">
      <h1 className="text-[22px] font-bold tracking-tight mb-1">Coach IA</h1>
      <p className="text-[13px] text-[#6B7B6B] mb-4">Plan d'entraînement pour {label}, adapté à vos courses et votre forme récente</p>

      <button onClick={() => setActivePage('races')}
        className="w-full flex items-center justify-between px-3.5 py-3 rounded-card border border-[#E4E8E4] bg-white mb-4 cursor-pointer">
        <span className="text-[13px] font-semibold text-[#1A1E1A]">
          <i className="ti ti-flag text-[15px] text-teal align-[-2px] mr-1.5" />
          {nextRaces.length ? `${nextRaces.length} course${nextRaces.length > 1 ? 's' : ''} à venir` : 'Aucune course enregistrée'}
        </span>
        <i className="ti ti-chevron-right text-[13px] text-[#A8B8A8]" />
      </button>

      {nextRaces.length > 0 && (
        <div className="flex flex-col gap-1.5 mb-4">
          {nextRaces.map((r) => (
            <div key={r.id} className="text-[12px] text-[#6B7B6B] px-1">
              <span className="font-semibold text-[#1A1E1A]">{r.name}</span> — {r.date} · {r.athlete_id ? athleteNames[r.athlete_id] : 'Les deux'} · priorité {r.priority}
            </div>
          ))}
        </div>
      )}

      <div className="bg-white border border-[#E4E8E4] rounded-card p-4 mb-4">
        <h2 className="text-[14px] font-bold mb-3">Générer le plan de la semaine</h2>

        <label className="text-[12px] font-medium text-[#6B7B6B] block mb-1">Objectif de la semaine (optionnel)</label>
        <input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="Laisse vide pour laisser le coach déduire de tes courses"
          className="w-full px-3 py-2.5 rounded-[7px] border border-[#E4E8E4] text-[14px] mb-3" />

        <label className="text-[12px] font-medium text-[#6B7B6B] block mb-2">Charge souhaitée</label>
        <div className="flex gap-1.5 mb-3">
          {LOAD_OPTIONS.map((o) => (
            <button key={o.id} onClick={() => setLoadLevel(o.id)}
              className={`flex-1 py-2 rounded-[7px] border text-[12px] font-medium cursor-pointer ${loadLevel === o.id ? 'bg-teal-light text-teal border-teal-mid' : 'bg-[#F4F6F4] text-[#6B7B6B] border-[#E4E8E4]'}`}>
              {o.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-[12px] font-medium text-[#6B7B6B] block mb-1">Contraintes (optionnel)</label>
            <input value={constraints} onChange={(e) => setConstraints(e.target.value)} placeholder="Ex: pas de vélo mardi"
              className="w-full px-3 py-2.5 rounded-[7px] border border-[#E4E8E4] text-[13px]" />
          </div>
          <div>
            <label className="text-[12px] font-medium text-[#6B7B6B] block mb-1">Séances max</label>
            <input type="number" min={1} value={maxSessions} onChange={(e) => setMaxSessions(e.target.value)}
              className="w-full px-3 py-2.5 rounded-[7px] border border-[#E4E8E4] text-[13px]" />
          </div>
        </div>

        <button onClick={handleGenerate} disabled={planMutation.isLoading}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-card bg-teal text-white text-[15px] font-semibold disabled:opacity-50">
          {planMutation.isLoading
            ? <><span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Génération…</>
            : <><i className="ti ti-sparkles text-[16px]" />Générer le plan</>}
        </button>
      </div>

      {plan && (
        <div className="bg-white border border-[#E4E8E4] rounded-card p-4 mb-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-[15px] font-bold text-[#1A1E1A]">{plan.week_focus}</h2>
            <span className="text-[12px] font-semibold text-teal">{plan.total_hours}h</span>
          </div>
          {plan.coach_notes && <p className="text-[12px] text-[#6B7B6B] mb-4">{plan.coach_notes}</p>}

          <div className="flex flex-col gap-2 mb-4">
            {plan.days.map((day, dayIdx) => (
              <div key={dayIdx} className="border border-[#E4E8E4] rounded-card p-2.5">
                <p className="text-[12px] font-semibold text-[#1A1E1A] mb-2">{day.day}</p>
                {day.rest || !day.sessions.length
                  ? <p className="text-[12px] text-[#A8B8A8] italic">Repos</p>
                  : day.sessions.map((s, sIdx) => {
                    const key = sessionKey(dayIdx, sIdx)
                    const isAccepted = accepted.has(key)
                    return (
                      <label key={sIdx} className="flex items-start gap-2.5 py-1.5 cursor-pointer">
                        <input type="checkbox" checked={isAccepted} onChange={() => toggleAccepted(key)} className="mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#1A1E1A]">
                            <i className={`ti ${DISC_ICON[s.discipline]} text-[13px] text-teal`} />
                            {DISC_LABEL[s.discipline]} · {s.kind} · {s.duration}
                            <span className="text-[10px] font-normal text-[#A8B8A8] ml-auto">
                              {s.athlete === 'both' ? 'Les deux' : athleteNames[s.athlete as AthleteId]}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#6B7B6B] mt-0.5">{s.description}</p>
                        </div>
                      </label>
                    )
                  })}
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={acceptAll} className="flex-1 py-3 rounded-card border border-[#E4E8E4] text-[13px] font-semibold text-[#6B7B6B]">
              Tout sélectionner
            </button>
            <button onClick={handleAcceptSelected} disabled={!accepted.size}
              className="flex-1 py-3 rounded-card bg-teal text-white text-[13px] font-semibold disabled:opacity-30">
              Ajouter au planning ({accepted.size})
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
