import { useState, useEffect } from 'react'
import Modal from '../shared/Modal'
import type { Discipline, SessionResult } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  sessionLabel: string
  discipline: Discipline
  existing?: SessionResult
  onSave: (payload: Omit<SessionResult, 'id' | 'session_id'>) => void
  onDelete?: () => void
}

export default function SessionResultModal({ open, onClose, sessionLabel, discipline, existing, onSave, onDelete }: Props) {
  const [duration, setDuration] = useState('')
  const [distance, setDistance] = useState('')
  const [avgHr, setAvgHr] = useState('')
  const [maxHr, setMaxHr] = useState('')
  const [avgPower, setAvgPower] = useState('')
  const [avgSpeed, setAvgSpeed] = useState('')
  const [elevation, setElevation] = useState('')
  const [calories, setCalories] = useState('')
  const [rpe, setRpe] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (open) {
      setDuration(existing?.actual_duration_min != null ? String(existing.actual_duration_min) : '')
      setDistance(existing?.actual_distance_km != null ? String(existing.actual_distance_km) : '')
      setAvgHr(existing?.avg_hr != null ? String(existing.avg_hr) : '')
      setMaxHr(existing?.max_hr != null ? String(existing.max_hr) : '')
      setAvgPower(existing?.avg_power_w != null ? String(existing.avg_power_w) : '')
      setAvgSpeed(existing?.avg_speed_kmh != null ? String(existing.avg_speed_kmh) : '')
      setElevation(existing?.elevation_gain_m != null ? String(existing.elevation_gain_m) : '')
      setCalories(existing?.calories != null ? String(existing.calories) : '')
      setRpe(existing?.rpe != null ? String(existing.rpe) : '')
      setNotes(existing?.notes ?? '')
    }
  }, [open, existing])

  const showDistance = discipline !== 'strength'
  const showPower = discipline === 'bike'
  const showSpeed = discipline !== 'strength'
  const speedLabel = discipline === 'swim' ? 'Vitesse moyenne (km/h)' : 'Vitesse moyenne (km/h)'

  const num = (v: string) => (v.trim() === '' ? undefined : Number(v.replace(',', '.')))

  const handleSave = () => {
    onSave({
      actual_duration_min: num(duration) != null ? Math.round(num(duration)!) : undefined,
      actual_distance_km: showDistance ? num(distance) : undefined,
      avg_hr: num(avgHr) != null ? Math.round(num(avgHr)!) : undefined,
      max_hr: num(maxHr) != null ? Math.round(num(maxHr)!) : undefined,
      avg_power_w: showPower ? num(avgPower) : undefined,
      avg_speed_kmh: showSpeed ? num(avgSpeed) : undefined,
      elevation_gain_m: num(elevation),
      calories: num(calories) != null ? Math.round(num(calories)!) : undefined,
      rpe: num(rpe) != null ? Math.round(num(rpe)!) : undefined,
      notes: notes.trim() || undefined,
      source: existing?.source ?? 'manual',
    })
    onClose()
  }

  const field = (label: string, value: string, setValue: (v: string) => void, suffix?: string) => (
    <div className="mb-3">
      <label className="text-[12px] font-medium text-[#6B7B6B] block mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          inputMode="decimal"
          className="flex-1 px-3 py-2.5 rounded-[7px] border border-[#E4E8E4] text-[14px] bg-white text-[#1A1E1A] focus:outline-none focus:border-teal-mid"
        />
        {suffix && <span className="text-[12px] text-[#A8B8A8] w-10">{suffix}</span>}
      </div>
    </div>
  )

  return (
    <Modal open={open} onClose={onClose} title={`Résultat — ${sessionLabel}`}>
      {field('Durée réelle', duration, setDuration, 'min')}
      {showDistance && field('Distance', distance, setDistance, 'km')}
      {field('FC moyenne', avgHr, setAvgHr, 'bpm')}
      {field('FC max', maxHr, setMaxHr, 'bpm')}
      {showPower && field('Puissance moyenne', avgPower, setAvgPower, 'W')}
      {showSpeed && field(speedLabel, avgSpeed, setAvgSpeed, 'km/h')}
      {field('Dénivelé', elevation, setElevation, 'm')}
      {field('Calories', calories, setCalories, 'kcal')}

      <div className="mb-4">
        <label className="text-[12px] font-medium text-[#6B7B6B] block mb-2">Ressenti d'effort (RPE)</label>
        <div className="flex gap-1">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
            <button key={v} onClick={() => setRpe(String(v))}
              className={`flex-1 py-2 rounded-[6px] border text-[11px] font-semibold cursor-pointer ${rpe === String(v) ? 'bg-teal text-white border-teal' : 'bg-[#F4F6F4] text-[#6B7B6B] border-[#E4E8E4]'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="text-[12px] font-medium text-[#6B7B6B] block mb-1.5">Notes (optionnel)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
          className="w-full px-3 py-2.5 rounded-[7px] border border-[#E4E8E4] text-[13px] resize-none focus:outline-none focus:border-teal-mid" />
      </div>

      <button onClick={handleSave} className="w-full py-3.5 rounded-card bg-teal text-white text-[15px] font-semibold mt-1">
        Enregistrer le résultat
      </button>
      {existing && onDelete && (
        <button onClick={() => { onDelete(); onClose() }} className="w-full py-3 mt-2 rounded-card border border-[#F5C6C6] text-[13px] text-[#A32D2D]">
          Supprimer le résultat
        </button>
      )}
      <button onClick={onClose} className="w-full py-3 mt-2 rounded-card border border-[#E4E8E4] text-[14px] text-[#6B7B6B]">
        Annuler
      </button>
    </Modal>
  )
}
