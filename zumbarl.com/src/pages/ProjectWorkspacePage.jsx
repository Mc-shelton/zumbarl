import { useState } from 'react'
import CampusSidebar from '../components/layout/CampusSidebar'
import Seo from '../components/Seo'
import ProjectRail from '../features/projects/components/ProjectRail'
import ProjectTopBar from '../features/projects/components/ProjectTopBar'
import OverviewPanel from '../features/projects/components/OverviewPanel'
import MessagesPanel from '../features/projects/components/MessagesPanel'
import FilesPanel from '../features/projects/components/FilesPanel'
import MilestonesPanel from '../features/projects/components/MilestonesPanel'
import MilestonesRail from '../features/projects/components/MilestonesRail'
import TeamOverviewPanel from '../features/projects/components/TeamOverviewPanel'
import TeamBoardPanel from '../features/projects/components/TeamBoardPanel'
import TeamSprintsPanel from '../features/projects/components/TeamSprintsPanel'
import TeamCreateSprintPanel from '../features/projects/components/TeamCreateSprintPanel'
import TeamMilestonesPanel from '../features/projects/components/TeamMilestonesPanel'
import TeamTimelinePanel from '../features/projects/components/TeamTimelinePanel'
import TeamPanel from '../features/projects/components/TeamPanel'
import TeamActivityLogsPanel from '../features/projects/components/TeamActivityLogsPanel'
import TeamReviewsPanel from '../features/projects/components/TeamReviewsPanel'
import TeamProjectRail from '../features/projects/components/TeamProjectRail'
import TeamTaskModal from '../features/projects/components/TeamTaskModal'
import TeamMilestoneModal from '../features/projects/components/TeamMilestoneModal'
import PlaceholderPanel from '../features/projects/components/PlaceholderPanel'
import SubmitWorkModal from '../features/projects/components/SubmitWorkModal'
import SubmittedPanel from '../features/projects/components/SubmittedPanel'
import {
  ProjectProgramWorkflowPanel,
} from '../features/projects/components/ProjectProgramWorkflowPanel'
import useProjectWorkspace from '../features/projects/hooks/useProjectWorkspace'
import { WorkflowStatusPanel } from '../features/workflows/components/WorkflowStatusPanel'
import { GIG_WORKFLOW_MOCK, createInitialProjectProgramState } from '../features/workflows/workflowData'
import '../styles/campus.css'
import '../styles/opportunities.css'
import '../styles/workflows.css'

