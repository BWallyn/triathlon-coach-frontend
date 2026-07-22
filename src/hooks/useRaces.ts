import { useQuery, useMutation, useQueryClient } from 'react-query'
import { getRaces, createRace, updateRace, deleteRace } from '../api'
import type { Race } from '../types'

export function useRaces(athleteId?: string) {
  const qc = useQueryClient()

  const { data: races = [], isLoading } = useQuery(
    ['races', athleteId ?? 'all'],
    () => getRaces(athleteId ? { athlete_id: athleteId } : undefined),
    { staleTime: 60_000 },
  )

  const createMutation = useMutation(
    (payload: Omit<Race, 'id'>) => createRace(payload),
    { onSuccess: () => qc.invalidateQueries(['races']) },
  )

  const updateMutation = useMutation(
    (payload: Race) => updateRace(payload.id, payload),
    { onSuccess: () => qc.invalidateQueries(['races']) },
  )

  const deleteMutation = useMutation(
    (id: number) => deleteRace(id),
    { onSuccess: () => qc.invalidateQueries(['races']) },
  )

  const upcoming = [...races].sort((a, b) => a.date.localeCompare(b.date))

  return { races: upcoming, isLoading, createMutation, updateMutation, deleteMutation }
}
