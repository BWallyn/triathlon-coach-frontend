import { useMutation, useQueryClient } from 'react-query'
import { upsertSessionResult, deleteSessionResult } from '../api'
import type { SessionResult } from '../types'

export function useSessionResults() {
  const qc = useQueryClient()

  const saveMutation = useMutation(
    (payload: { sessionId: number } & Omit<SessionResult, 'id' | 'session_id'>) => {
      const { sessionId, ...rest } = payload
      return upsertSessionResult(sessionId, rest)
    },
    {
      onSuccess: () => {
        qc.invalidateQueries(['sessions'])
        qc.invalidateQueries(['session-results'])
      },
    },
  )

  const removeMutation = useMutation(
    (sessionId: number) => deleteSessionResult(sessionId),
    {
      onSuccess: () => {
        qc.invalidateQueries(['sessions'])
        qc.invalidateQueries(['session-results'])
      },
    },
  )

  return { saveMutation, removeMutation }
}
