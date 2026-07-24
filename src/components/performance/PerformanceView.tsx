import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { usePerformance, type PerfRange } from '../../hooks/usePerformance'
import { useAthletes } from '../../hooks/useAthletes'
import { formatSecondsToPace } from '../../utils/pace'
import type { AthleteId, Discipline } from '../../types'

const RANGE_OPTIONS: { id: PerfRange; label: string }[] = [
  { id: '1m', label: '1 mois' },
  { id: '3m', label: '3 mois' },
  { id: '6m', label: '6 mois' },
  { id: '1y', label: '1 an' },
]

const DISC_OPTIONS: { id: Discipline | 'all'; label: string }[] = [
  { id: 'all', label: 'Toutes' },
  { id: 'swim', label: 'Natation' },
  { id: 'bike', label: 'Vélo' },
  { id: 'run', label: 'Run' },
  { id: 'strength', label: 'Muscu' },
]

const DUR_WEIGHT: Record<string, number> = {
  '30min': 0.5, '45min': 0.75, '1h': 1.0, '1h15': 1.25, '1h30': 1.5, '2h': 2.0, '2h30': 2.5, '3h+': 3.5,
}

function ChartCard({ title, children, empty }: { title: string; children: React.ReactNode; empty: boolean }) {
  return (
    <div className="bg-white border border-[#E4E8E4] rounded-card p-4 mb-4">
      <h2 className="text-[14px] font-bold text-[#1A1E1A] mb-3">{title}</h2>
      {empty ? (
        <p className="text-[12px] text-[#A8B8A8] py-8 text-center">Pas encore de résultats logués sur cette période.</p>
      ) : (
        <div style={{ width: '100%', height: 220 }}>{children}</div>
      )}
    </div>
  )
}

