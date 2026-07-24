export type AthleteId = 'B' | 'H'
export type ViewMode = 'B' | 'H' | 'T'
export type Discipline = 'swim' | 'bike' | 'run' | 'strength'
export type RaceDiscipline = 'triathlon' | 'running' | 'cycling' | 'swim'
export type RaceFormat =
  | 'sprint' | 'olympic' | 'half_ironman' | 'ironman'
  | '5k' | '10k' | 'half_marathon' | 'marathon' | 'trail'
  | 'criterium' | 'gran_fondo' | 'time_trial' | 'road_race'
  | 'open_water' | 'pool'
  | 'other'
export type RacePriority = 'A' | 'B' | 'C'
export type Slot = 'lunch' | 'dinner'
export type Charge = 'high' | 'med' | 'low' | 'rest'
export type Page = 'dashboard' | 'plan' | 'food' | 'courses' | 'coach' | 'sante' | 'recipes' | 'races'
export type Preset =
  | 'reduction_agressive' | 'reduction_moderee' | 'reduction_legere'
  | 'maintien'
  | 'masse_legere' | 'masse_moderee' | 'masse_agressive'
export type Season = 'spring' | 'summer' | 'autumn' | 'winter'


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
  result?: SessionResult
}

export interface SessionResult {
  id: number
  session_id: number
  actual_duration_min?: number
  actual_distance_km?: number
  avg_hr?: number
  max_hr?: number
  avg_power_w?: number
  avg_speed_kmh?: number
  elevation_gain_m?: number
  calories?: number
  rpe?: number
  notes?: string
  source: string
  strava_activity_id?: string
}

export interface SessionResultWithSession extends SessionResult {
  date: string
  athlete_id: AthleteId
  discipline: Discipline
  kind: string
  planned_duration: string
}

export interface Race {
  id: number
  athlete_id: AthleteId | null   // null = shared, both athletes race it
  name: string
  date: string                    // YYYY-MM-DD
  discipline: RaceDiscipline
  format: RaceFormat
  priority: RacePriority
  target_time?: string
  location?: string
  goal_notes?: string
}

export interface TrainingPlanSession {
  athlete: 'both' | AthleteId
  discipline: Discipline
  kind: string
  duration: string
  description: string
}

export interface TrainingPlanDay {
  day: string   // 'Lundi' | 'Mardi' | ...
  sessions: TrainingPlanSession[]
  rest: boolean
}

export interface TrainingPlan {
  week_focus: string
  total_hours: number
  days: TrainingPlanDay[]
  coach_notes: string
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
  batch_plan_id?: number | null
  portions?: MealPortion[]
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
  day_charges_by_athlete: Record<AthleteId, Record<string, Charge>>
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

export interface BatchRecipeIngredient {
  id: number
  ingredient_name: string
  quantity_per_serving: number
  unit: string
  is_scalable: boolean
  unit_weight_g?: number
}

export interface BatchRecipe {
  id: number
  name: string
  instructions?: string
  base_portions: number
  season: Season | null
  recipe_link?: string
  ref_kcal?: number
  ref_protein_g?: number
  ref_carbs_g?: number
  ref_fat_g?: number
  ingredients: BatchRecipeIngredient[]
}

export interface PortionAssignment {
  date: string
  slot: Slot
  preset: Preset
}

export interface MealPortion {
  id: number
  preset: Preset
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

export interface BatchCookingPlan {
  id: number
  recipe_id: number
  created_date: string
  meals: (Meal & { portions: MealPortion[] })[]
}
