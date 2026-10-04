import { useState } from 'react'
import { FiDownload, FiFileText, FiSearch, FiUploadCloud } from 'react-icons/fi'

function RealFilesPanel({ onSubmitWork, project }) {
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
          <FiSearch aria-hidden="true" />
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
              ) : <span className="project-file-unavailable">Unavailable</span>}
            </div>
          ))}
        </section>
      ) : (
        <section className="project-card project-files-empty">
          <FiUploadCloud aria-hidden="true" />
          <strong>{files.length ? 'No matching files' : 'No project files yet'}</strong>
          <p>{files.length ? 'Try a different file name.' : 'Files attached to submitted work will appear here for the whole team.'}</p>
          {!files.length && onSubmitWork ? (
            <button type="button" className="project-primary-btn" onClick={onSubmitWork}>
              <FiUploadCloud aria-hidden="true" /> Submit work
            </button>
          ) : null}
        </section>
      )}
    </section>
  )
}

function FilesPanel({ onSubmitWork, project }) {
  if (project?.source !== 'database') return null
  return <RealFilesPanel project={project} onSubmitWork={onSubmitWork} />
}

export default FilesPanel
