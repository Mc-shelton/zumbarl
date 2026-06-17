import {
  FiBriefcase,
  FiCalendar,
  FiChevronDown,
  FiClock,
  FiDollarSign,
  FiEye,
  FiFileText,
  FiCheck,
  FiInfo,
  FiRadio,
  FiSave,
  FiSend,
  FiTarget,
  FiUsers,
} from 'react-icons/fi'
import { BUSINESS_CREATE_SETTINGS, BUSINESS_CREATE_STEPS } from '../opportunityCreateData'

const SETTING_ICONS = {
  calendar: FiCalendar,
  eye: FiEye,
  users: FiUsers,
}

export function BusinessOpportunityCreateRail({
  activeStep,
  onPublish,
  onSaveDraft,
  summary,
}) {
  const showAudienceReach = activeStep === 2
  const showFinalReview = activeStep >= BUSINESS_CREATE_STEPS.length
  const showProgress = activeStep >= 3

  return (
    <aside className="campus-rail business-workspace-rail business-create-rail">
      <section className="business-profile-card business-create-summary-card">
        <h2>Campaign Summary</h2>
        <p>This is how your campaign will appear to students.</p>
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
          <div><dt><FiFileText aria-hidden="true" /> Deliverables</dt><dd>{summary.deliverables}</dd></div>
          <div><dt><FiUsers aria-hidden="true" /> Applicants</dt><dd>{summary.applicants}</dd></div>
        </dl>
      </section>

      {showAudienceReach ? (
        <section className="business-profile-card business-create-audience-card">
          <h2>Estimated Audience Reach</h2>
          <p>Based on your targeting criteria</p>
          <div>
            <strong>{summary.reach}</strong>
            <span>Students</span>
            <i aria-hidden="true"><FiUsers /></i>
          </div>
          <dl>
            <div><dt>Location</dt><dd>{summary.targeting.locations}</dd></div>
            <div><dt>Universities</dt><dd>{summary.targeting.universities}</dd></div>
            <div><dt>Age Range</dt><dd>{summary.targeting.ageRange}</dd></div>
            <div><dt>Gender</dt><dd>{summary.targeting.gender}</dd></div>
            <div><dt>Interest Areas</dt><dd>{summary.targeting.interests}</dd></div>
            <div><dt>Platforms</dt><dd>{summary.targeting.platforms}</dd></div>
          </dl>
          <p>
            <FiTarget aria-hidden="true" />
            More specific targeting improves match quality.
          </p>
        </section>
      ) : null}

      {showFinalReview ? (
        <section className="business-profile-card business-create-checklist-card">
          <h2>Review Checklist</h2>
          <div>
            {BUSINESS_CREATE_STEPS.map((step) => (
              <article key={step.id} className={step.id === 'review' ? 'is-active' : ''}>
                <span>{step.id === 'review' ? BUSINESS_CREATE_STEPS.length : <FiCheck aria-hidden="true" />}</span>
                <strong>{step.label}</strong>
                <em>{step.id === 'review' ? 'Ready to launch' : 'Looks good'}</em>
              </article>
            ))}
          </div>
        </section>
      ) : showProgress ? (
        <section className="business-profile-card business-create-progress-card">
          <h2>Your Progress</h2>
          <p>You&apos;re doing great.</p>
          <div>
            {BUSINESS_CREATE_STEPS.map((step, index) => {
              const stepNumber = index + 1
              const isDone = stepNumber < activeStep
              const isActive = stepNumber === activeStep

              return (
                <article key={step.id} className={isDone ? 'is-done' : isActive ? 'is-active' : ''}>
                  <span>{isDone ? '✓' : stepNumber}</span>
                  <strong>{step.label}</strong>
                  <em>{isDone ? 'Completed' : isActive ? 'In progress' : 'Upcoming'}</em>
                </article>
              )
            })}
          </div>
        </section>
      ) : null}

      {showFinalReview ? (
        <section className="business-profile-card business-create-launch-card">
          <h2>Ready to go live?</h2>
          <p>Once published, your campaign will be visible to matched student creators.</p>
          <button type="button" className="business-profile-primary-btn" onClick={onPublish}>
            Publish Campaign
            <FiSend aria-hidden="true" />
          </button>
          <button type="button" className="business-profile-ghost-btn" onClick={onSaveDraft}>
            Save as Draft
          </button>
        </section>
      ) : (
      <section className="business-profile-card business-create-settings-card">
        <h2>Posting Settings</h2>
        <div>
          {BUSINESS_CREATE_SETTINGS.map((setting) => {
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
          Once published, you can start receiving creator applications immediately.
        </p>
        <footer>
          <button type="button" className="business-profile-ghost-btn" onClick={onSaveDraft}>
            <FiSave aria-hidden="true" />
            Save as Draft
          </button>
          <button type="button" className="business-profile-primary-btn" onClick={onPublish}>
            <FiSend aria-hidden="true" />
            Publish Campaign
          </button>
        </footer>
      </section>
      )}
    </aside>
  )
}
