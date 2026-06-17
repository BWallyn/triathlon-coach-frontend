import { useMemo } from 'react'
import { startOfWeek, addDays, addWeeks, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useAppStore } from '../store'

export function useWeek() {
  const weekOffset = useAppStore((s) => s.weekOffset)

  return useMemo(() => {
    const base = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset)
    const dates = Array.from({ length: 7 }, (_, i) => addDays(base, i))
    const weekStart = format(dates[0], 'yyyy-MM-dd')
    const weekEnd = format(dates[6], 'yyyy-MM-dd')
    const label =
      format(dates[0], 'd MMM', { locale: fr }) +
      ' – ' +
      format(dates[6], 'd MMM yyyy', { locale: fr })
    return { dates, weekStart, weekEnd, label }
  }, [weekOffset])
}
