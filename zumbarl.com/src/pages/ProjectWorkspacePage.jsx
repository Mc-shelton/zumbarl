import { useMemo, useState } from 'react'
import CampusSidebar from '../components/layout/CampusSidebar'
import { BusinessWorkspaceSidebar } from '../features/business/components/BusinessApplicantSidebar'
import { getCurrentLoginRole, ROLE_SIDES } from '../features/auth/roleConfig'
import Seo from '../components/Seo'
import ProjectRail from '../features/projects/components/ProjectRail'
import ProjectTopBar from '../features/projects/components/ProjectTopBar'
import OverviewPanel from '../features/projects/components/OverviewPanel'
import ProjectConversationPanel from '../features/messages/components/ProjectConversationPanel'
import FilesPanel from '../features/projects/components/FilesPanel'
import ActivityLogPanel from '../features/projects/components/ActivityLogPanel'
import MilestonesPanel from '../features/projects/components/MilestonesPanel'
import MilestonesRail from '../features/projects/components/MilestonesRail'
import TeamPanel from '../features/projects/components/TeamPanel'
import TeamReviewsPanel from '../features/projects/components/TeamReviewsPanel'
import TeamProjectRail from '../features/projects/components/TeamProjectRail'
import TeamInviteModal from '../features/projects/components/TeamInviteModal'
import TeamInviteResponseCard from '../features/projects/components/TeamInviteResponseCard'
import PlaceholderPanel from '../features/projects/components/PlaceholderPanel'
import SubmitWorkModal from '../features/projects/components/SubmitWorkModal'
import SubmittedPanel from '../features/projects/components/SubmittedPanel'
import WorkDeliverablesPanel from '../features/projects/components/WorkDeliverablesPanel'
import useProjectWorkspace from '../features/projects/hooks/useProjectWorkspace'
import { useDeliverableTasks } from '../features/projects/hooks/useDeliverableTasks'
import { completeProjectScopeTarget, reviewProjectDeliverable } from '../features/projects/services/projectWorkspaceService'
import { endProject, startProject } from '../features/projects/services/projectSettingsService'
import BusinessProjectSettingsPanel from '../features/business/components/BusinessProjectSettingsPanel'
import ProjectStartNotice from '../features/projects/components/ProjectStartNotice'
import { useMilestoneWorkspace } from '../features/projects/hooks/useMilestoneWorkspace'
import MilestoneProgramPanel from '../features/projects/components/MilestoneProgramPanel'
import MilestoneScopePanel from '../features/projects/components/MilestoneScopePanel'
import ProjectSprintsPanel from '../features/projects/components/ProjectSprintsPanel'
import ProjectTimelinePanel from '../features/projects/components/ProjectTimelinePanel'
import MilestoneBoardPanel from '../features/projects/components/MilestoneBoardPanel'
import MilestoneProjectRail from '../features/projects/components/MilestoneProjectRail'
import '../styles/campus.css'
import '../styles/opportunities.css'
import '../styles/deliverableRoom.css'
import '../styles/projectTeam.css'
import '../styles/projectPlanning.css'
import '../styles/workflows.css'

