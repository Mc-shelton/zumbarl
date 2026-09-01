import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { ACCESS_KEYS, getCurrentLoginRole, hasAccess } from '../../auth/roleConfig'
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
import { fetchBackendProjectWorkspace, respondToProjectPriceProposal, submitProjectDeliverable, toProjectWorkspaceView } from '../services/projectWorkspaceService'
import {
  createProjectTeamInvites,
  listMyProjectTeamInvites,
  listProjectTeam,
  listProjectTeamInviteCandidates,
  respondToProjectTeamInvite,
} from '../services/projectTeamInviteService'

const EMPTY_PROJECT = Object.freeze({
  id: '',
  title: 'Project unavailable',
  status: 'Not found',
  lifecycleStatus: 'ended',
  deliverables: [],
  submissionTargets: [],
  files: [],
  timeline: [],
  hasMilestones: false,
  hasTeam: false,
  isTeamProject: false,
  source: 'empty',
})

function useProjectWorkspace() {
  const { projectId } = useParams()
  const isBusinessViewer = getCurrentLoginRole()?.side === 'company'
  const [searchParams, setSearchParams] = useSearchParams()
  const earnFlow = useEarnFlowState()
  // Tagged with the projectId it belongs to so a stale in-flight result for a
  // previous project is ignored rather than briefly rendered.
  const [backendProject, setBackendProject] = useState({ id: null, view: null })

  useEffect(() => {
    // Always ask the backend. Missing projects remain missing instead of being
    // replaced with development fixtures.
    if (!projectId) return undefined

    let active = true
    fetchBackendProjectWorkspace(projectId)
      .then((workspace) => {
        if (active) setBackendProject({ id: projectId, view: toProjectWorkspaceView(workspace) })
      })
      .catch(() => {
        if (active) setBackendProject({ id: projectId, view: null })
      })

    return () => {
      active = false
    }
  }, [projectId])

  const backendView = backendProject.id === projectId ? backendProject.view : null
  const activeProject = useMemo(() => (
    backendView
    || resolveEarnWorkspaceProject(earnFlow.projects, projectId)
    || { ...EMPTY_PROJECT, id: projectId || '' }
  ), [backendView, earnFlow.projects, projectId])
  const projectReview = useMemo(() => (
    resolveProjectReview(earnFlow.projectReviews, projectId)
  ), [earnFlow.projectReviews, projectId])
  const projectPayment = useMemo(() => (
    resolveProjectPayment(earnFlow.payments, projectId)
  ), [earnFlow.payments, projectId])
  const initialTab = useMemo(() => {
    const tab = normalizeProjectTab(searchParams.get('tab'))
    return resolveAllowedProjectTab(tab, activeProject, { isBusinessViewer })
  }, [activeProject, isBusinessViewer, searchParams])
  const [activeTab, setActiveTab] = useState(initialTab)
  // The project arrives a render or two after the URL does, and the tab list is
  // derived from it - a project that has not loaded yet has no Milestones tab,
  // so `?tab=milestones` resolved to Overview and stayed there, because useState
  // only reads its argument once. Re-applying whenever the resolved tab actually
  // changes lets the deep link land once the project unlocks its tabs, while
  // leaving the tabs this hook sets on its own (Sprints after a sprint action)
  // alone, since those do not move the URL.
  const appliedTabRef = useRef(initialTab)
  useEffect(() => {
    if (initialTab === appliedTabRef.current) return
    appliedTabRef.current = initialTab
    setActiveTab(initialTab)
  }, [initialTab])
  const [isSubmitOpen, setIsSubmitOpen] = useState(false)
  const [submitMilestone, setSubmitMilestone] = useState(null)
  const [submitTargetValue, setSubmitTargetValue] = useState('')
  const [submitMode, setSubmitMode] = useState('submit')
  const [teamModal, setTeamModal] = useState(null)
  const [teamState, setTeamState] = useState({
    candidates: [],
    error: '',
    invites: [],
    isLoadingCandidates: false,
    isSending: false,
    members: [],
    messageParticipants: [],
    projectId: null,
  })
  const [priceProposalState, setPriceProposalState] = useState({ error: '', isResponding: false, notice: '' })
  const [myTeamInvites, setMyTeamInvites] = useState([])
  const [teamInviteResponseState, setTeamInviteResponseState] = useState({ error: '', isResponding: false })
  const [teamInviteNotice, setTeamInviteNotice] = useState('')
  // The "Work Submitted Successfully" confirmation is a transient, in-memory
  // state shown only right after submitting this session — it is tagged with the
  // projectId and does NOT persist across reloads or project navigation. The
  // durable submission/review state lives in the Overview + deliverable status.
  const [submittedProjectId, setSubmittedProjectId] = useState(null)
  const isSubmitted = submittedProjectId === projectId
  const teamMode = hasAccess(ACCESS_KEYS.projects.createSprint) ? searchParams.get('mode') : null
  const projectTeam = teamState.projectId === projectId ? teamState : {
    candidates: [],
    error: '',
    invites: [],
    isLoadingCandidates: false,
    isSending: false,
    members: [],
    messageParticipants: [],
  }
  const requestedInviteId = searchParams.get('teamInvite')
  const pendingTeamInvite = myTeamInvites.find((invite) => (
    invite.projectId === projectId
      && invite.status === 'pending'
      && (!requestedInviteId || invite.id === requestedInviteId)
  )) || null

  useEffect(() => {
    if (!projectId) return undefined
    let active = true
    setTeamState((current) => ({
      ...current,
      candidates: [],
      error: '',
      invites: [],
      members: [],
      messageParticipants: [],
      projectId,
    }))
    Promise.all([
      listProjectTeam(projectId),
      listMyProjectTeamInvites().catch(() => ({ invites: [] })),
    ]).then(([team, mine]) => {
      if (!active) return
      setTeamState((current) => ({
        ...current,
        invites: team.invites || [],
        members: team.members || [],
        messageParticipants: team.messageParticipants || [],
        projectId,
      }))
      setMyTeamInvites(mine.invites || [])
    }).catch((error) => {
      if (active) setTeamState((current) => ({ ...current, error: error.message, projectId }))
    })

    return () => {
      active = false
    }
  }, [projectId])

  async function refreshWorkspace() {
    if (!projectId) return
    const workspace = await fetchBackendProjectWorkspace(projectId)
    setBackendProject({ id: projectId, view: toProjectWorkspaceView(workspace) })
  }

  const openSubmitWork = (milestone = null, requestedMode = null) => {
    setSubmitMilestone(milestone)
    setSubmitTargetValue('')
    setSubmitMode(requestedMode || (milestone?.deliverable ? 'revise' : activeProject?.workActionMode) || 'submit')
    setIsSubmitOpen(true)
  }

  // Open the submit flow with a specific phase (deliverable/milestone)
  // preselected, so clicking a phase navigates straight to submitting for it.
  const openSubmitWorkForPhase = (targetValue, requestedMode = null) => {
    const target = activeProject?.submissionTargets?.find((item) => item.value === targetValue)
    setSubmitMilestone(null)
    setSubmitTargetValue(targetValue || '')
    setSubmitMode(requestedMode || (target?.canRevise ? 'revise' : 'submit'))
    setIsSubmitOpen(true)
  }

  const closeSubmitWork = () => {
    setIsSubmitOpen(false)
    setSubmitMilestone(null)
    setSubmitTargetValue('')
    setSubmitMode('submit')
  }

  const handleTabChange = (tab) => {
    const nextTab = resolveAllowedProjectTab(tab, activeProject, { isBusinessViewer })
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

  const handleSubmit = async (payload) => {
    // Real awarded projects submit to the backend. The local flow is retained
    // only for a project already present in the user's earn workflow state.
    if (backendView && projectId) {
      await submitProjectDeliverable(projectId, payload)
      await refreshWorkspace()
    } else {
      submitProjectWork({ project: activeProject, projectId })
    }

    const nextParams = new URLSearchParams(searchParams)
    // A milestone submission keeps the student on the Milestones tab; a
    // whole-project submission shows the transient confirmation on Overview.
    if (!payload?.milestoneId) {
      nextParams.delete('tab')
      setSubmittedProjectId(projectId)
      setActiveTab('Overview')
    }
    setIsSubmitOpen(false)
    setSubmitMilestone(null)
    setSubmitTargetValue('')
    setSubmitMode('submit')
    setSearchParams(nextParams, { replace: true })
  }

  const handlePriceProposalResponse = async (decision) => {
    const proposal = activeProject?.priceProposal
    if (!proposal?.id) return
    setPriceProposalState({ error: '', isResponding: true, notice: '' })
    try {
      await respondToProjectPriceProposal(proposal.id, decision)
      await refreshWorkspace()
      setPriceProposalState({
        error: '',
        isResponding: false,
        notice: decision === 'accepted'
          ? 'New price accepted. Your agreed pay has been updated.'
          : 'Price proposal declined. Your previous agreed pay stands.',
      })
    } catch (error) {
      setPriceProposalState({
        error: error instanceof Error ? error.message : 'Could not respond to the price proposal.',
        isResponding: false,
        notice: '',
      })
    }
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
    setSubmittedProjectId(null)
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

  const openTeamInviteModal = async () => {
    setTeamModal('invite')
    setTeamState((current) => ({
      ...current,
      error: '',
      isLoadingCandidates: true,
      projectId,
    }))
    try {
      const result = await listProjectTeamInviteCandidates(projectId)
      setTeamState((current) => ({
        ...current,
        candidates: result.candidates || [],
        isLoadingCandidates: false,
        projectId,
      }))
    } catch (error) {
      setTeamState((current) => ({
        ...current,
        error: error.message,
        isLoadingCandidates: false,
        projectId,
      }))
    }
  }

  const handleInviteTeamMembers = async ({ candidates, note, role }) => {
    setTeamState((current) => ({ ...current, error: '', isSending: true, projectId }))
    try {
      const result = await createProjectTeamInvites(projectId, candidates, { note, role })
      const sentCount = result.notifications || 0
      setTeamState((current) => ({
        ...current,
        candidates: current.candidates.map((candidate) => (
          candidates.some((selected) => selected.userId === candidate.userId)
            ? { ...candidate, alreadyInvited: true, inviteStatus: 'pending' }
            : candidate
        )),
        error: '',
        invites: result.team?.invites || current.invites,
        isSending: false,
        members: result.team?.members || current.members,
        messageParticipants: result.team?.messageParticipants || current.messageParticipants,
        projectId,
      }))
      setTeamInviteNotice(sentCount
        ? `${sentCount} project invite${sentCount === 1 ? '' : 's'} sent. Students were notified.`
        : 'Those students have already been invited or are already on the team.')
      setTeamModal(null)
    } catch (error) {
      setTeamState((current) => ({ ...current, error: error.message, isSending: false, projectId }))
    }
  }

  const handleProjectTeamInviteResponse = async (action) => {
    if (!pendingTeamInvite) return
    setTeamInviteResponseState({ error: '', isResponding: true })
    try {
      await respondToProjectTeamInvite(pendingTeamInvite.id, action)
      const [team, mine] = await Promise.all([
        listProjectTeam(projectId),
        listMyProjectTeamInvites(),
      ])
      setTeamState((current) => ({
        ...current,
        invites: team.invites || [],
        members: team.members || [],
        messageParticipants: team.messageParticipants || [],
        projectId,
      }))
      setMyTeamInvites(mine.invites || [])
      setTeamInviteResponseState({ error: '', isResponding: false })
      setTeamInviteNotice(action === 'accept'
        ? 'Project invitation accepted. You are now part of the team.'
        : 'Project invitation declined.')
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('teamInvite')
      setSearchParams(nextParams, { replace: true })
    } catch (error) {
      setTeamInviteResponseState({ error: error.message, isResponding: false })
    }
  }

  return {
    activeProject,
    refreshWorkspace,
    activeTab,
    handleCancelCreateSprint,
    handleCreateSprint,
    handleInviteTeamMembers,
    handleProjectTeamInviteResponse,
    handlePriceProposalResponse,
    priceProposalState,
    handleOverview,
    handleReviewDecision,
    handleSubmit,
    handleTabChange,
    isSubmitted,
    isSubmitOpen,
    openSubmitWork,
    openSubmitWorkForPhase,
    openTeamInviteModal,
    closeSubmitWork,
    submitMilestone,
    submitMode,
    submitTargetValue,
    projectPayment,
    projectReview,
    projectId,
    setIsSubmitOpen,
    setTeamModal,
    teamModal,
    teamInviteCandidates: projectTeam.candidates,
    teamInviteError: projectTeam.error,
    teamInviteIsLoading: projectTeam.isLoadingCandidates,
    teamInviteIsSending: projectTeam.isSending,
    teamInviteResponseState,
    teamInvites: projectTeam.invites,
    teamInviteNotice,
    teamMembers: projectTeam.members,
    teamMessageParticipants: projectTeam.messageParticipants,
    pendingTeamInvite,
    teamMode,
  }
}

export default useProjectWorkspace
