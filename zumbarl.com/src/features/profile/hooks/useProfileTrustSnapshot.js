import { useMemo } from 'react'
import useEarnFlowState from '../../earn/hooks/useEarnFlowState'
import { resolveEarnTrustSnapshot } from '../../earn/services/earnTrustService'

export function useProfileTrustSnapshot() {
  const earnFlow = useEarnFlowState()

  return useMemo(() => resolveEarnTrustSnapshot(earnFlow), [earnFlow])
}
