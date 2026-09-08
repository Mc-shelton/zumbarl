import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiAlertCircle, FiCheck, FiClock, FiFileText, FiLock, FiShield, FiUploadCloud } from 'react-icons/fi'
import { uploadZumbarlFile } from '../../../lib/uploadZumbarlFile'
import { readMyStudentKyc, submitMyStudentKycDocument } from '../services/profileKycService'

const DOCUMENT_OPTIONS = [
  { type: 'NATIONAL_ID', label: 'National ID', note: 'Upload the front and back together as one PDF or clear image.' },
  { type: 'STUDENT_ID', label: 'Student ID', note: 'A current card issued by your university or college.' },
]

const ACCEPTED_DOCUMENT_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024

function statusLabel(value) {
  return String(value || 'pending').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function ProfileKycPanel({ onBusyChange, onDirtyChange }) {
  const [kyc, setKyc] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [files, setFiles] = useState({})
  const [uploadingType, setUploadingType] = useState('')
  const [feedback, setFeedback] = useState('')

  const load = useCallback(() => {
    return readMyStudentKyc()
      .then(setKyc)
      .catch((error) => setFeedback(error.message || 'KYC details could not be loaded.'))
      .finally(() => setIsLoading(false))
  }, [])
  useEffect(() => { void load() }, [load])

  const hasDraft = useMemo(() => Object.values(files).some(Boolean), [files])
  useEffect(() => { onBusyChange?.(Boolean(uploadingType)) }, [onBusyChange, uploadingType])
  useEffect(() => { onDirtyChange?.(hasDraft) }, [hasDraft, onDirtyChange])

  const latestByType = useMemo(() => new Map((kyc?.documents || []).map((document) => [document.documentType, document])), [kyc?.documents])

  async function uploadDocument(option) {
    const file = files[option.type]
    if (!file) return
    setUploadingType(option.type)
    setFeedback('')
    try {
      const upload = await uploadZumbarlFile(file, {
        scope: `kyc-${option.type.toLowerCase()}`,
        metadata: { purpose: option.type.toLowerCase(), category: option.type.toLowerCase(), targetType: 'student' },
      })
      const response = await submitMyStudentKycDocument({
        documentType: option.type,
        uploadId: upload.id,
      })
      setKyc(response)
      setFiles((current) => ({ ...current, [option.type]: null }))
      setFeedback(`${option.label} submitted securely for review.`)
    } catch (error) {
      setFeedback(error.message || `${option.label} could not be submitted.`)
    } finally {
      setUploadingType('')
    }
  }

  function selectDocument(option, file) {
    if (!file) {
      setFiles((current) => ({ ...current, [option.type]: null }))
      return
    }
    if (!ACCEPTED_DOCUMENT_TYPES.has(file.type)) {
      setFeedback('Choose a PDF, JPG, PNG or WebP document.')
      return
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      setFeedback('Choose a document smaller than 10 MB.')
      return
    }
    setFeedback('')
    setFiles((current) => ({ ...current, [option.type]: file }))
  }

  function retryLoad() {
    setIsLoading(true)
    setFeedback('')
    void load()
  }

  const businessReady = Boolean(kyc?.eligibility?.business?.approved)
  const kitchenReady = Boolean(kyc?.eligibility?.studentKitchen?.approved)

  return <section className="profile-kyc-panel">
    <header>
      <div><span>Identity verification</span><h3>Know Your Customer</h3><p>Verify your identity before creating a student business or kitchen. Files are stored in private KYC storage and are visible only to authorized reviewers.</p></div>
      <strong className={`profile-kyc-status is-${kyc?.status || (isLoading ? 'loading' : 'unavailable')}`}><FiShield /> {kyc ? statusLabel(kyc.status) : isLoading ? 'Loading' : 'Unavailable'}</strong>
    </header>

    {kyc ? <div className="profile-kyc-access-grid">
      <article className={businessReady ? 'is-ready' : ''}><span>{businessReady ? <FiCheck /> : <FiClock />}</span><div><strong>Student business</strong><small>{businessReady ? 'KYC approved—you can create a business page.' : 'Your National ID and Student ID must be approved.'}</small></div></article>
      <article className={kitchenReady ? 'is-ready' : ''}><span>{kitchenReady ? <FiCheck /> : <FiClock />}</span><div><strong>Student kitchen</strong><small>{kitchenReady ? 'KYC approved—you can create a kitchen.' : 'Your National ID and Student ID must be approved.'}</small></div></article>
    </div> : null}

    {feedback ? <p className="profile-kyc-feedback" role="status"><FiAlertCircle /> {feedback}{!kyc && !isLoading ? <button type="button" onClick={retryLoad}>Try again</button> : null}</p> : null}

    {isLoading ? <div className="profile-kyc-loading" aria-live="polite"><span /><span /><span /><p>Loading your verification details…</p></div> : kyc ? <div className="profile-kyc-documents">
      {DOCUMENT_OPTIONS.map((option) => {
        const document = latestByType.get(option.type)
        const isUploading = uploadingType === option.type
        return <article key={option.type}>
          <div className="profile-kyc-document-icon"><FiFileText /></div>
          <div className="profile-kyc-document-copy"><strong>{option.label}</strong><p>{option.note}</p>{document ? <small><FiLock /> {document.fileName || 'Private document'} · {statusLabel(document.status)}{document.expiresAt ? ` · Expires ${new Date(document.expiresAt).toLocaleDateString('en-KE')}` : ''}</small> : <small>Not submitted</small>}</div>
          <div className="profile-kyc-document-action">
            <label><FiUploadCloud /> <span>{files[option.type]?.name || (document ? 'Replace file' : 'Choose file')}</span><input accept="application/pdf,image/jpeg,image/png,image/webp" type="file" onChange={(event) => selectDocument(option, event.target.files?.[0])} /></label>
            <button type="button" disabled={!files[option.type] || Boolean(uploadingType)} onClick={() => uploadDocument(option)}>{isUploading ? 'Uploading…' : 'Submit'}</button>
          </div>
        </article>
      })}
    </div> : null}
  </section>
}

export default ProfileKycPanel
