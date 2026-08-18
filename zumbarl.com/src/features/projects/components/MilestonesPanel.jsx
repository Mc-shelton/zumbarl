import { FiBriefcase, FiCalendar, FiCheck, FiFileText, FiUploadCloud } from 'react-icons/fi'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'
import { milestoneProject, milestoneItems } from '../data/mockWorkspace'

const MILESTONE_STATUS = {
  approved: { label: 'Approved', tone: 'complete' },
  active: { label: 'In Progress', tone: 'progress' },
  draft: { label: 'Pending', tone: 'pending' },
  unfunded: { label: 'Awaiting funding', tone: 'pending' },
}

function resolveMilestoneStatus(milestone) {
  const key = String(milestone.status || 'draft').toLowerCase()
  if (key === 'approved') return MILESTONE_STATUS.approved
  if (key === 'active') return MILESTONE_STATUS.active
  if (milestone.fundingStatus !== 'funded') return MILESTONE_STATUS.unfunded
  return MILESTONE_STATUS.draft
}

function resolveSubmissionLabel(milestone) {
  const deliverable = milestone.deliverable
  if (!deliverable) return null
  const status = String(deliverable.status || '').toLowerCase()
  if (status === 'approved') return 'Approved'
  if (status === 'changes_requested') return 'Changes requested'
  return 'Submitted — under review'
}

function RealMilestonesPanel({ project, onSubmitMilestone }) {
  const canSubmitWork = hasAccess(ACCESS_KEYS.projects.submitWork)
  const milestones = Array.isArray(project.milestones) ? project.milestones : []
  const approvedCount = milestones.filter((item) => String(item.status).toLowerCase() === 'approved').length
  const progressPercent = milestones.length ? Math.round((approvedCount / milestones.length) * 100) : 0

  return (
    <section className="project-milestones-panel" aria-label="Project milestones">
      <section className="project-milestones-summary" aria-label="Milestone summary">
        <article>
          <FiBriefcase aria-hidden="true" />
          <div>
            <span>Project</span>
            <strong>{project.title}</strong>
          </div>
        </article>
        <article>
          <FiFileText aria-hidden="true" />
          <div>
            <span>Client</span>
            <strong>{project.client}</strong>
          </div>
        </article>
        <article>
          <div>
            <span>Project Progress</span>
            <strong>{approvedCount} of {milestones.length} milestones approved</strong>
          </div>
          <em>
            <i style={{ width: `${progressPercent}%` }} />
          </em>
          <b>{progressPercent}%</b>
        </article>
        <article>
          <FiCalendar aria-hidden="true" />
          <div>
            <span>Deadline</span>
            <strong>{project.deadline}</strong>
          </div>
        </article>
      </section>

      {milestones.length ? (
        <div className="project-milestones-list">
          {milestones.map((milestone, index) => {
            const status = resolveMilestoneStatus(milestone)
            const submissionLabel = resolveSubmissionLabel(milestone)
            const isApproved = status.tone === 'complete'
            const canSubmit = Boolean(onSubmitMilestone)
              && canSubmitWork
              && String(milestone.status).toLowerCase() === 'active'
              && (!milestone.deliverable || ['submitted', 'changes_requested'].includes(String(milestone.deliverable.status).toLowerCase()))

            return (
              <article key={milestone.id} className={`project-milestone-item is-${status.tone}`}>
                <span className="project-milestone-index">{isApproved ? <FiCheck aria-hidden="true" /> : index + 1}</span>
                <div className="project-milestone-card">
                  <span className="project-milestone-icon">
                    <FiFileText aria-hidden="true" />
                  </span>
                  <div className="project-milestone-copy">
                    <h2>{milestone.title}</h2>
                    {milestone.acceptanceCriteria ? <p>{milestone.acceptanceCriteria}</p> : null}
                    {submissionLabel ? <strong>Submission: {submissionLabel}</strong> : null}
                  </div>
                  <div className="project-milestone-meta">
                    <strong>{milestone.budgetLabel}</strong>
                    <span>{status.label}</span>
                    {canSubmit ? (
                      <button type="button" className="project-soft-btn" onClick={() => onSubmitMilestone?.(milestone)}>
                        <FiUploadCloud aria-hidden="true" />
                        {milestone.deliverable ? 'Revise Work' : 'Submit'}
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <p className="project-milestones-count">No milestones have been set up for this project yet.</p>
      )}

      {milestones.length ? (
        <p className="project-milestones-count">Showing {milestones.length} milestone{milestones.length === 1 ? '' : 's'}</p>
      ) : null}
    </section>
  )
}

function MockMilestonesPanel() {
  return (
    <section className="project-milestones-panel" aria-label="Project milestones">
      <section className="project-milestones-summary" aria-label="Milestone summary">
        <article>
          <FiBriefcase aria-hidden="true" />
          <div>
            <span>Project</span>
            <strong>{milestoneProject.title}</strong>
          </div>
        </article>
        <article>
          <FiFileText aria-hidden="true" />
          <div>
            <span>Client</span>
            <strong>{milestoneProject.client}</strong>
          </div>
        </article>
        <article>
          <div>
            <span>Project Progress</span>
            <strong>3 of 5 milestones completed</strong>
          </div>
          <em>
            <i />
          </em>
          <b>60%</b>
        </article>
        <article>
          <FiCalendar aria-hidden="true" />
          <div>
            <span>Project Timeline</span>
            <strong>Apr 30, 2024 - Jun 15, 2024</strong>
          </div>
        </article>
      </section>

      <div className="project-milestones-list">
        {milestoneItems.map((item) => {
          const Icon = item.icon
          return (
            <article key={item.id} className={`project-milestone-item is-${item.tone}`}>
              <span className="project-milestone-index">{item.id}</span>
              <div className="project-milestone-card">
                <span className="project-milestone-icon">
                  <Icon aria-hidden="true" />
                </span>
                <div className="project-milestone-copy">
                  <h2>{item.title}</h2>
                  <p>{item.description}</p>
                  <strong>Deliverables: {item.deliverables}</strong>
                </div>
                <div className="project-milestone-meta">
                  <p>Due: {item.due}</p>
                  <strong>{item.amount}</strong>
                  <span>{item.status}</span>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      <p className="project-milestones-count">Showing 1 to 5 of 5 milestones</p>
    </section>
  )
}

function MilestonesPanel({ project, onSubmitMilestone }) {
  if (project?.source === 'database') {
    return <RealMilestonesPanel project={project} onSubmitMilestone={onSubmitMilestone} />
  }
  return <MockMilestonesPanel />
}

export default MilestonesPanel
