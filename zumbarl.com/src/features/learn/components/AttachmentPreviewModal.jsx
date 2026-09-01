import { FiDownload, FiExternalLink, FiFileText, FiX } from 'react-icons/fi'
import { normalizeZumbarlFileUrl } from '../../../lib/normalizeZumbarlFileUrl'
import {
  recordKnowledgeResourceComplete,
  recordKnowledgeResourceDownload,
  recordKnowledgeResourceProgress,
  recordKnowledgeResourceVideoPlay,
} from '../services/learnService'
import './attachment-preview.css'

function attachmentName(attachment, url) {
  if (attachment.name) return attachment.name
  try {
    return decodeURIComponent(new URL(url, window.location.origin).pathname.split('/').filter(Boolean).at(-1) || 'Resource preview')
  } catch {
    return 'Resource preview'
  }
}

function AttachmentPreviewModal({ attachment, onClose }) {
  if (!attachment) return null

  const url = normalizeZumbarlFileUrl(attachment.url)
  const mimeType = String(attachment.mimeType || '').toLowerCase()
  const path = String(url).split(/[?#]/)[0].toLowerCase()
  const isImage = mimeType.startsWith('image/') || /\.(avif|gif|jpe?g|png|webp|svg)$/.test(path)
  const isVideo = mimeType.startsWith('video/') || /\.(mp4|mov|m4v|webm|ogg)$/.test(path)
  const isPdf = mimeType === 'application/pdf' || path.endsWith('.pdf')
  const isWebPage = /^https?:\/\//i.test(url) && !mimeType && !/\.(docx?|xlsx?|pptx?|zip|rar|7z)$/i.test(path)
  const name = attachmentName(attachment, url)

  return (
    <div className="knowledge-attachment-preview-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="knowledge-attachment-preview-modal" role="dialog" aria-modal="true" aria-label={`Preview ${name}`}>
        <header>
          <div><span>Resource preview</span><h2>{name}</h2></div>
          <button type="button" onClick={onClose} aria-label="Close preview"><FiX /></button>
        </header>
        <div className="knowledge-attachment-preview-stage">
          {isImage ? <img src={url} alt={name} /> : isVideo ? <video
            src={url}
            controls
            autoPlay
            playsInline
            onPlay={() => recordKnowledgeResourceVideoPlay(attachment.resourceId)}
            onTimeUpdate={(event) => {
              const { currentTime, duration } = event.currentTarget
              if (Number.isFinite(duration) && duration > 0) recordKnowledgeResourceProgress(attachment.resourceId, currentTime / duration * 100)
            }}
            onEnded={() => recordKnowledgeResourceComplete(attachment.resourceId, 'video')}
          /> : isPdf || isWebPage ? <iframe src={url} title={name} /> : <div className="knowledge-attachment-preview-unavailable"><FiFileText /><h3>Preview unavailable</h3><p>This file type cannot be displayed in the browser, but you can download it below.</p></div>}
        </div>
        <footer>
          <span>{attachment.mimeType || 'Shared resource'}</span>
          <a href={url} download={name} onClick={() => recordKnowledgeResourceDownload(attachment.resourceId, 'download')}><FiDownload /> Download</a>
          <a href={url} target="_blank" rel="noreferrer" onClick={() => recordKnowledgeResourceDownload(attachment.resourceId, 'open_original')}><FiExternalLink /> Open original</a>
        </footer>
      </section>
    </div>
  )
}

export default AttachmentPreviewModal
