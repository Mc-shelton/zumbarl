import CampusSidebar from '../components/layout/CampusSidebar'
import Seo from '../components/Seo'
import OpportunitiesBidsRail from '../features/opportunities/components/OpportunitiesBidsRail'
import OpportunitiesDiscoverRail from '../features/opportunities/components/OpportunitiesDiscoverRail'
import OpportunitiesHeader from '../features/opportunities/components/OpportunitiesHeader'
import OpportunitiesTabContent from '../features/opportunities/components/OpportunitiesTabContent'
import useOpportunitiesPageState from '../features/opportunities/hooks/useOpportunitiesPageState'
import { CAMPUS_OPPORTUNITIES_SEO } from '../features/seo/constants'
import '../styles/campus.css'
import '../styles/opportunities.css'

function OpportunitiesPage() {
  const pageState = useOpportunitiesPageState()

  return (
    <main className={`campus-page opportunities-page${pageState.isDetailPanelVisible ? ' is-detail-open' : ''}`}>
      <Seo
        title={CAMPUS_OPPORTUNITIES_SEO.title}
        description={CAMPUS_OPPORTUNITIES_SEO.description}
        path={CAMPUS_OPPORTUNITIES_SEO.path}
        keywords={CAMPUS_OPPORTUNITIES_SEO.keywords}
        jsonLd={[CAMPUS_OPPORTUNITIES_SEO.pageJsonLd]}
      />

      <div className="campus-stage">
        <div className={`campus-shell${pageState.isDetailPanelVisible ? ' is-detail-open' : ''}${!pageState.hasRightRail ? ' is-no-rail' : ''}`}>
          <CampusSidebar activeItemId="opportunities" />

          <section className="campus-main opportunities-main">
            <OpportunitiesHeader
              activeOpportunityTab={pageState.activeOpportunityTab}
              newInvitesCount={pageState.newInvitesCount}
              onTabChange={pageState.onTabChange}
              opportunitySearchRef={pageState.opportunitySearchRef}
            />

            <OpportunitiesTabContent
              activeInviteClientsCount={pageState.activeInviteClientsCount}
              actionRequiredServiceOrdersCount={pageState.actionRequiredServiceOrdersCount}
              activeOpportunityTab={pageState.activeOpportunityTab}
              completedServiceOrdersCount={pageState.completedServiceOrdersCount}
              confirmedServiceOrdersCount={pageState.confirmedServiceOrdersCount}
              expiringSoonInvitesCount={pageState.expiringSoonInvitesCount}
              invites={pageState.invites}
              newInvitesCount={pageState.newInvitesCount}
              onBidSelect={pageState.onBidSelect}
              onOpenMarketingCampaign={pageState.onOpenMarketingCampaign}
              onOpenPlaceBid={pageState.onOpenPlaceBid}
              onOpenProject={pageState.onOpenProject}
              onOpportunitySelect={pageState.onOpportunitySelect}
              onViewBooking={pageState.onViewBooking}
              projects={pageState.projects}
              activeOpportunityIntentId={pageState.activeOpportunityIntent.id}
              selectedBidId={pageState.selectedBidId}
              selectedOpportunityUuid={pageState.selectedOpportunityUuid}
              visibleBids={pageState.visibleBids}
              visibleOpportunities={pageState.visibleOpportunities}
            />
          </section>

          {pageState.isDiscoverTab ? (
            <OpportunitiesDiscoverRail
              isDetailOpen={pageState.isDetailOpen}
              isDetailPanelVisible={pageState.isDetailPanelVisible}
              isFilterCollapsed={pageState.isFilterCollapsed}
              isFilterExpanded={pageState.isFilterExpanded}
              isFilterPanelVisible={pageState.isFilterPanelVisible}
              onBackToDetail={pageState.onBackToDetail}
              onCloseDetails={pageState.onCloseDetails}
              onEditFilters={pageState.onEditFilters}
              onOpenPlaceBid={pageState.onOpenPlaceBid}
              activeOpportunityIntentId={pageState.activeOpportunityIntent.id}
              selectedOpportunity={pageState.selectedOpportunity}
              selectedOpportunityThumbnail={pageState.selectedOpportunityThumbnail}
            />
          ) : null}

          {pageState.isBidsTab ? (
            <OpportunitiesBidsRail
              selectedBid={pageState.selectedBid}
              selectedBidInterview={pageState.selectedBidInterview}
              upcomingInterviewsCount={pageState.upcomingInterviewsCount}
            />
          ) : null}
        </div>
      </div>
    </main>
  )
}

export default OpportunitiesPage
