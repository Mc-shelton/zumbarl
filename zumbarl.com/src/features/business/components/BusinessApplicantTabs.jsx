import { BUSINESS_APPLICANT_TABS } from '../applicantProfileData'

export function BusinessApplicantTabs({ activeTab, onTabChange }) {
  return (
    <nav className="business-profile-tabs" aria-label="Profile tabs" role="tablist">
      {BUSINESS_APPLICANT_TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          className={`business-profile-tab${activeTab === tab ? ' is-active' : ''}`}
          aria-selected={activeTab === tab}
          role="tab"
          onClick={() => onTabChange(tab)}
        >
          {tab}
        </button>
      ))}
    </nav>
  )
}
