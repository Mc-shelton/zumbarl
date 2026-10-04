import { useMemo, useState } from 'react'
import { FiArchive, FiCheckCircle, FiEye, FiEyeOff, FiFile, FiLock, FiSend, FiX } from 'react-icons/fi'

function fileLabel(url, index) {
  try {
    return decodeURIComponent(new URL(url, window.location.origin).pathname.split('/').filter(Boolean).at(-1)) || `Project file ${index + 1}`
  } catch {
    return `Project file ${index + 1}`
  }
}

function isImageUrl(url) {
  return /\.(?:png|jpe?g|gif|webp|svg)(?:\?|$)/i.test(url)
}

function portfolioDraft(item) {
  return {
    title: item?.title || '',
    description: item?.description || '',
    category: item?.category || 'Project',
    fileUrls: item?.fileUrls || [],
    thumbnailUrl: item?.thumbnailUrl || '',
    showClientName: Boolean(item?.showClientName),
    isFeatured: Boolean(item?.featured),
  }
}

function ProfilePortfolioEditor({ item, onArchive, onClose, onPublish, onSave, onShare, onUnpublish }) {
  const [draft, setDraft] = useState(() => portfolioDraft(item))
  const [visibility, setVisibility] = useState('campus')
  const [commentary, setCommentary] = useState('')
  const [working, setWorking] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const verifiedFiles = useMemo(() => item?.sourceFileUrls || item?.fileUrls || [], [item])
  if (!item) return null
  const isPublished = item.status === 'PUBLISHED' && item.isPublic

  async function run(action, task) {
    setWorking(action)
    setError('')
    setNotice('')
    try {
      await task()
    } catch (actionError) {
      setError(actionError?.message || 'The portfolio change could not be saved.')
    } finally {
      setWorking('')
    }
  }

  function payload() {
    return {
      ...draft,
      title: draft.title.trim(),
      description: draft.description.trim(),
      category: draft.category.trim(),
    }
  }

  return (
    <div className="portfolio-editor-backdrop" role="presentation">
      <section className="portfolio-editor" role="dialog" aria-modal="true" aria-labelledby="portfolio-editor-title">
        <header>
          <div><span><FiLock /> Verified project draft</span><h2 id="portfolio-editor-title">Choose what appears publicly</h2><p>The original client review and verification cannot be edited.</p></div>
          <button type="button" aria-label="Close portfolio editor" onClick={onClose}><FiX /></button>
        </header>

        <div className="portfolio-editor-grid">
          <div className="portfolio-editor-fields">
            <label><span>Project title</span><input maxLength="160" required value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} /></label>
            <label><span>Description</span><textarea maxLength="2000" required value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} /></label>
            <label><span>Category</span><input maxLength="100" required value={draft.category} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))} /></label>

            <div className="portfolio-editor-privacy">
              <label><input type="checkbox" checked={draft.showClientName} onChange={(event) => setDraft((current) => ({ ...current, showClientName: event.target.checked }))} /><span><strong>Show client name</strong><small>{draft.showClientName ? item.clientName || item.client : 'The public profile will say “Client private”.'}</small></span></label>
              <label><input type="checkbox" checked={draft.isFeatured} onChange={(event) => setDraft((current) => ({ ...current, isFeatured: event.target.checked }))} /><span><strong>Feature this project</strong><small>Place it before other portfolio work.</small></span></label>
            </div>
          </div>

          <aside className="portfolio-editor-files">
            <h3>Verified project files</h3>
            <p>Only checked files will be visible on the published project.</p>
            {verifiedFiles.map((url, index) => {
              const selected = draft.fileUrls.includes(url)
              return (
                <article key={url}>
                  <label><input type="checkbox" checked={selected} onChange={(event) => setDraft((current) => ({ ...current, fileUrls: event.target.checked ? [...current.fileUrls, url] : current.fileUrls.filter((value) => value !== url), thumbnailUrl: !event.target.checked && current.thumbnailUrl === url ? '' : current.thumbnailUrl }))} /><FiFile /><span>{fileLabel(url, index)}</span></label>
                  {selected && isImageUrl(url) ? <label className="portfolio-thumbnail-choice"><input type="radio" name="portfolio-thumbnail" checked={draft.thumbnailUrl === url} onChange={() => setDraft((current) => ({ ...current, thumbnailUrl: url }))} />Cover</label> : null}
                </article>
              )
            })}
            {!verifiedFiles.length ? <div className="portfolio-editor-empty"><FiCheckCircle /><span>This project is verified without public files. You can still publish its outcome and client feedback.</span></div> : null}
          </aside>
        </div>

        {isPublished ? (
          <section className="portfolio-editor-share">
            <div><h3>Share to Connect</h3><p>Publish a project update that links back to this portfolio entry.</p></div>
            <textarea maxLength="500" value={commentary} placeholder="What did you learn or accomplish? (optional)" onChange={(event) => setCommentary(event.target.value)} />
            <label><span>Audience</span><select value={visibility} onChange={(event) => setVisibility(event.target.value)}><option value="campus">My campus</option><option value="public">Public on Zumbarl</option></select></label>
            <button type="button" disabled={Boolean(working)} onClick={() => run('share', async () => { await onShare(item.id, { visibility, commentary }); setCommentary(''); setNotice('Shared to Connect.') })}><FiSend />{working === 'share' ? 'Sharing…' : 'Share project'}</button>
          </section>
        ) : null}

        {error ? <p className="portfolio-editor-message is-error" role="alert">{error}</p> : null}
        {notice ? <p className="portfolio-editor-message" role="status">{notice}</p> : null}

        <footer>
          <button type="button" className="is-archive" disabled={Boolean(working)} onClick={() => run('archive', () => onArchive(item.id))}><FiArchive />Archive</button>
          <div>
            <button type="button" disabled={Boolean(working)} onClick={() => run('save', async () => { await onSave(item.id, payload()); setNotice('Draft saved.') })}>{working === 'save' ? 'Saving…' : 'Save changes'}</button>
            {isPublished ? <button type="button" disabled={Boolean(working)} onClick={() => run('unpublish', () => onUnpublish(item.id))}><FiEyeOff />Make private</button> : <button type="button" className="is-primary" disabled={Boolean(working) || !draft.title.trim() || !draft.description.trim()} onClick={() => run('publish', async () => { await onSave(item.id, payload()); await onPublish(item.id) })}><FiEye />{working === 'publish' ? 'Publishing…' : 'Publish portfolio'}</button>}
          </div>
        </footer>
      </section>
    </div>
  )
}

export default ProfilePortfolioEditor
