import OpportunitiesBidsPanel from './OpportunitiesBidsPanel'
import OpportunitiesDiscoverPanel from './OpportunitiesDiscoverPanel'
import OpportunitiesInvitesPanel from './OpportunitiesInvitesPanel'
import OpportunitiesOngoingPanel from './OpportunitiesOngoingPanel'
import OpportunitiesServiceOrdersPanel from './OpportunitiesServiceOrdersPanel'

function OpportunitiesTabContent({
  activeInviteClientsCount,
  activeOpportunityIntentId,
  actionRequiredServiceOrdersCount,
  activeOpportunityTab,
  completedServiceOrdersCount,
  confirmedServiceOrdersCount,
  expiringSoonInvitesCount,
  invites,
  newInvitesCount,
  onBidSelect,
  onOpenMarketingCampaign,
  onOpenPlaceBid,
  onOpenProject,
  onOpportunitySelect,
  onViewBooking,
  projects,
  selectedBidId,
  selectedOpportunityUuid,
  visibleBids,
  visibleOpportunities,
}) {
  if (activeOpportunityTab === 'Discover') {
    return (
      <OpportunitiesDiscoverPanel
        activeOpportunityIntentId={activeOpportunityIntentId}
        onOpenMarketingCampaign={onOpenMarketingCampaign}
        onOpportunitySelect={onOpportunitySelect}
        opportunities={visibleOpportunities}
        selectedOpportunityUuid={selectedOpportunityUuid}
      />
    )
  }

  if (activeOpportunityTab === 'My Bids') {
    return (
      <OpportunitiesBidsPanel
        bids={visibleBids}
        onBidSelect={onBidSelect}
        onOpenProject={onOpenProject}
        selectedBidId={selectedBidId}
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
        onOpenPlaceBid={onOpenPlaceBid}
      />
    )
  }

  if (activeOpportunityTab === 'Ongoing') {
    return <OpportunitiesOngoingPanel onOpenProject={onOpenProject} projects={projects} />
  }

  if (activeOpportunityTab === 'Service Orders') {
    return (
      <OpportunitiesServiceOrdersPanel
        actionRequiredServiceOrdersCount={actionRequiredServiceOrdersCount}
        completedServiceOrdersCount={completedServiceOrdersCount}
        confirmedServiceOrdersCount={confirmedServiceOrdersCount}
        onViewBooking={onViewBooking}
      />
    )
  }

  return null
}

export default OpportunitiesTabContent
