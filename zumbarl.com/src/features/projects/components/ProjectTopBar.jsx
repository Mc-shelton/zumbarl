import {
  FiActivity,
  FiArrowRight,
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClipboard,
  FiCreditCard,
  FiFileText,
  FiFlag,
  FiFolder,
  FiHome,
  FiMessageCircle,
  FiMoreHorizontal,
  FiPlay,
  FiPlus,
  FiStar,
  FiUsers,
  FiUploadCloud,
} from 'react-icons/fi'
import { useEffect, useRef, useState } from 'react'
import CampusTopActions from '../../../components/layout/CampusTopActions'
import { Breadcrumb } from '../../../components/ui'
import { Link } from 'react-router-dom'
import { ACCESS_KEYS, getCurrentLoginRole, hasAccess } from '../../auth/roleConfig'
import { getProjectTabs } from '../constants'

function ProjectTopBar({
  activeProject,
  activeTab,
  hasStarted = true,
  isBusinessViewer = false,
  isEnding = false,
  isStarting = false,
  onStartProject,
  onEndProject,
  onTabChange,
  onSubmitWork,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [copyNotice, setCopyNotice] = useState('')
  const menuRef = useRef(null)
  const tabs = getProjectTabs(activeProject, {
    isBusinessViewer: getCurrentLoginRole()?.side === 'company',
  })
  const canDiscoverPrograms = hasAccess(ACCESS_KEYS.campus.opportunities)
  const canSubmitWork = !isBusinessViewer
    && hasAccess(ACCESS_KEYS.projects.submitWork)
    && activeProject.canSubmitWork !== false
  const isReadyToStart = isBusinessViewer && !hasStarted && Boolean(onStartProject)
  const primaryAction = canDiscoverPrograms ? (
    <Link to="/campus/opportunities" className="project-program-btn">
      <FiPlus aria-hidden="true" />
      Discover opportunities
      <FiArrowRight aria-hidden="true" />
    </Link>
  ) : null

  const tabIcons = {
    Overview: FiHome,
    'Work & Deliverables': FiClipboard,
    Team: FiUsers,
    Messages: FiMessageCircle,
    Files: FiFolder,
    Reviews: FiStar,
    'Activity Logs': FiActivity,
  }

  useEffect(() => {
    if (!isMenuOpen) return undefined
    const closeMenu = (event) => {
      if (!menuRef.current?.contains(event.target)) setIsMenuOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }
    document.addEventListener('pointerdown', closeMenu)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeMenu)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isMenuOpen])

  async function copyProjectLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopyNotice('Project link copied')
    } catch {
      setCopyNotice('Could not copy the link')
    }
    setIsMenuOpen(false)
    window.setTimeout(() => setCopyNotice(''), 2200)
  }

  return (
    <div className="project-workspace-head">
      <header className="project-workspace-topbar">
        <Breadcrumb
          className="project-workspace-breadcrumb"
          items={[
            {
              label: 'Projects',
              href: isBusinessViewer
                ? '/business/opportunities'
                : '/campus/opportunities?tab=service-orders',
            },
            { label: activeProject.title },
          ]}
        />

        <CampusTopActions
          className="project-workspace-actions"
          primaryAction={primaryAction}
          userButtonClassName="opportunities-user-btn"
        />
      </header>

      <section className="project-workspace-titlebar">
        <div className="project-workspace-title-context">
          <span className="project-workspace-title-mark" aria-hidden="true">
            <img src="/assets/index/bee_nobg.png" alt="" />
          </span>
          <div className="project-workspace-title-copy">
            <small>{isBusinessViewer ? 'Business delivery workspace' : 'Your Zumbarl project'}</small>
            <div>
              <h1>{activeProject.title}</h1>
              <span className="project-status">
                <FiCheckCircle aria-hidden="true" />
                {isReadyToStart ? 'Ready to start' : activeProject.status}
              </span>
            </div>
            <p>{isBusinessViewer ? 'Guide the work, review delivery and keep the student team moving.' : 'Build the work, show your progress and turn every approved task into proof.'}</p>
          </div>
        </div>
        {isReadyToStart ? (
          <button
            type="button"
            className="project-primary-btn project-start-btn"
            disabled={isStarting}
            onClick={onStartProject}
          >
            <FiPlay aria-hidden="true" />
            {isStarting ? 'Starting…' : 'Start project'}
          </button>
        ) : canSubmitWork ? (
          <button type="button" className="project-primary-btn" onClick={onSubmitWork}>
            <FiUploadCloud aria-hidden="true" />
            {activeProject.workActionLabel || 'Submit Work'}
          </button>
        ) : null}
        {onEndProject ? (
          <button
            type="button"
            className="project-end-btn"
            disabled={isEnding}
            title="Close the project after all deliverables have been approved and paid"
            onClick={onEndProject}
          >
            <FiFlag aria-hidden="true" />
            {isEnding ? 'Ending project…' : 'End project'}
          </button>
        ) : null}
        <div className="project-actions-menu" ref={menuRef}>
          <button
            type="button"
            className="project-icon-btn"
            aria-label="More project actions"
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            <FiMoreHorizontal aria-hidden="true" />
          </button>
          {isMenuOpen ? (
            <div className="project-actions-popover" role="menu">
              <button type="button" role="menuitem" onClick={copyProjectLink}>
                <FiClipboard aria-hidden="true" />
                Copy project link
              </button>
              {tabs.includes('Messages') ? (
                <button type="button" role="menuitem" onClick={() => { onTabChange('Messages'); setIsMenuOpen(false) }}>
                  <FiMessageCircle aria-hidden="true" />
                  Open messages
                </button>
              ) : null}
              {tabs.includes('Files') ? (
                <button type="button" role="menuitem" onClick={() => { onTabChange('Files'); setIsMenuOpen(false) }}>
                  <FiFileText aria-hidden="true" />
                  Open project files
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        {copyNotice ? <span className="project-copy-notice" role="status">{copyNotice}</span> : null}
      </section>

      <section className="project-workspace-meta" aria-label="Project summary">
        <span>
          <FiBriefcase aria-hidden="true" />
          Project ID: {activeProject.id}
        </span>
        <span>
          <FiCalendar aria-hidden="true" />
          {activeProject.started ? `Started: ${activeProject.started}` : `Posted on: ${activeProject.posted}`}
        </span>
        <span>
          <FiCreditCard aria-hidden="true" />
          {activeProject.projectAmountTitle || 'Budget'}: {activeProject.projectAmountLabel || activeProject.budget}
        </span>
        <span>
          <FiCalendar aria-hidden="true" />
          Deadline: {activeProject.deadline}
        </span>
      </section>

      <nav className="project-workspace-tabs zumbarl-segmented-tabs" aria-label="Project tabs">
        {tabs.map((tab) => {
          const TabIcon = tabIcons[tab]
          return (
            <button
              key={tab}
              type="button"
              className={activeTab === tab ? 'is-active' : ''}
              aria-current={activeTab === tab ? 'page' : undefined}
              onClick={() => onTabChange(tab)}
            >
              {TabIcon ? <TabIcon aria-hidden="true" /> : null}
              {tab}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export default ProjectTopBar
