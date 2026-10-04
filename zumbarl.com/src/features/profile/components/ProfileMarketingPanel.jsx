import { useEffect, useMemo, useState } from 'react'
import { FaFacebookF, FaInstagram, FaTiktok, FaXTwitter, FaYoutube } from 'react-icons/fa6'
import { FiAlertTriangle, FiArrowUp, FiCheckCircle, FiClock, FiLock, FiRefreshCw, FiShield, FiTrash2, FiUploadCloud, FiX } from 'react-icons/fi'
import { ConfirmDialog } from '../../../components/ui'
import { uploadZumbarlFile } from '../../../lib/uploadZumbarlFile'
import {
  deleteSocialMetricsAccount,
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
  if (value === null || value === undefined || value === '') return '—'
  return Number(value).toLocaleString()
}

function nullableMetric(value) {
  return value === '' || value === null || value === undefined ? null : Number(value)
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
  const [reloadKey, setReloadKey] = useState(0)
  const [loadError, setLoadError] = useState('')
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
  const [accountPendingRemoval, setAccountPendingRemoval] = useState(null)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [extractionNote, setExtractionNote] = useState('')
  const [extractionConfidence, setExtractionConfidence] = useState(0)

  useEffect(() => {
    let isActive = true
    readSocialMarketingProfile()
      .then((result) => {
        if (!isActive) return
        setAccounts(result.accounts || [])
        setLoadError('')
      })
      .catch(() => {
        if (isActive) setLoadError('We could not load your social profiles.')
      })
      .finally(() => { if (isActive) setIsLoading(false) })
    return () => { isActive = false }
  }, [reloadKey])

  const summary = useMemo(() => ({
    followers: accounts.reduce((total, account) => total + Number(account.followers || 0), 0),
    verified: accounts.filter((account) => account.verified && !account.isStale).length,
    due: accounts.filter((account) => account.isStale).length,
  }), [accounts])

  function retryLoading() {
    setIsLoading(true)
    setLoadError('')
    setReloadKey((key) => key + 1)
  }

  function openEditor(account = null) {
    const nextPlatform = account?.platform || SOCIAL_PLATFORMS.find(({ id }) => (
      !accounts.some((item) => item.platform.toLowerCase() === id.toLowerCase())
    ))?.id || 'Instagram'
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
    setAccountPendingRemoval(null)
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
        ...current,
        followers: extraction.followers ?? '',
        averageLikes: extraction.averageLikes ?? '',
        averageEngagement: extraction.averageEngagement ?? '',
      }))
      const found = Number(extraction.detectedCount || 0)
      setExtractionNote(
        found === 3
          ? 'All three metrics were read from your screenshot. Review them, then save.'
          : `${found} of 3 metrics were read automatically. You can correct them or leave unread metrics empty.`,
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
        followers: nullableMetric(metrics.followers),
        averageLikes: nullableMetric(metrics.averageLikes),
        averageEngagement: nullableMetric(metrics.averageEngagement),
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

  async function removeAccount() {
    if (!accountPendingRemoval || isDeletingAccount) return
    setIsDeletingAccount(true)
    setError('')
    try {
      await deleteSocialMetricsAccount(accountPendingRemoval.platform)
      setAccounts((current) => current.filter((account) => (
        account.platform.toLowerCase() !== accountPendingRemoval.platform.toLowerCase()
      )))
      setAccountPendingRemoval(null)
      setIsEditorOpen(false)
      setScreenshotUpload(null)
    } catch (reason) {
      setAccountPendingRemoval(null)
      setError(reason.message || 'The social account could not be removed.')
    } finally {
      setIsDeletingAccount(false)
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

  if (isLoading) return <section className="profile-marketing-state" aria-busy="true"><span /><span /><span /><p>Loading creator analytics…</p></section>

  return (
    <section className="profile-marketing-panel">
      <header className="profile-marketing-heading">
        <div>
          <span>Marketing profile</span>
          <h2>Creator analytics</h2>
          <p>Keep your audience numbers current to qualify for campaigns.</p>
        </div>
        {accounts.length ? <button type="button" onClick={() => openEditor()}>
          <FiUploadCloud aria-hidden="true" /> Add social profile
        </button> : null}
      </header>

      {!loadError ? (
        <div className="profile-marketing-summary" aria-label="Social profile summary">
          <article>
            <FiArrowUp aria-hidden="true" />
            <div><strong>{formatNumber(summary.followers)}</strong><span>Followers</span></div>
          </article>
          <article>
            <FiShield aria-hidden="true" />
            <div><strong>{summary.verified}</strong><span>Verified</span></div>
          </article>
          <article className={summary.due ? 'is-due' : ''}>
            <FiClock aria-hidden="true" />
            <div><strong>{summary.due}</strong><span>Updates due</span></div>
          </article>
        </div>
      ) : null}

      {loadError ? (
        <div className="profile-marketing-load-error" role="alert">
          <FiAlertTriangle aria-hidden="true" />
          <div><strong>Creator profiles unavailable</strong><span>{loadError} Check your connection, then try again.</span></div>
          <button type="button" onClick={retryLoading}><FiRefreshCw aria-hidden="true" /> Retry</button>
        </div>
      ) : null}

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

        {!accounts.length && !loadError ? (
          <div className="profile-marketing-empty">
            <div className="profile-marketing-platforms" aria-label="Supported platforms">
              {SOCIAL_PLATFORMS.map(({ id, Icon }) => <span key={id} title={id}><Icon aria-hidden="true" /></span>)}
            </div>
            <h3>Add your first social account</h3>
            <p>Upload one analytics screenshot. We&apos;ll read the audience numbers for you.</p>
            <button type="button" onClick={() => openEditor()}><FiUploadCloud aria-hidden="true" /> Add social profile</button>
          </div>
        ) : null}
      </div>

      <aside className="profile-marketing-weekly-note">
        <FiCheckCircle aria-hidden="true" />
        <div><strong>Updated weekly</strong><p>Fresh numbers improve campaign matching.</p></div>
      </aside>

      {isEditorOpen ? (
        <div className="profile-marketing-editor" role="dialog" aria-modal="true" aria-labelledby="social-metrics-title">
          <form onSubmit={saveAccount}>
            <header>
              <div>
                <span>Creator verification</span>
                <h2 id="social-metrics-title">Update your reach</h2>
                <p>Share a fresh analytics screenshot.</p>
              </div>
              <button type="button" onClick={closeEditor} aria-label="Close social metrics editor"><FiX aria-hidden="true" /></button>
            </header>

            <div className="profile-marketing-editor-grid">
              <div className="profile-marketing-platform-field">
                <span id="social-platform-label">Platform</span>
                <div className="profile-marketing-platform-picker" role="radiogroup" aria-labelledby="social-platform-label">
                  {SOCIAL_PLATFORMS.map(({ id, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={platform === id}
                      aria-label={id}
                      className={platform === id ? 'is-selected' : ''}
                      onClick={() => setPlatform(id)}
                      disabled={isExtracting || Boolean(screenshotUpload) || Boolean(connectedHandle) || accounts.some((account) => account.platform.toLowerCase() === id.toLowerCase())}
                    >
                      <Icon aria-hidden="true" /><span>{id}</span>
                    </button>
                  ))}
                </div>
              </div>
              {connectedHandle ? (
                <div className="profile-marketing-locked-account">
                  <span className="profile-marketing-locked-icon"><FiLock aria-hidden="true" /></span>
                  <div>
                    <span>Connected account</span>
                    <strong>{normalizeHandle(connectedHandle)}</strong>
                    <small>The handle is locked after its first verification.</small>
                  </div>
                  <button type="button" onClick={() => setAccountPendingRemoval({ platform, handle: connectedHandle })}>
                    <FiTrash2 aria-hidden="true" /> Remove and start fresh
                  </button>
                </div>
              ) : (
                <label>Profile handle
                  <input
                    value={handle}
                    onChange={(event) => setHandle(event.target.value)}
                    placeholder="@yourhandle"
                    required
                  />
                </label>
              )}
            </div>

            <label className={`profile-marketing-upload${isExtracting ? ' is-reading' : ''}`}>
              <span className="profile-marketing-upload-icon"><FiUploadCloud aria-hidden="true" /></span>
              <span className="profile-marketing-upload-copy">
                <strong>{isExtracting ? 'Reading your screenshot…' : screenshotUpload ? screenshotUpload.fileName : 'Choose analytics screenshot'}</strong>
                <span>{screenshotUpload ? 'Tap to use a different image' : 'PNG, JPG or WebP · include your handle and insights'}</span>
              </span>
              <span className="profile-marketing-upload-action">{screenshotUpload ? 'Replace' : 'Upload'}</span>
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

            {screenshotUpload ? (
              <fieldset disabled={isExtracting}>
                <legend>Review metrics</legend>
                <label>Followers <small>Optional</small><input type="number" min="0" value={metrics.followers} placeholder="—" onChange={(event) => setMetrics((current) => ({ ...current, followers: event.target.value }))} /></label>
                <label>Avg. likes <small>Optional</small><input type="number" min="0" value={metrics.averageLikes} placeholder="—" onChange={(event) => setMetrics((current) => ({ ...current, averageLikes: event.target.value }))} /></label>
                <label>Avg. engagement <small>Optional</small><input type="number" min="0" value={metrics.averageEngagement} placeholder="—" onChange={(event) => setMetrics((current) => ({ ...current, averageEngagement: event.target.value }))} /></label>
              </fieldset>
            ) : null}

            <footer>
              <button type="button" onClick={closeEditor}>Cancel</button>
              <button type="submit" className="is-primary" disabled={!handleMatches || isExtracting || isSaving}>
                {isSaving ? 'Saving…' : 'Verify and save'}
              </button>
            </footer>
          </form>
        </div>
      ) : null}

      <ConfirmDialog
        cancelLabel="Keep account"
        confirmLabel="Remove account"
        description={accountPendingRemoval ? `This removes ${normalizeHandle(accountPendingRemoval.handle)} and its verified metric history from Zumbarl. You can then add ${accountPendingRemoval.platform} again with a different handle.` : ''}
        isOpen={Boolean(accountPendingRemoval)}
        isPending={isDeletingAccount}
        onCancel={() => { if (!isDeletingAccount) setAccountPendingRemoval(null) }}
        onConfirm={removeAccount}
        title={accountPendingRemoval ? `Remove ${normalizeHandle(accountPendingRemoval.handle)}?` : 'Remove social account?'}
      />
    </section>
  )
}

export default ProfileMarketingPanel
