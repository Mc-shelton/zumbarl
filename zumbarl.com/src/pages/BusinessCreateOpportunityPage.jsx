import { Breadcrumb } from '../components/ui'
import { Link } from 'react-router-dom'
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
        title={`${createOpportunity.isEditingDraft ? 'Edit Opportunity Draft' : 'Create Opportunity'} | Zumbarl`}
        description="Create, fund and publish a Zumbarl business opportunity for student talent."
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
                { label: createOpportunity.isEditingDraft ? 'Edit Draft' : 'Create Opportunity' },
              ]}
            />
            <BusinessWorkspaceHeader
              title={createOpportunity.isEditingDraft ? 'Edit Opportunity Draft' : 'Create Opportunity'}
              description={createOpportunity.isEditingDraft
                ? 'Continue your saved brief, then fund and publish it when it is ready.'
                : 'Fill in the details below to post a new opportunity and find the right student talent.'}
            />
            {createOpportunity.isDraftLoading ? (
              <section className="business-profile-card business-create-form-card" role="status">
                <h2>Loading opportunity draft…</h2>
              </section>
            ) : createOpportunity.draftLoadError ? (
              <section className="business-profile-card business-create-form-card" role="alert">
                <h2>Draft unavailable</h2>
                <p>{createOpportunity.draftLoadError}</p>
                <Link className="business-profile-primary-btn" to="/business/opportunities">Back to opportunities</Link>
              </section>
            ) : (
              <>
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
                  isUploadingSplash={createOpportunity.isUploadingSplash}
                  isFirstStep={createOpportunity.isFirstStep}
                  isFinalStep={createOpportunity.isFinalStep}
                  onBack={createOpportunity.onBack}
                  onCancel={createOpportunity.onCancel}
                  onContinue={createOpportunity.onContinue}
                  onPublish={createOpportunity.onPublish}
                  onSaveDraft={createOpportunity.onSaveDraft}
                  onSplashUploadStateChange={createOpportunity.onSplashUploadStateChange}
                  onStepChange={createOpportunity.onStepChange}
                  onUpdateField={createOpportunity.onUpdateField}
                  saveError={createOpportunity.saveError}
                />
              </>
            )}
          </section>

            {!createOpportunity.isDraftLoading && !createOpportunity.draftLoadError ? <BusinessOpportunityBriefRail
              clarityChecks={createOpportunity.clarityChecks}
              clarityScore={createOpportunity.clarityScore}
              isPublishReady={createOpportunity.isPublishReady}
              isSaving={createOpportunity.isSaving}
              isUploadingSplash={createOpportunity.isUploadingSplash}
              onPublish={createOpportunity.onPublish}
              onSaveDraft={createOpportunity.onSaveDraft}
              onStepChange={createOpportunity.onStepChange}
              summary={createOpportunity.summary}
            /> : null}
        </div>
      </div>

      <BusinessOpportunityLeavePrompt {...createOpportunity.leavePrompt} />
    </main>
  )
}

export default BusinessCreateOpportunityPage
