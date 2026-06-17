import { FiCheckCircle, FiInfo } from 'react-icons/fi'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'
import { messages, project } from '../data/mockWorkspace'

function OverviewPanel() {
  const canOpenMessages = hasAccess(ACCESS_KEYS.projects.messages)

  return (
    <>
      <section className="project-card project-overview-card">
        <div>
          <h2>Project Overview</h2>
          <p>{project.overview}</p>
          <div className="project-detail-list">
            {project.details.map((detail) => (
              <article key={detail.label}>
                <FiCheckCircle aria-hidden="true" />
                <div>
                  <span>{detail.label}</span>
                  <strong>{detail.value}</strong>
                </div>
              </article>
            ))}
          </div>
        </div>
        <dl>
          <div>
            <dt>Category</dt>
            <dd>{project.category}</dd>
          </div>
          <div>
            <dt>Skills</dt>
            <dd>{project.skills}</dd>
          </div>
          <div>
            <dt>Client</dt>
            <dd className="has-profile">
              <img src="/assets/index/bee_nobg.png" alt="" />
              {project.client}
              <button type="button">View Profile</button>
            </dd>
          </div>
          <div>
            <dt>Project Owner</dt>
            <dd className="has-profile">
              <img src="/assets/index/bee_nobg.png" alt="" />
              {project.owner}
              {canOpenMessages ? <button type="button">Message</button> : null}
            </dd>
          </div>
        </dl>
      </section>

      <section className="project-card project-details-card">
        <h2>Project Details</h2>
        <dl>
          <div>
            <dt>Start Date</dt>
            <dd>Apr 28, 2024</dd>
          </div>
          <div>
            <dt>Payment Terms</dt>
            <dd>One-time payment upon completion</dd>
          </div>
          <div>
            <dt>Deadline</dt>
            <dd>{project.deadline}</dd>
          </div>
          <div>
            <dt>Revision Policy</dt>
            <dd>2 rounds of revisions included</dd>
          </div>
          <div>
            <dt>Budget</dt>
            <dd>{project.budget}</dd>
          </div>
          <div>
            <dt>Approval Required</dt>
            <dd>Yes, before final delivery</dd>
          </div>
        </dl>
        <p className="project-info-strip">
          <FiInfo aria-hidden="true" />
          <span>
            <strong>This project does not use milestones.</strong>
            You'll submit the final work when completed for review and payment.
          </span>
        </p>
      </section>

      {canOpenMessages ? (
        <section className="project-card project-recent-messages">
          <header>
            <h2>Recent Messages</h2>
            <button type="button">View All Messages</button>
          </header>
          {messages.slice(0, 2).map((message) => (
            <article key={`${message.author}-${message.date}`}>
              <img src="/assets/index/bee_nobg.png" alt="" />
              <div>
                <strong>{message.author}</strong>
                <p>{message.text}</p>
              </div>
              <span>{message.date}</span>
            </article>
          ))}
        </section>
      ) : null}
    </>
  )
}

export default OverviewPanel
