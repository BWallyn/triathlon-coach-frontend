import { useMutation } from 'react-query'
import { generateTrainingPlan } from '../api'
import type { TrainingPlan } from '../types'

export function useCoach() {
  const planMutation = useMutation(
    (payload: { week_start: string; week_end: string; goal?: string; load_level?: string; constraints?: string; max_sessions?: number }) =>
      generateTrainingPlan(payload),
  )

  return { planMutation }
}

export type { TrainingPlan }
