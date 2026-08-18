import { useEffect, useMemo, useState } from 'react'
import { FaFacebookF, FaInstagram, FaTiktok, FaXTwitter, FaYoutube } from 'react-icons/fa6'
import { FiAlertTriangle, FiArrowUp, FiCheckCircle, FiClock, FiRefreshCw, FiShield, FiUploadCloud } from 'react-icons/fi'
import { uploadZumbarlFile } from '../../../lib/uploadZumbarlFile'
import {
  extractSocialMetrics,
  readSocialMarketingProfile,
  saveSocialMetricsAccount,
} from '../services/socialMarketingService'

const SOCIAL_PLATFORMS = [
  { id: 'Instagram', Icon: FaInstagram },
  { id: 'TikTok', Icon: FaTiktok },
  { id: 'YouTube', Icon: FaYoutube },
  { id: 'Facebook', Icon: FaFacebookF },
  { id: 'X', Icon: FaXTwitter },
]

const EMPTY_METRICS = { followers: '', averageLikes: '', averageEngagement: '' }

function platformMeta(platform) {
  return SOCIAL_PLATFORMS.find((item) => item.id === platform) || SOCIAL_PLATFORMS[0]
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString()
}

function formatUpdateDate(value) {
  if (!value) return 'Update now'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Update now'
  return date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
}

function normalizeHandle(value) {
  const normalized = String(value || '').trim().toLowerCase().replace(/^@/, '').replace(/[^a-z0-9._-]/g, '')
  return normalized ? `@${normalized}` : ''
}

