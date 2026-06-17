import { useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'
import useEarnFlowState from '../../earn/hooks/useEarnFlowState'
import {
  resolveProjectReview,
  resolveEarnWorkspaceProject,
  resolveProjectPayment,
  reviewProjectSubmission,
  submitProjectWork,
} from '../../earn/services/earnFlowService'
import {
  normalizeProjectTab,
  PROJECT_TAB_QUERY,
  resolveAllowedProjectTab,
} from '../constants'
import { findMockProjectById, resolveProjectById } from '../data/mockWorkspace'

function useProjectWorkspace() {
  const { projectId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const earnFlow = useEarnFlowState()
  const activeProject = useMemo(() => (
    findMockProjectById(projectId)
    || resolveEarnWorkspaceProject(earnFlow.projects, projectId)
    || resolveProjectById(projectId)
  ), [earnFlow.projects, projectId])
  const projectReview = useMemo(() => (
    resolveProjectReview(earnFlow.projectReviews, projectId)
  ), [earnFlow.projectReviews, projectId])
  const projectPayment = useMemo(() => (
    resolveProjectPayment(earnFlow.payments, projectId)
  ), [earnFlow.payments, projectId])
  const initialTab = useMemo(() => {
    const tab = normalizeProjectTab(searchParams.get('tab'))
    return resolveAllowedProjectTab(tab, activeProject)
  }, [activeProject, searchParams])
  const [activeTab, setActiveTab] = useState(initialTab)
  const [isSubmitOpen, setIsSubmitOpen] = useState(false)
  const [teamModal, setTeamModal] = useState(null)
  const [isSubmitted, setIsSubmitted] = useState(searchParams.get('submitted') === 'true')
  const teamMode = hasAccess(ACCESS_KEYS.projects.createSprint) ? searchParams.get('mode') : null

  const handleTabChange = (tab) => {
    const nextTab = resolveAllowedProjectTab(tab, activeProject)
    const nextParams = new URLSearchParams(searchParams)

    if (nextTab === 'Overview') {
      nextParams.delete('tab')
    } else {
      nextParams.set('tab', PROJECT_TAB_QUERY[nextTab])
    }

    nextParams.delete('mode')
    setActiveTab(nextTab)
    setSearchParams(nextParams, { replace: true })
  }

  const handleSubmit = () => {
    const nextParams = new URLSearchParams(searchParams)
    submitProjectWork({ project: activeProject, projectId })
    nextParams.set('submitted', 'true')
    nextParams.delete('tab')
    setIsSubmitOpen(false)
    setIsSubmitted(true)
    setActiveTab('Overview')
    setSearchParams(nextParams, { replace: true })
  }

  const handleReviewDecision = (decision, review) => {
    reviewProjectSubmission({
      decision,
      project: activeProject,
      projectId,
      review,
    })
  }

  const handleOverview = () => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('submitted')
    nextParams.delete('tab')
    setIsSubmitted(false)
    setActiveTab('Overview')
    setSearchParams(nextParams, { replace: true })
  }

  const handleCreateSprint = () => {
    if (!hasAccess(ACCESS_KEYS.projects.createSprint)) {
      return
    }

    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('tab', PROJECT_TAB_QUERY.Sprints)
    nextParams.set('mode', 'create-sprint')
    setActiveTab('Sprints')
    setSearchParams(nextParams, { replace: true })
  }

  const handleCancelCreateSprint = () => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('tab', PROJECT_TAB_QUERY.Sprints)
    nextParams.delete('mode')
    setActiveTab('Sprints')
    setSearchParams(nextParams, { replace: true })
  }

  return {
    activeProject,
    activeTab,
    handleCancelCreateSprint,
    handleCreateSprint,
    handleOverview,
    handleReviewDecision,
    handleSubmit,
    handleTabChange,
    isSubmitted,
    isSubmitOpen,
    projectPayment,
    projectReview,
    projectId,
    setIsSubmitOpen,
    setTeamModal,
    teamModal,
    teamMode,
  }
}

export default useProjectWorkspace
