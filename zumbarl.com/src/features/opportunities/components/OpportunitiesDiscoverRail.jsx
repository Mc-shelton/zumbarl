import OpportunitiesFilterRailPanel from './OpportunitiesFilterRailPanel'
import OpportunityDetailRailPanel from './OpportunityDetailRailPanel'

function OpportunitiesDiscoverRail({
  activeOpportunityIntentId,
  isDetailOpen,
  isDetailPanelVisible,
  isFilterCollapsed,
  isFilterExpanded,
  isFilterPanelVisible,
  onBackToDetail,
  onCloseDetails,
  onEditFilters,
  onOpenPlaceBid,
  selectedOpportunity,
  selectedOpportunityThumbnail,
}) {
  const railClasses = (
    `campus-rail opportunities-rail${isDetailOpen ? ' has-detail' : ''}` +
    `${isDetailPanelVisible ? ' is-detail-mode' : ''}` +
    `${isFilterExpanded ? ' is-filter-mode' : ''}`
  )

  return (
    <aside className={railClasses}>
      <OpportunitiesFilterRailPanel
        isDetailOpen={isDetailOpen}
        isFilterCollapsed={isFilterCollapsed}
        isFilterExpanded={isFilterExpanded}
        isFilterPanelVisible={isFilterPanelVisible}
        onBackToDetail={onBackToDetail}
        onEditFilters={onEditFilters}
      />

      <OpportunityDetailRailPanel
        activeOpportunityIntentId={activeOpportunityIntentId}
        isDetailPanelVisible={isDetailPanelVisible}
        onClose={onCloseDetails}
        onEditFilters={onEditFilters}
        onOpenPlaceBid={onOpenPlaceBid}
        selectedOpportunity={selectedOpportunity}
        selectedOpportunityThumbnail={selectedOpportunityThumbnail}
      />
    </aside>
  )
}

export default OpportunitiesDiscoverRail
