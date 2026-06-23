import { Breadcrumb } from '../components/ui'
import Seo from '../components/Seo'
import { BusinessOpportunityBriefForm } from '../features/business/components/BusinessOpportunityBriefForm'
import { BusinessOpportunityBriefRail } from '../features/business/components/BusinessOpportunityBriefRail'
import { BusinessOpportunityBriefSteps } from '../features/business/components/BusinessOpportunityBriefSteps'
import { BusinessOpportunityLeavePrompt } from '../features/business/components/BusinessOpportunityLeavePrompt'
import { BusinessWorkspaceHeader } from '../features/business/components/BusinessWorkspaceHeader'
import { BusinessWorkspaceSidebar } from '../features/business/components/BusinessApplicantSidebar'
import { useBusinessOpportunityBriefCreate } from '../features/business/hooks/useBusinessOpportunityBriefCreate'
import '../styles/campus.css'
import '../styles/business.css'
import '../styles/workflows.css'

function BusinessCreateOpportunityPage() {
  const createOpportunity = useBusinessOpportunityBriefCreate()

  return (
    <main className="campus-page business-workspace-page business-create-opportunity-page">
      <Seo
        title="Create Opportunity | Zumbarl"
        description="Create and publish a Zumbarl business opportunity for student talent."
        path="/business/opportunities/create"
      />

      <div className="campus-stage">
        <div className="campus-shell business-workspace-shell business-create-opportunity-shell">
          <BusinessWorkspaceSidebar activeItemId="opportunities" />

          <section className="campus-main business-workspace-main business-create-main">
            <Breadcrumb
              className="business-create-breadcrumb"
              items={[
                { label: 'Opportunities', href: '/business/opportunities' },
                { label: 'Create Opportunity' },
              ]}
            />
            <BusinessWorkspaceHeader
              title="Create Opportunity"
              description="Fill in the details below to post a new opportunity and find the right student talent."
              onCreateOpportunity={createOpportunity.onReset}
            />
            <BusinessOpportunityBriefSteps
              activeStep={createOpportunity.activeStep}
              onStepChange={createOpportunity.onStepChange}
            />
            <BusinessOpportunityBriefForm
              activeStepMeta={createOpportunity.activeStepMeta}
              clarityChecks={createOpportunity.clarityChecks}
              form={createOpportunity.form}
              isPublishReady={createOpportunity.isPublishReady}
              isSaving={createOpportunity.isSaving}
              isFirstStep={createOpportunity.isFirstStep}
              isFinalStep={createOpportunity.isFinalStep}
              onBack={createOpportunity.onBack}
              onContinue={createOpportunity.onContinue}
              onPublish={createOpportunity.onPublish}
              onSaveDraft={createOpportunity.onSaveDraft}
              onStepChange={createOpportunity.onStepChange}
              onUpdateField={createOpportunity.onUpdateField}
              saveError={createOpportunity.saveError}
            />
          </section>

            <BusinessOpportunityBriefRail
              clarityChecks={createOpportunity.clarityChecks}
              clarityScore={createOpportunity.clarityScore}
              isPublishReady={createOpportunity.isPublishReady}
              onPublish={createOpportunity.onPublish}
              onSaveDraft={createOpportunity.onSaveDraft}
              onStepChange={createOpportunity.onStepChange}
              summary={createOpportunity.summary}
            />
        </div>
      </div>

      <BusinessOpportunityLeavePrompt {...createOpportunity.leavePrompt} />
    </main>
  )
}

export default BusinessCreateOpportunityPage
