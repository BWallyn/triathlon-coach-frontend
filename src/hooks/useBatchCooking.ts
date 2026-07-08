import { useQuery, useMutation, useQueryClient } from 'react-query'
import { getBatchRecipes, createBatchPlan } from '../api'
import type { PortionAssignment } from '../types'

export function useBatchCooking() {
  const qc = useQueryClient()

  const { data: recipes = [], isLoading: recipesLoading } = useQuery(
    ['batch-recipes'],
    getBatchRecipes,
    { staleTime: 5 * 60_000 },
  )

  const createPlanMutation = useMutation(
    (payload: { recipe_id: number; created_date: string; portions: PortionAssignment[] }) =>
      createBatchPlan(payload),
    { onSuccess: () => qc.invalidateQueries(['meals']) },
  )

  return { recipes, recipesLoading, createPlanMutation }
}
