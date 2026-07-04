export type AthleteId = 'B' | 'H'
export type ViewMode = 'B' | 'H' | 'T'
export type Discipline = 'swim' | 'bike' | 'run' | 'strength'
export type Slot = 'lunch' | 'dinner'
export type Charge = 'high' | 'med' | 'low' | 'rest'
export type Page = 'dashboard' | 'plan' | 'food' | 'courses' | 'coach' | 'sante'

export interface Athlete {
  id: AthleteId
  name: string
}

export interface TrainingSession {
  id: number
  athlete_id: AthleteId
  date: string
  discipline: Discipline
  kind: string
  duration: string
}

export interface Ingredient {
  id?: number
  name: string
  quantity: string
}

export interface Meal {
  id: number
  date: string
  slot: Slot
  name: string
  ingredients: Ingredient[]
}

export interface SleepLog {
  id?: number
  athlete_id: AthleteId
  date: string
  duration_min: number
  quality: number       // 1-5
  deep_min?: number
  rem_min?: number
  source?: string
}

export interface FeelingLog {
  id?: number
  athlete_id: AthleteId
  date: string
  fatigue: number       // 1-5
  motivation: number    // 1-5
  soreness: number      // 1-5
  note?: string
}

export interface DashboardSummary {
  week_start: string
  week_end: string
  day_charges: Record<string, Charge>
  weekly_load: Record<AthleteId, Record<Discipline, number>>
  sleep: Record<AthleteId, Record<string, { duration_min: number; quality: number; deep_min?: number; rem_min?: number }>>
  feeling: Record<AthleteId, Record<string, { fatigue: number; motivation: number; soreness: number; note?: string }>>
}

export interface WeightLog {
  id?: number
  athlete_id: AthleteId
  date: string
  weight_kg: number
}