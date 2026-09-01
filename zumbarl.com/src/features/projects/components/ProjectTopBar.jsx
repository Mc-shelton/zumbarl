import {
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiChevronDown,
  FiCreditCard,
  FiMoreHorizontal,
  FiPlus,
  FiUploadCloud,
} from 'react-icons/fi'
import CampusTopActions from '../../../components/layout/CampusTopActions'
import { Breadcrumb } from '../../../components/ui'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'
import { getCurrentLoginRole } from '../../auth/roleConfig'
import { getProjectTabs } from '../constants'

function ProjectTopBar({ activeProject, activeTab, isBusinessViewer = false, onTabChange, onSubmitWork }) {
  const tabs = getProjectTabs(activeProject, {
    isBusinessViewer: getCurrentLoginRole()?.side === 'company',
  })
  const canDiscoverPrograms = hasAccess(ACCESS_KEYS.campus.opportunities)
  const canSubmitWork = !isBusinessViewer
    && hasAccess(ACCESS_KEYS.projects.submitWork)
    && activeProject.canSubmitWork !== false
  const primaryAction = canDiscoverPrograms ? (
    <button type="button" className="project-program-btn">
      <FiPlus aria-hidden="true" />
      Discover Programs
      <FiChevronDown aria-hidden="true" />
    </button>
  ) : null

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
        <div>
          <h1>{activeProject.title}</h1>
          <span className="project-status">
            <FiCheckCircle aria-hidden="true" />
            {activeProject.status}
          </span>
        </div>
        {canSubmitWork ? (
          <button type="button" className="project-primary-btn" onClick={onSubmitWork}>
            <FiUploadCloud aria-hidden="true" />
            {activeProject.workActionLabel || 'Submit Work'}
          </button>
        ) : null}
        <button type="button" className="project-icon-btn" aria-label="More project actions">
          <FiMoreHorizontal aria-hidden="true" />
        </button>
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
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? 'is-active' : ''}
            onClick={() => onTabChange(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>
    </div>
  )
}

export default ProjectTopBar
