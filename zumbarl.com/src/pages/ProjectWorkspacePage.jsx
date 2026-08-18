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
import TeamTaskModal from '../features/projects/components/TeamTaskModal'
import TeamMilestoneModal from '../features/projects/components/TeamMilestoneModal'
import TeamInviteModal from '../features/projects/components/TeamInviteModal'
import TeamInviteResponseCard from '../features/projects/components/TeamInviteResponseCard'
import PlaceholderPanel from '../features/projects/components/PlaceholderPanel'
import SubmitWorkModal from '../features/projects/components/SubmitWorkModal'
import SubmittedPanel from '../features/projects/components/SubmittedPanel'
import WorkDeliverablesPanel from '../features/projects/components/WorkDeliverablesPanel'
import useProjectWorkspace from '../features/projects/hooks/useProjectWorkspace'
import { useDeliverableTasks } from '../features/projects/hooks/useDeliverableTasks'
import { reviewProjectDeliverable } from '../features/projects/services/projectWorkspaceService'
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
    projectId,
    projectPayment,
    projectReview,
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

  // A task is never marked done directly - it is submitted for review, and the
  // business approving that submission is what marks it done.
  const openSubmitWorkForTask = (task) => {
    if (isBusinessViewer) return
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

  const handleSubmissionReview = async (deliverableId, { decision, feedback }) => {
    setReviewActionState({ pendingId: deliverableId, error: '', notice: '' })
    try {
      await reviewProjectDeliverable(deliverableId, { decision, feedback })
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

  const myOpenTasks = deliverableTasks.tasks.filter((task) => (
    task.ownerId && task.ownerId === deliverableTasks.viewerStudentId
  ))

  // Milestone planning submits the concrete backend deliverable. The milestone
  // remains attached as its parent context; it is not the selectable work item.
  const milestoneDeliverableTargets = useMemo(() => (
    milestoneWorkspace.deliverablesWithMilestone.map((deliverable) => ({
      value: deliverable.id,
      label: deliverable.title,
      kind: 'milestone-deliverable',
      milestoneId: deliverable.milestoneId,
      milestoneTitle: deliverable.milestoneTitle,
      // A team deliverable can receive separate task submissions from several
      // students. Only final approval closes it to further work.
      canSubmit: deliverable.status !== 'approved',
      canRevise: deliverable.status === 'submitted',
      disabled: deliverable.status === 'approved',
    }))
  ), [milestoneWorkspace.deliverablesWithMilestone])

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
        <div className="campus-shell project-workspace-shell">
          {isBusinessViewer ? (
            <BusinessWorkspaceSidebar activeItemId="opportunities" />
          ) : (
            <CampusSidebar activeItemId="opportunities" />
          )}

          <section className="campus-main opportunities-main project-workspace-main">
            <ProjectTopBar
              activeProject={activeProject}
              activeTab={activeTab}
              isBusinessViewer={isBusinessViewer}
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
              {isBusinessViewer && hasStarted && activeProject.lifecycleStatus !== 'ended' ? (
                <p className="project-lifecycle-actions">
                  <button
                    type="button"
                    disabled={lifecyclePending === 'end'}
                    onClick={() => runLifecycle('end', () => endProject(projectId))}
                  >
                    {lifecyclePending === 'end' ? 'Ending project…' : 'End project'}
                  </button>
                </p>
              ) : null}

              {isSubmitted && activeTab === 'Overview' ? (
                <SubmittedPanel
                  activeProject={activeProject}
                  onApproveSubmission={() => handleReviewDecision('approved', {
                    endorsementCurrency: 12,
                    feedback: 'Strong delivery, clear communication, and useful campaign-ready assets.',
                    rating: '4.8',
                  })}
                  onOverview={handleOverview}
                  onRequestRevision={() => handleReviewDecision('revision_requested', {
                    feedback: 'Please add one more content variation and resubmit the final file pack.',
                  })}
                  onResubmit={isBusinessViewer ? undefined : () => openSubmitWork()}
                  payment={projectPayment}
                  reviewDecision={projectReview}
                />
              ) : usesTeamPlanning && activeTab === 'Overview' ? (
                <>
                  <MilestoneProgramPanel programGates={milestoneWorkspace.programGates} />
                  <OverviewPanel
                    project={activeProject}
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
                  project={activeProject}
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
                        onActivateMilestone={milestoneWorkspace.onActivateMilestone}
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
                  onOpenWorkDeliverables={() => handleTabChange('Work & Deliverables')}
                  onSubmitWork={isBusinessViewer ? undefined : openSubmitWork}
                  onSelectPhase={isBusinessViewer ? undefined : openSubmitWorkForPhase}
                  onRespondToPriceProposal={handlePriceProposalResponse}
                  priceProposalState={priceProposalState}
                />
              ) : activeTab === 'Work & Deliverables' ? (
                <WorkDeliverablesPanel
                  deliverableTasks={deliverableTasks}
                  project={activeProject}
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
                <FilesPanel project={activeProject} />
              ) : activeTab === 'Activity Logs' && activeProject.source === 'database' ? (
                <ActivityLogPanel project={activeProject} />
              ) : (
                <PlaceholderPanel title={activeTab} />
              )}
            </div>
          </section>

          {usesTeamPlanning && ['Overview', 'Board', 'Milestones'].includes(activeTab) ? (
            <MilestoneProjectRail
              deliverables={milestoneWorkspace.deliverables}
              isBusinessViewer={isBusinessViewer}
              milestones={milestoneWorkspace.milestones}
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
              onSubmitWork={isBusinessViewer ? undefined : () => openSubmitWork()}
              onTabChange={handleTabChange}
            />
          )}
        </div>
      </div>

      {isSubmitOpen && !isBusinessViewer ? (
        <SubmitWorkModal
          onClose={closeSubmitWorkModal}
          onSubmit={handleSubmitWork}
          myTasks={(usesDeliverableRooms || usesTeamPlanning) ? myOpenTasks : []}
          initialTaskIds={pendingSubmitTaskIds}
          milestone={submitMilestone}
          initialTargetValue={submitTargetValue}
          mode={submitMode}
          revisionSourceId={submitMilestone?.deliverable?.id || (!submissionTargets.length ? activeProject.latestDeliverable?.id : null)}
          targets={submissionTargets}
          targetKindLabel={usesTeamPlanning ? 'Deliverable' : (activeProject.targetKindLabel || 'Deliverable')}
        />
      ) : null}
      {teamModal === 'task' ? <TeamTaskModal onClose={() => setTeamModal(null)} /> : null}
      {teamModal === 'milestone' ? <TeamMilestoneModal onClose={() => setTeamModal(null)} /> : null}
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
        />
      ) : null}
    </main>
  )
}

export default ProjectWorkspacePage
