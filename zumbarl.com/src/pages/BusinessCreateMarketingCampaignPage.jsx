import { Breadcrumb } from '../components/ui'
import Seo from '../components/Seo'
import { ACCESS_KEYS } from '../features/auth/roleConfig'
import { BusinessOpportunityCreateForm } from '../features/business/components/BusinessOpportunityCreateForm'
import { BusinessOpportunityCreateRail } from '../features/business/components/BusinessOpportunityCreateRail'
import { BusinessOpportunityCreateSteps } from '../features/business/components/BusinessOpportunityCreateSteps'
import { BusinessWorkspaceHeader } from '../features/business/components/BusinessWorkspaceHeader'
import { BusinessWorkspaceSidebar } from '../features/business/components/BusinessApplicantSidebar'
import { useBusinessOpportunityCreate } from '../features/business/hooks/useBusinessOpportunityCreate'
import { WorkflowStatusPanel } from '../features/workflows/components/WorkflowStatusPanel'
import '../styles/campus.css'
import '../styles/business.css'
import '../styles/workflows.css'

function BusinessCreateMarketingCampaignPage() {
  const createCampaign = useBusinessOpportunityCreate({ destination: '/business/marketing' })

  return (
    <main className="campus-page business-workspace-page business-create-opportunity-page">
      <Seo
        title="Create Marketing Campaign | Zumbarl"
        description="Create and publish a Zumbarl student creator marketing campaign."
        path="/business/marketing/create"
      />

      <div className="campus-stage">
        <div className="campus-shell business-workspace-shell business-create-opportunity-shell">
          <BusinessWorkspaceSidebar activeItemId="marketing" />

          <section className="campus-main business-workspace-main business-create-main">
            <Breadcrumb
              className="business-create-breadcrumb"
              items={[
                { label: 'Marketing', href: '/business/marketing' },
                { label: 'Create Campaign' },
              ]}
            />
            <BusinessWorkspaceHeader
              title="Create Marketing Campaign"
              description="Build a campaign brief for student creators to promote your brand, products, or services."
              primaryActionAccess={ACCESS_KEYS.business.marketingCreate}
              primaryActionHref="/business/marketing/create"
              primaryActionLabel="Create Marketing Campaign"
            />
            <BusinessOpportunityCreateSteps
              activeStep={createCampaign.activeStep}
              onStepChange={createCampaign.onStepChange}
            />
            <WorkflowStatusPanel
              title="Campaign launch gates"
              items={[
                { label: 'Campaign budget', status: createCampaign.form.totalBudget ? 'done' : 'blocked', detail: `KES ${createCampaign.form.totalBudget} planned before publishing.` },
                { label: 'Eligibility criteria', status: 'done', detail: `${createCampaign.form.targetPlatforms.join(', ')} with audience filters set.` },
                { label: 'Proof requirements', status: 'done', detail: createCampaign.form.contentRequirements.join(', ') },
              ]}
            />
            <BusinessOpportunityCreateForm
              activeStepMeta={createCampaign.activeStepMeta}
              form={createCampaign.form}
              isFirstStep={createCampaign.isFirstStep}
              isFinalStep={createCampaign.isFinalStep}
              onBack={createCampaign.onBack}
              onContinue={createCampaign.onContinue}
              onPublish={createCampaign.onPublish}
              onSaveDraft={createCampaign.onSaveDraft}
              onStepChange={createCampaign.onStepChange}
              onUpdateField={createCampaign.onUpdateField}
            />
          </section>

          <BusinessOpportunityCreateRail
            activeStep={createCampaign.activeStep}
            onPublish={createCampaign.onPublish}
            onSaveDraft={createCampaign.onSaveDraft}
            summary={createCampaign.summary}
          />
        </div>
      </div>
    </main>
  )
}

export default BusinessCreateMarketingCampaignPage
