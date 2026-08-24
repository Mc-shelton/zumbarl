import { useEffect, useState } from 'react'
import { readBusinessDashboard } from '../services/readBusinessDashboard'

const EMPTY_WORKSPACE = {
  activeOpportunityTab: 'opportunities',
  applicants: [],
  business: null,
  errorMessage: '',
  insights: [],
  isLoading: true,
  kyc: {
    checks: [],
    completed: 0,
    percent: 0,
    status: 'not_started',
    total: 0,
  },
  metrics: [
    { icon: 'briefcase', label: 'Active Opportunities', meta: '0 total', tone: 'purple', value: 0 },
    { icon: 'users', label: 'Total Applicants', meta: '0 from database', tone: 'orange', value: 0 },
    { icon: 'trending', label: 'In Pipeline', meta: '0 projects', tone: 'green', value: 0 },
    { icon: 'check', label: 'Hires / Awarded', meta: '0 campaigns', tone: 'blue', value: 0 },
  ],
  opportunities: [],
  pipelineStages: [],
  projects: [],
  reviewEvents: [],
  upcomingActions: [],
}

export function useBusinessWorkspace() {
  const [workspace, setWorkspace] = useState(EMPTY_WORKSPACE)

  useEffect(() => {
    let isMounted = true

    async function loadWorkspace() {
      try {
        const dashboard = await readBusinessDashboard()
        if (!isMounted) return
        setWorkspace({
          ...EMPTY_WORKSPACE,
          ...dashboard,
          isLoading: false,
          errorMessage: '',
        })
      } catch (error) {
        if (!isMounted) return
        setWorkspace((current) => ({
          ...current,
          isLoading: false,
          errorMessage: error.message || 'Could not load business dashboard',
        }))
      }
    }

    loadWorkspace()

    return () => {
      isMounted = false
    }
  }, [])

  return workspace
}
