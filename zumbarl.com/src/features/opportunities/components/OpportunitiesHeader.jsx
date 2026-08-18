import { FiChevronDown, FiMapPin, FiSearch } from 'react-icons/fi'
import CampusTopActions from '../../../components/layout/CampusTopActions'
import { Breadcrumb, TabNav } from '../../../components/ui'
import { OPPORTUNITY_TABS } from '../constants'

function OpportunitiesHeader({
  activeLocation = 'all',
  activeOpportunityTab,
  locationOptions = [],
  newInvitesCount,
  onLocationChange = () => {},
  onSearchQueryChange = () => {},
  onTabChange,
  opportunitySearchRef,
  searchQuery = '',
}) {
  const isMarketingTab = activeOpportunityTab === 'Marketing'

  return (
    <div className="opportunities-sticky-head">
      <header className="campus-header opportunities-header">
        <div className="opportunities-head-copy">
          <Breadcrumb
            className="opportunities-breadcrumb"
            items={[
              { label: 'Opportunities' },
              { label: isMarketingTab ? 'Marketing' : 'Jobs & Gigs' },
            ]}
          />
          <h1 className={`opportunities-title${isMarketingTab ? ' is-marketing' : ''}`}>{isMarketingTab ? 'Marketing' : 'Jobs & Gigs'}</h1>
          <p className="opportunities-subtitle">
            {isMarketingTab
              ? 'Pick up creator campaigns, post approved materials, and earn from your social reach.'
              : 'Find flexible work, gigs and opportunities that fit your skills and schedule.'}
          </p>
        </div>
        <CampusTopActions
          className="campus-header-actions"
          userButtonClassName="opportunities-user-btn"
        />
      </header>

      <section className={`opportunities-search-row${isMarketingTab ? ' is-marketing' : ''}`} aria-label={isMarketingTab ? 'Search marketing campaigns' : 'Search opportunities'}>
        <div className="opportunities-search-field">
          <FiSearch aria-hidden="true" />
          <input
            ref={opportunitySearchRef}
            type="search"
            placeholder={isMarketingTab ? 'Search campaigns, platforms or keywords...' : 'Search jobs, gigs or companies...'}
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
          />
        </div>
        {!isMarketingTab ? (
          <label className="opportunities-location-btn">
            <FiMapPin aria-hidden="true" />
            <select
              aria-label="Filter by location"
              value={activeLocation}
              onChange={(event) => onLocationChange(event.target.value)}
            >
              <option value="all">All locations</option>
              {locationOptions.map((location) => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
            <FiChevronDown aria-hidden="true" />
          </label>
        ) : null}
        <button
          type="button"
          className="opportunities-search-btn"
          onClick={() => opportunitySearchRef.current?.focus()}
        >
          Search
        </button>
      </section>

      <section className="opportunities-tabs-wrap">
        <TabNav
          activeId={activeOpportunityTab}
          ariaLabel="Opportunity tabs"
          className="opportunities-tabs"
          items={OPPORTUNITY_TABS.map((tab) => ({ id: tab, label: tab }))}
          onChange={onTabChange}
          renderTab={(tab) => (
            <>
              <span>{tab.label}</span>
              {tab.id === 'Invites' && newInvitesCount > 0 ? (
                <em className="opportunities-tab-badge" aria-label={`${newInvitesCount} new invites`}>
                  {newInvitesCount}
                </em>
              ) : null}
            </>
          )}
        />
      </section>
    </div>
  )
}

export default OpportunitiesHeader
