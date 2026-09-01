import OpportunitiesBidsPanel from './OpportunitiesBidsPanel'
import OpportunitiesDiscoverPanel from './OpportunitiesDiscoverPanel'
import OpportunitiesInvitesPanel from './OpportunitiesInvitesPanel'
import OpportunitiesMarketingPanel from './OpportunitiesMarketingPanel'
import OpportunitiesOngoingPanel from './OpportunitiesOngoingPanel'
import OpportunitiesServiceOrdersPanel from './OpportunitiesServiceOrdersPanel'

function OpportunitiesTabContent({
  activeInviteClientsCount,
  activeOpportunityIntentId,
  activeOpportunityTypeId,
  actionRequiredServiceOrdersCount,
  activeOpportunityTab,
  completedServiceOrdersCount,
  confirmedServiceOrdersCount,
  expiringSoonInvitesCount,
  invites,
  newInvitesCount,
  onBidSelect,
  onClearFilters,
  onCreateBooking,
  onDeclineInvite,
  onMarkInvitesSeen,
  onOpenInviteProject,
  onOpenMarketingCampaign,
  onOpenMessages,
  onOpenPlaceBid,
  onOpenProject,
  onRefreshServiceOrders,
  onResumeBidDraft,
  onRespondCounterOffer,
  onViewBidOpportunity,
  onOpportunitySelect,
  onOpportunityTypeChange,
  onViewBooking,
  opportunityTypeOptions,
  projects,
  serviceOrders,
  serviceOrdersError,
  serviceOrdersLoading,
  projectTeamInvites,
  projectTeamInviteState,
  onRespondProjectTeamInvite,
  selectedBidId,
  shouldFocusSelectedBid,
  selectedOpportunityUuid,
  selectedProjectId,
  searchQuery,
  visibleBids,
  visibleOpportunities,
}) {
  if (activeOpportunityTab === 'Discover') {
    return (
      <OpportunitiesDiscoverPanel
        activeOpportunityIntentId={activeOpportunityIntentId}
        activeOpportunityTypeId={activeOpportunityTypeId}
        onClearFilters={onClearFilters}
        onOpportunitySelect={onOpportunitySelect}
        onOpportunityTypeChange={onOpportunityTypeChange}
        opportunities={visibleOpportunities}
        opportunityTypeOptions={opportunityTypeOptions}
        selectedOpportunityUuid={selectedOpportunityUuid}
      />
    )
  }

  if (activeOpportunityTab === 'My Bids') {
    return (
      <OpportunitiesBidsPanel
        bids={visibleBids}
        onBidSelect={onBidSelect}
        onOpenMessages={onOpenMessages}
        onOpenProject={onOpenProject}
        onResumeBidDraft={onResumeBidDraft}
        onRespondCounterOffer={onRespondCounterOffer}
        onViewBidOpportunity={onViewBidOpportunity}
        selectedBidId={selectedBidId}
        shouldFocusSelectedBid={shouldFocusSelectedBid}
      />
    )
  }

  if (activeOpportunityTab === 'Marketing') {
    return (
      <OpportunitiesMarketingPanel
        onOpenMarketingCampaign={onOpenMarketingCampaign}
        searchQuery={searchQuery}
      />
    )
  }

  if (activeOpportunityTab === 'Invites') {
    return (
      <OpportunitiesInvitesPanel
        activeInviteClientsCount={activeInviteClientsCount}
        expiringSoonInvitesCount={expiringSoonInvitesCount}
        invites={invites}
        newInvitesCount={newInvitesCount}
        onDeclineInvite={onDeclineInvite}
        onMarkInvitesSeen={onMarkInvitesSeen}
        onOpenInviteProject={onOpenInviteProject}
        onOpenPlaceBid={onOpenPlaceBid}
        projectTeamInvites={projectTeamInvites}
        projectTeamInviteState={projectTeamInviteState}
        onRespondProjectTeamInvite={onRespondProjectTeamInvite}
      />
    )
  }

  if (activeOpportunityTab === 'Ongoing') {
    return <OpportunitiesOngoingPanel onOpenMessages={onOpenMessages} onOpenProject={onOpenProject} projects={projects} selectedProjectId={selectedProjectId} />
  }

  if (activeOpportunityTab === 'Service Orders') {
    return (
      <OpportunitiesServiceOrdersPanel
        actionRequiredServiceOrdersCount={actionRequiredServiceOrdersCount}
        completedServiceOrdersCount={completedServiceOrdersCount}
        confirmedServiceOrdersCount={confirmedServiceOrdersCount}
        onCreateBooking={onCreateBooking}
        onOpenMessages={onOpenMessages}
        onRefresh={onRefreshServiceOrders}
        onViewBooking={onViewBooking}
        orders={serviceOrders}
        error={serviceOrdersError}
        isLoading={serviceOrdersLoading}
      />
    )
  }

  return null
}

export default OpportunitiesTabContent
