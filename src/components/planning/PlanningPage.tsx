import { useState } from 'react'
import { format, isToday } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useAppStore } from '../../store'
import { useWeek } from '../../hooks/useWeek'
import { useTraining, computeCharge } from '../../hooks/useTraining'
import { useAthletes } from '../../hooks/useAthletes'
import { useSessionResults } from '../../hooks/useSessionResults'
import { useToast } from '../shared/Toast'
import SessionModal from './SessionModal'
import SessionResultModal from './SessionResultModal'
import PerformanceView from '../performance/PerformanceView'
import type { ViewMode, Discipline, SessionResult } from '../../types'

const DISC_LABEL: Record<Discipline, string> = { swim: 'Natation', bike: 'Vélo', run: 'Run', strength: 'Muscu' }
const DISC_ICON: Record<Discipline, string> = { swim: 'ti-wave-sine', bike: 'ti-bike', run: 'ti-run', strength: 'ti-barbell' }
const CHARGE_DOT: Record<string, string> = { high: '#BA7517', med: '#1D9E75', low: '#A8B8A8', rest: '#A32D2D' }
const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export default function PlanningPage() {
  const { athleteNames } = useAthletes()
  const { viewMode, setViewMode } = useAppStore()
  const { shiftWeek } = useAppStore()
  const { dates, label } = useWeek()
  const { sessionsByDate, loadCounts, addMutation, removeMutation } = useTraining()
  const { saveMutation: saveResultMutation, removeMutation: removeResultMutation } = useSessionResults()
  const { showToast } = useToast()

  const [subView, setSubView] = useState<'plan' | 'performance'>('plan')
  const [modalDay, setModalDay] = useState<{ key: string; label: string } | null>(null)
  const [resultCtx, setResultCtx] = useState<{
    sessionId: number; discipline: Discipline; label: string; existing?: SessionResult
  } | null>(null)

  const todayKey = format(new Date(), 'yyyy-MM-dd')

  const openModal = (date: Date) => {
    setModalDay({
      key: format(date, 'yyyy-MM-dd'),
      label: format(date, 'EEEE d MMMM', { locale: fr }),
    })
  }

  const cB = loadCounts('B')
  const cH = loadCounts('H')
  const MAX = 5

  const tabCls = (mode: ViewMode) => {
    const active = viewMode === mode
    if (!active) return 'flex-1 py-2 rounded-[8px] text-[12px] font-semibold text-[#6B7B6B] bg-transparent border-none cursor-pointer'
    if (mode === 'B') return 'flex-1 py-2 rounded-[8px] text-[12px] font-semibold bg-teal-light text-teal border-none cursor-pointer'
    if (mode === 'H') return 'flex-1 py-2 rounded-[8px] text-[12px] font-semibold bg-violet-light text-violet border-none cursor-pointer'
    return 'flex-1 py-2 rounded-[8px] text-[12px] font-semibold bg-ocean-light text-ocean border-none cursor-pointer'
  }

  return (
    <div className="px-4 md:px-8 pt-6 pb-24 max-w-screen-xl mx-auto">
      <h1 className="text-[22px] font-bold tracking-tight mb-1">Planning</h1>
      <p className="text-[13px] text-[#6B7B6B] mb-4">{subView === 'plan' ? label : 'Résultats réels des séances'}</p>

      <div className="flex gap-1.5 bg-white border border-[#E4E8E4] rounded-card p-1 mb-4">
        {([{ id: 'plan', label: 'Planning', icon: 'ti-calendar-week' }, { id: 'performance', label: 'Performance', icon: 'ti-chart-line' }] as const).map((t) => (
          <button key={t.id} onClick={() => setSubView(t.id)}
            className={`flex-1 py-2 rounded-[8px] text-[12px] font-semibold border-none cursor-pointer transition-all ${subView === t.id ? 'bg-teal-light text-teal' : 'bg-transparent text-[#6B7B6B]'}`}>
            <i className={`ti ${t.icon} text-[13px] align-[-1px] mr-1`} />
            {t.label}
          </button>
        ))}
      </div>

      {subView === 'plan' && (
        <>
          <div className="flex gap-1.5 bg-white border border-[#E4E8E4] rounded-card p-1 mb-4">
            {(['B', 'H', 'T'] as ViewMode[]).map((m) => (
              <button key={m} onClick={() => setViewMode(m)} className={tabCls(m)}>
                <i className={`ti ${m === 'T' ? 'ti-users' : 'ti-user'} text-[13px] align-[-1px] mr-1`} />
                {m === 'T' ? 'Ensemble' : athleteNames[m]}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mb-4">
            <button onClick={() => shiftWeek(-1)} className="w-8 h-8 rounded-sm border border-[#E4E8E4] bg-white flex items-center justify-center text-[#6B7B6B]">
              <i className="ti ti-chevron-left text-[15px]" />
            </button>
            <span className="text-[13px] font-semibold">{label}</span>
            <button onClick={() => shiftWeek(1)} className="w-8 h-8 rounded-sm border border-[#E4E8E4] bg-white flex items-center justify-center text-[#6B7B6B]">
              <i className="ti ti-chevron-right text-[15px]" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1.5 mb-4">
            {(['swim', 'bike', 'run', 'strength'] as Discipline[]).map((disc) => {
              const nB = cB[disc]; const nH = cH[disc]
              const n = viewMode === 'T' ? null : viewMode === 'B' ? nB : nH
              const pctB = Math.min(nB / MAX, 1) * 100
              const pctH = Math.min(nH / MAX, 1) * 100
              const pct = viewMode === 'B' ? pctB : viewMode === 'H' ? pctH : pctB
              const colorMap: Record<Discipline, string> = { swim: 'bg-teal', bike: 'bg-amber-sport', run: 'bg-ocean', strength: 'bg-violet' }
              return (
                <div key={disc} className="bg-white border border-[#E4E8E4] rounded-card p-2.5">
                  <div className="flex items-center gap-1 text-[10px] text-[#6B7B6B] uppercase tracking-wider mb-1.5">
                    <i className={`ti ${DISC_ICON[disc]} text-[12px]`} />
                    {DISC_LABEL[disc]}
                  </div>
                  <div className="h-[3px] bg-[#E4E8E4] rounded-full relative mb-1">
                    <div className={`h-[3px] rounded-full absolute top-0 left-0 transition-all ${colorMap[disc]}`} style={{ width: `${pct}%` }} />
                    {viewMode === 'T' && <div className={`h-[3px] rounded-full absolute top-0 left-0 opacity-35 ${colorMap[disc]}`} style={{ width: `${pctH}%` }} />}
                  </div>
                  <div className="text-[11px] font-semibold text-[#1A1E1A]">
                    {viewMode === 'T' ? `B:${nB} H:${nH}` : `${n} séance${n !== 1 ? 's' : ''}`}
                  </div>
                </div>
              )
            })}
          </div>

          {viewMode === 'T' && (
            <div className="flex gap-3 mb-4 flex-wrap">
              <div className="flex items-center gap-1.5 text-[11px] text-[#6B7B6B]">
                <div className="w-2.5 h-2.5 rounded-full bg-teal" />{athleteNames.B}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#6B7B6B]">
                <div className="w-2.5 h-2.5 rounded-full bg-violet" />{athleteNames.H}
              </div>
            </div>
          )}

          <div className="overflow-x-auto -mx-4 md:-mx-8 px-4 md:px-8">
            <div className="flex gap-1.5 min-w-max">
              {dates.map((date, idx) => {
                const key = format(date, 'yyyy-MM-dd')
                const sB = sessionsByDate(key, 'B')
                const sH = sessionsByDate(key, 'H')
                const charge = computeCharge(sB, sH)
                const sessions = viewMode === 'T' ? [...sB.map(s => ({ ...s, who: 'B' as const })), ...sH.map(s => ({ ...s, who: 'H' as const }))]
                  : viewMode === 'B' ? sB.map(s => ({ ...s, who: 'B' as const })) : sH.map(s => ({ ...s, who: 'H' as const }))
                const canLog = key <= todayKey

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
                          : s.discipline === 'run' ? 'bg-ocean-light border-[#BAD6F0]'
                          : 'bg-violet-light border-violet-mid'
                        const typeColor = s.discipline === 'swim' ? 'text-teal'
                          : s.discipline === 'bike' ? 'text-amber-sport'
                          : s.discipline === 'run' ? 'text-ocean' : 'text-violet'
                        const stripe = viewMode === 'T'
                          ? (s.who === 'B' ? 'border-l-2 border-l-teal rounded-l-none' : 'border-l-2 border-l-violet rounded-l-none')
                          : ''
                        const ownerColor = s.who === 'B' ? 'text-teal' : 'text-violet'
                        const hasResult = !!s.result
                        return (
                          <div key={i} className={`rounded-sm border px-1.5 py-1 relative group ${discColor} ${stripe}`}>
                            <div className={`text-[10px] font-semibold uppercase tracking-wide ${typeColor}`}>
                              {DISC_LABEL[s.discipline]}
                            </div>
                            <div className="text-[10px] text-[#6B7B6B]">{s.kind}</div>
                            <div className="text-[10px] text-[#A8B8A8]">{s.duration}</div>
                            {viewMode === 'T' && (
                              <div className={`text-[9px] font-semibold mt-0.5 ${ownerColor}`}>
                                {athleteNames[s.who]}
                              </div>
                            )}
                            {canLog && (
                              <button
                                onClick={() => setResultCtx({
                                  sessionId: s.id,
                                  discipline: s.discipline,
                                  label: `${DISC_LABEL[s.discipline]} — ${format(date, 'EEEE d MMMM', { locale: fr })}`,
                                  existing: s.result,
                                })}
                                className={`mt-1 w-full text-[9px] rounded-[4px] py-0.5 flex items-center justify-center gap-0.5 cursor-pointer border ${hasResult ? 'bg-teal text-white border-teal' : 'bg-white/70 text-[#6B7B6B] border-[#E4E8E4]'}`}
                              >
                                <i className={`ti ${hasResult ? 'ti-check' : 'ti-stopwatch'} text-[10px]`} />
                                {hasResult ? 'Résultat' : 'Log'}
                              </button>
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

          <SessionResultModal
            open={!!resultCtx}
            onClose={() => setResultCtx(null)}
            sessionLabel={resultCtx?.label ?? ''}
            discipline={resultCtx?.discipline ?? 'run'}
            existing={resultCtx?.existing}
            onSave={(payload) => {
              if (!resultCtx) return
              saveResultMutation.mutate({ sessionId: resultCtx.sessionId, ...payload })
              showToast('Résultat enregistré')
            }}
            onDelete={resultCtx?.existing ? () => {
              if (!resultCtx) return
              removeResultMutation.mutate(resultCtx.sessionId)
              showToast('Résultat supprimé')
            } : undefined}
          />
        </>
      )}

      {subView === 'performance' && <PerformanceView />}
    </div>
  )
}
