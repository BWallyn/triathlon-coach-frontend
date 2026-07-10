import { useQuery } from 'react-query'
import { getAthletes } from '../api'
import type { AthleteId } from '../types'

// Fallback affiché brièvement pendant le premier chargement (avant que
// GET /athletes ait répondu), ou si l'API est indisponible. Les vrais noms
// viennent toujours du backend (lui-même configuré via ATHLETE_B_NAME /
// ATHLETE_H_NAME côté serveur — jamais codés en dur ici).
const FALLBACK_NAMES: Record<AthleteId, string> = { B: 'Athlète B', H: 'Athlète H' }

export function useAthletes() {
  const { data: athletes = [], isLoading } = useQuery(
    ['athletes'],
    getAthletes,
    { staleTime: 5 * 60_000 },
  )

  const athleteNames: Record<AthleteId, string> = {
    B: athletes.find((a) => a.id === 'B')?.name ?? FALLBACK_NAMES.B,
    H: athletes.find((a) => a.id === 'H')?.name ?? FALLBACK_NAMES.H,
  }

  return { athletes, athleteNames, isLoading }
}
