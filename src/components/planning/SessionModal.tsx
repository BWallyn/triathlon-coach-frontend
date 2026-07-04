import { useState } from 'react'
import Modal from '../shared/Modal'
import type { Discipline, ViewMode, AthleteId } from '../../types'

const SESSION_TYPES: Record<Discipline, { id: string; label: string; desc: string }[]> = {
  swim: [
    { id: 'endurance', label: 'Endurance', desc: 'Fond' },
    { id: 'technique', label: 'Technique', desc: 'Drill' },
    { id: 'seuil', label: 'Seuil', desc: 'Allure tri' },
    { id: 'fractionne', label: 'Fractionné', desc: 'Intervalles' },
  ],
  bike: [
    { id: 'endurance', label: 'Endurance', desc: 'Zone 2' },
    { id: 'seuil', label: 'Seuil', desc: 'FTP' },
    { id: 'fractionne', label: 'Fractionné', desc: 'VO2max' },
    { id: 'sortie', label: 'Longue', desc: 'Volume' },
    { id: 'brique', label: 'Brique', desc: 'Vélo+Run' },
    { id: 'recup', label: 'Récup', desc: 'Légère' },
  ],
  run: [
    { id: 'endurance', label: 'Endurance', desc: 'Zone 2' },
    { id: 'seuil', label: 'Seuil', desc: 'Tempo' },
    { id: 'fractionne', label: 'Fractionné', desc: 'VMA' },
    { id: 'cote', label: 'Côtes', desc: 'Force' },
    { id: 'long', label: 'Longue', desc: 'Half pace' },
    { id: 'recup', label: 'Récup', desc: 'Légère' },
  ],
  strength: [
    { id: 'full-body', label: 'Full body', desc: 'Global' },
    { id: 'haut', label: 'Haut du corps', desc: 'Push/Pull' },
    { id: 'bas', label: 'Bas du corps', desc: 'Jambes' },
    { id: 'core', label: 'Core', desc: 'Gainage' },
    { id: 'plyo', label: 'Plyométrie', desc: 'Explosivité' },
    { id: 'mobilite', label: 'Mobilité', desc: 'Prévention' },
  ],
}

const DURATIONS = ['30min', '45min', '1h', '1h15', '1h30', '2h', '2h30', '3h+']

interface Props {
  open: boolean
  onClose: () => void
  dateKey: string
  dateLabel: string
  viewMode: ViewMode
  athleteNames: Record<AthleteId, string>
  onAdd: (payload: { athlete_id: AthleteId; date: string; discipline: Discipline; kind: string; duration: string }) => void
}

export default function SessionModal({ open, onClose, dateKey, dateLabel, viewMode, athleteNames, onAdd }: Props) {
  const [who, setWho] = useState<AthleteId | null>(viewMode !== 'T' ? (viewMode as AthleteId) : null)
  const [disc, setDisc] = useState<Discipline | null>(null)
  const [kind, setKind] = useState<string | null>(null)
  const [dur, setDur] = useState<string | null>(null)

  const reset = () => { setWho(viewMode !== 'T' ? (viewMode as AthleteId) : null); setDisc(null); setKind(null); setDur(null) }

  const canConfirm = (viewMode !== 'T' || who) && disc && kind && dur

  const handleConfirm = () => {
    if (!canConfirm || !disc || !kind || !dur) return
    const athlete = viewMode === 'T' ? who! : (viewMode as AthleteId)
    onAdd({ athlete_id: athlete, date: dateKey, discipline: disc, kind, duration: dur })
    reset()
    onClose()
  }

  const handleClose = () => { reset(); onClose() }

  const optBase = 'px-2 py-2 rounded-[7px] border border-[#E4E8E4] text-[12px] font-medium cursor-pointer bg-[#F4F6F4] text-[#6B7B6B] text-center leading-snug transition-all'

  return (
    <Modal open={open} onClose={handleClose} title={dateLabel}>
      {viewMode === 'T' && (
        <div className="mb-4">
          <p className="text-[12px] text-[#6B7B6B] font-medium mb-2">Pour qui ?</p>
          <div className="grid grid-cols-2 gap-2">
            {(['B', 'C'] as AthleteId[]).map((a) => (
              <button key={a} onClick={() => setWho(a)}
                className={`${optBase} ${who === a ? 'bg-violet-light text-violet border-violet-mid' : ''}`}>
                <i className="ti ti-user text-[14px]" /><br />{athleteNames[a]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4">
        <p className="text-[12px] text-[#6B7B6B] font-medium mb-2">Discipline</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(['swim', 'bike', 'run', 'strength'] as Discipline[]).map((d) => {
            const icon = d === 'swim' ? 'ti-wave-sine' : d === 'bike' ? 'ti-bike' : d === 'run' ? 'ti-run' : 'ti-barbell'
            const label = d === 'swim' ? 'Natation' : d === 'bike' ? 'Vélo' : d === 'run' ? 'Run' : 'Musculation'
            const sel = disc === d
            const cls = sel
              ? (d === 'swim'
                  ? 'bg-teal-light text-teal border-teal-mid'
                  : d === 'bike'
                    ? 'bg-amber-light text-amber-sport border-amber-mid'
                    : d === 'run'
                      ? 'bg-ocean-light text-ocean border-ocean-mid'
                      : 'bg-violet-light text-violet border-violet-mid')
              : ''
            return (
              <button key={d} onClick={() => { setDisc(d); setKind(null) }}
                className={`${optBase} ${cls}`}>
                <i className={`ti ${icon} text-[16px]`} /><br />{label}
              </button>
            )
          })}
        </div>
      </div>

      {disc && (
        <div className="mb-4">
          <p className="text-[12px] text-[#6B7B6B] font-medium mb-2">Type de séance</p>
          <div className="grid grid-cols-2 gap-2">
            {SESSION_TYPES[disc].map((t) => (
              <button key={t.id} onClick={() => setKind(t.label)}
                className={`${optBase} ${kind === t.label ? 'bg-violet-light text-violet border-violet-mid' : ''}`}>
                {t.label}<br /><span className="text-[10px] text-[#A8B8A8]">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4">
        <p className="text-[12px] text-[#6B7B6B] font-medium mb-2">Durée</p>
        <div className="grid grid-cols-4 gap-2">
          {DURATIONS.map((d) => (
            <button key={d} onClick={() => setDur(d)}
              className={`${optBase} ${dur === d ? 'bg-teal-light text-teal border-teal-mid' : ''}`}>
              {d}
            </button>
          ))}
        </div>
      </div>

      <button onClick={handleConfirm} disabled={!canConfirm}
        className="w-full py-3.5 rounded-card bg-teal text-white text-[15px] font-semibold disabled:opacity-30 disabled:cursor-not-allowed mt-1">
        Ajouter la séance
      </button>
      <button onClick={handleClose} className="w-full py-3 mt-2 rounded-card border border-[#E4E8E4] text-[14px] text-[#6B7B6B]">
        Annuler
      </button>
    </Modal>
  )
}