function ProfileMarketingPanel() {
  const [accounts, setAccounts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [platform, setPlatform] = useState('Instagram')
  const [handle, setHandle] = useState('')
  const [connectedHandle, setConnectedHandle] = useState('')
  const [detectedHandle, setDetectedHandle] = useState('')
  const [metrics, setMetrics] = useState(EMPTY_METRICS)
  const [screenshotUpload, setScreenshotUpload] = useState(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [extractionNote, setExtractionNote] = useState('')
  const [extractionConfidence, setExtractionConfidence] = useState(0)

  useEffect(() => {
    let isActive = true
    readSocialMarketingProfile()
      .then((result) => { if (isActive) setAccounts(result.accounts || []) })
      .catch((reason) => { if (isActive) setError(reason.message || 'Social profiles could not be loaded.') })
      .finally(() => { if (isActive) setIsLoading(false) })
    return () => { isActive = false }
  }, [])

  const summary = useMemo(() => ({
    followers: accounts.reduce((total, account) => total + Number(account.followers || 0), 0),
    verified: accounts.filter((account) => account.verified && !account.isStale).length,
    due: accounts.filter((account) => account.isStale).length,
  }), [accounts])

  function openEditor(account = null) {
    const nextPlatform = account?.platform || 'Instagram'
    setPlatform(nextPlatform)
    setHandle(account?.handle || '')
    setConnectedHandle(account?.handle || '')
    setDetectedHandle('')
    setMetrics({
      followers: account?.followers ?? '',
      averageLikes: account?.averageLikes ?? '',
      averageEngagement: account?.averageEngagement ?? '',
    })
    setScreenshotUpload(null)
    setDetectedHandle('')
    setExtractionNote('')
    setExtractionConfidence(0)
    setError('')
    setIsEditorOpen(true)
  }

  function closeEditor() {
    if (isExtracting || isSaving) return
    setIsEditorOpen(false)
    setScreenshotUpload(null)
  }

  async function analyseScreenshot(file) {
    if (!file) return
    setError('')
    setExtractionNote('')
    setIsExtracting(true)
    try {
      const upload = await uploadZumbarlFile(file, {
        scope: 'social-metrics',
        metadata: { purpose: 'weekly-social-metrics', platform },
      })
      const expectedHandle = connectedHandle || handle
      const result = await extractSocialMetrics({
        platform,
        uploadId: upload.id,
        ...(expectedHandle.trim() ? { expectedHandle } : {}),
      })
      const extraction = result.extraction || {}
      setScreenshotUpload(upload)
      setExtractionConfidence(Number(extraction.confidence || 0))
      setDetectedHandle(result.handleCheck?.detectedHandle || extraction.handle || '')
      if (!connectedHandle && !handle.trim() && extraction.handle) setHandle(extraction.handle)
      setMetrics((current) => ({
        followers: extraction.followers ?? current.followers,
        averageLikes: extraction.averageLikes ?? current.averageLikes,
        averageEngagement: extraction.averageEngagement ?? current.averageEngagement,
      }))
      const found = Number(extraction.detectedCount || 0)
      setExtractionNote(
        found === 3
          ? 'All three metrics were read from your screenshot. Review them, then save.'
          : `${found} of 3 metrics were read automatically. Complete or correct the fields before saving.`,
      )
    } catch (reason) {
      setError(reason.message || 'The screenshot could not be analysed.')
    } finally {
      setIsExtracting(false)
    }
  }

  async function saveAccount(event) {
    event.preventDefault()
    if (!screenshotUpload || isSaving) return
    setError('')
    setIsSaving(true)
    try {
      const result = await saveSocialMetricsAccount({
        platform,
        handle,
        followers: Number(metrics.followers || 0),
        averageLikes: Number(metrics.averageLikes || 0),
        averageEngagement: Number(metrics.averageEngagement || 0),
        screenshotUploadId: screenshotUpload.id,
        extractionConfidence,
      })
      setAccounts((current) => [
        result.account,
        ...current.filter((account) => account.platform !== result.account.platform),
      ])
      setIsEditorOpen(false)
      setScreenshotUpload(null)
    } catch (reason) {
      setError(reason.message || 'The social metrics could not be saved.')
    } finally {
      setIsSaving(false)
    }
  }

  const expectedVerificationHandle = normalizeHandle(connectedHandle || handle)
  const normalizedDetectedHandle = normalizeHandle(detectedHandle)
  const handleMatches = Boolean(
    screenshotUpload
    && expectedVerificationHandle
    && normalizedDetectedHandle
    && expectedVerificationHandle === normalizedDetectedHandle
  )
  const handleMismatch = Boolean(screenshotUpload && expectedVerificationHandle && normalizedDetectedHandle && !handleMatches)
  const handleWasNotDetected = Boolean(screenshotUpload && !normalizedDetectedHandle)

  if (isLoading) return <section className="profile-marketing-state">Loading your social profiles…</section>

  return (
    <section className="profile-marketing-panel">
      <header className="profile-marketing-heading">
        <div>
          <span>Creator eligibility</span>
          <h2>Social reach</h2>
          <p>Upload a fresh analytics screenshot every week. We read the numbers and use the verified metrics to match you with campaigns.</p>
        </div>
        <button type="button" onClick={() => openEditor()}>
          <FiUploadCloud aria-hidden="true" /> Add social profile
        </button>
      </header>

      <div className="profile-marketing-summary" aria-label="Social profile summary">
        <article>
          <FiArrowUp aria-hidden="true" />
          <div><strong>{formatNumber(summary.followers)}</strong><span>Total followers</span></div>
        </article>
        <article>
          <FiShield aria-hidden="true" />
          <div><strong>{summary.verified}</strong><span>Current profiles</span></div>
        </article>
        <article className={summary.due ? 'is-due' : ''}>
          <FiClock aria-hidden="true" />
          <div><strong>{summary.due}</strong><span>Updates due</span></div>
        </article>
      </div>

      {error && !isEditorOpen ? <p className="profile-marketing-error" role="alert">{error}</p> : null}

      <div className="profile-marketing-accounts">
        {accounts.map((account) => {
          const { Icon } = platformMeta(account.platform)
          return (
            <article key={account.platform} className={account.isStale ? 'is-stale' : ''}>
              <header>
                <span className="profile-marketing-platform-icon"><Icon aria-hidden="true" /></span>
                <div><h3>{account.platform}</h3><p>{account.handle}</p></div>
                <em>{account.isStale ? 'Update due' : 'Verified'}</em>
              </header>
              <dl>
                <div><dt>Followers</dt><dd>{formatNumber(account.followers)}</dd></div>
                <div><dt>Avg. likes</dt><dd>{formatNumber(account.averageLikes)}</dd></div>
                <div><dt>Avg. engagements</dt><dd>{formatNumber(account.averageEngagement)}</dd></div>
              </dl>
              <footer>
                <span><FiClock aria-hidden="true" /> Next update: {formatUpdateDate(account.nextUpdateDueAt)}</span>
                <button type="button" onClick={() => openEditor(account)}><FiRefreshCw aria-hidden="true" /> Update</button>
              </footer>
            </article>
          )
        })}

        {!accounts.length ? (
          <div className="profile-marketing-empty">
            <FiUploadCloud aria-hidden="true" />
            <h3>Add your first creator profile</h3>
            <p>Start with an Instagram, TikTok, YouTube, Facebook, or X analytics screenshot.</p>
            <button type="button" onClick={() => openEditor()}>Upload screenshot</button>
          </div>
        ) : null}
      </div>

      <aside className="profile-marketing-weekly-note">
        <FiCheckCircle aria-hidden="true" />
        <div><strong>Why weekly?</strong><p>Fresh numbers let growing accounts qualify for better campaigns and prevent old analytics from being used.</p></div>
      </aside>

      {isEditorOpen ? (
        <div className="profile-marketing-editor" role="dialog" aria-modal="true" aria-labelledby="social-metrics-title">
          <form onSubmit={saveAccount}>
            <header>
              <div><span>Weekly verification</span><h2 id="social-metrics-title">Update social metrics</h2></div>
              <button type="button" onClick={closeEditor} aria-label="Close social metrics editor">×</button>
            </header>

            <div className="profile-marketing-editor-grid">
              <label>Platform
                <select value={platform} onChange={(event) => setPlatform(event.target.value)} disabled={isExtracting || Boolean(screenshotUpload)}>
                  {SOCIAL_PLATFORMS.map((item) => <option key={item.id}>{item.id}</option>)}
                </select>
              </label>
              <label>Profile handle
                <input
                  value={handle}
                  onChange={(event) => setHandle(event.target.value)}
                  placeholder="@yourhandle"
                  required
                  disabled={Boolean(connectedHandle)}
                />
              </label>
            </div>

            <label className={`profile-marketing-upload${isExtracting ? ' is-reading' : ''}`}>
              <FiUploadCloud aria-hidden="true" />
              <strong>{isExtracting ? 'Reading your screenshot…' : screenshotUpload ? screenshotUpload.fileName : 'Upload analytics screenshot'}</strong>
              <span>PNG, JPG or WebP · show followers, likes and engagement</span>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => analyseScreenshot(event.target.files?.[0])} disabled={isExtracting || isSaving} />
            </label>

            {handleMatches ? (
              <p className="profile-marketing-handle-check is-match">
                <FiCheckCircle aria-hidden="true" /> Account confirmed: {normalizedDetectedHandle}
              </p>
            ) : null}
            {handleMismatch ? (
              <p className="profile-marketing-handle-check is-mismatch" role="alert">
                <FiAlertTriangle aria-hidden="true" />
                This screenshot belongs to {normalizedDetectedHandle}, but your connected account is {expectedVerificationHandle}. Upload a screenshot from your own {platform} account.
              </p>
            ) : null}
            {handleWasNotDetected ? (
              <p className="profile-marketing-handle-check is-mismatch" role="alert">
                <FiAlertTriangle aria-hidden="true" /> We could not confirm the account handle. Upload a full profile or analytics screenshot that clearly shows your username.
              </p>
            ) : null}
            {extractionNote ? (
              <p className={`profile-marketing-extraction-note${Number(extractionConfidence) < 70 ? ' is-warning' : ''}`}>
                <FiCheckCircle aria-hidden="true" /> {extractionNote}
              </p>
            ) : null}
            {error ? <p className="profile-marketing-error" role="alert">{error}</p> : null}

            <fieldset disabled={isExtracting}>
              <legend>Extracted metrics</legend>
              <label>Followers<input type="number" min="0" value={metrics.followers} onChange={(event) => setMetrics((current) => ({ ...current, followers: event.target.value }))} required /></label>
              <label>Average likes<input type="number" min="0" value={metrics.averageLikes} onChange={(event) => setMetrics((current) => ({ ...current, averageLikes: event.target.value }))} required /></label>
              <label>Average engagements<input type="number" min="0" value={metrics.averageEngagement} onChange={(event) => setMetrics((current) => ({ ...current, averageEngagement: event.target.value }))} required /></label>
            </fieldset>

            <footer>
              <button type="button" onClick={closeEditor}>Cancel</button>
              <button type="submit" className="is-primary" disabled={!handleMatches || isExtracting || isSaving}>
                {isSaving ? 'Saving…' : 'Verify and save'}
              </button>
            </footer>
          </form>
        </div>
      ) : null}
    </section>
  )
}

export default ProfileMarketingPanel
