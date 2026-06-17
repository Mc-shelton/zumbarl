import { useNavigate } from 'react-router-dom'
import Seo from '../components/Seo'
import { ACCESS_KEYS, hasAccess } from '../features/auth/roleConfig'
import { BusinessApplicantHero } from '../features/business/components/BusinessApplicantHero'
import { BusinessApplicantRail } from '../features/business/components/BusinessApplicantRail'
import { BusinessApplicantShell } from '../features/business/components/BusinessApplicantShell'
import { BusinessApplicantSidebar } from '../features/business/components/BusinessApplicantSidebar'
import { BusinessApplicantTabPanels } from '../features/business/components/BusinessApplicantTabPanels'
import { BusinessApplicantTabs } from '../features/business/components/BusinessApplicantTabs'
import { BusinessApplicantTopBar } from '../features/business/components/BusinessApplicantTopBar'
import { useBusinessApplicantReview } from '../features/business/hooks/useBusinessApplicantReview'
import { BUSINESS_APPLICANT_PROFILE_SEO } from '../features/seo/constants'
import '../styles/campus.css'
import '../styles/business.css'

function BusinessApplicantProfilePage() {
  const navigate = useNavigate()
  const canViewFullApplicantProfile = hasAccess(ACCESS_KEYS.business.applicantProfiles)
  const businessReview = useBusinessApplicantReview()
  const openCreateOpportunity = () => navigate('/business/opportunities/create')

  return (
    <BusinessApplicantShell sidebar={<BusinessApplicantSidebar />}>
      <Seo
        title={BUSINESS_APPLICANT_PROFILE_SEO.title}
        description={BUSINESS_APPLICANT_PROFILE_SEO.description}
        path={BUSINESS_APPLICANT_PROFILE_SEO.path}
        keywords={BUSINESS_APPLICANT_PROFILE_SEO.keywords}
        jsonLd={[BUSINESS_APPLICANT_PROFILE_SEO.pageJsonLd]}
      />

      <BusinessApplicantTopBar onCreateOpportunity={openCreateOpportunity} />
      <div className="business-profile-body">
        <section className="business-profile-main">
          <BusinessApplicantHero />
          <BusinessApplicantTabs
            activeTab={businessReview.activeTab}
            onTabChange={businessReview.onTabChange}
          />
          <BusinessApplicantTabPanels
            activeTab={businessReview.activeTab}
            businessReview={businessReview}
            canViewFullApplicantProfile={canViewFullApplicantProfile}
          />
        </section>

        <BusinessApplicantRail
          awardBudgetPaid={businessReview.awardBudgetPaid}
          pipelineState={businessReview.pipelineState}
          onAwardProject={businessReview.onAwardProject}
          onCreateOpportunity={openCreateOpportunity}
          onMoveToNextStage={businessReview.onMoveToNextStage}
          onRemoveFromPipeline={businessReview.onRemoveFromPipeline}
          onScheduleInterview={businessReview.onScheduleInterview}
          onShortlistApplicant={businessReview.onShortlistApplicant}
          onPayAwardBudget={businessReview.onPayAwardBudget}
        />
      </div>
    </BusinessApplicantShell>
  )
}

export default BusinessApplicantProfilePage