function ProjectWorkspacePage() {
  const [revisionBudgetPaid, setRevisionBudgetPaid] = useState(false)
  const [projectProgramState, setProjectProgramState] = useState(createInitialProjectProgramState)
  const {
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
    projectId,
    projectPayment,
    projectReview,
    setIsSubmitOpen,
    setTeamModal,
    teamModal,
    teamMode,
  } = useProjectWorkspace()
  const patchProjectProgramState = (patch) => {
    setProjectProgramState((current) => ({ ...current, ...patch }))
  }

  return (
    <main className="campus-page opportunities-page project-workspace-page">
      <Seo
        title={`${activeProject.title} | Zumbarl Project`}
        description="Manage project files, messages, submissions and payment activity for an awarded Zumbarl gig."
        path={`/campus/projects/${projectId || 'social-media-content-creation'}`}
      />

      <div className="campus-stage">
        <div className="campus-shell project-workspace-shell">
          <CampusSidebar activeItemId="opportunities" />

          <section className="campus-main opportunities-main project-workspace-main">
            <ProjectTopBar
              activeProject={activeProject}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onSubmitWork={() => setIsSubmitOpen(true)}
            />

            <div className="project-workspace-content">
              {activeProject.hasTeam && !isSubmitted ? (
                <ProjectProgramWorkflowPanel
                  state={projectProgramState}
                  onPatchState={patchProjectProgramState}
                />
              ) : null}
              {isSubmitted ? (
                <WorkflowStatusPanel
                  title="Submission review gates"
                  items={[
                    ...GIG_WORKFLOW_MOCK.gates.slice(0, 2),
                    {
                      label: 'Revision limit',
                      status: GIG_WORKFLOW_MOCK.currentRevisionCount < GIG_WORKFLOW_MOCK.revisionLimit ? 'done' : 'blocked',
                      detail: `${GIG_WORKFLOW_MOCK.currentRevisionCount}/${GIG_WORKFLOW_MOCK.revisionLimit} revision requests used.`,
                    },
                    {
                      label: 'Pending revision budget',
                      status: revisionBudgetPaid ? 'done' : 'blocked',
                      detail: revisionBudgetPaid
                        ? 'Pending revision budget is paid. Business review actions are unlocked.'
                        : `${GIG_WORKFLOW_MOCK.revisedBudgetDue} must be paid before approval or revision action.`,
                    },
                  ]}
                  actions={!revisionBudgetPaid ? (
                    <button type="button" className="project-primary-btn" onClick={() => setRevisionBudgetPaid(true)}>
                      Mark revision budget paid
                    </button>
                  ) : null}
                />
              ) : null}
              {isSubmitted ? (
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
                  payment={projectPayment}
                  reviewDecision={projectReview}
                  reviewLocked={!revisionBudgetPaid}
                />
              ) : activeProject.hasTeam && activeTab === 'Overview' ? (
                <TeamOverviewPanel />
              ) : activeProject.hasTeam && activeTab === 'Board' ? (
                <TeamBoardPanel onAddTask={() => setTeamModal('task')} />
              ) : activeProject.hasTeam && activeTab === 'Timeline' ? (
                <TeamTimelinePanel />
              ) : activeProject.hasTeam && activeTab === 'Sprints' && teamMode === 'create-sprint' ? (
                <TeamCreateSprintPanel onCancel={handleCancelCreateSprint} />
              ) : activeProject.hasTeam && activeTab === 'Sprints' ? (
                <TeamSprintsPanel onCreateSprint={handleCreateSprint} />
              ) : activeProject.hasTeam && activeTab === 'Milestones' ? (
                <TeamMilestonesPanel onAddMilestone={() => setTeamModal('milestone')} />
              ) : activeProject.hasTeam && activeTab === 'Team' ? (
                <TeamPanel />
              ) : activeProject.hasTeam && activeTab === 'Activity Logs' ? (
                <TeamActivityLogsPanel />
              ) : activeProject.hasTeam && activeTab === 'Reviews' ? (
                <TeamReviewsPanel />
              ) : activeTab === 'Milestones' && activeProject.hasMilestones ? (
                <MilestonesPanel />
              ) : activeTab === 'Overview' ? (
                <OverviewPanel />
              ) : activeTab === 'Messages' ? (
                <MessagesPanel />
              ) : activeTab === 'Files' ? (
                <FilesPanel />
              ) : (
                <PlaceholderPanel title={activeTab} />
              )}
            </div>
          </section>

          {activeProject.hasTeam ? (
            <TeamProjectRail activeTab={activeTab} />
          ) : activeTab === 'Milestones' && activeProject.hasMilestones ? (
            <MilestonesRail />
          ) : (
            <ProjectRail
              activeTab={activeTab}
              isSubmitted={isSubmitted}
              onSubmitWork={() => setIsSubmitOpen(true)}
              onTabChange={handleTabChange}
            />
          )}
        </div>
      </div>

      {isSubmitOpen ? <SubmitWorkModal onClose={() => setIsSubmitOpen(false)} onSubmit={handleSubmit} /> : null}
      {teamModal === 'task' ? <TeamTaskModal onClose={() => setTeamModal(null)} /> : null}
      {teamModal === 'milestone' ? <TeamMilestoneModal onClose={() => setTeamModal(null)} /> : null}
    </main>
  )
}

export default ProjectWorkspacePage
