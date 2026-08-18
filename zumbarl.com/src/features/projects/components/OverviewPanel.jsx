import { FiCheckCircle, FiDownload, FiExternalLink, FiInfo } from 'react-icons/fi'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'
import { project as fallbackProject, messages as fallbackMessages } from '../data/mockWorkspace'
import ProjectDeliverablesStatus from './ProjectDeliverablesStatus'
import SubmittedWorkPreview from './SubmittedWorkPreview'

function OverviewPanel({ project, onOpenWorkDeliverables, onSubmitWork, onSelectPhase, onRespondToPriceProposal, priceProposalState }) {
  const canOpenMessages = hasAccess(ACCESS_KEYS.projects.messages)
  const activeProject = project || fallbackProject
  const isBackedProject = activeProject.source === 'database'
  const details = Array.isArray(activeProject.details) ? activeProject.details : []
  const scopeDeliverables = isBackedProject && Array.isArray(activeProject.scopeDeliverables)
    ? activeProject.scopeDeliverables
    : []
  const sampleWork = isBackedProject && Array.isArray(activeProject.sampleWork) ? activeProject.sampleWork : []
  const submittedWork = isBackedProject && Array.isArray(activeProject.deliverables) ? activeProject.deliverables : []
  const priceProposal = isBackedProject ? activeProject.priceProposal : null
  const isRespondingToProposal = priceProposalState?.isResponding
  const recentMessages = isBackedProject
    ? (Array.isArray(activeProject.messages) ? activeProject.messages : [])
    : fallbackMessages

  return (
    <>
      {priceProposal && priceProposal.status === 'pending' ? (
        <section className="project-card project-price-proposal-card">
          <div className="project-price-proposal-head">
            <h2>New price proposed</h2>
            <span className="project-price-proposal-amount">{priceProposal.amountLabel}</span>
          </div>
          <p>
            The business proposed a new agreed price of <strong>{priceProposal.amountLabel}</strong> for this project
            {priceProposal.previousAmountLabel ? <> (was {priceProposal.previousAmountLabel})</> : null}. Accepting updates your pay; declining keeps the current amount.
          </p>
          {priceProposalState?.error ? (
            <p className="project-price-proposal-error" role="alert">{priceProposalState.error}</p>
          ) : null}
          <div className="project-price-proposal-actions">
            <button
              type="button"
              className="project-soft-btn"
              disabled={isRespondingToProposal}
              onClick={() => onRespondToPriceProposal?.('rejected')}
            >
              Decline
            </button>
            <button
              type="button"
              className="project-primary-btn"
              disabled={isRespondingToProposal}
              onClick={() => onRespondToPriceProposal?.('accepted')}
            >
              {isRespondingToProposal ? 'Saving...' : 'Accept new price'}
            </button>
          </div>
        </section>
      ) : null}

      {priceProposalState?.notice && !priceProposal ? (
        <p className="team-invite-success" role="status">{priceProposalState.notice}</p>
      ) : null}

      <section className="project-card project-overview-card">
        <div>
          <h2>Project Overview</h2>
          <p>{activeProject.overview}</p>
          {details.length && !scopeDeliverables.length ? (
            <div className="project-detail-list">
              {details.map((detail) => (
                <article key={detail.label}>
                  <FiCheckCircle aria-hidden="true" />
                  <div>
                    <span>{detail.label}</span>
                    <strong>{detail.value}</strong>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>
        <dl>
          <div>
            <dt>Category</dt>
            <dd>{activeProject.category || 'Not specified'}</dd>
          </div>
          <div>
            <dt>Skills</dt>
            <dd>{activeProject.skills || 'Not specified'}</dd>
          </div>
          <div>
            <dt>Client</dt>
            <dd className="has-profile">
              <img src="/assets/index/bee_nobg.png" alt="" />
              {activeProject.client}
              <button type="button">View Profile</button>
            </dd>
          </div>
          <div>
            <dt>Project Owner</dt>
            <dd className="has-profile">
              <img src="/assets/index/bee_nobg.png" alt="" />
              {activeProject.owner}
              {canOpenMessages ? <button type="button">Message</button> : null}
            </dd>
          </div>
        </dl>
        {isBackedProject ? (
          <ProjectDeliverablesStatus
            project={activeProject}
            onSubmit={onSubmitWork ? () => onSubmitWork() : undefined}
            onSelectPhase={onSelectPhase}
            variant="inline"
          />
        ) : null}
      </section>

      <SubmittedWorkPreview
        limit={3}
        onViewAll={onOpenWorkDeliverables}
        submissions={submittedWork}
      />

      {scopeDeliverables.length ? (
        <section className="project-card project-scope-deliverables-card">
          <header>
            <div>
              <h2>Deliverables</h2>
              <p>The work and acceptance requirements agreed in the opportunity brief.</p>
            </div>
            <span>{scopeDeliverables.length} {scopeDeliverables.length === 1 ? 'item' : 'items'}</span>
          </header>
          <div className="project-scope-deliverables-list">
            {scopeDeliverables.map((deliverable) => {
              const primaryDescription = deliverable.description || deliverable.requirement
              return (
                <article key={deliverable.id}>
                  <div className="project-scope-deliverable-number" aria-hidden="true">{deliverable.number}</div>
                  <div className="project-scope-deliverable-content">
                    <header>
                      <div>
                        <span>{deliverable.kind === 'milestone' ? 'Milestone deliverable' : 'Deliverable'}</span>
                        <h3>{deliverable.title}</h3>
                      </div>
                      {deliverable.budgetLabel || deliverable.paymentLabel ? (
                        <strong>{deliverable.budgetLabel || deliverable.paymentLabel}</strong>
                      ) : null}
                    </header>
                    {primaryDescription ? <p>{primaryDescription}</p> : null}
                    <dl>
                      {deliverable.requirement && deliverable.requirement !== primaryDescription ? (
                        <div>
                          <dt>Requirement</dt>
                          <dd>{deliverable.requirement}</dd>
                        </div>
                      ) : null}
                      {deliverable.acceptanceCriteria ? (
                        <div>
                          <dt>Acceptance criteria</dt>
                          <dd>{deliverable.acceptanceCriteria}</dd>
                        </div>
                      ) : null}
                      {deliverable.submissionMethod ? (
                        <div>
                          <dt>Submit as</dt>
                          <dd>{deliverable.submissionMethod}</dd>
                        </div>
                      ) : null}
                      {deliverable.evidenceRequired ? (
                        <div>
                          <dt>Evidence required</dt>
                          <dd>{deliverable.evidenceRequired}</dd>
                        </div>
                      ) : null}
                      {deliverable.maxSubmissions ? (
                        <div>
                          <dt>Submission limit</dt>
                          <dd>
                            {deliverable.maxSubmissions} {deliverable.maxSubmissions === 1 ? 'submission' : 'submissions'}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ) : null}

      {sampleWork.length ? (
        <section className="project-card project-sample-work-card">
          <h2>Sample Work & References</h2>
          <p>Reference material the client attached so you can match the expected quality and format.</p>
          <div className="project-sample-work-list">
            {sampleWork.map((sample) => (
              <article key={sample.id}>
                <div>
                  <strong>{sample.label}</strong>
                  {sample.scopeTitle ? <span>{sample.scopeTitle}</span> : null}
                </div>
                <ul>
                  {sample.files.map((file, index) => (
                    <li key={`${sample.id}-file-${index}`}>
                      {file.url ? (
                        <a href={file.url} target="_blank" rel="noreferrer">
                          {file.isLink ? <FiExternalLink aria-hidden="true" /> : <FiDownload aria-hidden="true" />}
                          {file.name}
                          {file.sizeLabel ? <em>{file.sizeLabel}</em> : null}
                        </a>
                      ) : (
                        <span className="is-unavailable">
                          {file.name}
                          <em>file not available</em>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="project-card project-details-card">
        <h2>Project Details</h2>
        <dl>
          <div>
            <dt>Start Date</dt>
            <dd>{activeProject.started || activeProject.posted}</dd>
          </div>
          <div>
            <dt>Payment Terms</dt>
            <dd>{activeProject.paymentTerms || 'One-time payment upon completion'}</dd>
          </div>
          <div>
            <dt>Deadline</dt>
            <dd>{activeProject.deadline}</dd>
          </div>
          {activeProject.revisionPolicy || !isBackedProject ? (
            <div>
              <dt>Revision Policy</dt>
              <dd>{activeProject.revisionPolicy || '2 rounds of revisions included'}</dd>
            </div>
          ) : null}
          <div>
            <dt>Budget</dt>
            <dd>{activeProject.budget}</dd>
          </div>
          {activeProject.agreedAmountLabel ? (
            <div>
              <dt>Agreed Pay</dt>
              <dd>{activeProject.agreedAmountLabel}</dd>
            </div>
          ) : null}
          {activeProject.approvalRequired || !isBackedProject ? (
            <div>
              <dt>Approval Required</dt>
              <dd>{activeProject.approvalRequired || 'Yes, before final delivery'}</dd>
            </div>
          ) : null}
        </dl>
        {!activeProject.hasMilestones ? (
          <p className="project-info-strip">
            <FiInfo aria-hidden="true" />
            <span>
              <strong>This project does not use milestones.</strong>
              You'll submit the final work when completed for review and payment.
            </span>
          </p>
        ) : null}
      </section>

      {canOpenMessages && recentMessages.length ? (
        <section className="project-card project-recent-messages">
          <header>
            <h2>Recent Messages</h2>
            <button type="button">View All Messages</button>
          </header>
          {recentMessages.slice(0, 2).map((message) => (
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
