import {
  FiArrowRight,
  FiCheck,
  FiClock,
  FiDollarSign,
  FiDownload,
  FiFileText,
  FiMessageCircle,
  FiUploadCloud,
} from 'react-icons/fi'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'
import StudentWalletWithdrawal from '../../finance/components/StudentWalletWithdrawal'
import { Link } from 'react-router-dom'

function ProjectRail({ activeProject, activeTab, isSubmitted, onPaymentCompleted, onSubmitWork, onTabChange, tasks = [] }) {
  const canSubmitWork = hasAccess(ACCESS_KEYS.projects.submitWork)
  const canViewFiles = hasAccess(ACCESS_KEYS.projects.files)
  const project = activeProject
  const isBackedProject = project?.source === 'database'
  if (!isBackedProject) return null
  const timeline = Array.isArray(project.timeline) ? project.timeline : []
  const railFiles = Array.isArray(project.files) ? project.files : []
  const progressLabel = `${project.progressPercent ?? 0}%`
  const progressWidth = progressLabel
  const progressNote = project.progressNote || (isSubmitted ? 'Pending client review' : 'Work in progress')
  const walletPayouts = Array.isArray(project.payouts) ? project.payouts : []
  const pendingReleaseTargets = Array.isArray(project.submissionTargets)
    ? project.submissionTargets.filter((target) => target.approved && !target.completed)
    : []
  const openTaskCount = (Array.isArray(tasks) ? tasks : [])
    .filter((task) => !['done', 'dropped'].includes(String(task.status || '').toLowerCase()))
    .length
  const hasWallet = canSubmitWork && isBackedProject && (
    Number(project.walletBalance) > 0
    || project.totalEarned > 0
    || walletPayouts.length
    || pendingReleaseTargets.length
  )

  return (
    <aside className="campus-rail project-workspace-rail" aria-label="Project details">
      {hasWallet ? (
        <section className="campus-rail-card project-wallet-card">
          <header>
            <h3>Earnings &amp; Wallet</h3>
            <span className="project-wallet-badge"><FiDollarSign aria-hidden="true" /></span>
          </header>
          <div className="project-wallet-figures">
            <div>
              <span>Wallet balance</span>
              <strong>{project.walletBalanceLabel}</strong>
            </div>
            <div>
              <span>Earned here</span>
              <strong>{project.totalEarnedLabel}</strong>
            </div>
          </div>
          {pendingReleaseTargets.length ? (
            <div className="project-wallet-release-status" role="status">
              <FiClock aria-hidden="true" />
              <div>
                <strong>
                  {pendingReleaseTargets.length} approved {pendingReleaseTargets.length === 1 ? 'deliverable' : 'deliverables'} awaiting payment
                </strong>
                <p>
                  {openTaskCount
                    ? `${openTaskCount} open ${openTaskCount === 1 ? 'task must' : 'tasks must'} be finished or dropped before the business can complete and pay.`
                    : 'Your work is approved. The amount will appear here after the business completes and releases the deliverable.'}
                </p>
              </div>
            </div>
          ) : null}
          {walletPayouts.length ? (
            <ul className="project-wallet-payouts">
              {walletPayouts.slice(0, 3).map((payout) => (
                <li key={payout.id}>
                  <strong>{payout.amountLabel}</strong>
                  <em>Released {payout.paidLabel}</em>
                </li>
              ))}
            </ul>
          ) : null}
          <StudentWalletWithdrawal availableBalance={project.walletBalance} currency={project.walletCurrency} onCompleted={onPaymentCompleted} />
        </section>
      ) : null}

      <section className="campus-rail-card project-progress-card">
        <header>
          <h3>Project Progress</h3>
          <strong>{progressLabel}</strong>
        </header>
        <p>Overall Progress</p>
        <span className="project-progress-track">
          <i style={{ width: progressWidth }} />
        </span>
        <p>{progressNote}</p>
      </section>

      <section className="campus-rail-card project-timeline-card">
        <h3>Project Timeline</h3>
        <div className="project-timeline-list">
          {timeline.map((item, index) => {
            const isCurrent = item.current
            return (
              <article key={item.label} className={item.complete ? 'is-complete' : isCurrent ? 'is-current' : ''}>
                <span>{item.complete ? <FiCheck aria-hidden="true" /> : index + 1}</span>
                <div>
                  <strong>{item.label}</strong>
                  {isCurrent ? <em>Current</em> : null}
                </div>
                <p>{item.date}</p>
              </article>
            )
          })}
        </div>
      </section>

      {activeTab === 'Messages' ? (
        <section className="campus-rail-card project-about-card">
          <h3>About this project</h3>
          <dl>
            <div>
              <dt>Client</dt>
              <dd>{project.client}</dd>
            </div>
            <div>
              <dt>Project Owner</dt>
              <dd>{project.owner}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{project.status}</dd>
            </div>
            <div>
              <dt>Deadline</dt>
              <dd>{project.deadline}</dd>
            </div>
            <div>
              <dt>{project.projectAmountTitle || 'Budget'}</dt>
              <dd>{project.projectAmountLabel || project.budget}</dd>
            </div>
          </dl>
        </section>
      ) : activeTab === 'Files' ? (
        <>
          {canSubmitWork && project.canSubmitWork !== false ? (
            <section className="campus-rail-card project-support-card">
              <FiUploadCloud aria-hidden="true" />
              <div>
                <h3>{project.workActionMode === 'revise' ? 'Need to revise work?' : 'Need to submit work?'}</h3>
                <p>{project.workActionMode === 'revise' ? 'Replace a pending or returned submission with an updated version.' : 'Upload your completed files when you’re ready for review.'}</p>
              </div>
              <button type="button" className="project-soft-btn" onClick={onSubmitWork}>
                {project.workActionLabel || 'Submit Work'}
                <FiArrowRight aria-hidden="true" />
              </button>
            </section>
          ) : null}
        </>
      ) : (
        <>
          {canViewFiles && railFiles.length ? (
            <section className="campus-rail-card project-files-card">
              <header>
                <h3>Project Files</h3>
                <button type="button" onClick={() => onTabChange('Files')}>View All Files</button>
              </header>
              {railFiles.map((file) => (
                <article key={file.name} className={`project-mini-file is-${file.tone}`}>
                  <FiFileText aria-hidden="true" />
                  <div>
                    <strong>{file.name}</strong>
                    <p>{file.meta}</p>
                  </div>
                  <span>{file.date}</span>
                  <FiDownload aria-hidden="true" />
                </article>
              ))}
            </section>
          ) : null}
          <section className="campus-rail-card project-support-card">
            <FiMessageCircle aria-hidden="true" />
            <div>
              <h3>Need help with this project?</h3>
              <p>Our support team is here to help.</p>
            </div>
            <Link to="/help" className="project-soft-btn">
              Contact Support
              <FiArrowRight aria-hidden="true" />
            </Link>
          </section>
        </>
      )}
    </aside>
  )
}

export default ProjectRail
