import { useSyncExternalStore } from 'react'
import {
  getEarnFlowSnapshot,
  subscribeEarnFlow,
} from '../services/earnFlowService'

function useEarnFlowState() {
  return useSyncExternalStore(
    subscribeEarnFlow,
    getEarnFlowSnapshot,
    getEarnFlowSnapshot,
  )
}

export default useEarnFlowState
