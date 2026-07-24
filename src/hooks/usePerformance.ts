import { useMemo } from 'react'
import { useQuery } from 'react-query'
import { format, subMonths } from 'date-fns'
import { getSessionResults, getSessions } from '../api'
import type { AthleteId, Discipline } from '../types'

export type PerfRange = '1m' | '3m' | '6m' | '1y'
const RANGE_MONTHS: Record<PerfRange, number> = { '1m': 1, '3m': 3, '6m': 6, '1y': 12 }

export function usePerformance(athleteId: AthleteId, range: PerfRange, discipline: Discipline | 'all') {
  const { dateStart, dateEnd } = useMemo(() => {
    const end = new Date()
    const start = subMonths(end, RANGE_MONTHS[range])
    return { dateStart: format(start, 'yyyy-MM-dd'), dateEnd: format(end, 'yyyy-MM-dd') }
  }, [range])

  const resultsQuery = useQuery(
    ['session-results', athleteId, dateStart, dateEnd, discipline],
    () => getSessionResults({
      athlete_id: athleteId,
      date_start: dateStart,
      date_end: dateEnd,
      discipline: discipline !== 'all' ? discipline : undefined,
    }),
    { staleTime: 60_000 },
  )

  const sessionsQuery = useQuery(
    ['sessions', 'perf', athleteId, dateStart, dateEnd],
    () => getSessions(dateStart, dateEnd),
    { staleTime: 60_000 },
  )

  const planned = (sessionsQuery.data ?? []).filter(
    (s) => s.athlete_id === athleteId && (discipline === 'all' || s.discipline === discipline),
  )

  return {
    results: resultsQuery.data ?? [],
    planned,
    isLoading: resultsQuery.isLoading || sessionsQuery.isLoading,
  }
}
