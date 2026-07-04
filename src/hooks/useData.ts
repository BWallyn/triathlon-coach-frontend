import { useQuery, useMutation, useQueryClient } from 'react-query'
import { getSessions, createSession, deleteSession } from '../api'
import { getMeals, generateMeals, createMeal, updateMeal } from '../api'
import { getDashboardSummary, logSleep, logFeeling } from '../api'
import { useWeek } from './useWeek'
import type { Discipline, TrainingSession, Ingredient, SleepLog, FeelingLog } from '../types'

const DUR_WEIGHT: Record<string, number> = {
  '30min': 0.5, '45min': 0.75, '1h': 1.0, '1h15': 1.25,
  '1h30': 1.5, '2h': 2.0, '2h30': 2.5, '3h+': 3.5,
}

export function computeCharge(sessionsB: TrainingSession[], sessionsC: TrainingSession[]) {
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
    onSuccess: () => { qc.invalidateQueries(['sessions']); qc.invalidateQueries(['dashboard']) },
  })
  const removeMutation = useMutation(deleteSession, {
    onSuccess: () => { qc.invalidateQueries(['sessions']); qc.invalidateQueries(['dashboard']) },
  })

  const sessionsByDate = (dateKey: string, athleteId: 'B' | 'C') =>
    sessions.filter((s) => s.date === dateKey && s.athlete_id === athleteId)

  const loadCounts = (athleteId: 'B' | 'C') => {
    const counts: Record<Discipline, number> = { swim: 0, bike: 0, run: 0, strength: 0 }
    sessions.filter((s) => s.athlete_id === athleteId).forEach((s) => { counts[s.discipline]++ })
    return counts
  }

  return { sessions, isLoading, addMutation, removeMutation, sessionsByDate, loadCounts }
}

export function useMeals() {
  const { weekStart, weekEnd } = useWeek()
  const qc = useQueryClient()

  const { data: meals = [], isLoading } = useQuery(
    ['meals', weekStart, weekEnd],
    () => getMeals(weekStart, weekEnd),
    { staleTime: 30_000 },
  )

  const generateMutation = useMutation(
    () => generateMeals(weekStart, weekEnd),
    { onSuccess: () => qc.invalidateQueries(['meals']) },
  )

  const saveMutation = useMutation(
    (payload: { id?: number; date: string; slot: string; name: string; ingredients: Omit<Ingredient, 'id'>[] }) => {
      if (payload.id) return updateMeal(payload.id, payload)
      return createMeal(payload)
    },
    { onSuccess: () => qc.invalidateQueries(['meals']) },
  )

  const mealFor = (dateKey: string, slot: 'lunch' | 'dinner') =>
    meals.find((m) => m.date === dateKey && m.slot === slot)

  return { meals, isLoading, generateMutation, saveMutation, mealFor }
}

export function useDashboard() {
  const { weekStart, weekEnd } = useWeek()
  const qc = useQueryClient()

  const { data: summary, isLoading } = useQuery(
    ['dashboard', weekStart, weekEnd],
    () => getDashboardSummary(weekStart, weekEnd),
    { staleTime: 60_000 },
  )

  const sleepMutation = useMutation(
    (payload: Omit<SleepLog, 'id'>) => logSleep(payload),
    { onSuccess: () => qc.invalidateQueries(['dashboard']) },
  )

  const feelingMutation = useMutation(
    (payload: Omit<FeelingLog, 'id'>) => logFeeling(payload),
    { onSuccess: () => qc.invalidateQueries(['dashboard']) },
  )

  return { summary, isLoading, sleepMutation, feelingMutation }
}