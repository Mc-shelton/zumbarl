import {
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiChevronDown,
  FiClock,
  FiDollarSign,
  FiEye,
  FiInfo,
  FiList,
  FiRadio,
  FiSave,
  FiSend,
  FiUsers,
} from 'react-icons/fi'
import { BUSINESS_OPPORTUNITY_BRIEF_SETTINGS } from '../opportunityBriefCreateData'

const SETTING_ICONS = {
  calendar: FiCalendar,
  eye: FiEye,
  users: FiUsers,
}

export function BusinessOpportunityBriefRail({
  clarityChecks = [],
  clarityScore = 0,
  isPublishReady = false,
  onPublish,
  onSaveDraft,
  summary,
}) {
  return (
    <aside className="campus-rail business-workspace-rail business-create-rail">
      <section className="business-profile-card business-create-summary-card">
        <h2>Opportunity Summary</h2>
        <p>This is how your opportunity will appear to students.</p>
        <article>
          <span aria-hidden="true"><FiRadio /></span>
          <div>
            <h3>{summary.title}</h3>
            <p>{summary.company}</p>
            <em>{summary.type}</em>
          </div>
        </article>
        <p className="business-create-summary-copy">{summary.summary}</p>
        <dl>
          <div><dt><FiDollarSign aria-hidden="true" /> Budget</dt><dd>{summary.budget}</dd></div>
          <div><dt><FiClock aria-hidden="true" /> Duration</dt><dd>{summary.duration}</dd></div>
          <div><dt><FiBriefcase aria-hidden="true" /> Engagement</dt><dd>{summary.engagement}</dd></div>
          <div><dt><FiCalendar aria-hidden="true" /> Deadline</dt><dd>{summary.deadline}</dd></div>
          <div><dt><FiUsers aria-hidden="true" /> Applicants</dt><dd>{summary.applicants}</dd></div>
        </dl>
      </section>

      <section className="business-profile-card business-create-clarity-card">
        <h2>Brief Clarity</h2>
        <p>{summary.readiness}</p>
        <div className="business-create-clarity-meter" aria-label={`${clarityScore}% complete`}>
          <span style={{ width: `${clarityScore}%` }} />
        </div>
        <ul>
          {clarityChecks.map((check) => (
            <li key={check.id} className={check.complete ? 'is-complete' : 'is-missing'}>
              {check.complete ? <FiCheckCircle aria-hidden="true" /> : <FiList aria-hidden="true" />}
              <span>{check.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="business-profile-card business-create-settings-card">
        <h2>Posting Settings</h2>
        <div>
          {BUSINESS_OPPORTUNITY_BRIEF_SETTINGS.map((setting) => {
            const Icon = SETTING_ICONS[setting.icon] || FiInfo

            return (
              <button type="button" key={setting.label}>
                <Icon aria-hidden="true" />
                <span><strong>{setting.label}</strong>{setting.value}</span>
                <FiChevronDown aria-hidden="true" />
              </button>
            )
          })}
        </div>
        <p>
          <FiInfo aria-hidden="true" />
          Once published, you can start receiving applications immediately.
        </p>
        <footer>
          <button type="button" className="business-profile-ghost-btn" onClick={onSaveDraft}>
            <FiSave aria-hidden="true" />
            Save as Draft
          </button>
          <button
            type="button"
            className="business-profile-primary-btn"
            disabled={!isPublishReady}
            onClick={onPublish}
          >
            <FiSend aria-hidden="true" />
            Publish Opportunity
          </button>
        </footer>
      </section>
    </aside>
  )
}