function ProjectWorkspacePage() {
  const isBusinessViewer = getCurrentLoginRole().side === ROLE_SIDES.company
  const {
    activeProject,
    refreshWorkspace,
    activeTab,
    handleInviteTeamMembers,
    handleProjectTeamInviteResponse,
    handlePriceProposalResponse,
    priceProposalState,
    handleOverview,
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
    projectId,
    setTeamModal,
    teamModal,
    teamInviteCandidates,
    teamInviteError,
    teamInviteIsLoading,
    teamInviteIsSending,
    teamInviteResponseState,
    teamInvites,
    teamInviteNotice,
    teamMembers: persistedTeamMembers,
    teamMessageParticipants,
    pendingTeamInvite,
    workspaceError,
    workspaceIsLoading,
  } = useProjectWorkspace()
  const isTeamProject = Boolean(activeProject.isTeamProject ?? activeProject.hasTeam)
  // Board, sprints, timeline and the program gates belong to milestone-based
  // projects. A deliverable-based team divides the work inside the deliverable.
  const usesTeamPlanning = isTeamProject && Boolean(activeProject.hasMilestones)
  const usesDeliverableRooms = isTeamProject && !activeProject.hasMilestones
  // Lifted to the page because the submit modal and the task board both need it:
  // submitting is how a task reaches review, so the two cannot hold separate copies.
  const deliverableTasks = useDeliverableTasks(projectId, { enabled: usesDeliverableRooms || usesTeamPlanning })
  const milestoneWorkspace = useMilestoneWorkspace(projectId, { enabled: usesTeamPlanning })
  const [pendingSubmitTaskIds, setPendingSubmitTaskIds] = useState([])
  const [openMilestoneDeliverableId, setOpenMilestoneDeliverableId] = useState('')
  const [lifecyclePending, setLifecyclePending] = useState('')
  const [lifecycleError, setLifecycleError] = useState('')
  const [reviewActionState, setReviewActionState] = useState({
    pendingId: '',
    error: '',
    notice: '',
  })
  // This workspace is shared: the business is routed here once hiring produces a
  // project, so the controls that belong to it have to live here too.
  const hasStarted = activeProject.lifecycleStatus !== 'awarded'

  async function runLifecycle(key, action) {
    setLifecyclePending(key)
    setLifecycleError('')
    try {
      await action()
      await refreshWorkspace()
    } catch (error) {
      setLifecycleError(error?.message || 'That action could not be completed.')
    } finally {
      setLifecyclePending('')
    }
  }

  function handleEndProject() {
    const confirmed = window.confirm(
      'End this project? This closes the workspace once all deliverables are approved and paid.',
    )
    if (!confirmed) return
    runLifecycle('end', () => endProject(projectId))
  }

  // A task is never marked done directly - it is submitted for review, and the
  // business approving that submission is what marks it done.
  const openSubmitWorkForTask = (task) => {
    if (isBusinessViewer) return
    if (!task?.ownerId) {
      setLifecycleError('Claim this work before submitting it for review.')
      return
    }
    if (task.ownerId !== deliverableTasks.viewerStudentId) {
      setLifecycleError('This work is assigned to someone else. Only the assigned student can submit it for review.')
      return
    }
    setLifecycleError('')
    setPendingSubmitTaskIds(task?.id ? [task.id] : [])
    openSubmitWorkForPhase(task?.targetId || task?.milestoneDeliverableId || task?.scopeItemId || '', 'submit')
  }

  const handleSubmitWork = async (payload) => {
    await handleSubmit(payload)
    setPendingSubmitTaskIds([])
    await deliverableTasks.refresh()
  }

  const closeSubmitWorkModal = () => {
    setPendingSubmitTaskIds([])
    closeSubmitWork()
  }

  const handleSubmissionReview = async (deliverableId, { decision, feedback, review }) => {
    setReviewActionState({ pendingId: deliverableId, error: '', notice: '' })
    try {
      await reviewProjectDeliverable(deliverableId, { decision, feedback, review })
      await Promise.all([
        refreshWorkspace(),
        deliverableTasks.refresh(),
        milestoneWorkspace.refresh(),
      ])
      setReviewActionState({
        pendingId: '',
        error: '',
        notice: decision === 'approved'
          ? 'Work approved. The covered tasks are now complete.'
          : 'Changes requested. The covered tasks are back in progress.',
      })
      return true
    } catch (error) {
      setReviewActionState({
        pendingId: deliverableId,
        error: error?.message || 'Could not save the review decision.',
        notice: '',
      })
      return false
    }
  }

  const handleCompleteTarget = (scopeItemId) => runLifecycle(`complete:${scopeItemId}`, async () => {
    await completeProjectScopeTarget(projectId, { scopeItemId })
    await deliverableTasks.refresh()
  })

  const handleCompleteMilestone = (milestone) => runLifecycle(`complete-milestone:${milestone.id}`, async () => {
    await completeProjectScopeTarget(projectId, { milestoneId: milestone.id })
    await Promise.all([deliverableTasks.refresh(), milestoneWorkspace.refresh()])
  })

  const myOpenTasks = deliverableTasks.tasks.filter((task) => (
    task.ownerId && task.ownerId === deliverableTasks.viewerStudentId
  ))

  // Milestone planning submits the concrete backend deliverable. The milestone
  // remains attached as its parent context; it is not the selectable work item.
  const milestoneDeliverableTargets = useMemo(() => {
    const milestoneById = new Map(milestoneWorkspace.milestones.map((item) => [item.id, item]))
    return milestoneWorkspace.deliverablesWithMilestone.map((deliverable) => {
      const milestone = milestoneById.get(deliverable.milestoneId)
      const completed = milestone?.status === 'approved'
      const parked = deliverable.status === 'dormant'
      const hasSubmission = ['submitted', 'approved', 'changes_requested'].includes(deliverable.status)
      return {
        value: deliverable.id,
        label: deliverable.title,
        kind: 'milestone-deliverable',
        milestoneId: deliverable.milestoneId,
        milestoneTitle: deliverable.milestoneTitle,
        submissionStatus: hasSubmission ? deliverable.status : null,
        completed,
        // Approval settles one contribution, not the whole team target. A new
        // task may still be added and submitted until the milestone is paid.
        canSubmit: !completed && !parked,
        canRevise: !completed && deliverable.status === 'changes_requested',
        disabled: completed || parked,
        disabledReason: completed ? 'Completed' : parked ? 'Parked until funded' : '',
      }
    })
  }, [milestoneWorkspace.deliverablesWithMilestone, milestoneWorkspace.milestones])

  const submissionTargets = usesTeamPlanning
    ? milestoneDeliverableTargets
    : (activeProject.submissionTargets || [])

  return (
    <main className="campus-page opportunities-page project-workspace-page">
      <Seo
        title={`${activeProject.title} | Zumbarl Project`}
        description="Manage project files, messages, submissions and payment activity for an awarded Zumbarl gig."
        path={`${isBusinessViewer ? '/business' : '/campus'}/projects/${projectId || 'social-media-content-creation'}`}
      />

      <div className="campus-stage">
        <div className={`campus-shell project-workspace-shell${['Board', 'Messages'].includes(activeTab) ? ' is-no-rail is-focus-view' : ''}`}>
          {isBusinessViewer ? (
            <BusinessWorkspaceSidebar activeItemId="opportunities" />
          ) : (
            <CampusSidebar activeItemId="opportunities" />
          )}

          <section className="campus-main opportunities-main project-workspace-main">
            <ProjectTopBar
              activeProject={activeProject}
              activeTab={activeTab}
              hasStarted={hasStarted}
              isBusinessViewer={isBusinessViewer}
              isEnding={lifecyclePending === 'end'}
              isStarting={lifecyclePending === 'start'}
              onEndProject={isBusinessViewer && hasStarted && activeProject.lifecycleStatus !== 'ended'
                ? handleEndProject
                : undefined}
              onStartProject={isBusinessViewer && !hasStarted
                ? () => runLifecycle('start', () => startProject(projectId))
                : undefined}
              onTabChange={handleTabChange}
              onSubmitWork={isBusinessViewer ? undefined : () => openSubmitWork()}
            />

            {teamInviteNotice ? (
              <p className="team-invite-success" role="status">{teamInviteNotice}</p>
            ) : null}

            <TeamInviteResponseCard
              invite={pendingTeamInvite}
              error={teamInviteResponseState.error}
              isResponding={teamInviteResponseState.isResponding}
              onRespond={handleProjectTeamInviteResponse}
            />

            <div className="project-workspace-content">
              {usesTeamPlanning || usesDeliverableRooms ? (
                <ProjectStartNotice
                  hasStarted={hasStarted}
                  isPending={lifecyclePending === 'start'}
                  onStartProject={isBusinessViewer && !hasStarted
                    ? () => runLifecycle('start', () => startProject(projectId))
                    : undefined}
                />
              ) : null}
              {lifecycleError ? (
                <p className="project-lifecycle-error" role="alert">{lifecycleError}</p>
              ) : null}
              {workspaceIsLoading ? (
                <section className="project-card project-files-empty" aria-live="polite">
                  <strong>Loading project…</strong>
                  <p>Fetching the current workspace from Zumbarl.</p>
                </section>
              ) : workspaceError ? (
                <section className="project-card project-files-empty" role="alert">
                  <strong>Project unavailable</strong>
                  <p>{workspaceError}</p>
                  <button type="button" className="project-primary-btn" onClick={refreshWorkspace}>Try again</button>
                </section>
              ) : isSubmitted && activeTab === 'Overview' ? (
                <SubmittedPanel
                  activeProject={activeProject}
                  onOverview={handleOverview}
                  onResubmit={isBusinessViewer ? undefined : () => openSubmitWork()}
                />
              ) : usesTeamPlanning && activeTab === 'Overview' ? (
                <>
                  <MilestoneProgramPanel programGates={milestoneWorkspace.programGates} />
                  <OverviewPanel
                    project={activeProject}
                    onOpenMessages={() => handleTabChange('Messages')}
                    onOpenWorkDeliverables={() => handleTabChange('Work & Deliverables')}
                    onSubmitWork={isBusinessViewer ? undefined : openSubmitWork}
                    onSelectPhase={isBusinessViewer ? undefined : openSubmitWorkForPhase}
                    onRespondToPriceProposal={handlePriceProposalResponse}
                    priceProposalState={priceProposalState}
                  />
                </>
              ) : usesTeamPlanning && activeTab === 'Board' ? (
                <MilestoneBoardPanel
                  assignees={persistedTeamMembers}
                  mode="kanban"
                  deliverableTasks={deliverableTasks}
                  deliverablesByMilestone={milestoneWorkspace.deliverablesByMilestone}
                  milestones={milestoneWorkspace.milestones}
                  openDeliverableId={openMilestoneDeliverableId}
                  sprints={milestoneWorkspace.sprints}
                  onOpenDeliverable={setOpenMilestoneDeliverableId}
                  onSubmitTask={isBusinessViewer ? undefined : openSubmitWorkForTask}
                />
              ) : usesTeamPlanning && activeTab === 'Timeline' ? (
                <ProjectTimelinePanel timeline={milestoneWorkspace.timeline} />
              ) : usesTeamPlanning && activeTab === 'Sprints' ? (
                <ProjectSprintsPanel
                  canPlan
                  deliverables={milestoneWorkspace.deliverablesWithMilestone}
                  onAddBacklogItem={(payload) => deliverableTasks.onDeclareTask({ ...payload, ownerId: null })}
                  pending={milestoneWorkspace.pending}
                  sprints={milestoneWorkspace.sprints}
                  tasks={deliverableTasks.tasks}
                  onAssignTasks={async (sprintId, taskIds) => {
                    const result = await milestoneWorkspace.onAssignTasks(sprintId, taskIds)
                    if (result) await deliverableTasks.refresh()
                    return result
                  }}
                  onCreateSprint={milestoneWorkspace.onCreateSprint}
                  onUpdateSprint={milestoneWorkspace.onUpdateSprint}
                />
              ) : usesTeamPlanning && activeTab === 'Milestones' ? (
                <WorkDeliverablesPanel
                  isMilestoneScope
                  deliverableTasks={deliverableTasks}
                  isBusinessViewer={isBusinessViewer}
                  onReview={isBusinessViewer ? handleSubmissionReview : undefined}
                  project={activeProject}
                  reviewState={reviewActionState}
                  onSubmitTask={isBusinessViewer ? undefined : openSubmitWorkForTask}
                  onSubmitWork={isBusinessViewer ? undefined : openSubmitWork}
                  onSelectPhase={isBusinessViewer ? undefined : openSubmitWorkForPhase}
                  milestoneContent={openMilestoneDeliverableId ? (
                    <MilestoneBoardPanel
                      assignees={persistedTeamMembers}
                      deliverableTasks={deliverableTasks}
                      deliverablesByMilestone={milestoneWorkspace.deliverablesByMilestone}
                      milestones={milestoneWorkspace.milestones}
                      openDeliverableId={openMilestoneDeliverableId}
                      sprints={milestoneWorkspace.sprints}
                      onOpenDeliverable={setOpenMilestoneDeliverableId}
                      onSubmitTask={isBusinessViewer ? undefined : openSubmitWorkForTask}
                    />
                  ) : (
                    <>
                      <MilestoneScopePanel
                        canSettle={isBusinessViewer}
                        completionPending={lifecyclePending.startsWith('complete-milestone:') ? lifecyclePending.split(':')[1] : ''}
                        onActivateMilestone={milestoneWorkspace.onActivateMilestone}
                        onCompleteMilestone={isBusinessViewer ? handleCompleteMilestone : undefined}
                        onFundMilestone={milestoneWorkspace.onFundMilestone}
                        deliverablesByMilestone={milestoneWorkspace.deliverablesByMilestone}
                        milestones={milestoneWorkspace.milestones}
                        pending={milestoneWorkspace.pending}
                        tasks={deliverableTasks.tasks}
                        onCreateDeliverable={milestoneWorkspace.onCreateDeliverable}
                        onOpenDeliverable={(deliverable) => setOpenMilestoneDeliverableId(deliverable.id)}
                        onCreateMilestone={milestoneWorkspace.onCreateMilestone}
                        onUpdateMilestone={milestoneWorkspace.onUpdateMilestone}
                      />
                      <MilestoneProgramPanel programGates={milestoneWorkspace.programGates} />
                    </>
                  )}
                />
              ) : isTeamProject && activeTab === 'Team' ? (
                <TeamPanel
                  invites={teamInvites}
                  members={persistedTeamMembers}
                  tasks={deliverableTasks.tasks}
                  viewerStudentId={deliverableTasks.viewerStudentId}
                  onInviteMembers={openTeamInviteModal}
                />
              ) : usesTeamPlanning && activeTab === 'Activity Logs' ? (
                <ActivityLogPanel
                  dependencies={deliverableTasks.dependencies}
                  deliverables={milestoneWorkspace.deliverables}
                  invites={teamInvites}
                  members={persistedTeamMembers}
                  milestones={milestoneWorkspace.milestones}
                  notes={deliverableTasks.notes}
                  project={activeProject}
                  sprints={milestoneWorkspace.sprints}
                  tasks={deliverableTasks.tasks}
                />
              ) : isTeamProject && activeTab === 'Reviews' ? (
                <TeamReviewsPanel
                  isBusinessViewer={isBusinessViewer}
                  milestones={milestoneWorkspace.milestones}
                  onReview={isBusinessViewer ? handleSubmissionReview : undefined}
                  reviewState={reviewActionState}
                  submissions={activeProject.deliverables || []}
                  tasks={deliverableTasks.tasks}
                />
              ) : activeTab === 'Milestones' && activeProject.hasMilestones ? (
                <MilestonesPanel project={activeProject} onSubmitMilestone={isBusinessViewer ? undefined : openSubmitWork} />
              ) : activeTab === 'Overview' ? (
                <OverviewPanel
                  project={activeProject}
                  onOpenMessages={() => handleTabChange('Messages')}
                  onOpenWorkDeliverables={() => handleTabChange('Work & Deliverables')}
                  onSubmitWork={isBusinessViewer ? undefined : openSubmitWork}
                  onSelectPhase={isBusinessViewer ? undefined : openSubmitWorkForPhase}
                  onRespondToPriceProposal={handlePriceProposalResponse}
                  priceProposalState={priceProposalState}
                />
              ) : activeTab === 'Work & Deliverables' ? (
                <WorkDeliverablesPanel
                  deliverableTasks={deliverableTasks}
                  isBusinessViewer={isBusinessViewer}
                  lifecycleError={lifecycleError}
                  completionPending={lifecyclePending}
                  onCompleteTarget={isBusinessViewer ? handleCompleteTarget : undefined}
                  onReview={isBusinessViewer ? handleSubmissionReview : undefined}
                  project={activeProject}
                  reviewState={reviewActionState}
                  onSubmitTask={isBusinessViewer ? undefined : openSubmitWorkForTask}
                  onSubmitWork={isBusinessViewer ? undefined : openSubmitWork}
                  onSelectPhase={isBusinessViewer ? undefined : openSubmitWorkForPhase}
                />
              ) : activeTab === 'Settings' ? (
                <BusinessProjectSettingsPanel projectId={projectId} />
              ) : activeTab === 'Messages' ? (
                <ProjectConversationPanel
                  opportunity={{ backendId: activeProject.opportunityId, title: activeProject.title }}
                  participants={teamMessageParticipants}
                  projectId={projectId}
                />
              ) : activeTab === 'Files' ? (
                <FilesPanel
                  project={activeProject}
                  onSubmitWork={isBusinessViewer ? undefined : () => openSubmitWork()}
                />
              ) : activeTab === 'Activity Logs' && activeProject.source === 'database' ? (
                <ActivityLogPanel project={activeProject} />
              ) : (
                <PlaceholderPanel title={activeTab} />
              )}
            </div>
          </section>

          {workspaceIsLoading || workspaceError || activeTab === 'Messages' || (usesTeamPlanning && activeTab === 'Board') ? null : usesTeamPlanning && ['Overview', 'Milestones'].includes(activeTab) ? (
            <MilestoneProjectRail
              deliverables={milestoneWorkspace.deliverables}
              isBusinessViewer={isBusinessViewer}
              milestones={milestoneWorkspace.milestones}
              onPaymentCompleted={refreshWorkspace}
              project={activeProject}
              sprints={milestoneWorkspace.sprints}
              tasks={deliverableTasks.tasks}
              viewerStudentId={deliverableTasks.viewerStudentId}
            />
          ) : usesTeamPlanning ? (
            <TeamProjectRail
              activeTab={activeTab}
              activityData={{
                dependencies: deliverableTasks.dependencies,
                deliverables: milestoneWorkspace.deliverables,
                invites: teamInvites,
                members: persistedTeamMembers,
                milestones: milestoneWorkspace.milestones,
                notes: deliverableTasks.notes,
                project: activeProject,
                sprints: milestoneWorkspace.sprints,
                tasks: deliverableTasks.tasks,
              }}
              messageParticipants={teamMessageParticipants}
              onInviteMember={openTeamInviteModal}
              reviews={activeProject.deliverables || []}
              timeline={milestoneWorkspace.timeline}
            />
          ) : activeTab === 'Milestones' && activeProject.hasMilestones ? (
            <MilestonesRail />
          ) : (
            <ProjectRail
              activeProject={activeProject}
              activeTab={activeTab}
              isSubmitted={isSubmitted}
              onPaymentCompleted={refreshWorkspace}
              onSubmitWork={isBusinessViewer ? undefined : () => openSubmitWork()}
              onTabChange={handleTabChange}
              tasks={deliverableTasks.tasks}
            />
          )}
        </div>
      </div>

      {isSubmitOpen && !isBusinessViewer ? (
        <SubmitWorkModal
          onClose={closeSubmitWorkModal}
          onSubmit={handleSubmitWork}
          myTasks={(usesDeliverableRooms || usesTeamPlanning) ? myOpenTasks : []}
          tasks={(usesDeliverableRooms || usesTeamPlanning) ? deliverableTasks.tasks : []}
          taskCoverageEnabled={isTeamProject}
          viewerStudentId={deliverableTasks.viewerStudentId}
          onClaimTask={(task) => deliverableTasks.onClaimTask(task.id, deliverableTasks.viewerStudentId)}
          initialTaskIds={pendingSubmitTaskIds}
          milestone={submitMilestone}
          initialTargetValue={submitTargetValue}
          mode={submitMode}
          revisionSourceId={submitMilestone?.deliverable?.id || (!submissionTargets.length ? activeProject.latestDeliverable?.id : null)}
          targets={submissionTargets}
          targetKindLabel={usesTeamPlanning ? 'Deliverable' : (activeProject.targetKindLabel || 'Deliverable')}
        />
      ) : null}
      {teamModal === 'invite' ? (
        <TeamInviteModal
          candidates={teamInviteCandidates}
          error={teamInviteError}
          existingInvites={teamInvites}
          existingMembers={persistedTeamMembers}
          isLoading={teamInviteIsLoading}
          isSending={teamInviteIsSending}
          onClose={() => setTeamModal(null)}
          onSend={handleInviteTeamMembers}
          projectId={projectId}
        />
      ) : null}
    </main>
  )
}

export default ProjectWorkspacePage
