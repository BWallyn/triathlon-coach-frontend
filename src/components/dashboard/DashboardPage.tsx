import { useMemo, useState } from 'react'
import { useQuery } from 'react-query'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, addMonths, subMonths } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getSessions } from '../../api'
import { useDashboard } from '../../hooks/useData'
import { useWeek } from '../../hooks/useWeek'
import { useAppStore } from '../../store'
import { useToast } from '../shared/Toast'
import type { AthleteId, Charge, Discipline } from '../../types'

// ── Palettes ──────────────────────────────────────────────────
const CHARGE_COLOR: Record<Charge, string> = {
  high: 'bg-amber-light text-amber-sport border-amber-mid',
  med: 'bg-teal-light text-teal border-teal-mid',
  low: 'bg-[#F4F6F4] text-[#6B7B6B] border-[#E4E8E4]',
  rest: 'bg-[#FCEBEB] text-[#A32D2D] border-[#F5C6C6]',
}
const CHARGE_DOT: Record<Charge, string> = {
  high: '#BA7517', med: '#1D9E75', low: '#A8B8A8', rest: '#A32D2D',
}
const CHARGE_LABEL: Record<Charge, string> = {
  high: 'Élevée', med: 'Modérée', low: 'Légère', rest: 'Repos',
}
const DISC_ICON: Record<Discipline, string> = {
  swim: 'ti-wave-sine', bike: 'ti-bike', run: 'ti-run', strength: 'ti-barbell',
}
const DISC_COLOR: Record<Discipline, string> = {
  swim: 'text-teal', bike: 'text-amber-sport', run: 'text-ocean', strength: 'text-violet',
}

function ScoreBar({ value, max = 5, color }: { value: number; max?: number; color: string }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => (
        <div key={i} className={`flex-1 h-1.5 rounded-full ${i < value ? color : 'bg-[#E4E8E4]'}`} />
      ))}
    </div>
  )
}

