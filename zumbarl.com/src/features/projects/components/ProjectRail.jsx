import {
  FiArrowRight,
  FiCheck,
  FiDollarSign,
  FiDownload,
  FiFileText,
  FiMessageCircle,
  FiUploadCloud,
} from 'react-icons/fi'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'
import { project as fallbackProject, railFiles as fallbackRailFiles, timeline as fallbackTimeline } from '../data/mockWorkspace'

function ProjectRail({ activeProject, activeTab, isSubmitted, onSubmitWork, onTabChange }) {
  const canSubmitWork = hasAccess(ACCESS_KEYS.projects.submitWork)
  const canViewFiles = hasAccess(ACCESS_KEYS.projects.files)
  const project = activeProject || fallbackProject
  const isBackedProject = project.source === 'database'
  const timeline = isBackedProject && Array.isArray(project.timeline) ? project.timeline : fallbackTimeline
  const railFiles = isBackedProject ? (Array.isArray(project.files) ? project.files : []) : fallbackRailFiles
  const progressLabel = isBackedProject ? `${project.progressPercent ?? 0}%` : '60%'
  const progressWidth = progressLabel
  const progressNote = isBackedProject
    ? (project.progressNote || (isSubmitted ? 'Pending client review' : 'Work in progress'))
    : (isSubmitted ? 'Pending client review' : 'Work in progress')
  const walletPayouts = isBackedProject && Array.isArray(project.payouts) ? project.payouts : []
  const hasWallet = isBackedProject && (project.totalEarned > 0 || walletPayouts.length)

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
            const isCurrent = isBackedProject ? item.current : (isSubmitted ? item.label === 'Work Submitted' : item.current)
            return (
              <article key={item.label} className={item.complete ? 'is-complete' : isCurrent ? 'is-current' : ''}>
                <span>{item.complete ? <FiCheck aria-hidden="true" /> : index + 1}</span>
                <div>
                  <strong>{item.label}</strong>
                  {item.label === 'Work Submitted' && isCurrent ? <em>Current</em> : null}
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
          {!isBackedProject ? (
            <>
              <section className="campus-rail-card project-storage-card">
                <header>
                  <h3>Storage Usage</h3>
                  <strong>24%</strong>
                </header>
                <p>2.4 GB of 10 GB used</p>
                <span className="project-progress-track">
                  <i />
                </span>
              </section>
              <section className="campus-rail-card project-file-categories">
                <h3>File Categories</h3>
                {['All Files', 'Documents', 'Spreadsheets', 'Presentations', 'Forms', 'PDFs', 'Folders'].map((item, index) => (
                  <button key={item} type="button">
                    <FiFileText aria-hidden="true" />
                    {item}
                    <span>{[15, 4, 3, 2, 1, 3, 2][index]}</span>
                  </button>
                ))}
              </section>
            </>
          ) : null}
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
            <button type="button" className="project-soft-btn">
              Contact Support
              <FiArrowRight aria-hidden="true" />
            </button>
          </section>
        </>
      )}
    </aside>
  )
}

export default ProjectRail
