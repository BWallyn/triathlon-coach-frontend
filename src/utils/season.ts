import type { Season } from '../types'

export function getCurrentSeason(date = new Date()): Season {
  const m = date.getMonth() + 1
  if (m >= 3 && m <= 5) return 'spring'
  if (m >= 6 && m <= 8) return 'summer'
  if (m >= 9 && m <= 11) return 'autumn'
  return 'winter'
}

export const SEASON_LABELS: Record<Season, string> = {
  spring: 'Printemps', summer: 'Été', autumn: 'Automne', winter: 'Hiver',
}
