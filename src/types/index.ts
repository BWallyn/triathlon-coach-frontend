export type AthleteId = 'B' | 'C'
export type ViewMode = 'B' | 'C' | 'T'
export type Discipline = 'swim' | 'bike' | 'run'
export type Slot = 'lunch' | 'dinner'
export type Charge = 'high' | 'med' | 'low' | 'rest'

export interface Athlete {
  id: AthleteId
  name: string
}

export interface TrainingSession {
  id: number
  athlete_id: AthleteId
  date: string // YYYY-MM-DD
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

export interface DayData {
  date: Date
  dateKey: string
  sessionsB: TrainingSession[]
  sessionsC: TrainingSession[]
  charge: Charge
  lunch?: Meal
  dinner?: Meal
}
