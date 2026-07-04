import { useQuery, useMutation, useQueryClient } from 'react-query'
import { format } from 'date-fns'
import { getSessions, createSession, deleteSession } from '../api'
import { useWeek } from './useWeek'
import type { Discipline, Charge, TrainingSession } from '../types'

const DUR_WEIGHT: Record<string, number> = {
  '30min': 0.5, '45min': 0.75, '1h': 1.0, '1h15': 1.25,
  '1h30': 1.5, '2h': 2.0, '2h30': 2.5, '3h+': 3.5,
}

export function computeCharge(sessionsB: TrainingSession[], sessionsC: TrainingSession[]): Charge {
  if (!sessionsB.length && !sessionsC.length) return 'rest'
  const hB = sessionsB.reduce((s, x) => s + (DUR_WEIGHT[x.duration] ?? 1), 0)
  const hC = sessionsC.reduce((s, x) => s + (DUR_WEIGHT[x.duration] ?? 1), 0)
  const maxH = Math.max(hB, hC)
  if (maxH >= 2) return 'high'
  if (maxH >= 1) return 'med'
  return 'low'
}

export function useTraining() {
  const { weekStart, weekEnd } = useWeek()
  const qc = useQueryClient()

  const { data: sessions = [], isLoading } = useQuery(
    ['sessions', weekStart, weekEnd],
    () => getSessions(weekStart, weekEnd),
    { staleTime: 30_000 },
  )

  const addMutation = useMutation(createSession, {
    onSuccess: () => qc.invalidateQueries(['sessions']),
  })

  const removeMutation = useMutation(deleteSession, {
    onSuccess: () => qc.invalidateQueries(['sessions']),
  })

  const sessionsByDate = (dateKey: string, athleteId: 'B' | 'C') =>
    sessions.filter((s) => s.date === dateKey && s.athlete_id === athleteId)

  const loadCounts = (athleteId: 'B' | 'C') => {
    const counts: Record<Discipline, number> = { swim: 0, bike: 0, run: 0, strength: 0 }
    sessions
      .filter((s) => s.athlete_id === athleteId)
      .forEach((s) => { counts[s.discipline]++ })
    return counts
  }

  return { sessions, isLoading, addMutation, removeMutation, sessionsByDate, loadCounts }
}
