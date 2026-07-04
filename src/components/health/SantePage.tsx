import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { useHealth, type HealthRange } from '../../hooks/useHealth'
import { useToast } from '../shared/Toast'
import type { AthleteId } from '../../types'

const RANGE_OPTIONS: { id: HealthRange; label: string }[] = [
  { id: '1m', label: '1 mois' },
  { id: '3m', label: '3 mois' },
  { id: '6m', label: '6 mois' },
  { id: '1y', label: '1 an' },
]

const athleteNames: Record<AthleteId, string> = { B: 'Benji', H: 'Hélène' }

function ChartCard({ title, children, empty }: { title: string; children: React.ReactNode; empty: boolean }) {
  return (
    <div className="bg-white border border-[#E4E8E4] rounded-card p-4 mb-4">
      <h2 className="text-[14px] font-bold text-[#1A1E1A] mb-3">{title}</h2>
      {empty ? (
        <p className="text-[12px] text-[#A8B8A8] py-8 text-center">Pas encore de données sur cette période.</p>
      ) : (
        <div style={{ width: '100%', height: 220 }}>{children}</div>
      )}
    </div>
  )
}

export default function SantePage() {
  const [athleteId, setAthleteId] = useState<AthleteId>('B')
  const [range, setRange] = useState<HealthRange>('3m')
  const { sleep, feeling, weight, addWeightMutation, removeWeightMutation } = useHealth(athleteId, range)
  const { showToast } = useToast()

  const [weightInput, setWeightInput] = useState('')
  const [weightDate, setWeightDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const fmtDay = (d: string) => format(new Date(d + 'T12:00:00'), 'd MMM', { locale: fr })

  const sleepData = useMemo(
    () => sleep.map((s) => ({
      label: fmtDay(s.date),
      heures: +(s.duration_min / 60).toFixed(1),
      qualite: s.quality,
    })),
    [sleep],
  )

  const feelingData = useMemo(
    () => feeling.map((f) => ({
      label: fmtDay(f.date),
      fraicheur: f.fatigue, motivation: f.motivation, courbatures: f.soreness,
    })),
    [feeling],
  )

  const weightData = useMemo(
    () => weight.map((w) => ({ label: fmtDay(w.date), poids: w.weight_kg, id: w.id })),
    [weight],
  )

  const handleAddWeight = () => {
    const val = parseFloat(weightInput.replace(',', '.'))
    if (Number.isNaN(val) || val <= 0) { showToast('Poids invalide'); return }
    addWeightMutation.mutate(
      { athlete_id: athleteId, date: weightDate, weight_kg: val },
      { onSuccess: () => { showToast('Poids enregistré'); setWeightInput('') } },
    )
  }

  return (
    <div className="max-w-lg mx-auto px-3.5 pt-4 pb-24">
      <h1 className="text-[22px] font-bold tracking-tight mb-1">Santé</h1>
      <p className="text-[13px] text-[#6B7B6B] mb-4">Sommeil, ressenti et poids dans le temps</p>

      <div className="flex gap-1.5 bg-white border border-[#E4E8E4] rounded-card p-1 mb-3">
        {(['B', 'H'] as AthleteId[]).map((a) => (
          <button key={a} onClick={() => setAthleteId(a)}
            className={`flex-1 py-2 rounded-[8px] text-[12px] font-semibold border-none cursor-pointer transition-all ${
              athleteId === a
                ? a === 'B' ? 'bg-teal-light text-teal' : 'bg-violet-light text-violet'
                : 'bg-transparent text-[#6B7B6B]'
            }`}>
            {athleteNames[a]}
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

      <div className="bg-white border border-[#E4E8E4] rounded-card p-4 mb-4">
        <h2 className="text-[14px] font-bold text-[#1A1E1A] mb-3">Ajouter une pesée</h2>
        <div className="flex gap-2">
          <input type="date" value={weightDate} onChange={(e) => setWeightDate(e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-[7px] border border-[#E4E8E4] text-[13px] focus:outline-none focus:border-teal-mid" />
          <input type="number" inputMode="decimal" placeholder="Kg" value={weightInput} onChange={(e) => setWeightInput(e.target.value)}
            className="w-24 px-3 py-2.5 rounded-[7px] border border-[#E4E8E4] text-[13px] text-center focus:outline-none focus:border-teal-mid" />
          <button onClick={handleAddWeight} disabled={addWeightMutation.isLoading}
            className="px-4 py-2.5 rounded-[7px] bg-teal text-white text-[13px] font-semibold disabled:opacity-50">
            Ajouter
          </button>
        </div>
      </div>

      <ChartCard title="Poids (kg)" empty={!weightData.length}>
        <ResponsiveContainer>
          <LineChart data={weightData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4E8E4" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10 }} domain={['dataMin - 1', 'dataMax + 1']} />
            <Tooltip />
            <Line type="monotone" dataKey="poids" stroke="#1D9E75" strokeWidth={2} dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Sommeil" empty={!sleepData.length}>
        <ResponsiveContainer>
          <LineChart data={sleepData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4E8E4" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
            <YAxis yAxisId="right" orientation="right" domain={[0, 5]} tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line yAxisId="left" type="monotone" dataKey="heures" name="Durée (h)" stroke="#185FA5" strokeWidth={2} dot={{ r: 2 }} />
            <Line yAxisId="right" type="monotone" dataKey="qualite" name="Qualité /5" stroke="#7F77DD" strokeWidth={2} dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Ressenti" empty={!feelingData.length}>
        <ResponsiveContainer>
          <LineChart data={feelingData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4E8E4" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="fraicheur" name="Fraîcheur" stroke="#1D9E75" strokeWidth={2} dot={{ r: 2 }} />
            <Line type="monotone" dataKey="motivation" name="Motivation" stroke="#BA7517" strokeWidth={2} dot={{ r: 2 }} />
            <Line type="monotone" dataKey="courbatures" name="Courbatures" stroke="#A32D2D" strokeWidth={2} dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {weightData.length > 0 && (
        <div className="bg-white border border-[#E4E8E4] rounded-card p-4">
          <h2 className="text-[14px] font-bold text-[#1A1E1A] mb-3">Historique des pesées</h2>
          {[...weightData].reverse().map((w) => (
            <div key={w.id} className="flex items-center justify-between py-2 border-t border-[#F4F6F4] first:border-t-0">
              <span className="text-[12px] text-[#6B7B6B]">{w.label}</span>
              <div className="flex items-center gap-3">
                <span className="text-[13px] font-semibold text-[#1A1E1A]">{w.poids} kg</span>
                <button onClick={() => w.id && removeWeightMutation.mutate(w.id)}
                  className="text-[#A8B8A8] hover:text-[#A32D2D] text-[13px] bg-none border-none cursor-pointer">
                  <i className="ti ti-trash" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}