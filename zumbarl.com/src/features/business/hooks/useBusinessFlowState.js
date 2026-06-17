import { useSyncExternalStore } from 'react'
import {
  getBusinessFlowSnapshot,
  subscribeBusinessFlow,
} from '../services/businessFlowService'

export function useBusinessFlowState() {
  return useSyncExternalStore(
    subscribeBusinessFlow,
    getBusinessFlowSnapshot,
    getBusinessFlowSnapshot,
  )
}