// ── Sleep & Feeling log modal ─────────────────────────────────
function LogModal({ open, onClose, date, onSaveSleep, onSaveFeeling, existing }: {
  open: boolean; onClose: () => void; date: string
  onSaveSleep: (v: { duration_min: number; quality: number }) => void
  onSaveFeeling: (v: { fatigue: number; motivation: number; soreness: number; note?: string }) => void
  existing?: { sleep?: any; feeling?: any }
}) {
  const [tab, setTab] = useState<'sleep' | 'feeling'>('sleep')
  const [hours, setHours] = useState(String(existing?.sleep ? Math.floor(existing.sleep.duration_min / 60) : 7))
  const [mins, setMins] = useState(String(existing?.sleep ? existing.sleep.duration_min % 60 : 30))
  const [quality, setQuality] = useState(existing?.sleep?.quality ?? 3)
  const [fatigue, setFatigue] = useState(existing?.feeling?.fatigue ?? 3)
  const [motivation, setMotivation] = useState(existing?.feeling?.motivation ?? 3)
  const [soreness, setSoreness] = useState(existing?.feeling?.soreness ?? 3)
  const [note, setNote] = useState(existing?.feeling?.note ?? '')

  if (!open) return null

  const d = new Date(date + 'T12:00:00')

  const ScoreInput = ({ label, value, setValue }: { label: string; value: number; setValue: (v: number) => void }) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[13px] font-medium text-[#1A1E1A]">{label}</span>
        <span className="text-[13px] font-bold text-teal">{value}/5</span>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((v) => (
          <button key={v} onClick={() => setValue(v)}
            className={`flex-1 py-2.5 rounded-[7px] border text-[13px] font-semibold cursor-pointer transition-all ${value === v ? 'bg-teal text-white border-teal' : 'bg-[#F4F6F4] text-[#6B7B6B] border-[#E4E8E4]'}`}>
            {v}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full bg-white rounded-t-2xl border-t border-[#E4E8E4] max-h-[88vh] overflow-y-auto pb-10 max-w-2xl mx-auto">
        <div className="w-9 h-1 bg-[#E4E8E4] rounded-full mx-auto mt-3 mb-4" />
        <div className="px-5">
          <h2 className="text-[16px] font-bold mb-1">Saisie du jour</h2>
          <p className="text-[13px] text-[#6B7B6B] mb-4">{format(d, 'EEEE d MMMM', { locale: fr })}</p>

          <div className="flex gap-1.5 bg-[#F4F6F4] rounded-card p-1 mb-5">
            {(['sleep', 'feeling'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 rounded-[8px] text-[12px] font-semibold border-none cursor-pointer transition-all ${tab === t ? 'bg-white text-[#1A1E1A] shadow-sm' : 'bg-transparent text-[#6B7B6B]'}`}>
                <i className={`ti ${t === 'sleep' ? 'ti-moon' : 'ti-heart-rate-monitor'} text-[13px] align-[-1px] mr-1`} />
                {t === 'sleep' ? 'Sommeil' : 'Ressenti'}
              </button>
            ))}
          </div>

          {tab === 'sleep' && (
            <>
              <div className="mb-4">
                <label className="text-[12px] font-medium text-[#6B7B6B] block mb-2">Durée de sommeil</label>
                <div className="flex gap-3 items-center">
                  <div className="flex-1">
                    <input type="number" min="0" max="12" value={hours} onChange={e => setHours(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-[7px] border border-[#E4E8E4] text-[14px] text-center focus:outline-none focus:border-teal-mid" />
                    <p className="text-[10px] text-[#A8B8A8] text-center mt-1">heures</p>
                  </div>
                  <span className="text-[20px] text-[#A8B8A8] font-light">:</span>
                  <div className="flex-1">
                    <input type="number" min="0" max="59" value={mins} onChange={e => setMins(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-[7px] border border-[#E4E8E4] text-[14px] text-center focus:outline-none focus:border-teal-mid" />
                    <p className="text-[10px] text-[#A8B8A8] text-center mt-1">minutes</p>
                  </div>
                </div>
              </div>
              <ScoreInput label="Qualité perçue" value={quality} setValue={setQuality} />
              <button onClick={() => {
                onSaveSleep({ duration_min: parseInt(hours) * 60 + parseInt(mins), quality })
                onClose()
              }} className="w-full py-3.5 bg-teal text-white rounded-card text-[15px] font-semibold mt-2">
                Enregistrer le sommeil
              </button>
            </>
          )}

          {tab === 'feeling' && (
            <>
              <ScoreInput label="Fraîcheur (1=épuisé, 5=au top)" value={fatigue} setValue={setFatigue} />
              <ScoreInput label="Motivation (1=nulle, 5=max)" value={motivation} setValue={setMotivation} />
              <ScoreInput label="Courbatures (1=très douloureux, 5=aucune)" value={soreness} setValue={setSoreness} />
              <div className="mb-4">
                <label className="text-[12px] font-medium text-[#6B7B6B] block mb-2">Note (optionnel)</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Comment tu te sens ?"
                  className="w-full px-3 py-2.5 rounded-[7px] border border-[#E4E8E4] text-[13px] resize-none focus:outline-none focus:border-teal-mid" />
              </div>
              <button onClick={() => {
                onSaveFeeling({ fatigue, motivation, soreness, note: note || undefined })
                onClose()
              }} className="w-full py-3.5 bg-teal text-white rounded-card text-[15px] font-semibold mt-2">
                Enregistrer le ressenti
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────
export default function DashboardPage() {
  const { dates, label } = useWeek()
  const { shiftWeek } = useAppStore()
  const { summary, sleepMutation, feelingMutation } = useDashboard()
  const { showToast } = useToast()
  const { setActivePage } = useAppStore()

  const [calMonth, setCalMonth] = useState(new Date())
  const [logModal, setLogModal] = useState<{ date: string; athleteId: AthleteId } | null>(null)

  // ── Calendar ───────────────────────────────────────────────
  const calStart = startOfMonth(calMonth)
  const calEnd = endOfMonth(calMonth)
  const calStartKey = format(calStart, 'yyyy-MM-dd')
  const calEndKey = format(calEnd, 'yyyy-MM-dd')
  const todayKey = format(new Date(), 'yyyy-MM-dd')
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd })
  const firstDow = (getDay(calStart) + 6) % 7 // Mon=0

  const { data: monthSessions = [], isLoading: isMonthSessionsLoading } = useQuery(
    ['dashboard-month-sessions', calStartKey, calEndKey],
    () => getSessions(calStartKey, calEndKey),
    { staleTime: 60_000 },
  )

  const monthSessionsByDay = useMemo(() => {
    const base: Record<string, Record<AthleteId, Discipline[]>> = {}
    monthSessions.forEach((s) => {
      const athlete: AthleteId = s.athlete_id === 'B' ? 'B' : 'H'
      if (!base[s.date]) {
        base[s.date] = { B: [], H: [] }
      }
      if (!base[s.date][athlete].includes(s.discipline)) {
        base[s.date][athlete].push(s.discipline)
      }
    })
    return base
  }, [monthSessions])

  const chargeForDay = (d: Date): Charge | null => {
    const key = format(d, 'yyyy-MM-dd')
    return summary?.day_charges[key] ?? null
  }

  // ── Averages ───────────────────────────────────────────────
  const avgSleep = (athleteId: AthleteId) => {
    const entries = Object.values(summary?.sleep[athleteId] ?? {})
    if (!entries.length) return null
    const avgMin = entries.reduce((s, e) => s + e.duration_min, 0) / entries.length
    const avgQ = entries.reduce((s, e) => s + e.quality, 0) / entries.length
    return { hours: (avgMin / 60).toFixed(1), quality: avgQ.toFixed(1) }
  }

  const avgFeeling = (athleteId: AthleteId) => {
    const entries = Object.values(summary?.feeling[athleteId] ?? {})
    if (!entries.length) return null
    return {
      fatigue: (entries.reduce((s, e) => s + e.fatigue, 0) / entries.length).toFixed(1),
      motivation: (entries.reduce((s, e) => s + e.motivation, 0) / entries.length).toFixed(1),
      soreness: (entries.reduce((s, e) => s + e.soreness, 0) / entries.length).toFixed(1),
    }
  }

  const totalLoad = (athleteId: AthleteId) => {
    const l = summary?.weekly_load[athleteId]
    if (!l) return 0
    return (l.swim + l.bike + l.run + (l.strength ?? 0)).toFixed(1)
  }

  const sleepB = avgSleep('B')
  const sleepH = avgSleep('H')
  const feelingB = avgFeeling('B')
  const feelingH = avgFeeling('H')

  return (
    <div className="px-4 md:px-8 pt-6 pb-24 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-[#1A1E1A]">Dashboard</h1>
          <p className="text-[14px] text-[#6B7B6B]">Vue couple — semaine en cours</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => shiftWeek(-1)} className="w-8 h-8 rounded-[7px] border border-[#E4E8E4] bg-white flex items-center justify-center text-[#6B7B6B] cursor-pointer">
            <i className="ti ti-chevron-left text-[15px]" />
          </button>
          <span className="text-[13px] font-semibold text-[#1A1E1A] min-w-[140px] text-center">{label}</span>
          <button onClick={() => shiftWeek(1)} className="w-8 h-8 rounded-[7px] border border-[#E4E8E4] bg-white flex items-center justify-center text-[#6B7B6B] cursor-pointer">
            <i className="ti ti-chevron-right text-[15px]" />
          </button>
        </div>
      </div>

      {/* KPI rows by athlete */}
      <div className="flex flex-col gap-3 mb-6">
        {([
          { id: 'H' as AthleteId, name: 'Hélène', sleep: sleepH, feeling: feelingH, tone: 'violet' as const },
          { id: 'B' as AthleteId, name: 'Benji', sleep: sleepB, feeling: feelingB, tone: 'teal' as const },
        ]).map(({ id, name, sleep, feeling, tone }) => (
          <div key={id} className="rounded-card border border-[#E4E8E4] bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <p className={`text-[14px] font-bold ${tone === 'teal' ? 'text-teal' : 'text-violet'}`}>{name}</p>
              <span className="text-[10px] uppercase tracking-wider text-[#6B7B6B]">Cette semaine</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <div className={`rounded-[10px] border px-3 py-2 ${tone === 'teal' ? 'bg-teal-light border-teal-mid' : 'bg-violet-light border-violet-mid'}`}>
                <div className="text-[10px] uppercase tracking-wider text-[#6B7B6B] mb-0.5">Charge</div>
                <div className="text-[20px] font-bold text-[#1A1E1A] leading-tight">{totalLoad(id)}h</div>
              </div>
              <div className="rounded-[10px] border border-teal-mid bg-teal-light px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-[#6B7B6B] mb-0.5">Sommeil moy.</div>
                <div className="text-[20px] font-bold text-[#1A1E1A] leading-tight">{sleep ? `${sleep.hours}h` : '—'}</div>
              </div>
              <div className="rounded-[10px] border border-amber-mid bg-amber-light px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-[#6B7B6B] mb-0.5">Ressenti</div>
                <div className="text-[20px] font-bold text-[#1A1E1A] leading-tight">{feeling ? `${feeling.fatigue}/5` : '—'}</div>
              </div>
              <div className="rounded-[10px] border border-ocean-mid bg-ocean-light px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-[#6B7B6B] mb-0.5">Motivation</div>
                <div className="text-[20px] font-bold text-[#1A1E1A] leading-tight">{feeling ? `${feeling.motivation}/5` : '—'}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Calendrier mensuel */}
      <div className="bg-white border border-[#E4E8E4] rounded-card p-5 md:p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-[24px] md:text-[30px] leading-none font-bold capitalize text-[#1A1E1A]">
              {format(calMonth, 'MMMM yyyy', { locale: fr })}
            </h2>
            <p className="text-[11px] md:text-[12px] text-[#6B7B6B] mt-1.5">
              Sports programmés (icônes atténuées à venir, pleines passées/du jour)
            </p>
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => setCalMonth(subMonths(calMonth, 1))} className="w-8 h-8 rounded-[7px] border border-[#E4E8E4] bg-white flex items-center justify-center cursor-pointer text-[#6B7B6B]">
              <i className="ti ti-chevron-left text-[14px]" />
            </button>
            <button onClick={() => setCalMonth(addMonths(calMonth, 1))} className="w-8 h-8 rounded-[7px] border border-[#E4E8E4] bg-white flex items-center justify-center cursor-pointer text-[#6B7B6B]">
              <i className="ti ti-chevron-right text-[14px]" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
            <div key={i} className="text-[10px] md:text-[11px] text-[#A8B8A8] text-center font-semibold py-1 uppercase tracking-wider">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: firstDow }, (_, i) => <div key={`e${i}`} />)}
          {calDays.map((d) => {
            const key = format(d, 'yyyy-MM-dd')
            const charge = chargeForDay(d)
            const today = isToday(d)
            const isDoneOrToday = key <= todayKey
            const sessions = monthSessionsByDay[key] ?? { B: [], H: [] }

            return (
              <div key={d.toISOString()} className={`min-h-[88px] md:min-h-[98px] rounded-[8px] border p-1.5 md:p-2 flex flex-col gap-1 ${today ? 'ring-2 ring-teal ring-offset-0 border-teal-mid' : 'border-[#E4E8E4]'}`}
                style={{ background: charge ? CHARGE_DOT[charge] + '18' : '#FAFBFA' }}>
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] md:text-[12px] font-bold ${today ? 'text-teal' : 'text-[#1A1E1A]'}`}>{format(d, 'd')}</span>
                  {charge && charge !== 'rest' && (
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: CHARGE_DOT[charge] }} />
                  )}
                </div>

                {(['B', 'H'] as AthleteId[]).map((athlete) => (
                  <div key={athlete} className={`flex items-center gap-1 ${isDoneOrToday ? 'opacity-100' : 'opacity-55'}`}>
                    <span className={`w-3.5 text-[9px] font-bold ${athlete === 'B' ? 'text-teal' : 'text-violet'}`}>{athlete}</span>
                    <div className="flex items-center gap-0.5 overflow-hidden min-h-[15px]">
                      {sessions[athlete].length ? sessions[athlete].map((disc) => (
                        <i key={`${athlete}-${disc}`} className={`ti ${DISC_ICON[disc]} text-[13px] md:text-[15px] ${DISC_COLOR[disc]}`} />
                      )) : (
                        <span className="text-[10px] text-[#C3CCC3]">-</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        {isMonthSessionsLoading && (
          <p className="text-[11px] text-[#A8B8A8] mt-3">Chargement des séances du mois...</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Colonne gauche : semaine + saisie ──────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* Charge semaine par jour, séparée par athlète */}
          <div className="bg-white border border-[#E4E8E4] rounded-card p-5">
            <h2 className="text-[15px] font-bold text-[#1A1E1A] mb-4">Charge d'entraînement</h2>
            <div className="grid grid-cols-7 gap-2">
              {dates.map((date) => {
                const key = format(date, 'yyyy-MM-dd')
                const chargeB = (summary?.day_charges_by_athlete?.B?.[key] ?? 'rest') as Charge
                const chargeH = (summary?.day_charges_by_athlete?.H?.[key] ?? 'rest') as Charge
                const today = isToday(date)
                return (
                  <div key={key} className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] text-[#A8B8A8] uppercase tracking-wider">
                      {format(date, 'EEE', { locale: fr })}
                    </span>
                    <span className={`text-[11px] font-bold ${today ? 'text-teal' : 'text-[#1A1E1A]'}`}>
                      {format(date, 'd')}
                    </span>
                    <div className="flex gap-1 w-full">
                      <div
                        title={`Benji — ${CHARGE_LABEL[chargeB]}`}
                        className={`flex-1 aspect-square rounded-[6px] border flex items-center justify-center text-[9px] font-bold ${today ? 'ring-1 ring-teal' : ''} ${CHARGE_COLOR[chargeB]}`}
                      >
                        B
                      </div>
                      <div
                        title={`Hélène — ${CHARGE_LABEL[chargeH]}`}
                        className={`flex-1 aspect-square rounded-[6px] border flex items-center justify-center text-[9px] font-bold ${today ? 'ring-1 ring-violet' : ''} ${CHARGE_COLOR[chargeH]}`}
                      >
                        H
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Légende */}
            <div className="flex gap-4 mt-4 flex-wrap">
              {(['high', 'med', 'low', 'rest'] as Charge[]).map(c => (
                <div key={c} className="flex items-center gap-1.5 text-[11px] text-[#6B7B6B]">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHARGE_DOT[c] }} />
                  {CHARGE_LABEL[c]}
                </div>
              ))}
            </div>
          </div>

          {/* Saisie journalière */}
          <div className="bg-white border border-[#E4E8E4] rounded-card p-5">
            <h2 className="text-[15px] font-bold text-[#1A1E1A] mb-1">Saisie journalière</h2>
            <p className="text-[12px] text-[#6B7B6B] mb-4">Tap sur un jour pour saisir le sommeil et le ressenti</p>
            <div className="grid grid-cols-7 gap-2">
              {dates.map((date) => {
                const key = format(date, 'yyyy-MM-dd')
                const hasSleepB = !!summary?.sleep.B[key]
                const hasFeelingB = !!summary?.feeling.B[key]
                const hasSleepH = !!summary?.sleep.H[key]
                const hasFeelingH = !!summary?.feeling.H[key]
                return (
                  <div key={key} className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-[#A8B8A8] uppercase tracking-wider text-center">
                      {format(date, 'EEE', { locale: fr })}
                    </span>
                    <button onClick={() => setLogModal({ date: key, athleteId: 'B' })}
                      className={`w-full py-2 rounded-[7px] border text-[10px] font-medium cursor-pointer transition-all ${hasSleepB && hasFeelingB ? 'bg-teal-light text-teal border-teal-mid' : 'bg-[#F4F6F4] text-[#A8B8A8] border-[#E4E8E4] hover:border-teal-mid'}`}>
                      <i className="ti ti-user block text-[13px] mb-0.5" />B
                      {(hasSleepB || hasFeelingB) && <i className="ti ti-check block text-[10px]" />}
                    </button>
                    <button onClick={() => setLogModal({ date: key, athleteId: 'H' })}
                      className={`w-full py-2 rounded-[7px] border text-[10px] font-medium cursor-pointer transition-all ${hasSleepH && hasFeelingH ? 'bg-violet-light text-violet border-violet-mid' : 'bg-[#F4F6F4] text-[#A8B8A8] border-[#E4E8E4] hover:border-violet-mid'}`}>
                      <i className="ti ti-user block text-[13px] mb-0.5" />H
                      {(hasSleepH || hasFeelingH) && <i className="ti ti-check block text-[10px]" />}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Charge par discipline */}
          <div className="bg-white border border-[#E4E8E4] rounded-card p-5">
            <h2 className="text-[15px] font-bold text-[#1A1E1A] mb-4">Volume hebdomadaire</h2>
            <div className="grid grid-cols-2 gap-4">
              {(['B', 'H'] as AthleteId[]).map(a => {
                const load = summary?.weekly_load[a]
                const total = load ? load.swim + load.bike + load.run + (load.strength ?? 0) : 0
                return (
                  <div key={a}>
                    <p className={`text-[12px] font-semibold mb-3 ${a === 'B' ? 'text-teal' : 'text-violet'}`}>
                      {a === 'B' ? 'Benji' : 'Hélène'}
                    </p>
                    {(['swim', 'bike', 'run', 'strength'] as const).map(disc => {
                      const h = load?.[disc] ?? 0
                      const pct = total > 0 ? (h / total) * 100 : 0
                      const [bg, label] = disc === 'swim'
                        ? ['bg-teal', 'Natation']
                        : disc === 'bike'
                          ? ['bg-amber-sport', 'Vélo']
                          : disc === 'run'
                            ? ['bg-ocean', 'Run']
                            : ['bg-violet', 'Muscu']
                      return (
                        <div key={disc} className="mb-2.5">
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-[#6B7B6B]">{label}</span>
                            <span className="font-semibold text-[#1A1E1A]">{h.toFixed(1)}h</span>
                          </div>
                          <div className="h-2 bg-[#E4E8E4] rounded-full">
                            <div className={`h-2 rounded-full ${bg} transition-all`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── Colonne droite : bien-être + raccourcis ────────── */}
        <div className="flex flex-col gap-5">

          {/* Bien-être de la semaine */}
          <div className="bg-white border border-[#E4E8E4] rounded-card p-5">
            <h2 className="text-[15px] font-bold text-[#1A1E1A] mb-4">Bien-être</h2>
            {(['B', 'H'] as AthleteId[]).map(a => {
              const sleep = avgSleep(a)
              const feeling = avgFeeling(a)
              const color = a === 'B' ? 'text-teal' : 'text-violet'
              const barColor = a === 'B' ? 'bg-teal' : 'bg-violet'
              return (
                <div key={a} className={`mb-4 ${a === 'H' ? 'pt-4 border-t border-[#F4F6F4]' : ''}`}>
                  <p className={`text-[12px] font-semibold mb-3 ${color}`}>
                    {a === 'B' ? 'Benji' : 'Hélène'}
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-[#6B7B6B]">Sommeil</span>
                        <span className="font-semibold">{sleep ? `${sleep.hours}h` : '—'}</span>
                      </div>
                      <ScoreBar value={sleep ? Math.round(parseFloat(sleep.quality)) : 0} color={barColor} />
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-[#6B7B6B]">Fraîcheur</span>
                        <span className="font-semibold">{feeling ? `${feeling.fatigue}/5` : '—'}</span>
                      </div>
                      <ScoreBar value={feeling ? Math.round(parseFloat(feeling.fatigue)) : 0} color={barColor} />
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-[#6B7B6B]">Motivation</span>
                        <span className="font-semibold">{feeling ? `${feeling.motivation}/5` : '—'}</span>
                      </div>
                      <ScoreBar value={feeling ? Math.round(parseFloat(feeling.motivation)) : 0} color={barColor} />
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-[#6B7B6B]">Courbatures</span>
                        <span className="font-semibold">{feeling ? `${feeling.soreness}/5` : '—'}</span>
                      </div>
                      <ScoreBar value={feeling ? Math.round(parseFloat(feeling.soreness)) : 0} color={barColor} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Raccourcis */}
          <div className="bg-white border border-[#E4E8E4] rounded-card p-5">
            <h2 className="text-[15px] font-bold text-[#1A1E1A] mb-3">Accès rapide</h2>
            <div className="flex flex-col gap-2">
              {([
                { page: 'plan', icon: 'ti-calendar-week', label: 'Planning d\'entraînement' },
                { page: 'food', icon: 'ti-chef-hat', label: 'Nutrition & batch cooking' },
                { page: 'coach', icon: 'ti-sparkles', label: 'Coach IA' },
              ] as const).map(({ page, icon, label }) => (
                <button key={page} onClick={() => setActivePage(page)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] border border-[#E4E8E4] bg-[#F9FAF9] hover:bg-[#F4F6F4] cursor-pointer text-left transition-colors w-full">
                  <i className={`ti ${icon} text-[16px] text-teal`} />
                  <span className="text-[13px] text-[#1A1E1A]">{label}</span>
                  <i className="ti ti-chevron-right text-[13px] text-[#A8B8A8] ml-auto" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Log modal */}
      {logModal && (
        <LogModal
          open={!!logModal}
          onClose={() => setLogModal(null)}
          date={logModal.date}
          existing={{
            sleep: summary?.sleep[logModal.athleteId][logModal.date],
            feeling: summary?.feeling[logModal.athleteId][logModal.date],
          }}
          onSaveSleep={(v) => {
            sleepMutation.mutate({ athlete_id: logModal.athleteId, date: logModal.date, ...v })
            showToast('Sommeil enregistré')
          }}
          onSaveFeeling={(v) => {
            feelingMutation.mutate({ athlete_id: logModal.athleteId, date: logModal.date, ...v })
            showToast('Ressenti enregistré')
          }}
        />
      )}
    </div>
  )
}