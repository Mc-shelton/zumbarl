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
import TeamInvoicesPanel from '../features/projects/components/TeamInvoicesPanel'
import TeamReviewsPanel from '../features/projects/components/TeamReviewsPanel'
import TeamProjectRail from '../features/projects/components/TeamProjectRail'
import TeamTaskModal from '../features/projects/components/TeamTaskModal'
import TeamMilestoneModal from '../features/projects/components/TeamMilestoneModal'
import PlaceholderPanel from '../features/projects/components/PlaceholderPanel'
import SubmitWorkModal from '../features/projects/components/SubmitWorkModal'
import SubmittedPanel from '../features/projects/components/SubmittedPanel'
import useProjectWorkspace from '../features/projects/hooks/useProjectWorkspace'
import '../styles/campus.css'
import '../styles/opportunities.css'

function ProjectWorkspacePage() {
  const {
    activeProject,
    activeTab,
    handleCancelCreateSprint,
    handleCreateSprint,
    handleOverview,
    handleSubmit,
    handleTabChange,
    isSubmitted,
    isSubmitOpen,
    projectId,
    setIsSubmitOpen,
    setTeamModal,
    teamModal,
    teamMode,
  } = useProjectWorkspace()

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
              {isSubmitted ? (
                <SubmittedPanel onOverview={handleOverview} />
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
              ) : activeProject.hasTeam && activeTab === 'Invoices' ? (
                <TeamInvoicesPanel />
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
