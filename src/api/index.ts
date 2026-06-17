import axios from 'axios'
import type { Athlete, TrainingSession, Meal, Ingredient } from '../types'

const api = axios.create({ baseURL: '/api' })

// ── Athletes ──────────────────────────────────────────────────
export const getAthletes = () =>
  api.get<Athlete[]>('/athletes').then((r) => r.data)

export const updateAthleteName = (id: string, name: string) =>
  api.patch<Athlete>(`/athletes/${id}`, { name }).then((r) => r.data)

// ── Sessions ──────────────────────────────────────────────────
export const getSessions = (weekStart: string, weekEnd: string) =>
  api
    .get<TrainingSession[]>('/sessions', { params: { week_start: weekStart, week_end: weekEnd } })
    .then((r) => r.data)

export const createSession = (payload: Omit<TrainingSession, 'id'>) =>
  api.post<TrainingSession>('/sessions', payload).then((r) => r.data)

export const deleteSession = (id: number) => api.delete(`/sessions/${id}`)

// ── Meals ─────────────────────────────────────────────────────
export const getMeals = (weekStart: string, weekEnd: string) =>
  api
    .get<Meal[]>('/meals', { params: { week_start: weekStart, week_end: weekEnd } })
    .then((r) => r.data)

export const generateMeals = (weekStart: string, weekEnd: string) =>
  api
    .post<Meal[]>('/meals/generate', null, { params: { week_start: weekStart, week_end: weekEnd } })
    .then((r) => r.data)

export const createMeal = (payload: {
  date: string
  slot: string
  name: string
  ingredients: Omit<Ingredient, 'id'>[]
}) => api.post<Meal>('/meals', payload).then((r) => r.data)

export const updateMeal = (
  id: number,
  payload: { date: string; slot: string; name: string; ingredients: Omit<Ingredient, 'id'>[] },
) => api.put<Meal>(`/meals/${id}`, payload).then((r) => r.data)

export const deleteMeal = (id: number) => api.delete(`/meals/${id}`)
