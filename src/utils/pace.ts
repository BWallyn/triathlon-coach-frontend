/**
 * Helpers to convert between a pace expressed as "M:SS" (minutes:seconds per
 * unit distance — per km for running, per 100m for swimming) and the plain
 * integer number of seconds stored in avg_pace_sec.
 */

export function parsePaceToSeconds(input: string): number | undefined {
  const trimmed = input.trim()
  if (!trimmed) return undefined
  const match = /^(\d{1,2}):([0-5]\d)$/.exec(trimmed)
  if (!match) return undefined
  const minutes = Number(match[1])
  const seconds = Number(match[2])
  return minutes * 60 + seconds
}

export function formatSecondsToPace(totalSeconds?: number | null): string {
  if (totalSeconds == null || Number.isNaN(totalSeconds)) return ''
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.round(totalSeconds % 60)
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
