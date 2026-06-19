import { FiChevronDown, FiMapPin, FiSearch } from 'react-icons/fi'
import CampusTopActions from '../../../components/layout/CampusTopActions'
import { Breadcrumb } from '../../../components/ui'
import { OPPORTUNITY_TABS } from '../constants'

function OpportunitiesHeader({
  activeOpportunityTab,
  newInvitesCount,
  onTabChange,
  opportunitySearchRef,
}) {
  return (
    <div className="opportunities-sticky-head">
      <header className="campus-header opportunities-header">
        <div className="opportunities-head-copy">
          <Breadcrumb
            className="opportunities-breadcrumb"
            items={[
              { label: 'Opportunities' },
              { label: 'Jobs & Gigs' },
            ]}
          />
          <h1 className="opportunities-title">Jobs & Gigs</h1>
          <p className="opportunities-subtitle">
            Find flexible work, gigs and opportunities that fit your skills and schedule.
          </p>
        </div>
        <CampusTopActions
          className="campus-header-actions"
          userButtonClassName="opportunities-user-btn"
        />
      </header>

      <section className="opportunities-search-row" aria-label="Search opportunities">
        <div className="opportunities-search-field">
          <FiSearch aria-hidden="true" />
          <input
            ref={opportunitySearchRef}
            type="search"
            placeholder="Search jobs, gigs or companies..."
          />
        </div>
        <button type="button" className="opportunities-location-btn">
          <FiMapPin aria-hidden="true" />
          All locations
          <FiChevronDown aria-hidden="true" />
        </button>
        <button type="button" className="opportunities-search-btn">Search</button>
      </section>

      <section className="opportunities-tabs-wrap">
        <nav className="opportunities-tabs" aria-label="Opportunity tabs">
          {OPPORTUNITY_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={activeOpportunityTab === tab ? 'is-active' : ''}
              aria-selected={activeOpportunityTab === tab}
              onClick={() => onTabChange(tab)}
            >
              <span>{tab}</span>
              {tab === 'Invites' && newInvitesCount > 0 ? (
                <em className="opportunities-tab-badge" aria-label={`${newInvitesCount} new invites`}>
                  {newInvitesCount}
                </em>
              ) : null}
            </button>
          ))}
        </nav>
      </section>
    </div>
  )
}

export default OpportunitiesHeader
