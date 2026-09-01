import { useEffect, useMemo, useRef, useState } from 'react'
import {
  FiActivity,
  FiArrowUpRight,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiMessageCircle,
  FiUsers,
} from 'react-icons/fi'

function progressValue(project) {
  if (project.statusTone === 'is-completed') return 100
  const parsed = Number.parseFloat(String(project.progress || '').replace('%', ''))
  return Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : 0
}

function isDueSoon(project) {
  const deadline = new Date(project.deadline)
  if (Number.isNaN(deadline.getTime())) return false
  const remainingDays = (deadline.getTime() - Date.now()) / 86400000
  return remainingDays >= 0 && remainingDays <= 30
}

function OpportunitiesOngoingPanel({ onOpenMessages = () => {}, onOpenProject, projects = [], selectedProjectId = null }) {
  const selectedProjectRef = useRef(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const dueSoonCount = projects.filter(isDueSoon).length
  const pendingInputCount = projects.filter((project) => project.statusTone === 'is-awaiting').length
  const activeCount = projects.filter((project) => project.statusTone !== 'is-completed').length
  const summary = [
    { label: 'Active work', value: activeCount, detail: 'Jobs and projects moving', Icon: FiBriefcase, tone: 'is-plum' },
    { label: 'Due soon', value: dueSoonCount, detail: 'Within the next 30 days', Icon: FiClock, tone: 'is-amber' },
    { label: 'Needs attention', value: pendingInputCount, detail: 'Waiting for your input', Icon: FiActivity, tone: 'is-teal' },
  ]
  const filters = [
    { id: 'all', label: 'All projects', count: projects.length },
    { id: 'active', label: 'In progress', count: projects.filter((project) => project.statusTone === 'is-scheduled').length },
    { id: 'attention', label: 'Needs attention', count: pendingInputCount },
    { id: 'completed', label: 'Completed', count: projects.filter((project) => project.statusTone === 'is-completed').length },
  ]
  const visibleProjects = useMemo(() => projects.filter((project) => {
    if (activeFilter === 'active') return project.statusTone === 'is-scheduled'
    if (activeFilter === 'attention') return project.statusTone === 'is-awaiting'
    if (activeFilter === 'completed') return project.statusTone === 'is-completed'
    return true
  }), [activeFilter, projects])

  useEffect(() => {
    if (!selectedProjectId || !selectedProjectRef.current) return
    const frame = window.requestAnimationFrame(() => {
      selectedProjectRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [projects.length, selectedProjectId])

  return (
    <section className="opportunities-list-section opportunities-ongoing-section" aria-label="Ongoing jobs, gigs and projects">
      <div className="opportunities-ongoing-overview">
        <div className="opportunities-ongoing-intro">
          <span className="opportunities-ongoing-kicker"><FiActivity aria-hidden="true" /> Your work hub</span>
          <h2>Keep the momentum going</h2>
          <p>Everything you have won or accepted, organised around progress and the next useful action.</p>
          <div className="opportunities-ongoing-live"><span aria-hidden="true" /> {activeCount} active {activeCount === 1 ? 'project' : 'projects'}</div>
        </div>
        <div className="opportunities-ongoing-summary">
          {summary.map(({ label, value, detail, Icon, tone }) => (
            <article className={tone} key={label}>
              <span className="opportunities-ongoing-summary-icon"><Icon aria-hidden="true" /></span>
              <div><p>{label}</p><strong>{value}</strong><small>{detail}</small></div>
            </article>
          ))}
        </div>
      </div>

      <div className="opportunities-work-directory">
        <div><span>Project board</span><h3>Your projects</h3><p>Move between active work, reviews and completed wins.</p></div>
        <nav aria-label="Filter ongoing projects">
          {filters.map((filter) => (
            <button type="button" className={activeFilter === filter.id ? 'is-active' : ''} aria-pressed={activeFilter === filter.id} key={filter.id} onClick={() => setActiveFilter(filter.id)}>
              {filter.label}<span>{filter.count}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="opportunities-ongoing-list">
        {projects.length === 0 ? (
          <div className="opportunities-ongoing-empty">
            <span><FiBriefcase aria-hidden="true" /></span>
            <div><h3>Your next project will land here</h3><p>Projects you win or accept will appear with their milestones, messages and next steps.</p></div>
          </div>
        ) : null}
        {projects.length > 0 && visibleProjects.length === 0 ? (
          <div className="opportunities-ongoing-empty is-filtered">
            <span><FiCheckCircle aria-hidden="true" /></span>
            <div><h3>Nothing in this view</h3><p>Choose another filter to see the rest of your project history.</p></div>
          </div>
        ) : null}
        {visibleProjects.map((project) => {
          const progress = progressValue(project)
          return (
          <article key={project.id} ref={selectedProjectId === project.id ? selectedProjectRef : null} className={`opportunities-ongoing-card ${project.statusTone}${selectedProjectId === project.id ? ' is-selected' : ''}`}>
            <header className="opportunities-ongoing-card-head">
              <div className="opportunities-ongoing-project-mark" aria-hidden="true"><FiBriefcase /></div>
              <div className="opportunities-ongoing-card-title">
                <p>{project.category}</p>
                <h3>{project.title}</h3>
                <span>{project.client}</span>
              </div>
              <span className={`opportunities-ongoing-status ${project.statusTone}`}><i aria-hidden="true" />{project.status}</span>
            </header>

            <div className="opportunities-ongoing-meta">
              <p><span><FiCalendar aria-hidden="true" /></span><small>Deadline</small><strong>{project.deadline}</strong></p>
              <p><span><FiCreditCard aria-hidden="true" /></span><small>Project value</small><strong>{project.budget}</strong></p>
              <p><span><FiUsers aria-hidden="true" /></span><small>Working with</small><strong>{project.client}</strong></p>
            </div>

            <div className="opportunities-ongoing-progress">
              <div><span>Project progress</span><strong>{Math.round(progress)}%</strong></div>
              <div className="opportunities-ongoing-progress-track" role="progressbar" aria-label={`${project.title} progress`} aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(progress)}>
                <span style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="opportunities-ongoing-next-step">
              <FiCheckCircle aria-hidden="true" />
              <div><small>Latest update</small><p>{project.note}</p></div>
            </div>

            <footer className="opportunities-ongoing-card-foot">
              <span>Stay close to the client and keep milestones current.</span>
              <div className="opportunities-ongoing-actions">
                <button type="button" className="opportunities-ongoing-message-btn" onClick={onOpenMessages}><FiMessageCircle aria-hidden="true" /> Message</button>
                <button
                  type="button"
                  className="opportunities-ongoing-open-btn"
                  onClick={() => onOpenProject(project)}
                >
                  Open project <FiArrowUpRight aria-hidden="true" />
                </button>
              </div>
            </footer>
          </article>
          )
        })}
      </div>
    </section>
  )
}

export default OpportunitiesOngoingPanel
