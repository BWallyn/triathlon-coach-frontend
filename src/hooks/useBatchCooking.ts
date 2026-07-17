import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { getBatchRecipes, createBatchPlan, createBatchRecipe, updateBatchRecipe, deleteBatchRecipe } from '../api'
import { getCurrentSeason } from '../utils/season'
import type { PortionAssignment, Season, BatchRecipeIngredient } from '../types'

interface RecipePayload {
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
}

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
    (payload: RecipePayload) => createBatchRecipe(payload),
    { onSuccess: () => qc.invalidateQueries(['batch-recipes']) },
  )

  const updateRecipeMutation = useMutation(
    (payload: RecipePayload & { id: number }) => updateBatchRecipe(payload.id, payload),
    { onSuccess: () => qc.invalidateQueries(['batch-recipes']) },
  )

  const deleteRecipeMutation = useMutation(
    (id: number) => deleteBatchRecipe(id),
    { onSuccess: () => qc.invalidateQueries(['batch-recipes']) },
  )

  return {
    recipes, recipesLoading, seasonFilter, setSeasonFilter,
    createPlanMutation, createRecipeMutation, updateRecipeMutation, deleteRecipeMutation,
  }
}