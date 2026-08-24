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
  onClearFilters,
  onCloseDetails,
  onEditFilters,
  onOpenPlaceBid,
  onRailFilterChange,
  onRailFilterToggle,
  railFilters,
  selectedOpportunity,
  selectedOpportunityBid,
  selectedOpportunityProject,
  selectedOpportunityThumbnail,
  skillOptions,
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
        onClearFilters={onClearFilters}
        onEditFilters={onEditFilters}
        onRailFilterChange={onRailFilterChange}
        onRailFilterToggle={onRailFilterToggle}
        railFilters={railFilters}
        skillOptions={skillOptions}
      />

      <OpportunityDetailRailPanel
        activeOpportunityIntentId={activeOpportunityIntentId}
        isDetailPanelVisible={isDetailPanelVisible}
        onClose={onCloseDetails}
        onEditFilters={onEditFilters}
        onOpenPlaceBid={onOpenPlaceBid}
        selectedOpportunity={selectedOpportunity}
        selectedOpportunityBid={selectedOpportunityBid}
        selectedOpportunityProject={selectedOpportunityProject}
        selectedOpportunityThumbnail={selectedOpportunityThumbnail}
      />
    </aside>
  )
}

export default OpportunitiesDiscoverRail
