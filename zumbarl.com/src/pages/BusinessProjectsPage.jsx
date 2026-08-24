import { FiArrowRight, FiBriefcase, FiCheckCircle, FiClock, FiPlayCircle } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import Seo from '../components/Seo'
import { BusinessWorkspaceHeader } from '../features/business/components/BusinessWorkspaceHeader'
import { BusinessWorkspaceSidebar } from '../features/business/components/BusinessApplicantSidebar'
import { useBusinessWorkspace } from '../features/business/hooks/useBusinessWorkspace'
import '../styles/campus.css'
import '../styles/business.css'

function getProjectState(project) {
  if (project.endedAt || project.completedAt) return { icon: FiCheckCircle, label: 'Completed', tone: 'completed' }
  if (project.startedAt || ['active', 'execution', 'in_progress'].includes(String(project.status || '').toLowerCase())) {
    return { icon: FiPlayCircle, label: 'In progress', tone: 'active' }
  }
  return { icon: FiClock, label: 'Ready to start', tone: 'pending' }
}

function formatAmount(project) {
  const amount = Number(project.agreedAmount || 0)
  return amount ? `${project.agreedCurrency || 'KES'} ${amount.toLocaleString('en-KE')}` : 'Budget pending'
}

function BusinessProjectsPage() {
  const workspace = useBusinessWorkspace()
  const projects = workspace.projects || []

  return (
    <main className="campus-page business-workspace-page business-projects-page">
      <Seo
        title="Business Projects | Zumbarl"
        description="Open, start and manage projects awarded to Zumbarl talent."
        path="/business/projects"
      />

      <div className="campus-stage">
        <div className="campus-shell business-workspace-shell business-projects-shell">
          <BusinessWorkspaceSidebar activeItemId="projects" />

          <section className="campus-main business-workspace-main">
            <BusinessWorkspaceHeader
              title="Projects"
              description="Start awarded work, manage deliverables and review student submissions."
              primaryActionHref="/business/opportunities/create"
              primaryActionLabel="Create Opportunity"
            />

            {workspace.errorMessage ? <p className="business-dashboard-error">{workspace.errorMessage}</p> : null}
            {workspace.isLoading ? <p className="business-dashboard-empty">Loading your projects…</p> : null}

            {!workspace.isLoading && projects.length ? (
              <section className="business-projects-grid" aria-label="Zetech Studios projects">
                {projects.map((project) => {
                  const state = getProjectState(project)
                  const StateIcon = state.icon
                  return (
                    <article key={project.id} className="business-profile-card business-project-card">
                      <header>
                        <span className="business-project-card-icon"><FiBriefcase aria-hidden="true" /></span>
                        <span className={`business-project-state is-${state.tone}`}><StateIcon aria-hidden="true" />{state.label}</span>
                      </header>
                      <div>
                        <h2>{project.title}</h2>
                        <p>{project.isTeamProject || project.hasTeam ? 'Team project' : 'Student project'} · {formatAmount(project)}</p>
                      </div>
                      <dl>
                        <div><dt>Opportunity</dt><dd>{project.opportunityId ? 'Awarded work' : 'Direct project'}</dd></div>
                        <div><dt>Next step</dt><dd>{state.tone === 'pending' ? 'Start project' : state.tone === 'active' ? 'Review work' : 'View record'}</dd></div>
                      </dl>
                      <Link to={`/business/projects/${encodeURIComponent(project.id)}`}>
                        Open project <FiArrowRight aria-hidden="true" />
                      </Link>
                    </article>
                  )
                })}
              </section>
            ) : null}

            {!workspace.isLoading && !projects.length ? (
              <section className="business-profile-card business-projects-empty">
                <FiBriefcase aria-hidden="true" />
                <h2>No awarded projects yet</h2>
                <p>A project will appear here after you award an application.</p>
                <Link to="/business/opportunities">Review opportunities <FiArrowRight aria-hidden="true" /></Link>
              </section>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  )
}

export default BusinessProjectsPage
