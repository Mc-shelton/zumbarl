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
import Breadcrumb from '../../../components/ui/Breadcrumb'
import { getProjectTabs } from '../constants'

function ProjectTopBar({ activeProject, activeTab, onTabChange, onSubmitWork }) {
  const tabs = getProjectTabs(activeProject)
  const primaryAction = (
    <button type="button" className="project-program-btn">
      <FiPlus aria-hidden="true" />
      Discover Programs
      <FiChevronDown aria-hidden="true" />
    </button>
  )

  return (
    <div className="project-workspace-head">
      <header className="project-workspace-topbar">
        <Breadcrumb
          className="opportunities-breadcrumb"
          items={[
            { label: 'Projects', href: '/campus/opportunities?tab=service-orders' },
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
        <button type="button" className="project-primary-btn" onClick={onSubmitWork}>
          <FiUploadCloud aria-hidden="true" />
          Submit Work
        </button>
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
          Budget: {activeProject.budget}
        </span>
        <span>
          <FiCalendar aria-hidden="true" />
          Deadline: {activeProject.deadline}
        </span>
      </section>

      <nav className="project-workspace-tabs" aria-label="Project tabs">
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
