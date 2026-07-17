import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { getBatchRecipes, createBatchPlan, createBatchRecipe } from '../api'
import { getCurrentSeason } from '../utils/season'
import type { PortionAssignment, Season, BatchRecipeIngredient } from '../types'

export function useBatchCooking() {
  const qc = useQueryClient()
  const [seasonFilter, setSeasonFilter] = useState<Season | 'all'>(getCurrentSeason())

  const { data: recipes = [], isLoading: recipesLoading } = useQuery(
    ['batch-recipes', seasonFilter],
    () => getBatchRecipes(seasonFilter),
    { staleTime: 5 * 60_000 },
  )

  const createPlanMutation = useMutation(
    (payload: { recipe_id: number; created_date: string; portions: PortionAssignment[] }) =>
      createBatchPlan(payload),
    { onSuccess: () => qc.invalidateQueries(['meals']) },
  )

  const createRecipeMutation = useMutation(
    (payload: {
      name: string; instructions?: string; base_portions: number
      season: Season | null; recipe_link?: string
      ingredients: Omit<BatchRecipeIngredient, 'id'>[]
    }) => createBatchRecipe(payload),
    { onSuccess: () => qc.invalidateQueries(['batch-recipes']) },
  )

  return { recipes, recipesLoading, seasonFilter, setSeasonFilter, createPlanMutation, createRecipeMutation }
}