export default function PerformanceView() {
  const { athleteNames } = useAthletes()
  const [athleteId, setAthleteId] = useState<AthleteId>('B')
  const [range, setRange] = useState<PerfRange>('3m')
  const [discipline, setDiscipline] = useState<Discipline | 'all'>('all')
  const { results, planned, isLoading } = usePerformance(athleteId, range, discipline)

  const fmtDay = (d: string) => format(new Date(d + 'T12:00:00'), 'd MMM', { locale: fr })
  const sorted = useMemo(() => [...results].sort((a, b) => a.date.localeCompare(b.date)), [results])

  const hrData = useMemo(
    () => sorted.filter((r) => r.avg_hr != null).map((r) => ({ label: fmtDay(r.date), fcMoy: r.avg_hr, fcMax: r.max_hr ?? undefined })),
    [sorted],
  )
  const powerData = useMemo(
    () => sorted.filter((r) => r.avg_power_w != null).map((r) => ({ label: fmtDay(r.date), puissance: r.avg_power_w })),
    [sorted],
  )
  // Vitesse (km/h) — vélo uniquement
  const speedData = useMemo(
    () => sorted.filter((r) => r.avg_speed_kmh != null).map((r) => ({ label: fmtDay(r.date), vitesse: r.avg_speed_kmh })),
    [sorted],
  )
  // Allure (sec/km ou sec/100m selon discipline) — run / swim uniquement
  const paceData = useMemo(
    () => sorted.filter((r) => r.avg_pace_sec != null).map((r) => ({ label: fmtDay(r.date), paceSec: r.avg_pace_sec })),
    [sorted],
  )
  const paceUnitLabel = discipline === 'swim' ? 'min/100m' : 'min/km'
  const rpeData = useMemo(
    () => sorted.filter((r) => r.rpe != null).map((r) => ({ label: fmtDay(r.date), rpe: r.rpe })),
    [sorted],
  )
  const durationData = useMemo(
    () => sorted.map((r) => ({ label: fmtDay(r.date), minutes: r.actual_duration_min ?? 0 })),
    [sorted],
  )

  const plannedCount = planned.length
  const loggedCount = results.length
  const compliancePct = plannedCount > 0 ? Math.round((loggedCount / plannedCount) * 100) : null
  const plannedHours = planned.reduce((sum, s) => sum + (DUR_WEIGHT[s.duration] ?? 1), 0)
  const loggedHours = results.reduce((sum, r) => sum + (r.actual_duration_min ?? 0) / 60, 0)

  return (
    <div>
      <div className="flex gap-1.5 bg-white border border-[#E4E8E4] rounded-card p-1 mb-3">
        {(['B', 'H'] as AthleteId[]).map((a) => (
          <button key={a} onClick={() => setAthleteId(a)}
            className={`flex-1 py-2 rounded-[8px] text-[12px] font-semibold border-none cursor-pointer transition-all ${
              athleteId === a ? (a === 'B' ? 'bg-teal-light text-teal' : 'bg-violet-light text-violet') : 'bg-transparent text-[#6B7B6B]'
            }`}>
            {athleteNames[a]}
          </button>
        ))}
      </div>

      <div className="flex gap-1.5 mb-3 flex-wrap">
        {DISC_OPTIONS.map((d) => (
          <button key={d.id} onClick={() => setDiscipline(d.id)}
            className={`px-3 py-1.5 rounded-full border text-[11px] font-medium cursor-pointer transition-all ${
              discipline === d.id ? 'bg-violet text-white border-violet' : 'bg-white text-[#6B7B6B] border-[#E4E8E4]'
            }`}>
            {d.label}
          </button>
        ))}
      </div>

      <div className="flex gap-1.5 mb-5 flex-wrap">
        {RANGE_OPTIONS.map((r) => (
          <button key={r.id} onClick={() => setRange(r.id)}
            className={`px-3 py-1.5 rounded-full border text-[11px] font-medium cursor-pointer transition-all ${
              range === r.id ? 'bg-teal text-white border-teal' : 'bg-white text-[#6B7B6B] border-[#E4E8E4]'
            }`}>
            {r.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2.5 mb-5">
        <div className="bg-white border border-[#E4E8E4] rounded-card p-3">
          <div className="text-[10px] uppercase tracking-wider text-[#6B7B6B] mb-1">Complétion</div>
          <div className="text-[20px] font-bold text-[#1A1E1A]">{compliancePct != null ? `${compliancePct}%` : '—'}</div>
          <div className="text-[10px] text-[#A8B8A8] mt-0.5">{loggedCount}/{plannedCount} séances</div>
        </div>
        <div className="bg-white border border-[#E4E8E4] rounded-card p-3">
          <div className="text-[10px] uppercase tracking-wider text-[#6B7B6B] mb-1">Heures planifiées</div>
          <div className="text-[20px] font-bold text-[#1A1E1A]">{plannedHours.toFixed(1)}h</div>
        </div>
        <div className="bg-white border border-[#E4E8E4] rounded-card p-3">
          <div className="text-[10px] uppercase tracking-wider text-[#6B7B6B] mb-1">Heures réelles</div>
          <div className="text-[20px] font-bold text-[#1A1E1A]">{loggedHours.toFixed(1)}h</div>
        </div>
      </div>

      <ChartCard title="Fréquence cardiaque" empty={!hrData.length}>
        <ResponsiveContainer>
          <LineChart data={hrData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4E8E4" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="fcMoy" name="FC moy. (bpm)" stroke="#185FA5" strokeWidth={2} dot={{ r: 2 }} />
            <Line type="monotone" dataKey="fcMax" name="FC max (bpm)" stroke="#A32D2D" strokeWidth={2} dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {(discipline === 'bike' || discipline === 'all') && (
        <ChartCard title="Puissance (vélo)" empty={!powerData.length}>
          <ResponsiveContainer>
            <LineChart data={powerData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E8E4" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="puissance" name="Puissance (W)" stroke="#BA7517" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {(discipline === 'bike' || discipline === 'all') && (
        <ChartCard title="Vitesse moyenne (vélo)" empty={!speedData.length}>
          <ResponsiveContainer>
            <LineChart data={speedData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E8E4" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="vitesse" name="Vitesse (km/h)" stroke="#1D9E75" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {(discipline === 'run' || discipline === 'swim') && (
        <ChartCard title={`Allure moyenne (${paceUnitLabel})`} empty={!paceData.length}>
          <ResponsiveContainer>
            <LineChart data={paceData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E8E4" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis
                reversed
                tick={{ fontSize: 10 }}
                tickFormatter={(v: number) => formatSecondsToPace(v)}
                width={40}
              />
              <Tooltip formatter={(value: number) => [formatSecondsToPace(value), 'Allure']} />
              <Line type="monotone" dataKey="paceSec" name="Allure" stroke="#7F77DD" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <ChartCard title="Ressenti d'effort (RPE)" empty={!rpeData.length}>
        <ResponsiveContainer>
          <LineChart data={rpeData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4E8E4" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey="rpe" name="RPE /10" stroke="#7F77DD" strokeWidth={2} dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Durée réelle des séances" empty={!durationData.length}>
        <ResponsiveContainer>
          <LineChart data={durationData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4E8E4" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey="minutes" name="Durée (min)" stroke="#185FA5" strokeWidth={2} dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {isLoading && <p className="text-[11px] text-[#A8B8A8] text-center">Chargement…</p>}

      <div className="bg-teal-light border border-teal-mid rounded-card px-3 py-2.5 text-[12px] text-teal flex items-start gap-2">
        <i className="ti ti-sparkles text-[15px] flex-shrink-0 mt-0.5" />
        Ces données (complétion, RPE, FC) sont automatiquement transmises au Coach IA pour ajuster le volume et l'intensité des prochains plans.
      </div>
    </div>
  )
}
