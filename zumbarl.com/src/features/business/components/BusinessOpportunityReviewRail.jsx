import {
  FiCheckCircle,
  FiCircle,
  FiFileText,
  FiHeadphones,
  FiInfo,
  FiUsers,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'

function getApplicationSummary(applications) {
  const summary = applications.reduce((counts, application) => {
    const status = String(application.status || 'submitted').toLowerCase()
    let key = 'new'
    if (['shortlisted', 'interview_scheduled'].includes(status)) key = 'shortlisted'
    if (['accepted', 'awarded'].includes(status)) key = 'accepted'
    if (['rejected', 'removed'].includes(status)) key = 'rejected'

    return {
      ...counts,
      [key]: counts[key] + 1,
    }
  }, { new: 0, shortlisted: 0, accepted: 0, rejected: 0 })
  const totalBidAmount = applications.reduce((total, application) => total + Number(application.bidAmount || 0), 0)

  return {
    ...summary,
    total: applications.length,
    averageBid: applications.length ? Math.round(totalBidAmount / applications.length) : 0,
    committedAmount: applications
      .filter((application) => ['accepted', 'awarded'].includes(String(application.status || '').toLowerCase()))
      .reduce((total, application) => total + Number(application.bidAmount || 0), 0),
    withAttachments: applications.filter((application) => Array.isArray(application.attachments) && application.attachments.length).length,
  }
}

function formatTimelineDate(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getOpportunityTimeline(opportunity, summary) {
  const isCompleted = String(opportunity.status || '').toLowerCase() === 'completed'
  const hasAward = summary.accepted > 0

  return [
    { label: 'Published', date: formatTimelineDate(opportunity.publishedAt) || 'Not published', done: Boolean(opportunity.publishedAt) },
    { label: 'Application Deadline', date: formatTimelineDate(opportunity.deadline) || 'Rolling', done: summary.total > 0 },
    { label: 'Work in Progress', date: hasAward ? 'Underway' : '-', done: hasAward },
    { label: 'Review Work', date: '-', done: false },
    { label: 'Completed', date: formatTimelineDate(opportunity.completedAt) || '-', done: isCompleted },
  ]
}

function ApplicationSummaryCard({ applications }) {
  const summary = getApplicationSummary(applications)

  return (
    <section className="business-profile-card business-review-summary-card">
      <header>
        <h2>Application Summary</h2>
      </header>
      <dl>
        <div><dt>Total Applications</dt><dd>{summary.total}</dd></div>
        <div><dt>New</dt><dd>{summary.new}</dd></div>
        <div><dt>Shortlisted</dt><dd>{summary.shortlisted}</dd></div>
        <div><dt>Accepted</dt><dd>{summary.accepted}</dd></div>
        <div><dt>Rejected</dt><dd>{summary.rejected}</dd></div>
      </dl>
      <hr />
      <dl>
        <div><dt>Average Bid</dt><dd>KES {summary.averageBid.toLocaleString()}</dd></div>
        <div><dt>With Attachments</dt><dd>{summary.withAttachments}</dd></div>
      </dl>
    </section>
  )
}

function TipCard({ children }) {
  return (
    <section className="business-profile-card business-review-tip-card">
      <FiInfo aria-hidden="true" />
      <div>
        <h2>Tips</h2>
        <p>{children}</p>
        <Link to="/help">View Best Practices →</Link>
      </div>
    </section>
  )
}

function HelpCard({ title, detail }) {
  return (
    <section className="business-profile-card business-review-help-card">
      <h2>{title}</h2>
      <p>{detail}</p>
      <Link to="/help"><FiHeadphones aria-hidden="true" /> Get Support</Link>
    </section>
  )
}

function ApplicationsRail({ activeApplicationStatus, applications, onChangeApplicationStatus = () => {} }) {
  const summary = getApplicationSummary(applications)

  if (activeApplicationStatus === 'shortlisted') {
    return (
      <>
        <ApplicationSummaryCard applications={applications} />

        <section className="business-profile-card business-review-shortlisted-insights-card">
          <h2>Shortlisted Insights</h2>
          <p><FiCheckCircle aria-hidden="true" /> You have {summary.shortlisted} applicant{summary.shortlisted === 1 ? '' : 's'} shortlisted.</p>
          <div>
            <article><span>Average Bid</span><strong>KES {summary.averageBid.toLocaleString()}</strong></article>
            <article><span>Attachments</span><strong>{summary.withAttachments}</strong></article>
          </div>
        </section>

        <section className="business-profile-card business-review-quick-actions-card">
          <h2>Next Steps</h2>
          <button type="button" onClick={() => onChangeApplicationStatus('shortlisted')}>
            <FiFileText aria-hidden="true" />
            <span><strong>Start interviews</strong><em>Connect with shortlisted creators</em></span>
          </button>
          <button type="button" onClick={() => onChangeApplicationStatus('accepted')}>
            <FiCheckCircle aria-hidden="true" />
            <span><strong>View accepted</strong><em>Creators you have accepted so far</em></span>
          </button>
        </section>

        <HelpCard title="Need help scheduling interviews?" detail="Visit our Help Center for best practices." />
      </>
    )
  }

  return (
    <>
      <ApplicationSummaryCard applications={applications} />

      <section className="business-profile-card business-review-quick-actions-card">
        <h2>Quick Actions</h2>
        <button type="button" onClick={() => onChangeApplicationStatus('all')}>
          <FiUsers aria-hidden="true" />
          <span><strong>View all applicants</strong><em>Every bid submitted for this brief</em></span>
        </button>
        <button type="button" onClick={() => onChangeApplicationStatus('shortlisted')}>
          <FiFileText aria-hidden="true" />
          <span><strong>Review shortlist</strong><em>Applicants you have shortlisted</em></span>
        </button>
      </section>

      <TipCard>Review applications carefully and shortlist creators who best match your campaign goals.</TipCard>

      <HelpCard title="Need help reviewing?" detail="Our team is here to help you find the perfect creators." />
    </>
  )
}

function getReviewScopeCount(opportunity) {
  const milestoneScopes = Array.isArray(opportunity?.milestoneScopes) ? opportunity.milestoneScopes : []
  const deliverableMilestones = Array.isArray(opportunity?.deliverableMilestones) ? opportunity.deliverableMilestones : []
  return opportunity?.scopeMode === 'milestone' && milestoneScopes.length ? milestoneScopes.length : deliverableMilestones.length
}

function DeliverablesRail({ applications, opportunity }) {
  const summary = getApplicationSummary(applications)

  return (
    <>
      <section className="business-profile-card business-review-summary-card">
        <header>
          <h2>Deliverable Summary</h2>
        </header>
        <dl>
          <div><dt>Total Deliverables</dt><dd>{getReviewScopeCount(opportunity)}</dd></div>
          <div><dt>Submitted Work</dt><dd>0</dd></div>
          <div><dt>Creators Active</dt><dd>{summary.accepted}</dd></div>
        </dl>
      </section>

      <TipCard>Clear deliverable instructions and examples lead to higher quality submissions.</TipCard>

      <HelpCard title="Need help with delivery?" detail="Our team can help clarify requirements and keep submissions moving." />
    </>
  )
}

function PaymentsRail({ applications, opportunity }) {
  const summary = getApplicationSummary(applications)
  const budgetAmount = Number(opportunity.budgetAmount)
    || Number(String(opportunity.budget || '').replace(/[^\d.]/g, ''))
    || 0
  const committedPercent = budgetAmount ? Math.min(100, Math.round((summary.committedAmount / budgetAmount) * 100)) : 0
  const isFunded = String(opportunity.escrowStatus || 'unfunded') !== 'unfunded'

  return (
    <>
      <ApplicationSummaryCard applications={applications} />

      <section className="business-profile-card business-review-payment-overview-card">
        <header>
          <h2>Payment Overview</h2>
        </header>
        <div>
          <figure>
            <span>{opportunity.budget || `KES ${budgetAmount.toLocaleString()}`}<em>Total Budget</em></span>
          </figure>
          <dl>
            <div><dt><span className="tone-green" />Escrow</dt><dd>{isFunded ? 'Funded' : 'Not funded'}</dd></div>
            <div><dt><span className="tone-orange" />Committed</dt><dd>KES {summary.committedAmount.toLocaleString()} ({committedPercent}%)</dd></div>
            <div><dt><span className="tone-blue" />Available</dt><dd>KES {Math.max(0, budgetAmount - summary.committedAmount).toLocaleString()}</dd></div>
          </dl>
        </div>
      </section>

      <HelpCard title="Need help with payments?" detail="Visit our Help Center for guides and support." />
    </>
  )
}

export function BusinessOpportunityReviewRail({
  activeApplicationStatus,
  activeReviewTab,
  applications = [],
  onChangeApplicationStatus,
  opportunity,
}) {
  if (!opportunity) return null
  const applicationSummary = getApplicationSummary(applications)
  const timeline = getOpportunityTimeline(opportunity, applicationSummary)
  const budgetAmount = Number(opportunity.budgetAmount)
    || Number(String(opportunity.budget || '').replace(/[^\d.]/g, ''))
    || 0
  const committedPercent = budgetAmount
    ? Math.min(100, Math.round((applicationSummary.committedAmount / budgetAmount) * 100))
    : 0

  return (
    <aside className="campus-rail business-workspace-rail business-opportunity-review-rail">
      {activeReviewTab === 'applications' ? (
        <ApplicationsRail
          activeApplicationStatus={activeApplicationStatus}
          applications={applications}
          onChangeApplicationStatus={onChangeApplicationStatus}
        />
      ) : activeReviewTab === 'deliverables' ? (
        <DeliverablesRail applications={applications} opportunity={opportunity} />
      ) : activeReviewTab === 'payments' || activeReviewTab === 'performance' ? (
        <PaymentsRail applications={applications} opportunity={opportunity} />
      ) : (
        <>
          <section className="business-profile-card business-review-summary-card">
            <header>
              <h2>Opportunity Summary</h2>
            </header>
            <dl>
              <div><dt>Opportunity ID</dt><dd>{String(opportunity.backendId || opportunity.id || '').slice(-8).toUpperCase() || '—'}</dd></div>
              <div><dt>Total Budget</dt><dd>{opportunity.budget}</dd></div>
              <div><dt>Committed</dt><dd>KES {applicationSummary.committedAmount.toLocaleString()} ({committedPercent}%)</dd></div>
            </dl>
            <div className="business-review-spend-bar"><span style={{ width: `${committedPercent}%` }} /></div>
            <dl>
              <div><dt>Applications</dt><dd>{applicationSummary.total}</dd></div>
              <div><dt>Shortlisted</dt><dd>{applicationSummary.shortlisted}</dd></div>
              <div><dt>Accepted</dt><dd>{applicationSummary.accepted}</dd></div>
              <div><dt>Completed</dt><dd>{opportunity.status === 'Completed' ? 1 : 0}</dd></div>
            </dl>
          </section>

          <section className="business-profile-card business-review-timeline-card">
            <header>
              <h2>Timeline</h2>
            </header>
            <ol>
              {timeline.map((item) => (
                <li key={item.label} className={item.done ? 'is-done' : ''}>
                  {item.done ? <FiCheckCircle aria-hidden="true" /> : <FiCircle aria-hidden="true" />}
                  <span>{item.label}</span>
                  <time>{item.date}</time>
                </li>
              ))}
            </ol>
          </section>

          <section className="business-profile-card business-review-team-card">
            <header>
              <h2>Posted By</h2>
            </header>
            <ul>
              <li>
                <span className="tone-orange">
                  {String(opportunity.company || 'ZB').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <strong>{opportunity.company || 'Business account'}</strong>
                  <p>Opportunity owner</p>
                </div>
              </li>
            </ul>
          </section>
        </>
      )}
    </aside>
  )
}
