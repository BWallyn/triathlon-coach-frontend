import { useQuery, useMutation, useQueryClient } from 'react-query'
import { getMeals, generateMeals, createMeal, updateMeal, deleteMeal } from '../api'
import { useWeek } from './useWeek'
import type { Ingredient } from '../types'

export function useMeals() {
  const { weekStart, weekEnd } = useWeek()
  const qc = useQueryClient()

  const { data: meals = [], isLoading } = useQuery(
    ['meals', weekStart, weekEnd],
    () => getMeals(weekStart, weekEnd),
    { staleTime: 30_000 },
  )

  const generateMutation = useMutation(
    () => generateMeals(weekStart, weekEnd),
    { onSuccess: () => qc.invalidateQueries(['meals']) },
  )

  const saveMutation = useMutation(
    (payload: { id?: number; date: string; slot: string; name: string; ingredients: Omit<Ingredient, 'id'>[] }) => {
      if (payload.id) {
        return updateMeal(payload.id, { date: payload.date, slot: payload.slot, name: payload.name, ingredients: payload.ingredients })
      }
      return createMeal({ date: payload.date, slot: payload.slot, name: payload.name, ingredients: payload.ingredients })
    },
    { onSuccess: () => qc.invalidateQueries(['meals']) },
  )

  const removeMutation = useMutation(deleteMeal, {
    onSuccess: () => qc.invalidateQueries(['meals']),
  })

  const mealFor = (dateKey: string, slot: 'lunch' | 'dinner') =>
    meals.find((m) => m.date === dateKey && m.slot === slot)

  return { meals, isLoading, generateMutation, saveMutation, removeMutation, mealFor }
}
