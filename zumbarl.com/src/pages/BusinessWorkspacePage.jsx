import Seo from '../components/Seo'
import { BusinessDashboardMetrics } from '../features/business/components/BusinessDashboardMetrics'
import { BusinessPipelineOverview } from '../features/business/components/BusinessPipelineOverview'
import { BusinessRecentApplicants } from '../features/business/components/BusinessRecentApplicants'
import { BusinessWorkspaceHeader } from '../features/business/components/BusinessWorkspaceHeader'
import { BusinessWorkspaceRail } from '../features/business/components/BusinessWorkspaceRail'
import { BusinessWorkspaceSidebar } from '../features/business/components/BusinessApplicantSidebar'
import { useBusinessWorkspace } from '../features/business/hooks/useBusinessWorkspace'
import '../styles/campus.css'
import '../styles/business.css'

function BusinessWorkspacePage() {
  const workspace = useBusinessWorkspace()

  return (
    <main className="campus-page business-workspace-page">
      <Seo
        title="Business Workspace | Zumbarl"
        description="Manage Zumbarl opportunities, applicant reviews, and awarded student projects."
        path="/business/workspace"
      />

      <div className="campus-stage">
        <div className="campus-shell business-workspace-shell">
          <BusinessWorkspaceSidebar activeItemId="home" />

          <section className="campus-main business-workspace-main">
            <BusinessWorkspaceHeader
              primaryActionHref="/business/opportunities/create"
              primaryActionLabel="Create Opportunity"
            />
            <BusinessDashboardMetrics metrics={workspace.metrics} />
           
            <BusinessPipelineOverview stages={workspace.pipelineStages} />
            <BusinessRecentApplicants applicants={workspace.applicants} />
          </section>

          <BusinessWorkspaceRail
            insights={workspace.insights}
            upcomingActions={workspace.upcomingActions}
          />
        </div>
      </div>
    </main>
  )
}

export default BusinessWorkspacePage
