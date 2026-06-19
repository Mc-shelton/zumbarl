import { useEffect, useSyncExternalStore } from 'react'
import {
  getBusinessFlowSnapshot,
  hydrateBusinessOpportunitiesFromBackend,
  subscribeBusinessFlow,
} from '../services/businessFlowService'

export function useBusinessFlowState() {
  const snapshot = useSyncExternalStore(
    subscribeBusinessFlow,
    getBusinessFlowSnapshot,
    getBusinessFlowSnapshot,
  )

  useEffect(() => {
    hydrateBusinessOpportunitiesFromBackend()
  }, [])

  return snapshot
}
