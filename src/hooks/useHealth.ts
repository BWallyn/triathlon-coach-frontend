import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { format, subMonths } from 'date-fns'
import { getSleep, getFeeling, getWeight, logWeight, deleteWeight } from '../api'
import type { AthleteId, WeightLog } from '../types'

export type HealthRange = '1m' | '3m' | '6m' | '1y'

const RANGE_MONTHS: Record<HealthRange, number> = { '1m': 1, '3m': 3, '6m': 6, '1y': 12 }

export function useHealth(athleteId: AthleteId, range: HealthRange) {
  const qc = useQueryClient()

  const { dateStart, dateEnd } = useMemo(() => {
    const end = new Date()
    const start = subMonths(end, RANGE_MONTHS[range])
    return { dateStart: format(start, 'yyyy-MM-dd'), dateEnd: format(end, 'yyyy-MM-dd') }
  }, [range])

  const sleepQuery = useQuery(
    ['health-sleep', athleteId, dateStart, dateEnd],
    () => getSleep({ athlete_id: athleteId, date_start: dateStart, date_end: dateEnd }),
    { staleTime: 60_000 },
  )
  const feelingQuery = useQuery(
    ['health-feeling', athleteId, dateStart, dateEnd],
    () => getFeeling({ athlete_id: athleteId, date_start: dateStart, date_end: dateEnd }),
    { staleTime: 60_000 },
  )
  const weightQuery = useQuery(
    ['health-weight', athleteId, dateStart, dateEnd],
    () => getWeight({ athlete_id: athleteId, date_start: dateStart, date_end: dateEnd }),
    { staleTime: 60_000 },
  )

  const addWeightMutation = useMutation(
    (payload: Omit<WeightLog, 'id'>) => logWeight(payload),
    { onSuccess: () => qc.invalidateQueries(['health-weight']) },
  )
  const removeWeightMutation = useMutation(deleteWeight, {
    onSuccess: () => qc.invalidateQueries(['health-weight']),
  })

  return {
    sleep: sleepQuery.data ?? [],
    feeling: feelingQuery.data ?? [],
    weight: weightQuery.data ?? [],
    isLoading: sleepQuery.isLoading || feelingQuery.isLoading || weightQuery.isLoading,
    addWeightMutation,
    removeWeightMutation,
  }
}