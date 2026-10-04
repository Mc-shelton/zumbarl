import { useMemo, useState } from 'react'
import { FaFacebookF, FaLinkedinIn, FaWhatsapp } from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import { FiCopy, FiLock, FiShare2, FiX } from 'react-icons/fi'
import { useDialog } from '../../../components/ui'
import { recordRecommendationInteraction } from '../../recommendations/services/recommendationEventService'

function ExploreShareModal({ onClose, target }) {
  const isOpen = Boolean(target?.url)
  const isPublicShare = target?.visibility === 'public' && !target?.communityGroupId
  const dialogRef = useDialog({ isOpen, onClose })
  const [copyState, setCopyState] = useState('')

  const shareText = useMemo(() => {
    if (!(target?.visibility === 'public' && !target?.communityGroupId)) {
      return `A ${target?.kind === 'story' ? 'campus story' : 'campus post'} was shared with you on Zumbarl.`
    }
    const author = target?.author ? `${target.author}: ` : ''
    return `${author}${target?.text || target?.title || 'See this on Zumbarl'}`.trim()
  }, [target])

  const previewText = useMemo(() => {
    const text = String(target?.text || target?.title || 'A campus moment worth sharing').replace(/\s+/g, ' ').trim()
    return text.length > 120 ? `${text.slice(0, 119).trimEnd()}…` : text
  }, [target])

  if (!isOpen) return null

  const encodedUrl = encodeURIComponent(target.url)
  const encodedText = encodeURIComponent(shareText)
  const networks = [
    { id: 'whatsapp', label: 'WhatsApp', hint: 'Send direct', icon: FaWhatsapp, href: `https://wa.me/?text=${encodedText}%20${encodedUrl}` },
    { id: 'facebook', label: 'Facebook', hint: 'Share to feed', icon: FaFacebookF, href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { id: 'x', label: 'X', hint: 'Post an update', icon: FaXTwitter, href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}` },
    { id: 'linkedin', label: 'LinkedIn', hint: 'Share professionally', icon: FaLinkedinIn, href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
  ]

  function recordShare(channel) {
    if (!target.id) return
    const isStory = target.kind === 'story'
    recordRecommendationInteraction({
      surface: isStory ? 'stories' : 'connect_feed',
      entityType: isStory ? 'connect_story' : 'connect_post',
      entityId: String(target.id),
      eventType: 'share',
      metadata: { channel },
    })
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(target.url)
      setCopyState('Link copied')
      recordShare('copy_link')
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
      recordShare('device')
    } catch (error) {
      if (error?.name !== 'AbortError') setCopyState('Could not open your share apps')
    }
  }

  return (
    <section ref={dialogRef} className="explore-share-backdrop" role="dialog" aria-modal="true" aria-labelledby="explore-share-title" onClick={onClose}>
      <article className="explore-share-modal" onClick={(event) => event.stopPropagation()}>
        <div className="explore-share-brandbar">
          <div className="explore-share-brand">
            <span><img src="/assets/index/bee_nobg.png" alt="" /></span>
            <div>
              <small>Zumbarl Connect</small>
              <strong>Pass the buzz along</strong>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close share options"><FiX /></button>
        </div>

        <div className="explore-share-content">
          <header className="explore-share-heading">
            <span className="explore-share-kicker">Share on or beyond Zumbarl</span>
            <h2 id="explore-share-title">Share this {target.kind === 'story' ? 'story' : 'post'}</h2>
            <p className="explore-share-description">
              {isPublicShare
                ? `Send this campus moment to your people. The link opens the original ${target.kind === 'story' ? 'story' : 'post'} on Zumbarl.`
                : `Send this to another Zumbarl member. They may need to sign in before the original ${target.kind === 'story' ? 'story' : 'post'} opens.`}
            </p>
          </header>

          <div className="explore-share-preview">
            <span className="explore-share-preview-mark"><img src="/assets/index/bee_nobg.png" alt="" /></span>
            <div>
              <small>{target.kind === 'story' ? 'Story' : 'Post'} from {target.author || 'the Zumbarl community'}</small>
              <strong>{previewText}</strong>
            </div>
            <span className={`explore-share-preview-chip${isPublicShare ? '' : ' is-member-only'}`}>{isPublicShare ? 'Public on Zumbarl' : <><FiLock aria-hidden="true" /> Member link</>}</span>
          </div>

          <p className="explore-share-section-label">Choose where to share</p>
          <div className="explore-share-networks" aria-label="Social networks">
            {networks.map(({ id, label, hint, icon: Icon, href }) => (
              <a className={`is-${id}`} key={label} href={href} target="_blank" rel="noreferrer" aria-label={`Share on ${label}`} onClick={() => recordShare(id)}>
                <span className="explore-share-network-icon"><Icon aria-hidden="true" /></span>
                <span><strong>{label}</strong><small>{hint}</small></span>
              </a>
            ))}
          </div>

          <button type="button" className="explore-share-device" onClick={shareWithDevice}>
            <span><FiShare2 aria-hidden="true" /></span>
            <strong>Share with another app</strong>
            <small>Use your device’s share menu</small>
          </button>

          <div className="explore-share-link-block">
            <label htmlFor="explore-share-link">Or copy the {target.kind === 'story' ? 'story' : 'post'} link</label>
            <div className="explore-share-link-row">
              <input id="explore-share-link" readOnly value={target.url} onFocus={(event) => event.currentTarget.select()} />
              <button type="button" className={copyState === 'Link copied' ? 'is-copied' : ''} onClick={copyLink}><FiCopy aria-hidden="true" /> {copyState === 'Link copied' ? 'Copied' : 'Copy link'}</button>
            </div>
            <p className="explore-share-status" role="status">{copyState}</p>
          </div>
        </div>
      </article>
    </section>
  )
}

export default ExploreShareModal
