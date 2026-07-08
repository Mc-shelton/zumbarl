import {
  FiAlertTriangle,
  FiBarChart2,
  FiCheckCircle,
  FiCircle,
  FiCreditCard,
  FiDownload,
  FiEdit3,
  FiFileText,
  FiHeadphones,
  FiInfo,
  FiMessageSquare,
  FiSend,
  FiShield,
  FiUpload,
  FiUsers,
} from 'react-icons/fi'

const TEAM_MEMBERS = [
  { name: 'Brian Mwangi', role: 'Owner', tone: 'orange' },
  { name: 'Jane Wanjiku', role: 'Manager', tone: 'purple' },
  { name: 'Samuel Otieno', role: 'Reviewer', tone: 'green' },
]

const TIMELINE = [
  { label: 'Published', date: 'May 12, 2025', done: true },
  { label: 'Application Deadline', date: 'May 27, 2025', done: true },
  { label: 'Work in Progress', date: 'May 28, 2025' },
  { label: 'Review Work', date: 'Jun 5, 2025' },
  { label: 'Completed', date: '-' },
]

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
    withAttachments: applications.filter((application) => Array.isArray(application.attachments) && application.attachments.length).length,
  }
}

function ApplicationSummaryCard({ applications, withEditIcon = false }) {
  const summary = getApplicationSummary(applications)

  return (
    <section className="business-profile-card business-review-summary-card">
      <header>
        <h2>Application Summary</h2>
        <button type="button">{withEditIcon ? <FiEdit3 aria-hidden="true" /> : null} Edit</button>
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

function ApplicationsRail({ activeApplicationStatus, applications }) {
  const summary = getApplicationSummary(applications)

  if (activeApplicationStatus === 'shortlisted') {
    return (
      <>
        <ApplicationSummaryCard applications={applications} />

        <section className="business-profile-card business-review-shortlisted-insights-card">
          <h2>Shortlisted Insights</h2>
          <p><FiCheckCircle aria-hidden="true" /> You have {summary.shortlisted} applicants shortlisted.</p>
          <div>
            <article><span>Average Bid</span><strong>KES {summary.averageBid.toLocaleString()}</strong></article>
            <article><span>Attachments</span><strong>{summary.withAttachments}</strong></article>
          </div>
        </section>

        <section className="business-profile-card business-review-quick-actions-card">
          <h2>Next Steps</h2>
          <button type="button"><FiFileText aria-hidden="true" /><span><strong>Start interviews</strong><em>Connect with shortlisted creators</em></span></button>
          <button type="button"><FiUsers aria-hidden="true" /><span><strong>Compare creators</strong><em>Review profiles and performance</em></span></button>
          <button type="button"><FiCheckCircle aria-hidden="true" /><span><strong>Move to accepted</strong><em>Select the best fit for your campaign</em></span></button>
        </section>

        <section className="business-profile-card business-review-help-card">
          <h2>Need help scheduling interviews?</h2>
          <p>Visit our Help Center for best practices.</p>
          <button type="button"><FiHeadphones aria-hidden="true" /> View Help Center</button>
        </section>
      </>
    )
  }

  return (
    <>
      <ApplicationSummaryCard applications={applications} withEditIcon />

      <section className="business-profile-card business-review-quick-actions-card">
        <h2>Quick Actions</h2>
        <button type="button"><FiDownload aria-hidden="true" /><span><strong>Download Applications</strong><em>Export all applications as CSV</em></span></button>
        <button type="button"><FiSend aria-hidden="true" /><span><strong>Message New Applicants</strong><em>Send a message to new creators</em></span></button>
        <button type="button"><FiEdit3 aria-hidden="true" /><span><strong>Update Application</strong><em>Edit application form or requirements</em></span></button>
      </section>

      <section className="business-profile-card business-review-tip-card">
        <FiInfo aria-hidden="true" />
        <div>
          <h2>Tips</h2>
          <p>Review applications carefully and shortlist creators who best match your campaign goals.</p>
          <button type="button">View Best Practices →</button>
        </div>
      </section>

      <section className="business-profile-card business-review-help-card">
        <h2>Need help reviewing?</h2>
        <p>Our team is here to help you find the perfect creators.</p>
        <button type="button"><FiHeadphones aria-hidden="true" /> Get Support</button>
      </section>
    </>
  )
}

function getReviewScopeCount(opportunity) {
  const milestoneScopes = Array.isArray(opportunity?.milestoneScopes) ? opportunity.milestoneScopes : []
  const deliverableMilestones = Array.isArray(opportunity?.deliverableMilestones) ? opportunity.deliverableMilestones : []
  return opportunity?.scopeMode === 'milestone' && milestoneScopes.length ? milestoneScopes.length : deliverableMilestones.length
}

function DeliverablesRail({ opportunity }) {
  const scopeCount = getReviewScopeCount(opportunity)
  const totalDeliverables = scopeCount || 6

  return (
    <>
      <section className="business-profile-card business-review-summary-card">
        <header>
          <h2>Deliverable Summary</h2>
          <button type="button"><FiEdit3 aria-hidden="true" /> Edit</button>
        </header>
        <dl>
          <div><dt>Total Deliverables</dt><dd>{totalDeliverables}</dd></div>
          <div><dt>Submitted Work</dt><dd>7</dd></div>
          <div><dt>Files</dt><dd>12</dd></div>
          <div><dt>Overdue</dt><dd>1</dd></div>
        </dl>
        <hr />
        <dl>
          <div><dt>Completion Rate</dt><dd>39%</dd></div>
          <div><dt>Creators Active</dt><dd>18</dd></div>
        </dl>
      </section>

      <section className="business-profile-card business-review-quick-actions-card">
        <h2>Quick Actions</h2>
        <button type="button"><FiFileText aria-hidden="true" /><span><strong>Review Submitted Work</strong><em>Review and provide feedback on creator submissions</em></span></button>
        <button type="button"><FiUpload aria-hidden="true" /><span><strong>Upload Files</strong><em>Upload brief, assets or reference files for creators</em></span></button>
        <button type="button"><FiEdit3 aria-hidden="true" /><span><strong>Update Requirements</strong><em>Edit deliverable requirements or due dates</em></span></button>
      </section>

      <section className="business-profile-card business-review-tip-card">
        <FiAlertTriangle aria-hidden="true" />
        <div>
          <h2>Tips</h2>
          <p>Clear deliverable instructions and examples lead to higher quality submissions.</p>
          <button type="button">View Best Practices →</button>
        </div>
      </section>

      <section className="business-profile-card business-review-help-card">
        <h2>Need help with delivery?</h2>
        <p>Our team can help clarify requirements and keep submissions moving.</p>
        <button type="button"><FiHeadphones aria-hidden="true" /> Get Support</button>
      </section>
    </>
  )
}

function PaymentsRail() {
  return (
    <>
      <section className="business-profile-card business-review-summary-card">
        <header>
          <h2>Application Summary</h2>
          <button type="button">Edit</button>
        </header>
        <dl>
          <div><dt>Total Applications</dt><dd>18</dd></div>
          <div><dt>New</dt><dd>5</dd></div>
          <div><dt>Shortlisted</dt><dd>6</dd></div>
          <div><dt>Accepted</dt><dd>3</dd></div>
          <div><dt>Rejected</dt><dd>4</dd></div>
        </dl>
        <hr />
        <dl>
          <div><dt>Avg. Engagement Rate</dt><dd>5.6%</dd></div>
          <div><dt>Total Reach</dt><dd>124.3K</dd></div>
        </dl>
      </section>

      <section className="business-profile-card business-review-payment-overview-card">
        <header>
          <h2>Payment Overview</h2>
          <button type="button">View Report</button>
        </header>
        <div>
          <figure>
            <span>KES 25,000<em>Total Budget</em></span>
          </figure>
          <dl>
            <div><dt><span className="tone-green" />Paid</dt><dd>KES 12,400 (50%)</dd></div>
            <div><dt><span className="tone-orange" />Partially Paid</dt><dd>KES 1,250 (5%)</dd></div>
            <div><dt><span className="tone-blue" />Pending</dt><dd>KES 7,600 (30.4%)</dd></div>
            <div><dt><span className="tone-gray" />Available</dt><dd>KES 5,000 (19.6%)</dd></div>
          </dl>
        </div>
      </section>

      <section className="business-profile-card business-review-quick-actions-card">
        <h2>Quick Actions</h2>
        <button type="button"><FiCreditCard aria-hidden="true" /><span><strong>Make Bulk Payment</strong><em>Pay multiple creators at once</em></span></button>
        <button type="button"><FiDownload aria-hidden="true" /><span><strong>Export Payment Report</strong><em>Download all payment data as CSV</em></span></button>
        <button type="button"><FiFileText aria-hidden="true" /><span><strong>Download Invoices</strong><em>Download all creator invoices</em></span></button>
      </section>

      <section className="business-profile-card business-review-help-card">
        <h2>Need help with payments?</h2>
        <p>Visit our Help Center for guides and support.</p>
        <button type="button"><FiHeadphones aria-hidden="true" /> Get Support</button>
      </section>
    </>
  )
}

function PerformanceRail() {
  return (
    <>
      <section className="business-profile-card business-review-summary-card">
        <header>
          <h2>Application Summary</h2>
          <button type="button">Edit</button>
        </header>
        <dl>
          <div><dt>Total Applications</dt><dd>18</dd></div>
          <div><dt>New</dt><dd>5</dd></div>
          <div><dt>Shortlisted</dt><dd>6</dd></div>
          <div><dt>Accepted</dt><dd>3</dd></div>
          <div><dt>Rejected</dt><dd>4</dd></div>
        </dl>
        <hr />
        <dl>
          <div><dt>Avg. Engagement Rate</dt><dd>5.6%</dd></div>
          <div><dt>Total Reach</dt><dd>124.3K</dd></div>
        </dl>
      </section>

      <section className="business-profile-card business-review-performance-breakdown-card">
        <h2>Performance Breakdown</h2>
        <div>
          <figure>
            <span>124.3K<em>Total Reach</em></span>
          </figure>
          <dl>
            <div><dt><span className="tone-green" />Instagram</dt><dd>52.1% <strong>64.7K</strong></dd></div>
            <div><dt><span className="tone-dark" />TikTok</dt><dd>28.4% <strong>35.2K</strong></dd></div>
            <div><dt><span className="tone-red" />YouTube</dt><dd>15.3% <strong>19.0K</strong></dd></div>
            <div><dt><span className="tone-gray" />Other</dt><dd>4.2% <strong>5.4K</strong></dd></div>
          </dl>
        </div>
      </section>

      <section className="business-profile-card business-review-quick-actions-card">
        <h2>Quick Actions</h2>
        <button type="button"><FiBarChart2 aria-hidden="true" /><span><strong>View Detailed Analytics</strong><em>Dive deeper into performance metrics</em></span></button>
        <button type="button"><FiDownload aria-hidden="true" /><span><strong>Export Performance Report</strong><em>Download report as PDF or CSV</em></span></button>
        <button type="button"><FiUsers aria-hidden="true" /><span><strong>Compare Creators</strong><em>Compare creator performance</em></span></button>
        <button type="button"><FiShield aria-hidden="true" /><span><strong>View Audience Insights</strong><em>Understand your audience better</em></span></button>
      </section>

      <section className="business-profile-card business-review-tip-card">
        <FiInfo aria-hidden="true" />
        <div>
          <h2>Tips</h2>
          <p>Monitor performance regularly and optimize content to improve engagement.</p>
          <button type="button">View Best Practices →</button>
        </div>
      </section>
    </>
  )
}

function ActivityRail() {
  return (
    <>
      <section className="business-profile-card business-review-summary-card">
        <header>
          <h2>Application Summary</h2>
          <button type="button">Edit</button>
        </header>
        <dl>
          <div><dt>Total Applications</dt><dd>18</dd></div>
          <div><dt>New</dt><dd>5</dd></div>
          <div><dt>Shortlisted</dt><dd>6</dd></div>
          <div><dt>Accepted</dt><dd>3</dd></div>
          <div><dt>Rejected</dt><dd>4</dd></div>
        </dl>
        <hr />
        <dl>
          <div><dt>Avg. Engagement Rate</dt><dd>5.6%</dd></div>
          <div><dt>Total Reach</dt><dd>124.3K</dd></div>
        </dl>
      </section>

      <section className="business-profile-card business-review-recent-activity-card">
        <h2>Recent Activity</h2>
        <ul>
          <li>
            <span className="tone-green"><FiCheckCircle aria-hidden="true" /></span>
            <p><strong>Payment made to Kevin The Creator</strong><em>2 hours ago</em></p>
          </li>
          <li>
            <span className="tone-purple"><FiUpload aria-hidden="true" /></span>
            <p><strong>Work submitted by Kevin The Creator</strong><em>3 hours ago</em></p>
          </li>
          <li>
            <span className="tone-pink"><FiMessageSquare aria-hidden="true" /></span>
            <p><strong>Status updated for Campus Talks KE</strong><em>Yesterday, 4:20 PM</em></p>
          </li>
        </ul>
        <button type="button">View all activity</button>
      </section>

      <section className="business-profile-card business-review-tip-card">
        <FiInfo aria-hidden="true" />
        <div>
          <h2>Tips</h2>
          <p>Use the activity timeline to stay updated on all important actions and never miss a thing.</p>
          <button type="button">View Best Practices →</button>
        </div>
      </section>
    </>
  )
}

export function BusinessOpportunityReviewRail({ activeApplicationStatus, activeReviewTab, applications = [], opportunity }) {
  if (!opportunity) return null
  const applicationSummary = getApplicationSummary(applications)

  return (
    <aside className="campus-rail business-workspace-rail business-opportunity-review-rail">
      {activeReviewTab === 'applications' ? (
        <ApplicationsRail activeApplicationStatus={activeApplicationStatus} applications={applications} />
      ) : activeReviewTab === 'deliverables' ? (
        <DeliverablesRail opportunity={opportunity} />
      ) : activeReviewTab === 'payments' ? (
        <PaymentsRail />
      ) : activeReviewTab === 'performance' ? (
        <PerformanceRail />
      ) : activeReviewTab === 'activity' ? (
        <ActivityRail />
      ) : (
        <>
      <section className="business-profile-card business-review-summary-card">
        <header>
          <h2>Opportunity Summary</h2>
          <button type="button"><FiEdit3 aria-hidden="true" /> Edit</button>
        </header>
        <dl>
          <div><dt>Campaign ID</dt><dd>CMP-2025-00012</dd></div>
          <div><dt>Total Budget</dt><dd>{opportunity.budget}</dd></div>
          <div><dt>Spent</dt><dd>KES 12,400 (50%)</dd></div>
        </dl>
        <div className="business-review-spend-bar"><span /></div>
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
          <button type="button"><FiEdit3 aria-hidden="true" /> Edit</button>
        </header>
        <ol>
          {TIMELINE.map((item) => (
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
          <h2>Team Members</h2>
          <button type="button"><FiEdit3 aria-hidden="true" /> Edit</button>
        </header>
        <ul>
          {TEAM_MEMBERS.map((member) => (
            <li key={member.name}>
              <span className={`tone-${member.tone}`}>{member.name.split(' ').map((part) => part[0]).join('')}</span>
              <div>
                <strong>{member.name}</strong>
                <p>{member.role}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
        </>
      )}
    </aside>
  )
}
