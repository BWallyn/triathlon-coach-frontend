import axios from 'axios'
import type { Athlete, TrainingSession, Meal, Ingredient, SleepLog, FeelingLog, DashboardSummary, WeightLog, BatchRecipe, BatchRecipeIngredient, BatchCookingPlan, PortionAssignment, Season } from '../types'

const BASE = import.meta.env.VITE_API_URL ?? '/api'
const api = axios.create({ baseURL: BASE })

// ── Athletes ──────────────────────────────────────────────────
export const getAthletes = () => api.get<Athlete[]>('/athletes').then(r => r.data)
export const updateAthleteName = (id: string, name: string) =>
  api.patch<Athlete>(`/athletes/${id}`, { name }).then(r => r.data)

// ── Sessions ──────────────────────────────────────────────────
export const getSessions = (weekStart: string, weekEnd: string) =>
  api.get<TrainingSession[]>('/sessions', { params: { week_start: weekStart, week_end: weekEnd } }).then(r => r.data)
export const createSession = (payload: Omit<TrainingSession, 'id'>) =>
  api.post<TrainingSession>('/sessions', payload).then(r => r.data)
export const deleteSession = (id: number) => api.delete(`/sessions/${id}`)

// ── Meals ─────────────────────────────────────────────────────
export const getMeals = (weekStart: string, weekEnd: string) =>
  api.get<Meal[]>('/meals', { params: { week_start: weekStart, week_end: weekEnd } }).then(r => r.data)
export const generateMeals = (weekStart: string, weekEnd: string) =>
  api.post<Meal[]>('/meals/generate', null, { params: { week_start: weekStart, week_end: weekEnd } }).then(r => r.data)
export const createMeal = (payload: { date: string; slot: string; name: string; ingredients: Omit<Ingredient, 'id'>[] }) =>
  api.post<Meal>('/meals', payload).then(r => r.data)
export const updateMeal = (id: number, payload: { date: string; slot: string; name: string; ingredients: Omit<Ingredient, 'id'>[] }) =>
  api.put<Meal>(`/meals/${id}`, payload).then(r => r.data)
export const deleteMeal = (id: number) => api.delete(`/meals/${id}`)

// ── Wellness ──────────────────────────────────────────────────
export const getDashboardSummary = (weekStart: string, weekEnd: string) =>
  api.get<DashboardSummary>('/wellness/summary', { params: { week_start: weekStart, week_end: weekEnd } }).then(r => r.data)

export const logSleep = (payload: Omit<SleepLog, 'id'>) =>
  api.post<SleepLog>('/wellness/sleep', payload).then(r => r.data)
export const getSleep = (params: { athlete_id?: string; date_start?: string; date_end?: string }) =>
  api.get<SleepLog[]>('/wellness/sleep', { params }).then(r => r.data)

export const logFeeling = (payload: Omit<FeelingLog, 'id'>) =>
  api.post<FeelingLog>('/wellness/feeling', payload).then(r => r.data)
export const getFeeling = (params: { athlete_id?: string; date_start?: string; date_end?: string }) =>
  api.get<FeelingLog[]>('/wellness/feeling', { params }).then(r => r.data)

export const logWeight = (payload: Omit<WeightLog, 'id'>) =>
  api.post<WeightLog>('/wellness/weight', payload).then(r => r.data)
export const getWeight = (params: { athlete_id?: string; date_start?: string; date_end?: string }) =>
  api.get<WeightLog[]>('/wellness/weight', { params }).then(r => r.data)
export const deleteWeight = (id: number) => api.delete(`/wellness/weight/${id}`)

// ── Batch cooking ────────────────────────────────────────────
export const getBatchRecipes = (season?: Season | 'all') =>
  api.get<BatchRecipe[]>('/batch-cooking/recipes', {
    params: season && season !== 'all' ? { season } : {},
  }).then(r => r.data)

export const createBatchRecipe = (payload: {
  name: string
  instructions?: string
  base_portions: number
  season: Season | null
  recipe_link?: string
  ref_kcal?: number
  ref_protein_g?: number
  ref_carbs_g?: number
  ref_fat_g?: number
  ingredients: Omit<BatchRecipeIngredient, 'id'>[]
}) => api.post<BatchRecipe>('/batch-cooking/recipes', payload).then(r => r.data)

export const updateBatchRecipe = (id: number, payload: {
  name: string
  instructions?: string
  base_portions: number
  season: Season | null
  recipe_link?: string
  ref_kcal?: number
  ref_protein_g?: number
  ref_carbs_g?: number
  ref_fat_g?: number
  ingredients: Omit<BatchRecipeIngredient, 'id'>[]
}) => api.put<BatchRecipe>(`/batch-cooking/recipes/${id}`, payload).then(r => r.data)

export const deleteBatchRecipe = (id: number) =>
  api.delete(`/batch-cooking/recipes/${id}`)

export const createBatchPlan = (payload: { recipe_id: number; created_date: string; portions: PortionAssignment[] }) =>
  api.post<BatchCookingPlan>('/batch-cooking/plans', payload).then(r => r.data)