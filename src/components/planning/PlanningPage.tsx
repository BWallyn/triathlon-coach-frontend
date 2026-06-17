import { useState } from 'react'
import { format, isToday } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useAppStore } from '../../store'
import { useWeek } from '../../hooks/useWeek'
import { useTraining, computeCharge } from '../../hooks/useTraining'
import { useToast } from '../shared/Toast'
import SessionModal from './SessionModal'
import type { ViewMode, Discipline, AthleteId } from '../../types'

const DISC_LABEL: Record<Discipline, string> = { swim: 'Natation', bike: 'Vélo', run: 'Run' }
const DISC_ICON: Record<Discipline, string> = { swim: 'ti-wave-sine', bike: 'ti-bike', run: 'ti-run' }
const CHARGE_DOT: Record<string, string> = { high: '#BA7517', med: '#1D9E75', low: '#A8B8A8', rest: '#A32D2D' }
const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const athleteNames: Record<AthleteId, string> = { B: 'Benji', C: 'Ma copine' }

export default function PlanningPage() {
  const { viewMode, setViewMode } = useAppStore()
  const { shiftWeek } = useAppStore()
  const { dates, weekStart, weekEnd, label } = useWeek()
  const { sessionsByDate, loadCounts, addMutation, removeMutation } = useTraining()
  const { showToast } = useToast()

  const [modalDay, setModalDay] = useState<{ key: string; label: string } | null>(null)

  const openModal = (date: Date) => {
    setModalDay({
      key: format(date, 'yyyy-MM-dd'),
      label: format(date, 'EEEE d MMMM', { locale: fr }),
    })
  }

  const cB = loadCounts('B')
  const cC = loadCounts('C')
  const MAX = 5

  const tabCls = (mode: ViewMode) => {
    const active = viewMode === mode
    if (!active) return 'flex-1 py-2 rounded-[8px] text-[12px] font-semibold text-[#6B7B6B] bg-transparent border-none cursor-pointer'
    if (mode === 'B') return 'flex-1 py-2 rounded-[8px] text-[12px] font-semibold bg-teal-light text-teal border-none cursor-pointer'
    if (mode === 'C') return 'flex-1 py-2 rounded-[8px] text-[12px] font-semibold bg-violet-light text-violet border-none cursor-pointer'
    return 'flex-1 py-2 rounded-[8px] text-[12px] font-semibold bg-ocean-light text-ocean border-none cursor-pointer'
  }

  return (
    <div className="max-w-lg mx-auto px-3.5 pt-4 pb-24">
      <h1 className="text-[22px] font-bold tracking-tight mb-1">Planning</h1>
      <p className="text-[13px] text-[#6B7B6B] mb-4">{label}</p>

      {/* Athlete tabs */}
      <div className="flex gap-1.5 bg-white border border-[#E4E8E4] rounded-card p-1 mb-4">
        {(['B', 'C', 'T'] as ViewMode[]).map((m) => (
          <button key={m} onClick={() => setViewMode(m)} className={tabCls(m)}>
            <i className={`ti ${m === 'T' ? 'ti-users' : 'ti-user'} text-[13px] align-[-1px] mr-1`} />
            {m === 'B' ? 'Benji' : m === 'C' ? 'Ma copine' : 'Ensemble'}
          </button>
        ))}
      </div>

      {/* Week nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => shiftWeek(-1)} className="w-8 h-8 rounded-sm border border-[#E4E8E4] bg-white flex items-center justify-center text-[#6B7B6B]">
          <i className="ti ti-chevron-left text-[15px]" />
        </button>
        <span className="text-[13px] font-semibold">{label}</span>
        <button onClick={() => shiftWeek(1)} className="w-8 h-8 rounded-sm border border-[#E4E8E4] bg-white flex items-center justify-center text-[#6B7B6B]">
          <i className="ti ti-chevron-right text-[15px]" />
        </button>
      </div>

      {/* Load bars */}
      <div className="grid grid-cols-3 gap-1.5 mb-4">
        {(['swim', 'bike', 'run'] as Discipline[]).map((disc) => {
          const nB = cB[disc]; const nC = cC[disc]
          const n = viewMode === 'T' ? null : viewMode === 'B' ? nB : nC
          const pctB = Math.min(nB / MAX, 1) * 100
          const pctC = Math.min(nC / MAX, 1) * 100
          const pct = viewMode === 'B' ? pctB : viewMode === 'C' ? pctC : pctB
          const colorMap: Record<Discipline, string> = { swim: 'bg-teal', bike: 'bg-amber-sport', run: 'bg-ocean' }
          return (
            <div key={disc} className="bg-white border border-[#E4E8E4] rounded-card p-2.5">
              <div className="flex items-center gap-1 text-[10px] text-[#6B7B6B] uppercase tracking-wider mb-1.5">
                <i className={`ti ${DISC_ICON[disc]} text-[12px]`} />
                {DISC_LABEL[disc]}
              </div>
              <div className="h-[3px] bg-[#E4E8E4] rounded-full relative mb-1">
                <div className={`h-[3px] rounded-full absolute top-0 left-0 transition-all ${colorMap[disc]}`} style={{ width: `${pct}%` }} />
                {viewMode === 'T' && <div className={`h-[3px] rounded-full absolute top-0 left-0 opacity-35 ${colorMap[disc]}`} style={{ width: `${pctC}%` }} />}
              </div>
              <div className="text-[11px] font-semibold text-[#1A1E1A]">
                {viewMode === 'T' ? `B:${nB} C:${nC}` : `${n} séance${n !== 1 ? 's' : ''}`}
              </div>
            </div>
          )
        })}
      </div>

      {/* Ensemble legend */}
      {viewMode === 'T' && (
        <div className="flex gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-[11px] text-[#6B7B6B]">
            <div className="w-2.5 h-2.5 rounded-full bg-teal" />Benji
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#6B7B6B]">
            <div className="w-2.5 h-2.5 rounded-full bg-violet" />Ma copine
          </div>
        </div>
      )}

      {/* Days scroll */}
      <div className="overflow-x-auto -mx-3.5 px-3.5">
        <div className="flex gap-1.5 min-w-max">
          {dates.map((date, idx) => {
            const key = format(date, 'yyyy-MM-dd')
            const sB = sessionsByDate(key, 'B')
            const sC = sessionsByDate(key, 'C')
            const charge = computeCharge(sB, sC)
            const sessions = viewMode === 'T' ? [...sB.map(s => ({ ...s, who: 'B' as const })), ...sC.map(s => ({ ...s, who: 'C' as const }))]
              : viewMode === 'B' ? sB.map(s => ({ ...s, who: 'B' as const })) : sC.map(s => ({ ...s, who: 'C' as const }))

            return (
              <div key={key} className="w-[88px] flex-shrink-0">
                <div className="text-center mb-2">
                  <div className="text-[10px] text-[#A8B8A8] uppercase tracking-widest">{DAYS_SHORT[idx]}</div>
                  <div className={`text-[18px] font-bold leading-tight ${isToday(date) ? 'text-teal' : 'text-[#1A1E1A]'}`}>
                    {format(date, 'd')}
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full mx-auto mt-0.5" style={{ background: CHARGE_DOT[charge] }} title={charge} />
                </div>

                <div className="flex flex-col gap-1.5 min-h-[40px]">
                  {sessions.map((s, i) => {
                    const discColor = s.discipline === 'swim' ? 'bg-teal-light border-[#B0E8D4]'
                      : s.discipline === 'bike' ? 'bg-amber-light border-[#F5D49A]'
                      : 'bg-ocean-light border-[#BAD6F0]'
                    const typeColor = s.discipline === 'swim' ? 'text-teal'
                      : s.discipline === 'bike' ? 'text-amber-sport' : 'text-ocean'
                    const stripe = viewMode === 'T'
                      ? (s.who === 'B' ? 'border-l-2 border-l-teal rounded-l-none' : 'border-l-2 border-l-violet rounded-l-none')
                      : ''
                    const ownerColor = s.who === 'B' ? 'text-teal' : 'text-violet'
                    return (
                      <div key={i} className={`rounded-sm border px-1.5 py-1 relative group ${discColor} ${stripe}`}>
                        <div className={`text-[10px] font-semibold uppercase tracking-wide ${typeColor}`}>
                          {DISC_LABEL[s.discipline]}
                        </div>
                        <div className="text-[10px] text-[#6B7B6B]">{s.kind}</div>
                        <div className="text-[10px] text-[#A8B8A8]">{s.duration}</div>
                        {viewMode === 'T' && (
                          <div className={`text-[9px] font-semibold mt-0.5 ${ownerColor}`}>
                            {s.who === 'B' ? 'Benji' : 'Copine'}
                          </div>
                        )}
                        {viewMode !== 'T' && (
                          <button
                            onClick={() => { removeMutation.mutate(s.id); showToast('Séance supprimée') }}
                            className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 text-[#A8B8A8] hover:text-[#6B7B6B] text-[11px] bg-none border-none cursor-pointer p-0.5"
                          >
                            <i className="ti ti-x" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>

                <button
                  onClick={() => openModal(date)}
                  className="w-full mt-1.5 py-1.5 border border-dashed border-[#E4E8E4] rounded-sm text-[15px] text-[#A8B8A8] hover:border-[#6B7B6B] hover:text-[#6B7B6B] hover:bg-[#F4F6F4] bg-none cursor-pointer"
                >
                  <i className="ti ti-plus" />
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <SessionModal
        open={!!modalDay}
        onClose={() => setModalDay(null)}
        dateKey={modalDay?.key ?? ''}
        dateLabel={modalDay?.label ?? ''}
        viewMode={viewMode}
        athleteNames={athleteNames}
        onAdd={(payload) => {
          addMutation.mutate(payload)
          showToast('Séance ajoutée')
        }}
      />
    </div>
  )
}
