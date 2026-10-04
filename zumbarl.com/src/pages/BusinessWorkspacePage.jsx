import { useState } from 'react'
import Seo from '../components/Seo'
import { BusinessCampusPresence } from '../features/business/components/BusinessCampusPresence'
import { BusinessDashboardMetrics } from '../features/business/components/BusinessDashboardMetrics'
import { BusinessPipelineOverview } from '../features/business/components/BusinessPipelineOverview'
import { BusinessRecentApplicants } from '../features/business/components/BusinessRecentApplicants'
import { BusinessWorkspaceHeader } from '../features/business/components/BusinessWorkspaceHeader'
import { BusinessWorkspaceRail } from '../features/business/components/BusinessWorkspaceRail'
import { BusinessWorkspaceSidebar } from '../features/business/components/BusinessApplicantSidebar'
import { useBusinessWorkspace } from '../features/business/hooks/useBusinessWorkspace'
import { createBusinessPost } from '../features/business/services/readBusinessDashboard'
import ExplorePostComposer from '../features/explore/components/ExplorePostComposer'
import '../styles/campus.css'
import '../styles/business.css'
import '../styles/explore-campus.css'

function BusinessWorkspacePage() {
  const workspace = useBusinessWorkspace()
  const [isPostComposerOpen, setIsPostComposerOpen] = useState(false)
  const [publishNotice, setPublishNotice] = useState('')

  async function publishBusinessPost(payload) {
    await createBusinessPost(payload)
    setPublishNotice('Your post is live in Explore Campus.')
    await workspace.reload().catch(() => null)
  }

  async function copyStudentLink(path) {
    try {
      await navigator.clipboard.writeText(new URL(path, window.location.origin).toString())
      setPublishNotice('Student-facing link copied to your clipboard.')
    } catch {
      setPublishNotice('Copying is unavailable in this browser. Open this dashboard over HTTPS and try again.')
    }
  }

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
              title={`Welcome back, ${workspace.business?.name || 'Business workspace'}!`}
              primaryActionHref="/business/opportunities/create"
              primaryActionLabel="Create Opportunity"
            />
            {workspace.errorMessage ? <p className="business-dashboard-error">{workspace.errorMessage}</p> : null}
            {publishNotice ? <p className="business-dashboard-publish-notice" role="status">{publishNotice}</p> : null}
            <BusinessCampusPresence
              business={workspace.business}
              onCopyStudentLink={copyStudentLink}
              onCreatePost={() => { setPublishNotice(''); setIsPostComposerOpen(true) }}
              postCount={workspace.postCount}
              posts={workspace.posts}
            />
            <BusinessDashboardMetrics metrics={workspace.metrics} />

            <BusinessPipelineOverview stages={workspace.pipelineStages} />
            <BusinessRecentApplicants applicants={workspace.applicants} />
          </section>

          <BusinessWorkspaceRail
            insights={workspace.insights}
            kyc={workspace.kyc}
            upcomingActions={workspace.upcomingActions}
          />
        </div>
      </div>
      <ExplorePostComposer
        allowedTypes={['post', 'media', 'poll', 'feeling']}
        eyebrow="Business voice"
        identity={{ name: workspace.business?.name || 'Your business', avatarUrl: workspace.business?.logoUrl }}
        initialType="post"
        isOpen={isPostComposerOpen}
        onClose={() => setIsPostComposerOpen(false)}
        onPublish={publishBusinessPost}
        placeholder={`Share an update from ${workspace.business?.name || 'your business'} with Explore Campus…`}
        publishLabel="Publish as business"
        title={`Post as ${workspace.business?.name || 'your business'}`}
      />
    </main>
  )
}

export default BusinessWorkspacePage
