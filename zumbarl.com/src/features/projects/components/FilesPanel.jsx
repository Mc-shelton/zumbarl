import { useState } from 'react'
import { FiChevronDown, FiDownload, FiFileText, FiGrid, FiList, FiMessageCircle, FiMoreHorizontal, FiPlus, FiUploadCloud } from 'react-icons/fi'
import { ACCESS_KEYS, hasAccess } from '../../auth/roleConfig'
import { workspaceFiles } from '../data/mockWorkspace'

function RealFilesPanel({ project }) {
  const [query, setQuery] = useState('')
  const files = Array.isArray(project.workFiles) ? project.workFiles : []
  const normalized = query.trim().toLowerCase()
  const visibleFiles = normalized
    ? files.filter((file) => file.name.toLowerCase().includes(normalized))
    : files

  return (
    <section className="project-files-panel">
      <header className="project-files-head">
        <div>
          <h2>Project Files</h2>
          <p>Files you have submitted for this project. Reviewers can download each one.</p>
        </div>
      </header>

      <div className="project-files-tools">
        <label>
          <FiMessageCircle aria-hidden="true" />
          <input
            type="search"
            value={query}
            placeholder="Search files..."
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>

      {visibleFiles.length ? (
        <section className="project-card project-files-table" aria-label="Project files table">
          <div className="project-files-row is-head">
            <span>Name</span>
            <span>Type</span>
            <span>Source</span>
            <span>Submitted</span>
            <span>Size</span>
            <span />
          </div>
          {visibleFiles.map((file) => (
            <div key={file.id} className="project-files-row">
              <span>
                <FiFileText className={`is-${file.tone}`} aria-hidden="true" />
                <strong>{file.name}</strong>
              </span>
              <span>{file.type}</span>
              <span>{file.source}</span>
              <span>{file.updated}</span>
              <span>{file.size}</span>
              {file.url ? (
                <a href={file.url} target="_blank" rel="noreferrer" aria-label={`Download ${file.name}`}>
                  <FiDownload aria-hidden="true" />
                </a>
              ) : (
                <button type="button" aria-label={`More actions for ${file.name}`}>
                  <FiMoreHorizontal aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </section>
      ) : (
        <section className="project-card project-files-empty">
          <FiUploadCloud aria-hidden="true" />
          <p>{files.length ? 'No files match your search.' : 'No files submitted yet. Files you submit with your work will appear here.'}</p>
        </section>
      )}
    </section>
  )
}

function MockFilesPanel() {
  const canManageFiles = hasAccess(ACCESS_KEYS.projects.manageFiles)
  const createCards = [
    ['Document', 'Text docs'],
    ['Spreadsheet', 'Excel, Google Sheets'],
    ['Presentation', 'Slides, Pitch decks'],
    ['Form', 'Surveys, Intake forms'],
    ['Gantt Chart', 'Project timelines'],
    ['Mind Map', 'Brainstorm ideas'],
    ['Lead Tracker', 'Lead generation'],
    ['Kanban Board', 'Task management'],
    ['More', 'See all'],
  ]

  return (
    <section className="project-files-panel">
      <header className="project-files-head">
        <div>
          <h2>Project Files</h2>
          <p>Access, organize, and manage all project-related files in one place.</p>
        </div>
        {canManageFiles ? (
          <>
            <button type="button" className="project-primary-btn">
              <FiPlus aria-hidden="true" />
              New
            </button>
            <button type="button" className="project-soft-btn">
              <FiUploadCloud aria-hidden="true" />
              Upload Files
            </button>
          </>
        ) : null}
        <button type="button" className="project-icon-btn" aria-label="List view">
          <FiList aria-hidden="true" />
        </button>
        <button type="button" className="project-icon-btn" aria-label="Grid view">
          <FiGrid aria-hidden="true" />
        </button>
      </header>

      <div className="project-files-tools">
        <label>
          <FiMessageCircle aria-hidden="true" />
          <input type="search" placeholder="Search files..." />
        </label>
        <button type="button">
          Filter
          <FiChevronDown aria-hidden="true" />
        </button>
      </div>

      {canManageFiles ? (
        <section className="project-create-row" aria-label="Create new file">
          {createCards.map(([title, caption]) => (
            <button key={title} type="button">
              <FiFileText aria-hidden="true" />
              <strong>{title}</strong>
              <span>{caption}</span>
            </button>
          ))}
        </section>
      ) : null}

      <section className="project-card project-files-table" aria-label="Project files table">
        <div className="project-files-row is-head">
          <span>Name</span>
          <span>Type</span>
          <span>Owner</span>
          <span>Last Updated</span>
          <span>Size</span>
          <span />
        </div>
        {workspaceFiles.map(({ icon: Icon, ...file }) => (
          <div key={file.name} className="project-files-row">
            <span>
              <Icon className={`is-${file.tone}`} aria-hidden="true" />
              <strong>{file.name}</strong>
            </span>
            <span>{file.type}</span>
            <span>
              <img src="/assets/index/bee_nobg.png" alt="" />
              {file.owner}
            </span>
            <span>{file.updated}</span>
            <span>{file.size}</span>
            <button type="button" aria-label={`More actions for ${file.name}`}>
              <FiMoreHorizontal aria-hidden="true" />
            </button>
          </div>
        ))}
      </section>
    </section>
  )
}

function FilesPanel({ project }) {
  if (project?.source === 'database') {
    return <RealFilesPanel project={project} />
  }
  return <MockFilesPanel />
}

export default FilesPanel
