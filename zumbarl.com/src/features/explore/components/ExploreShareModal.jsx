import { useMemo, useState } from 'react'
import { FaFacebookF, FaLinkedinIn, FaTwitter, FaWhatsapp } from 'react-icons/fa'
import { FiCopy, FiShare2, FiX } from 'react-icons/fi'
import { useDialog } from '../../../components/ui'

function ExploreShareModal({ onClose, target }) {
  const isOpen = Boolean(target?.url)
  const dialogRef = useDialog({ isOpen, onClose })
  const [copyState, setCopyState] = useState('')

  const shareText = useMemo(() => {
    const author = target?.author ? `${target.author}: ` : ''
    return `${author}${target?.text || target?.title || 'See this on Zumbarl'}`.trim()
  }, [target])

  if (!isOpen) return null

  const encodedUrl = encodeURIComponent(target.url)
  const encodedText = encodeURIComponent(shareText)
  const networks = [
    { label: 'WhatsApp', icon: FaWhatsapp, href: `https://wa.me/?text=${encodedText}%20${encodedUrl}` },
    { label: 'Facebook', icon: FaFacebookF, href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { label: 'X', icon: FaTwitter, href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}` },
    { label: 'LinkedIn', icon: FaLinkedinIn, href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
  ]

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(target.url)
      setCopyState('Link copied')
    } catch {
      setCopyState('Copy the link from the field below')
    }
  }

  async function shareWithDevice() {
    if (!navigator.share) {
      await copyLink()
      return
    }
    try {
      await navigator.share({ title: target.title || 'Zumbarl', text: shareText, url: target.url })
    } catch (error) {
      if (error?.name !== 'AbortError') setCopyState('Could not open your share apps')
    }
  }

  return (
    <section ref={dialogRef} className="explore-share-backdrop" role="dialog" aria-modal="true" aria-labelledby="explore-share-title" onClick={onClose}>
      <article className="explore-share-modal" onClick={(event) => event.stopPropagation()}>
        <header>
          <div>
            <span className="explore-share-kicker">Share on or beyond Zumbarl</span>
            <h2 id="explore-share-title">Share this {target.kind === 'story' ? 'story' : 'post'}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close share options"><FiX /></button>
        </header>

        <p className="explore-share-description">
          Anyone opening this link will see this {target.kind === 'story' ? 'story' : 'post'} directly, with Explore Campus still available around it.
        </p>

        <div className="explore-share-networks" aria-label="Social networks">
          {networks.map(({ label, icon: Icon, href }) => (
            <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={`Share on ${label}`}>
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </a>
          ))}
        </div>

        <button type="button" className="explore-share-device" onClick={shareWithDevice}>
          <FiShare2 aria-hidden="true" />
          Share with another app
        </button>

        <div className="explore-share-link-row">
          <input readOnly value={target.url} aria-label="Share link" onFocus={(event) => event.currentTarget.select()} />
          <button type="button" onClick={copyLink}><FiCopy aria-hidden="true" /> Copy link</button>
        </div>
        <p className="explore-share-status" role="status">{copyState}</p>
      </article>
    </section>
  )
}

export default ExploreShareModal
