import { useEffect, useSyncExternalStore } from 'react'
import {
  hydrateEarnFlowFromBackend,
  getEarnFlowSnapshot,
  subscribeEarnFlow,
} from '../services/earnFlowService'

function useEarnFlowState() {
  const state = useSyncExternalStore(
    subscribeEarnFlow,
    getEarnFlowSnapshot,
    getEarnFlowSnapshot,
  )

  useEffect(() => {
    hydrateEarnFlowFromBackend().catch(() => {})
  }, [])

  return state
}

export default useEarnFlowState
