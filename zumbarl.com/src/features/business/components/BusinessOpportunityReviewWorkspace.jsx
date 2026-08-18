import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TabNav } from '../../../components/ui'
import { getSplashCropStyle } from '../../../lib/getSplashCropStyle'
import {
  FiCalendar,
  FiCheckCircle,
  FiCreditCard,
  FiDownload,
  FiDollarSign,
  FiEye,
  FiFileText,
  FiFilter,
  FiImage,
  FiLock,
  FiPhone,
  FiMessageSquare,
  FiMoreVertical,
  FiMapPin,
  FiPlus,
  FiSearch,
  FiSend,
  FiUsers,
  FiVideo,
  FiX,
} from 'react-icons/fi'
import { Button, MetricCard, PersonRow, StatusPill } from '../../../components/ui'
import { listBackendBusinessActivity } from '../services/persistBusinessOpportunity'
import { useDeliverableTasks } from '../../projects/hooks/useDeliverableTasks'
import BusinessProjectSettingsPanel from './BusinessProjectSettingsPanel'
import DeliverableRoom from '../../projects/components/DeliverableRoom'
import MilestoneScopePanel from '../../projects/components/MilestoneScopePanel'
import ProjectStartNotice from '../../projects/components/ProjectStartNotice'
import MilestoneProgramPanel from '../../projects/components/MilestoneProgramPanel'
import MilestoneBoardPanel from '../../projects/components/MilestoneBoardPanel'
import ProjectSprintsPanel from '../../projects/components/ProjectSprintsPanel'
import ProjectTimelinePanel from '../../projects/components/ProjectTimelinePanel'
import { useMilestoneWorkspace } from '../../projects/hooks/useMilestoneWorkspace'
import TeamPanel from '../../projects/components/TeamPanel'
import { listProjectTeam } from '../../projects/services/projectTeamInviteService'
import {} from '../../calls/services/callService'
import {} from '../../calls/getCallMeetingUrl'
import ProjectConversationPanel from '../../messages/components/ProjectConversationPanel'
import {} from '../../communications/services/communicationSounds'

const REVIEW_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'applications', label: 'Applications' },
  { id: 'deliverables', label: 'Work & Deliverables' },
  { id: 'milestones', label: 'Milestones' },
  { id: 'board', label: 'Board' },
  { id: 'sprints', label: 'Sprints' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'team', label: 'Team' },
  { id: 'payments', label: 'Payments' },
  { id: 'performance', label: 'Performance' },
  { id: 'messages', label: 'Messages' },
  { id: 'activity', label: 'Activity' },
  { id: 'settings', label: 'Settings' },
]

function getReviewTabs(opportunity, applicationCount = 0) {
  const scopeCount = getOpportunityPaymentScopeItems(opportunity).length
  const tabs = REVIEW_TABS.map((tab) => {
    if (tab.id === 'applications') return { ...tab, count: applicationCount }
    if (tab.id === 'deliverables' && scopeCount) return { ...tab, count: scopeCount }
    return tab
  })

  // Only a team project has a team to show; a task is one student.
  const isTask = String(opportunity?.opportunityType || '').toLowerCase() === 'task'
  const withoutTeam = isTask
    ? tabs.filter((tab) => tab.id !== 'team' && tab.id !== 'settings')
    : tabs

  // Milestone planning surfaces belong to milestone briefs only.
  const MILESTONE_ONLY = ['milestones', 'board', 'sprints', 'timeline', 'performance']
  // For a milestone brief the milestones are the work, so Work & Deliverables is
  // a redundant second view of it.
  if (opportunity?.scopeMode === 'milestone') {
    return withoutTeam.filter((tab) => tab.id !== 'deliverables')
  }

  return withoutTeam.filter((tab) => !MILESTONE_ONLY.includes(tab.id))
}

const REVIEW_IMAGE = '/assets/index/business_page_images/optimized/campaign-creators-gMsnXqILjp4-unsplash.webp'
const SAMPLE_APPLICATION_PDF_PREVIEW = 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCAzMDAgMTQ0XSAvQ29udGVudHMgNCAwIFIgL1Jlc291cmNlcyA8PCAvRm9udCA8PCAvRjEgNSAwIFIgPj4gPj4gPj4KZW5kb2JqCjQgMCBvYmoKPDwgL0xlbmd0aCA0NCA+PgpzdHJlYW0KQlQKL0YxIDI0IFRmCjcyIDcyIFRkCihQb3J0Zm9saW8gc2FtcGxlKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCjUgMCBvYmoKPDwgL1R5cGUgL0ZvbnQgL1N1YnR5cGUgL1R5cGUxIC9CYXNlRm9udCAvSGVsdmV0aWNhID4+CmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1OCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCjAwMDAwMDAyNzQgMDAwMDAgbiAKMDAwMDAwMDM2NyAwMDAwMCBuIAp0cmFpbGVyCjw8IC9TaXplIDYgL1Jvb3QgMSAwIFIgPj4Kc3RhcnR4cmVmCjQzNQolJUVPRgo='

const APPLICATION_FILTERS = [
  { id: 'all', label: 'All', count: 18 },
  { id: 'new', label: 'New', count: 5 },
  { id: 'shortlisted', label: 'Shortlisted', count: 6 },
  { id: 'accepted', label: 'Accepted', count: 3 },
  { id: 'rejected', label: 'Rejected', count: 4 },
]

void SAMPLE_APPLICATION_PDF_PREVIEW

const DELIVERABLE_FILTERS = [
  { id: 'deliverables', label: 'Deliverables' },
  { id: 'submitted-work', label: 'Submitted Work' },
  { id: 'files', label: 'Files' },
  { id: 'messages', label: 'Messages' },
]


function getSkillList(opportunity) {
  return Array.isArray(opportunity?.skills)
    ? opportunity.skills
    : String(opportunity?.skills || '').split(',').map((item) => item.trim()).filter(Boolean)
}

function DeliverableIcon({ icon }) {
  if (icon === 'instagram') {
    return <span className="business-review-deliverable-icon tone-instagram"><FiImage aria-hidden="true" /></span>
  }

  if (icon === 'youtube') {
    return <span className="business-review-deliverable-icon tone-youtube">▶</span>
  }

  if (icon === 'tiktok') {
    return <span className="business-review-deliverable-icon tone-tiktok"><FiVideo aria-hidden="true" /></span>
  }

  if (icon === 'scope') {
    return <span className="business-review-deliverable-icon tone-x"><FiFileText aria-hidden="true" /></span>
  }

  return <span className="business-review-deliverable-icon tone-x">X</span>
}

function getCurrencyAmount(value) {
  return Number(String(value || '').replace(/[^\d.]/g, '')) || 0
}

function formatKesAmount(value) {
  return `KES ${getCurrencyAmount(value).toLocaleString()}`
}

function formatCurrencyAmount(value, currency = 'KES') {
  return `${currency} ${getCurrencyAmount(value).toLocaleString()}`
}

function formatOpportunityDate(value, fallback = 'Not set') {
  if (!value || value === 'Rolling') return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getOpportunityCoverImage(opportunity) {
  return opportunity?.opportunitySplash?.previewUrl
    || opportunity?.opportunitySplash?.url
    || opportunity?.imageUrl
    || opportunity?.image
    || REVIEW_IMAGE
}

function getOpportunityPaymentScopeItems(opportunity) {
  const milestoneScopes = Array.isArray(opportunity?.milestoneScopes) ? opportunity.milestoneScopes : []
  const deliverableMilestones = Array.isArray(opportunity?.deliverableMilestones) ? opportunity.deliverableMilestones : []
  const usesMilestones = opportunity?.scopeMode === 'milestone' && milestoneScopes.length
  const scopeItems = usesMilestones ? milestoneScopes : deliverableMilestones

  return scopeItems.map((item, index) => {
    const budgetAmount = getCurrencyAmount(item.budgetAmount ?? item.budget)
    return {
      budgetAmount,
      description: item.description || item.requirement || item.submissionMethod || 'Defined in the opportunity scope.',
      id: item.id || `scope-${index}`,
      paymentPercent: item.paymentPercent || '',
      release: item.paymentRelease || `Release after ${usesMilestones ? 'milestone' : 'deliverable'} approval.`,
      source: item,
      title: item.title || item.type || `${usesMilestones ? 'Milestone' : 'Deliverable'} ${index + 1}`,
      typeLabel: usesMilestones ? 'Milestone' : 'Deliverable',
    }
  })
}

function getContractPaymentScopeItems(opportunity, agreedAmount = 0) {
  const scopeItems = getOpportunityPaymentScopeItems(opportunity)
  const contractAmount = getCurrencyAmount(agreedAmount)
  if (!contractAmount || !scopeItems.length) return scopeItems

  const weightOf = (item) => getCurrencyAmount(item.paymentPercent) || item.budgetAmount
  const totalWeight = scopeItems.reduce((sum, item) => sum + weightOf(item), 0)
  const allocated = scopeItems.map((item) => Math.round(
    contractAmount * (totalWeight > 0 ? weightOf(item) / totalWeight : 1 / scopeItems.length),
  ))
  allocated[allocated.length - 1] = contractAmount - allocated.slice(0, -1).reduce((sum, amount) => sum + amount, 0)

  return scopeItems.map((item, index) => ({ ...item, budgetAmount: allocated[index] }))
}

function getOpportunitySampleFiles(opportunity) {
  return getOpportunityPaymentScopeItems(opportunity).flatMap((item) => {
    const samples = Array.isArray(item.source?.sampleWork) ? item.source.sampleWork : []

    return samples.map((sample, index) => ({
      id: sample.id || `${item.id}-file-${index}`,
      name: sample.fileName || sample.label || sample.title || `Reference file ${index + 1}`,
      type: String(sample.fileType || sample.mimeType || 'File').toUpperCase(),
      owner: opportunity?.company || 'Business account',
      updated: item.title,
      size: sample.sizeBytes ? `${(sample.sizeBytes / (1024 * 1024)).toFixed(1)} MB` : '—',
      url: sample.url || sample.previewUrl || '',
      tone: String(sample.mimeType || '').includes('pdf') ? 'pdf' : 'zip',
    }))
  })
}

function getOpportunityDeliverableRows(opportunity, agreedAmount = 0, agreedCurrency = 'KES') {
  const scopeItems = getContractPaymentScopeItems(opportunity, agreedAmount)
  if (!scopeItems.length) return []

  return scopeItems.map((item, index) => {
    const source = item.source || {}
    return {
      id: item.id,
      title: item.title,
      required: true,
      type: `${item.typeLabel} ${index + 1}`,
      description: item.description,
      dueDate: formatOpportunityDate(opportunity?.deadline, 'Scheduled after agreement'),
      dueMeta: opportunity?.deadline ? 'From brief deadline' : 'No fixed due date',
      submissions: '0',
      status: opportunity?.status === 'Open' ? 'Ready' : opportunity?.status || 'Draft',
      tone: opportunity?.status === 'Open' ? 'green' : 'gray',
      icon: 'scope',
      format: source.evidenceRequired || 'Defined in the opportunity scope',
      evidenceRequired: source.evidenceRequired || 'Defined in the opportunity scope',
      acceptanceCriteria: source.acceptanceCriteria || 'Acceptance criteria can be confirmed during review.',
      paymentRelease: item.release,
      budget: formatCurrencyAmount(item.budgetAmount, agreedCurrency),
      paymentPercent: item.paymentPercent ? `${item.paymentPercent}%` : 'Auto',
      requirement: item.description,
      workflow: source.workflow || source.type || item.typeLabel,
      workflowLabel: source.workflow || source.type || item.typeLabel,
      acceptedEvidence: source.evidenceRequired || 'Defined in the opportunity scope',
      lockedUntilApproved: source.lockedUntilApproved || source.isSequential,
      reference: source.reference || 'Reference files are managed from the brief.',
    }
  })
}

function getApplicationStatus(status) {
  const normalized = String(status || 'submitted').toLowerCase()
  if (['shortlisted', 'interview_scheduled'].includes(normalized)) return { id: 'shortlisted', label: 'Shortlisted', tone: 'orange' }
  if (['accepted', 'awarded'].includes(normalized)) return { id: 'accepted', label: 'Accepted', tone: 'green' }
  if (['rejected', 'removed'].includes(normalized)) return { id: 'rejected', label: 'Rejected', tone: 'red' }
  return { id: 'new', label: 'New', tone: 'blue' }
}

function formatApplicationDate(value) {
  if (!value) return { date: 'Recently', relative: 'Submission time unavailable' }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return { date: String(value), relative: '' }

  const elapsedMs = Math.max(0, Date.now() - date.getTime())
  const elapsedHours = Math.floor(elapsedMs / 3_600_000)
  const relative = elapsedHours < 1
    ? 'Less than an hour ago'
    : elapsedHours < 24
      ? `${elapsedHours} hour${elapsedHours === 1 ? '' : 's'} ago`
      : `${Math.floor(elapsedHours / 24)} day${Math.floor(elapsedHours / 24) === 1 ? '' : 's'} ago`

  return {
    date: date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }),
    relative,
  }
}

function toApplicationRow(bid) {
  const student = bid.student || {}
  const applicationStatus = getApplicationStatus(bid.status)
  const submitted = formatApplicationDate(bid.appliedAt || bid.createdAt)
  const name = student.name || bid.bidderName || 'Student applicant'
  const username = student.username ? `@${student.username}` : student.email || 'Zumbarl student'

  return {
    ...bid,
    avatar: student.avatarUrl || '/assets/index/bee_nobg.png',
    bio: student.bio || 'This student has not added a profile summary yet.',
    campus: student.campus || 'Campus not provided',
    completedGigs: student.completedGigs || 0,
    course: student.course || student.careerPath || 'Course not provided',
    creator: name,
    handle: username,
    joined: formatApplicationDate(student.joinedAt).date,
    location: student.locationCity || 'Location not provided',
    questionAnswers: Array.isArray(bid.questionAnswers) ? bid.questionAnswers : [],
    attachments: Array.isArray(bid.attachments) ? bid.attachments : [],
    score: Math.round(student.score || 0),
    skills: Array.isArray(student.skills) ? student.skills : [],
    status: applicationStatus.label,
    statusId: applicationStatus.id,
    submitted: submitted.date,
    submittedAgo: submitted.relative,
    tone: applicationStatus.tone,
  }
}

function canNegotiateApplication(application) {
  const applicationStatus = String(application?.statusId || application?.status || '').toLowerCase()
  if (['accepted', 'awarded', 'rejected'].includes(applicationStatus)) return false

  const previousOffer = application?.counterOffer
  if (!previousOffer) return true

  return previousOffer.status === 'rejected' && previousOffer.autoRejectOnDecline !== true
}

function toSubmittedAttachment(attachment, index) {
  const mimeType = String(attachment.mimeType || '').toLowerCase()
  const configuredFileType = String(attachment.fileType || 'File')
  const fileName = String(attachment.fileName || '')
  const extension = fileName.split('.').pop()?.toLowerCase()
  let previewType = 'file'
  let fileType = configuredFileType

  if (mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(extension)) {
    previewType = 'image'
    fileType = `${(mimeType.split('/')[1] || extension || 'image').toUpperCase()} image`
  } else if (mimeType.startsWith('video/') || ['mp4', 'mov', 'webm'].includes(extension)) {
    previewType = 'video'
    fileType = `${(mimeType.split('/')[1] || extension || 'video').toUpperCase()} video`
  } else if (mimeType === 'application/pdf' || extension === 'pdf') {
    previewType = 'pdf'
    fileType = 'PDF'
  } else if (configuredFileType.toLowerCase() === 'image') {
    previewType = 'image'
  } else if (configuredFileType.toLowerCase() === 'video') {
    previewType = 'video'
  } else if (configuredFileType.toLowerCase() === 'pdf') {
    previewType = 'pdf'
  }

  return {
    id: attachment.uploadId || attachment.requirementId || `attachment-${index}`,
    title: attachment.label || attachment.fileName || `Attachment ${index + 1}`,
    fileType,
    meta: fileName || (configuredFileType.toLowerCase() === 'link' ? 'Submitted link' : 'Submitted file'),
    mimeType: attachment.mimeType,
    previewLabel: configuredFileType.toLowerCase() === 'link' ? 'Open link' : 'View attachment',
    previewType,
    src: attachment.url,
  }
}

function AttachmentPreview({ attachment }) {
  if (!attachment) return null

  if (attachment.previewType === 'image') {
    return <img src={attachment.src} alt={`${attachment.title} preview`} />
  }

  if (attachment.previewType === 'video') {
    return (
      <video controls poster={attachment.poster}>
        <source src={attachment.src} type={attachment.mimeType || 'video/mp4'} />
        <track kind="captions" label="English captions" />
      </video>
    )
  }

  if (attachment.previewType === 'pdf') {
    return <iframe src={attachment.src} title={`${attachment.title} PDF preview`} />
  }

  return (
    <div className="business-review-attachment-preview-empty">
      <FiFileText aria-hidden="true" />
      <p>This file type cannot be previewed inline.</p>
      <a href={attachment.src} target="_blank" rel="noreferrer">Open file</a>
    </div>
  )
}

function ApplicationNegotiationModal({ application, onClose, onCounterOffer, opportunityBudgetAmount = 0 }) {
  const [counterAmount, setCounterAmount] = useState('')
  const [isCounterOffering, setIsCounterOffering] = useState(false)
  const [counterError, setCounterError] = useState('')
  const [counterNotice, setCounterNotice] = useState('')
  const [autoRejectOnDecline, setAutoRejectOnDecline] = useState(true)
  const [latestCounterOffer, setLatestCounterOffer] = useState(application?.counterOffer || null)

  if (!application) return null

  const currency = application.currency || 'KES'
  const bidAmount = Number(application.bidAmount || 0)
  const proposedAmount = Number(counterAmount)
  const canProposeOffer = !latestCounterOffer || (
    latestCounterOffer.status === 'rejected'
    && latestCounterOffer.autoRejectOnDecline !== true
    && String(application.statusId || '').toLowerCase() !== 'rejected'
  )
  const canSendOffer = Boolean(
    canProposeOffer
    && onCounterOffer
    && counterAmount.trim()
    && Number.isFinite(proposedAmount)
    && proposedAmount > 0,
  )

  async function sendCounterOffer(event) {
    event.preventDefault()
    if (!counterAmount.trim() || !Number.isFinite(proposedAmount) || proposedAmount <= 0) {
      setCounterError('Enter a valid amount greater than zero.')
      return
    }
    if (bidAmount && proposedAmount >= bidAmount) {
      setCounterError(`Enter an amount lower than the student's ${currency} ${bidAmount.toLocaleString()} bid.`)
      return
    }
    if (opportunityBudgetAmount > 0 && proposedAmount <= opportunityBudgetAmount) {
      setCounterError(`Enter an amount above your original ${currency} ${opportunityBudgetAmount.toLocaleString()} budget.`)
      return
    }

    setIsCounterOffering(true)
    setCounterError('')
    setCounterNotice('')
    try {
      const result = await onCounterOffer(application.id, proposedAmount, { autoRejectOnDecline })
      setLatestCounterOffer(result?.counterOffer || {
        amount: proposedAmount,
        autoRejectOnDecline,
        currency,
        status: 'pending',
      })
      setCounterAmount('')
      setCounterNotice('Offer sent. The student was notified to accept or decline.')
    } catch (error) {
      setCounterError(error instanceof Error ? error.message : 'Could not send the offer.')
    } finally {
      setIsCounterOffering(false)
    }
  }

  return (
    <div className="business-review-modal-backdrop" role="presentation">
      <section
        className="business-review-negotiation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="application-negotiation-title"
      >
        <header>
          <div>
            <span aria-hidden="true"><FiDollarSign /></span>
            <div>
              <h2 id="application-negotiation-title">Negotiate application</h2>
              <p>Propose a new price without leaving the applications list.</p>
            </div>
          </div>
          <button type="button" aria-label="Close price negotiation" onClick={onClose}>
            <FiX aria-hidden="true" />
          </button>
        </header>

        <div className="business-review-negotiation-body">
          <section className="business-review-negotiation-applicant">
            <img src={application.avatar} alt="" />
            <div>
              <strong>{application.creator}</strong>
              <span>{application.handle}</span>
            </div>
          </section>

          <dl className="business-review-negotiation-summary">
            <div>
              <dt>Student&apos;s bid</dt>
              <dd>{currency} {bidAmount.toLocaleString()}</dd>
            </div>
            <div>
              <dt>Opportunity budget</dt>
              <dd>{opportunityBudgetAmount > 0 ? `${currency} ${opportunityBudgetAmount.toLocaleString()}` : 'Not specified'}</dd>
            </div>
          </dl>

          {latestCounterOffer ? (
            <p className={`business-review-counter-status is-${latestCounterOffer.status || 'pending'}`}>
              Latest offer: {latestCounterOffer.currency || currency} {Number(latestCounterOffer.amount || 0).toLocaleString()}
              {' · '}{latestCounterOffer.status === 'accepted'
                ? 'Accepted by student'
                : latestCounterOffer.status === 'rejected'
                  ? 'Declined by student'
                  : 'Awaiting student response'}
            </p>
          ) : null}

          {canProposeOffer ? (
            <form className="business-review-negotiation-form" onSubmit={sendCounterOffer}>
            <label htmlFor={`counter-offer-${application.id}`}>
              <span>Your proposed amount</span>
              <div>
                <strong>{currency}</strong>
                <input
                  id={`counter-offer-${application.id}`}
                  type="number"
                  min={opportunityBudgetAmount > 0 ? opportunityBudgetAmount + 1 : 1}
                  max={bidAmount > 1 ? bidAmount - 1 : undefined}
                  value={counterAmount}
                  placeholder={opportunityBudgetAmount > 0 ? String(opportunityBudgetAmount) : 'Enter amount'}
                  autoFocus
                  onChange={(event) => {
                    setCounterAmount(event.target.value)
                    setCounterError('')
                    setCounterNotice('')
                  }}
                />
              </div>
            </label>
            {opportunityBudgetAmount > 0 && bidAmount > opportunityBudgetAmount ? (
              <p className="business-review-negotiation-range">
                Valid pushback range: above {currency} {opportunityBudgetAmount.toLocaleString()} and below {currency} {bidAmount.toLocaleString()}.
              </p>
            ) : null}
            <label className="business-review-negotiation-auto-reject">
              <input
                type="checkbox"
                checked={autoRejectOnDecline}
                onChange={(event) => setAutoRejectOnDecline(event.target.checked)}
              />
              <span>
                <strong>Automatically reject if the offer is declined</strong>
                <em>The application will move to Rejected immediately, so you won&apos;t need to reject it separately.</em>
              </span>
            </label>
            <p className="business-review-negotiation-notice">The student will receive an in-app notification and can accept or decline this offer.</p>
            {counterError ? <p className="business-review-counter-error" role="alert">{counterError}</p> : null}
            </form>
          ) : (
            <p className="business-review-negotiation-closed" role="status">
              {latestCounterOffer?.status === 'pending'
                ? 'This offer is awaiting the student’s response. You cannot replace it while it is pending.'
                : latestCounterOffer?.status === 'accepted'
                  ? 'The student accepted this offer. Price negotiation is complete.'
                  : 'This application was auto-rejected when the offer was declined. No further offers can be sent.'}
            </p>
          )}
          {counterNotice ? <p className="business-review-counter-notice" role="status">{counterNotice}</p> : null}
        </div>

        <footer>
          <Button tone="ghost" disabled={isCounterOffering} onClick={onClose}>{canProposeOffer ? 'Cancel' : 'Close'}</Button>
          {canProposeOffer ? (
            <Button tone="brand" disabled={isCounterOffering || !canSendOffer} onClick={sendCounterOffer}>
              <FiSend aria-hidden="true" />
              {isCounterOffering ? 'Sending offer...' : latestCounterOffer ? 'Send new offer' : 'Send offer'}
            </Button>
          ) : null}
        </footer>
      </section>
    </div>
  )
}

function ApplicationReviewModal({ application, initialStep = 'review', onClose, onScheduleInterview, onStartInterview, onAccept, onRequestEscrowTopUp, opportunityBudgetAmount = 0 }) {
  const [reviewStep, setReviewStep] = useState(initialStep)
  const [previewAttachment, setPreviewAttachment] = useState(null)
  const [isAccepting, setIsAccepting] = useState(false)
  const [acceptError, setAcceptError] = useState('')
  const [interviewType, setInterviewType] = useState('video')
  const [interviewDate, setInterviewDate] = useState(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().slice(0, 10)
  })
  const [interviewTime, setInterviewTime] = useState('11:00')
  const [interviewDuration, setInterviewDuration] = useState('30')
  const [meetingOption, setMeetingOption] = useState('generated')
  const [customMeetingUrl, setCustomMeetingUrl] = useState('')
  const [interviewNote, setInterviewNote] = useState('')
  const [isSchedulingInterview, setIsSchedulingInterview] = useState(false)
  const [isStartingInterview, setIsStartingInterview] = useState(false)
  const [scheduleError, setScheduleError] = useState('')
  const [scheduledInterview, setScheduledInterview] = useState(null)

  if (!application) return null

  const isScheduling = reviewStep === 'schedule'
  const interviewStatus = String(application.interview?.status || '').toLowerCase()
  const hasInterview = Boolean(application.interview)
  const canStartInterview = interviewStatus === 'confirmed' && Boolean(application.interview?.meetingUrl)
  const qualificationAnswers = application.questionAnswers
  const submittedAttachments = application.attachments.map(toSubmittedAttachment)
  const currency = application.currency || 'KES'
  const bidAmount = Number(application.bidAmount || 0)
  const isAboveBudget = opportunityBudgetAmount > 0 && bidAmount > opportunityBudgetAmount
  const escrowShortfall = isAboveBudget ? bidAmount - opportunityBudgetAmount : 0
  const escrowShortfallMessage = isAboveBudget
    ? `This applicant's agreed price (${currency} ${bidAmount.toLocaleString()}) is more than the ${currency} ${opportunityBudgetAmount.toLocaleString()} funded in escrow. Add funds to cover it before awarding.`
    : ''
  const existingCounterOffer = application.counterOffer

  async function acceptApplication() {
    if (!onAccept) return
    // Agreed price exceeds the escrow balance — route to the escrow top-up flow
    // instead of failing the award. The shortfall is shown at the top of that modal.
    if (isAboveBudget && onRequestEscrowTopUp) {
      onRequestEscrowTopUp({ amount: escrowShortfall, applicationId: application.id, message: escrowShortfallMessage })
      onClose()
      return
    }
    setIsAccepting(true)
    setAcceptError('')
    try {
      await onAccept(application.id)
      onClose()
    } catch (error) {
      setAcceptError(error instanceof Error ? error.message : 'Could not accept this applicant.')
    } finally {
      setIsAccepting(false)
    }
  }

  async function startInterview() {
    if (!application.interview?.meetingUrl) return
    window.open(application.interview.meetingUrl, '_blank', 'noopener,noreferrer')
    setIsStartingInterview(true)
    setScheduleError('')
    try {
      await onStartInterview(application.id)
    } catch (error) {
      setScheduleError(error instanceof Error ? error.message : 'Could not start the interview.')
    } finally {
      setIsStartingInterview(false)
    }
  }

  async function scheduleInterview() {
    if (meetingOption === 'custom' && !customMeetingUrl.trim()) {
      setScheduleError('Enter the custom meeting link.')
      return
    }

    setIsSchedulingInterview(true)
    setScheduleError('')
    try {
      const result = await onScheduleInterview(application.id, {
        interviewType,
        interviewAt: new Date(`${interviewDate}T${interviewTime}:00`).toISOString(),
        durationMinutes: Number(interviewDuration),
        timezone: 'Africa/Nairobi',
        meetingOption: interviewType === 'audio' ? 'phone' : meetingOption,
        meetingUrl: meetingOption === 'custom' ? customMeetingUrl.trim() : undefined,
        note: interviewNote.trim() || undefined,
      })
      setScheduledInterview(result?.interview || result)
    } catch (error) {
      setScheduleError(error instanceof Error ? error.message : 'Could not schedule the interview.')
    } finally {
      setIsSchedulingInterview(false)
    }
  }

  return (
    <div className="business-review-modal-backdrop" role="presentation">
      <section className="business-review-application-modal" role="dialog" aria-modal="true" aria-labelledby="application-review-title">
        <header>
          <div>
            <h2 id="application-review-title">
              {isScheduling ? 'Shortlist & Schedule Interview' : 'Review Application'}
            </h2>
            <p>
              {isScheduling
                ? `You're about to shortlist ${application.creator} and schedule an interview.`
                : "Review the creator's profile, competitiveness and application details."}
            </p>
          </div>
          <button type="button" aria-label="Close application review" onClick={onClose}>
            <FiX aria-hidden="true" />
          </button>
        </header>

        <div className="business-review-application-modal-body">
          <aside className="business-review-application-profile">
            <section className="business-profile-card">
              <div className="business-review-applicant-head">
                <img src={application.avatar} alt={`${application.creator} avatar`} />
                <div>
                  <h3>{application.creator} <StatusPill tone={application.tone}>{application.status}</StatusPill></h3>
                  <p>{application.handle}</p>
                </div>
              </div>
              <div className="business-review-applicant-meta">
                <span><FiMapPin aria-hidden="true" /> {application.location}</span>
                <span><FiCalendar aria-hidden="true" /> Joined {application.joined}</span>
              </div>
              <p>{application.bio}</p>
              <dl className="business-review-applicant-stats">
                <div><dt>{application.score}/100</dt><dd>Zumbarl score</dd></div>
                <div><dt>{application.completedGigs}</dt><dd>Completed gigs</dd></div>
                <div><dt>{application.skills.length}</dt><dd>Verified skills</dd></div>
              </dl>
              <div className="business-review-applicant-platforms">
                <h4>Profile</h4>
                <span>{application.course}</span>
                <span>{application.campus}</span>
              </div>
            </section>

            <section className="business-profile-card business-review-applicant-mini-card">
              <header>
                <h3>Jobs Done</h3>
                <span>{application.completedGigs}</span>
              </header>
              <p>Completed Campaigns</p>
              <Link className="ui-button is-ghost" to="/business/applicant-profile">View Portfolio</Link>
            </section>

            <section className="business-profile-card business-review-applicant-score">
              <h3>Generally Competitiveness</h3>
              <div>
                <figure><span>{application.score}/100</span></figure>
                <p><StatusPill tone={application.score >= 70 ? 'green' : 'orange'}>{application.score >= 70 ? 'High' : 'Developing'}</StatusPill>Calculated from the student&apos;s current Zumbarl score.</p>
              </div>
              <button type="button">See how score is calculated</button>
            </section>
          </aside>

          {isScheduling ? (
            <section className="business-review-schedule-panel">
              <div className="business-review-schedule-notice">
                <FiCheckCircle aria-hidden="true" />
                <p>
                  <strong>{scheduledInterview ? `${application.creator} was shortlisted and notified.` : `${application.creator} will be moved to Shortlisted.`}</strong>
                  <span>{scheduledInterview ? 'The student can RSVP, suggest a new time, or cancel with a note.' : 'An email and in-app notification will be sent when you schedule.'}</span>
                </p>
              </div>

              {!scheduledInterview ? (
                <>
                <section className="business-review-schedule-section">
                <h3>1. Interview Type</h3>
                <div className="business-review-interview-type-grid">
                  <label className={interviewType === 'video' ? 'is-selected' : ''}>
                    <input type="radio" name="interview-type" checked={interviewType === 'video'} onChange={() => setInterviewType('video')} />
                    <span><FiVideo aria-hidden="true" /></span>
                    <strong>Video Call</strong>
                    <em>Generated room or custom meeting link</em>
                  </label>
                  <label className={interviewType === 'audio' ? 'is-selected' : ''}>
                    <input type="radio" name="interview-type" checked={interviewType === 'audio'} onChange={() => setInterviewType('audio')} />
                    <span><FiPhone aria-hidden="true" /></span>
                    <strong>Audio Call</strong>
                    <em>Phone call interview</em>
                  </label>
                </div>
              </section>

              <section className="business-review-schedule-section">
                <h3>2. Interview Details</h3>
                <div className="business-review-schedule-fields">
                  <label><span>Date</span><input type="date" required value={interviewDate} onChange={(event) => setInterviewDate(event.target.value)} /></label>
                  <label><span>Time</span><input type="time" required value={interviewTime} onChange={(event) => setInterviewTime(event.target.value)} /></label>
                  <label><span>Duration</span><select value={interviewDuration} onChange={(event) => setInterviewDuration(event.target.value)}><option value="15">15 mins</option><option value="30">30 mins</option><option value="45">45 mins</option><option value="60">60 mins</option></select></label>
                  <label><span>Time Zone</span><select value="Africa/Nairobi" disabled><option value="Africa/Nairobi">EAT (UTC+3)</option></select></label>
                </div>
              </section>

              <section className="business-review-schedule-section">
                <h3>3. Interviewers</h3>
                <div className="business-review-interviewers">
                  <PersonRow avatar="/assets/index/business_page_images/optimized/omar-lopez-1qfy-jDc_jo-unsplash.webp" name="Brian Mwangi" subtitle="Owner" />
                  <PersonRow avatar="/assets/index/business_page_images/optimized/bruno-ngarukiye-IzEcrYJ1G34-unsplash.webp" name="Kevin The Creator" subtitle="Creator Manager" />
                  <button type="button"><FiPlus aria-hidden="true" /> Add interviewer</button>
                </div>
              </section>

              {interviewType === 'video' ? (
                <section className="business-review-schedule-section">
                <h3>4. Meeting Link (Optional)</h3>
                <label className="business-review-radio-row"><input type="radio" name="meeting-link" checked={meetingOption === 'generated'} onChange={() => setMeetingOption('generated')} /> <span><strong>Generate secure video room</strong><em>A meeting link will be generated and shared.</em></span></label>
                <label className="business-review-radio-row"><input type="radio" name="meeting-link" checked={meetingOption === 'custom'} onChange={() => setMeetingOption('custom')} /> <span><strong>Add custom meeting link</strong></span></label>
                {meetingOption === 'custom' ? (
                  <label className="business-review-custom-meeting-link">
                    <span>Custom meeting URL</span>
                    <input type="url" required value={customMeetingUrl} placeholder="https://meet.google.com/..." onChange={(event) => setCustomMeetingUrl(event.target.value)} />
                  </label>
                ) : null}
                </section>
              ) : null}

              <section className="business-review-schedule-section">
                <h3>5. Add a Note (Optional)</h3>
                <textarea value={interviewNote} placeholder="Add preparation notes or interview context..." onChange={(event) => setInterviewNote(event.target.value)} />
              </section>
              {scheduleError ? <p className="business-review-schedule-error" role="alert">{scheduleError}</p> : null}
                </>
              ) : null}
            </section>
          ) : (
            <section className="business-profile-card business-review-application-form-card">
              <header>
                <div>
                  <h3>Application Form</h3>
                  <p>Submitted on {application.submitted} · {application.submittedAgo}</p>
                </div>
                <StatusPill tone={application.tone}>{application.status}</StatusPill>
              </header>
              <ol>
                <li>
                  <h4>Proposal</h4>
                  <p>{application.proposal || 'No proposal text was provided.'}</p>
                </li>
                <li>
                  <h4>Commercial offer</h4>
                  <p>{currency} {bidAmount.toLocaleString()} · {application.deliveryTime || 'Delivery time not specified'}</p>
                  {isAboveBudget ? (
                    <p className="business-review-above-budget">
                      This bid is above your {currency} {opportunityBudgetAmount.toLocaleString()} budget.
                    </p>
                  ) : null}
                  {existingCounterOffer ? (
                    <p className={`business-review-counter-status is-${existingCounterOffer.status}`}>
                      {existingCounterOffer.status === 'pending'
                        ? `Offer of ${existingCounterOffer.currency || currency} ${Number(existingCounterOffer.amount || 0).toLocaleString()} sent — awaiting the student's response.`
                        : existingCounterOffer.status === 'accepted'
                          ? `Student accepted your offer of ${existingCounterOffer.currency || currency} ${Number(existingCounterOffer.amount || 0).toLocaleString()}.`
                          : `Student declined your offer of ${existingCounterOffer.currency || currency} ${Number(existingCounterOffer.amount || 0).toLocaleString()}.`}
                    </p>
                  ) : null}
                </li>
                {application.coverNote ? (
                  <li>
                    <h4>Message to the business</h4>
                    <p>{application.coverNote}</p>
                  </li>
                ) : null}
              </ol>

              {qualificationAnswers.length ? (
                <section className="business-review-qualification-answers">
                  <header>
                    <h3>Application Answers</h3>
                    <p>Answers to the questions configured for this opportunity.</p>
                  </header>
                  <div>
                    {qualificationAnswers.map((item, index) => (
                      <article key={`${item.question}-${index}`}>
                        <span aria-hidden="true"><FiCheckCircle /></span>
                        <div>
                          <h4>{item.question}</h4>
                          <p>{item.answer}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              {submittedAttachments.length ? (
                <section className="business-review-application-attachments">
                  <header>
                    <h3>Submitted Attachments</h3>
                    <p>Files and links saved with this application.</p>
                  </header>
                  <div>
                    {submittedAttachments.map((attachment) => (
                      <article key={attachment.id}>
                        <span aria-hidden="true">
                          {attachment.previewType === 'video' ? <FiVideo /> : attachment.previewType === 'image' ? <FiImage /> : <FiFileText />}
                        </span>
                        <div>
                          <h4>{attachment.title}</h4>
                          <p>{attachment.fileType} · {attachment.meta}</p>
                        </div>
                        <button type="button" onClick={() => setPreviewAttachment(attachment)}>
                          <FiEye aria-hidden="true" />
                          {attachment.previewLabel}
                        </button>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}
            </section>
          )}
        </div>

        {previewAttachment ? (
          <section className="business-review-attachment-preview-modal" role="dialog" aria-modal="true" aria-labelledby="attachment-preview-title">
            <header>
              <div>
                <h3 id="attachment-preview-title">{previewAttachment.title}</h3>
                <p>{previewAttachment.fileType} attachment preview</p>
              </div>
              <button type="button" aria-label="Close attachment preview" onClick={() => setPreviewAttachment(null)}>
                <FiX aria-hidden="true" />
              </button>
            </header>
            <div>
              <AttachmentPreview attachment={previewAttachment} />
            </div>
            <footer>
              <a href={previewAttachment.src} target="_blank" rel="noreferrer">
                <FiDownload aria-hidden="true" />
                Open original
              </a>
              <Button tone="ghost" onClick={() => setPreviewAttachment(null)}>Close preview</Button>
            </footer>
          </section>
        ) : null}

        <footer>
          {isScheduling ? (
            <>
              <Button tone="ghost" onClick={onClose}>{scheduledInterview ? 'Close' : 'Cancel'}</Button>
              {!scheduledInterview ? (
                <>
                  <Button tone="ghost" onClick={() => setReviewStep('review')}>Back</Button>
                  <Button tone="brand" disabled={isSchedulingInterview} onClick={scheduleInterview}>
                    {isSchedulingInterview ? 'Scheduling...' : 'Shortlist & Schedule Interview'}
                  </Button>
                </>
              ) : null}
            </>
          ) : (
            <>
              <Button tone="ghost" onClick={onClose}>Close</Button>
              <Button className="business-review-modal-reject" tone="ghost">Reject</Button>
              {!hasInterview ? (
                <Button className="business-review-modal-shortlist" tone="ghost" onClick={() => setReviewStep('schedule')}>Shortlist</Button>
              ) : null}
              {interviewStatus === 'confirmed' ? (
                <Button tone="brand" disabled={!canStartInterview || isStartingInterview} onClick={startInterview}>
                  {isStartingInterview ? 'Starting...' : canStartInterview ? 'Start Interview' : 'Interview Confirmed'}
                </Button>
              ) : null}
              {interviewStatus === 'pending' ? (
                <Button tone="ghost" disabled>Awaiting RSVP</Button>
              ) : null}
              {interviewStatus === 'proposed_new_time' ? (
                <Button tone="brand" onClick={() => setReviewStep('schedule')}>Review Proposed Time</Button>
              ) : null}
              {interviewStatus === 'cancelled' ? (
                <Button tone="brand" onClick={() => setReviewStep('schedule')}>Reschedule Interview</Button>
              ) : null}
              {acceptError ? <span className="business-review-schedule-error" role="alert">{acceptError}</span> : null}
              <Button
                tone="brand"
                disabled={isAccepting || application.statusId === 'accepted'}
                onClick={acceptApplication}
              >
                {application.statusId === 'accepted' ? 'Accepted' : isAccepting ? 'Accepting...' : 'Accept'}
              </Button>
            </>
          )}
        </footer>
      </section>
    </div>
  )
}

const DELIVERABLE_WORKFLOW_OPTIONS = [
  {
    value: 'file-assets',
    label: 'File Asset Deliverables',
    acceptedEvidence: 'PNG, JPG, PDF, SVG, MP4, MOV, AI, PSD, Figma link, or Canva link.',
    type: 'Type 1 - File Asset',
  },
  {
    value: 'code-development',
    label: 'Code & Development Deliverables',
    acceptedEvidence: 'GitHub repository, commit history, live URL, ZIP fallback, test evidence, or Loom walkthrough.',
    type: 'Type 2 - Code & Development',
  },
  {
    value: 'documents',
    label: 'Document Deliverables',
    acceptedEvidence: 'Google Docs link, PDF, DOCX, report, script, proposal, source notes, or originality evidence.',
    type: 'Type 3 - Document',
  },
  {
    value: 'stats-metrics',
    label: 'Stats & Metrics Deliverables',
    acceptedEvidence: 'Analytics screenshots, CSV export, dashboard link, before/after metrics, or verified platform report.',
    type: 'Type 4 - Stats & Metrics',
  },
  {
    value: 'proof-based',
    label: 'Proof-Based Deliverables',
    acceptedEvidence: 'Geo-tagged photos, timestamped screenshots, signed confirmation, location proof, or recipient proof.',
    type: 'Type 5 - Proof-Based',
  },
  {
    value: 'hybrid',
    label: 'Hybrid Deliverables',
    acceptedEvidence: 'A combined package of files, links, proof, metrics, and supporting notes needed for approval.',
    type: 'Type 6 - Hybrid',
  },
]

const NEW_DELIVERABLE_TEMPLATE = {
  acceptanceCriteria: 'No watermarks, follows brand assets, and includes editable source files for work above KES 5,000.',
  budget: '6,000',
  lockedUntilApproved: true,
  requirement: 'Design and upload the final campaign graphics plus editable source files.',
  title: 'Create branded social media assets',
  workflow: 'file-assets',
}

function getDeliverableWorkflow(workflowValue, deliverableType = '') {
  const matchedWorkflow = DELIVERABLE_WORKFLOW_OPTIONS.find((workflow) => workflow.value === workflowValue)
  if (matchedWorkflow) return matchedWorkflow

  const matchedType = DELIVERABLE_WORKFLOW_OPTIONS.find((workflow) => deliverableType.includes(workflow.type.replace(/^Type \d - /, '')))
  return matchedType || DELIVERABLE_WORKFLOW_OPTIONS[0]
}

function getDeliverablePaymentPercent(draft, drafts) {
  const totalBudget = drafts.reduce((sum, item) => sum + Number(String(item.budget).replace(/,/g, '') || 0), 0)
  const draftBudget = Number(String(draft.budget).replace(/,/g, '') || 0)

  if (!totalBudget) return Math.round(100 / drafts.length)

  return Math.round((draftBudget / totalBudget) * 100)
}

function createDeliverableDraft(index = 0) {
  return {
    ...NEW_DELIVERABLE_TEMPLATE,
    id: `draft-deliverable-${Date.now()}-${index}`,
    title: index ? `New Deliverable ${index + 1}` : NEW_DELIVERABLE_TEMPLATE.title,
  }
}

// The scope is reference material - read once when setting expectations, not
// every time you open the deliverable. It sits behind a button so the live work
// (tasks, workload, thread) is what the page actually opens on.
// Releasing the budget is offered only when the team has actually finished the
// deliverable: every declared task approved and nothing still blocked. The
// button stays visible but disabled when it is not, so the business can see what
// is outstanding rather than wondering where the action went.
function CompleteAndPayButton({ completion, isCompleted, isCompleting, onComplete }) {
  if (isCompleted) return <span className="business-review-deliverable-complete-badge">Paid</span>
  if (!completion?.hasTasks) return null

  const reason = completion.blocked
    ? `${completion.blocked} task${completion.blocked === 1 ? '' : 's'} still blocked`
    : completion.pending
      ? `${completion.pending} task${completion.pending === 1 ? '' : 's'} not approved yet`
      : ''

  return (
    <button
      type="button"
      className="business-review-complete-pay-btn"
      disabled={!completion.isReady || isCompleting}
      title={reason || 'Release this deliverable\u2019s budget, split by workload'}
      onClick={onComplete}
    >
      {isCompleting ? 'Completing…' : 'Complete & pay'}
      {reason ? <em>{reason}</em> : null}
    </button>
  )
}

function DeliverableScopeModal({ deliverable, onClose }) {
  const workflow = getDeliverableWorkflow(deliverable.workflow, deliverable.type)

  return (
    <div className="business-review-modal-backdrop" role="presentation">
      <section
        className="business-review-deliverable-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="deliverable-scope-title"
      >
        <header>
          <div>
            <h2 id="deliverable-scope-title">{deliverable.title}</h2>
            <p>Deliverable scope details from the opportunity setup.</p>
          </div>
          <button type="button" aria-label="Close scope details" onClick={onClose}>
            <FiX aria-hidden="true" />
          </button>
        </header>

        <div className="business-review-deliverable-details-body">
          <section>
            <h3>Deliverable Summary</h3>
            <dl>
              <div><dt>Workflow</dt><dd>{deliverable.workflowLabel || workflow.label}</dd></div>
              <div><dt>Accepted evidence</dt><dd>{deliverable.acceptedEvidence || workflow.acceptedEvidence}</dd></div>
              <div><dt>Budget</dt><dd>{deliverable.budget || 'Not assigned'}</dd></div>
              <div><dt>Payment %</dt><dd>{deliverable.paymentPercent || 'Calculated from budget'}</dd></div>
              <div><dt>Status</dt><dd><StatusPill tone={deliverable.tone}>{deliverable.status}</StatusPill></dd></div>
              <div><dt>Submission lock</dt><dd>{deliverable.lockedUntilApproved ? 'Locks later deliverables' : 'No sequencing lock'}</dd></div>
            </dl>
          </section>

          <section>
            <h3>Deliverable Requirement</h3>
            <p>{deliverable.requirement || deliverable.description}</p>
          </section>

          <section>
            <h3>Acceptance Criteria</h3>
            <p>{deliverable.acceptanceCriteria}</p>
          </section>

          <section>
            <h3>Student Submission Rules</h3>
            <p>{deliverable.lockedUntilApproved ? 'Later deliverable submissions stay locked until this deliverable is approved.' : 'Students can submit later deliverables without waiting for this one to be approved.'}</p>
          </section>
        </div>

        <footer>
          <Button tone="ghost" onClick={onClose}>Close</Button>
        </footer>
      </section>
    </div>
  )
}

function DeliverableDetailPanel({
  completion,
  deliverable,
  deliverableTasks,
  isCompleted = false,
  isCompleting = false,
  onClose,
  onComplete,
  onOpenSubmission,
  projectId = null,
  submissions = [],
}) {
  const [isScopeOpen, setIsScopeOpen] = useState(false)

  if (!deliverable) return null

  return (
    <div className="business-review-deliverable-detail">
      <section className="business-review-deliverable-details-inline" aria-labelledby="deliverable-details-title">
        <header>
          <div>
            <button type="button" className="business-review-deliverable-back" onClick={onClose}>
              ← All deliverables
            </button>
            <h2 id="deliverable-details-title">{deliverable.title}</h2>
            <p>{deliverable.description || 'How the team is building this deliverable.'}</p>
          </div>
          <div className="business-review-deliverable-detail-actions">
            <button type="button" className="business-review-scope-btn" onClick={() => setIsScopeOpen(true)}>
              <FiEye aria-hidden="true" />
              Scope details
            </button>
            {onComplete ? (
              <CompleteAndPayButton
                completion={completion}
                isCompleted={isCompleted}
                isCompleting={isCompleting}
                onComplete={onComplete}
              />
            ) : null}
          </div>
        </header>

        <div className="business-review-deliverable-details-body">
          {projectId ? (
            <DeliverableWorkloadPanel
              deliverable={deliverable}
              deliverableTasks={deliverableTasks}
              projectId={projectId}
              submissions={submissions}
              onOpenSubmission={onOpenSubmission}
            />
          ) : (
            <p className="business-review-empty-note">
              Task and workload detail appears once this deliverable is part of an awarded team project.
            </p>
          )}
        </div>
      </section>

      {isScopeOpen ? (
        <DeliverableScopeModal deliverable={deliverable} onClose={() => setIsScopeOpen(false)} />
      ) : null}
    </div>
  )
}

function AddDeliverableModal({ isOpen, onClose, onCreate }) {
  const [activeTab, setActiveTab] = useState('deliverables')
  const [drafts, setDrafts] = useState(() => [createDeliverableDraft()])

  if (!isOpen) return null

  const totalBudget = drafts.reduce((sum, draft) => sum + Number(String(draft.budget).replace(/,/g, '') || 0), 0)

  function updateDraft(id, field, value) {
    setDrafts((items) => items.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  function addDraft() {
    setDrafts((items) => [...items, createDeliverableDraft(items.length)])
  }

  function removeDraft(id) {
    setDrafts((items) => (items.length > 1 ? items.filter((item) => item.id !== id) : items))
  }

  function handleClose() {
    setActiveTab('deliverables')
    setDrafts([createDeliverableDraft()])
    onClose()
  }

  function handleCreate() {
    onCreate(drafts)
    handleClose()
  }

  return (
    <div className="business-review-modal-backdrop" role="presentation">
      <section className="business-review-add-deliverable-modal" role="dialog" aria-modal="true" aria-labelledby="add-deliverable-title">
        <header>
          <div>
            <h2 id="add-deliverable-title">Add Deliverables</h2>
            <p>{activeTab === 'deliverables' ? 'Add one or more deliverables for creators to submit.' : 'Review the deliverables before creating them.'}</p>
          </div>
          <button type="button" aria-label="Close add deliverable" onClick={handleClose}>
            <FiX aria-hidden="true" />
          </button>
        </header>

        <TabNav
          activeId={activeTab}
          ariaLabel="Add deliverable steps"
          className="business-review-add-tabs"
          items={[
            { id: 'deliverables', label: 'Deliverables' },
            { id: 'review', label: 'Review' },
          ]}
          onChange={setActiveTab}
        />

        <div className="business-review-add-deliverable-body">
          {activeTab === 'deliverables' ? (
            <>
              {drafts.map((draft, index) => (
                <section key={draft.id} className="business-review-add-draft-card">
                  <header>
                    <div>
                      <p>Deliverable {index + 1}</p>
                      <h3>{draft.title}</h3>
                    </div>
                    <button type="button" aria-label={`Remove deliverable ${index + 1}`} onClick={() => removeDraft(draft.id)}>
                      <FiX aria-hidden="true" />
                    </button>
                  </header>

                  <div className="business-review-add-two-column">
                    <label className="business-review-add-field">
                      <span>Deliverable Workflow</span>
                      <select value={draft.workflow} onChange={(event) => updateDraft(draft.id, 'workflow', event.target.value)}>
                        {DELIVERABLE_WORKFLOW_OPTIONS.map((workflow) => (
                          <option key={workflow.value} value={workflow.value}>{workflow.label}</option>
                        ))}
                      </select>
                      <small>{getDeliverableWorkflow(draft.workflow).acceptedEvidence}</small>
                    </label>
                    <label className="business-review-add-field">
                      <span>Title</span>
                      <input type="text" value={draft.title} onChange={(event) => updateDraft(draft.id, 'title', event.target.value)} />
                    </label>
                  </div>

                  <label className="business-review-add-field">
                    <span>Deliverable Requirement</span>
                    <textarea value={draft.requirement} onChange={(event) => updateDraft(draft.id, 'requirement', event.target.value)} />
                  </label>

                  <div className="business-review-add-two-column">
                    <label className="business-review-add-field">
                      <span>Budget (KES)</span>
                      <input type="text" value={draft.budget} onChange={(event) => updateDraft(draft.id, 'budget', event.target.value)} />
                    </label>
                    <label className="business-review-add-field">
                      <span>Payment %</span>
                      <input type="text" value={getDeliverablePaymentPercent(draft, drafts)} readOnly />
                      <small>Recalculates based on total deliverables</small>
                    </label>
                  </div>

                  <label className="business-review-add-field">
                    <span>Acceptance Criteria</span>
                    <textarea value={draft.acceptanceCriteria} onChange={(event) => updateDraft(draft.id, 'acceptanceCriteria', event.target.value)} />
                  </label>

                  <label className="business-review-add-lock">
                    <input
                      type="checkbox"
                      checked={draft.lockedUntilApproved}
                      onChange={(event) => updateDraft(draft.id, 'lockedUntilApproved', event.target.checked)}
                    />
                    <span>Lock later deliverable submissions until this deliverable is approved</span>
                  </label>
                </section>
              ))}
              <button type="button" className="business-review-add-more-deliverable" onClick={addDraft}>
                <FiPlus aria-hidden="true" />
                Add another deliverable
              </button>
            </>
          ) : null}

          {activeTab === 'review' ? (
            <section className="business-review-add-review">
              <h3>Review New Deliverables</h3>
              <p>{drafts.length} deliverable{drafts.length === 1 ? '' : 's'} will be created and added to this opportunity.</p>
              {drafts.map((draft, index) => (
                <article key={draft.id}>
                  <span>{index + 1}</span>
                  <div>
                    <strong>{draft.title}</strong>
                    <p>{getDeliverableWorkflow(draft.workflow).label} · {getDeliverableWorkflow(draft.workflow).acceptedEvidence}</p>
                    <em>{draft.requirement}</em>
                  </div>
                  <strong>{getDeliverablePaymentPercent(draft, drafts)}%</strong>
                  <b>KES {Number(String(draft.budget).replace(/,/g, '') || 0).toLocaleString()}</b>
                </article>
              ))}
              <footer><span>Total budget to approve</span><strong>KES {totalBudget.toLocaleString()}</strong></footer>
            </section>
          ) : null}
        </div>

        <footer>
          <Button tone="ghost" onClick={activeTab === 'deliverables' ? handleClose : () => setActiveTab('deliverables')}>{activeTab === 'deliverables' ? 'Cancel' : 'Back'}</Button>
          <Button tone="brand" onClick={activeTab === 'review' ? handleCreate : () => setActiveTab('review')}>
            {activeTab === 'deliverables' ? 'Review Deliverables' : 'Create Deliverables'}
          </Button>
        </footer>
      </section>
    </div>
  )
}

function PublishOpportunityModal({ fundingAmount = 0, noticeMessage = '', isOpen, mode = 'publish', opportunity, type, onClose, onFund, onPublish }) {
  const [publishStep, setPublishStep] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('wallet')
  const [selectedCardId, setSelectedCardId] = useState('visa-8421')
  const [isCompletingPayment, setIsCompletingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [paymentReference] = useState(() => `opportunity-payment-${opportunity?.backendId || opportunity?.id || 'draft'}-${Date.now()}`)

  if (!isOpen) return null

  const isEscrowTopUp = mode === 'topup'

  const paymentMethods = {
    wallet: {
      actionLabel: 'Pay with Wallet',
      amountCopy: 'This amount will be deducted from your Zumbarl wallet balance and held in escrow.',
      detailCopy: 'Confirm that you want to fund this opportunity from your wallet.',
      detailTitle: 'Use your Zumbarl wallet balance',
      label: 'Zumbarl Wallet',
      meta: 'Available Balance: KES 32,450',
      nextLabel: 'Next: Wallet Confirmation',
      stepLabel: 'Wallet Confirmation',
      summary: 'Fund escrow instantly from your Zumbarl wallet.',
    },
    'mobile-money': {
      actionLabel: 'Send STK Push',
      amountCopy: 'This amount will be requested through M-Pesa STK push.',
      detailCopy: 'Enter your phone number to receive the payment request.',
      detailTitle: 'You will receive an STK push on your registered phone number',
      label: 'Mobile Money STK Push',
      meta: 'M-Pesa request sent to your phone',
      nextLabel: 'Next: STK Push',
      stepLabel: 'STK Push',
      summary: 'Complete payment from your phone.',
    },
    bank: {
      actionLabel: 'Confirm Bank Transfer',
      amountCopy: 'Transfer this amount to the Zumbarl escrow account and upload the payment reference.',
      detailCopy: 'Use the reference below so finance can match your transfer to this opportunity.',
      detailTitle: 'Make a bank transfer to Zumbarl escrow',
      label: 'Bank Transfer',
      meta: 'Manual transfer, reviewed by finance',
      nextLabel: 'Next: Bank Details',
      stepLabel: 'Bank Details',
      summary: 'Send payment directly to our bank account.',
    },
    card: {
      actionLabel: 'Pay with Card',
      amountCopy: 'Your card will be charged securely after confirmation.',
      detailCopy: 'Enter card details to complete escrow funding for this opportunity.',
      detailTitle: 'Pay securely with card',
      label: 'Card Payment',
      meta: 'Visa, Mastercard and supported cards',
      nextLabel: 'Next: Card Checkout',
      stepLabel: 'Card Checkout',
      summary: 'Complete payment with a debit or credit card.',
    },
  }
  const selectedPaymentMethod = paymentMethods[paymentMethod]
  const paymentScopeItems = isEscrowTopUp ? [] : getOpportunityPaymentScopeItems(opportunity)
  const scopedBudgetTotal = paymentScopeItems.reduce((total, item) => total + item.budgetAmount, 0)
  const fallbackBudgetTotal = getCurrencyAmount(opportunity.budget || opportunity.budgetAmount)
  const paymentBudgetTotal = isEscrowTopUp ? Number(fundingAmount || 0) : scopedBudgetTotal || fallbackBudgetTotal
  const paymentBudgetLabel = formatKesAmount(paymentBudgetTotal)
  const skills = getSkillList(opportunity)
  const modalObjective = opportunity.opportunityType || type
  const modalDeadline = opportunity.deadline === 'Rolling' ? 'Rolling' : formatOpportunityDate(opportunity.deadline, 'Rolling')
  const savedCards = [
    { id: 'visa-8421', label: 'Visa ending 8421', meta: 'Expires 08/28', brand: 'Visa' },
    { id: 'mastercard-1134', label: 'Mastercard ending 1134', meta: 'Expires 11/27', brand: 'Mastercard' },
  ]

  async function completePaymentAndPublish() {
    if (isCompletingPayment) return
    setIsCompletingPayment(true)
    setPaymentError('')
    try {
      const completeFunding = isEscrowTopUp ? onFund : onPublish
      await completeFunding?.(opportunity, {
        amount: paymentBudgetTotal,
        currency: opportunity.currency || 'KES',
        reference: paymentReference,
      })
      onClose()
    } catch (error) {
      setPaymentError(error instanceof Error
        ? error.message
        : isEscrowTopUp ? 'Escrow could not be updated.' : 'Payment could not be completed. The opportunity remains private.')
    } finally {
      setIsCompletingPayment(false)
    }
  }

  return (
    <div className="business-review-modal-backdrop" role="presentation">
      <section className="business-review-publish-modal" role="dialog" aria-modal="true" aria-labelledby="publish-opportunity-title">
        <button type="button" className="business-review-publish-close" aria-label={isEscrowTopUp ? 'Close escrow update' : 'Close fund and publish opportunity'} onClick={onClose}>
          <FiX aria-hidden="true" />
        </button>

        <header className="business-review-publish-head">
          <h2 id="publish-opportunity-title">{isEscrowTopUp ? 'Update Escrow' : 'Fund & Publish Opportunity'}</h2>
          <p>{isEscrowTopUp
            ? 'Add the remaining agreed amount before starting the project.'
            : 'Pay the opportunity budget into escrow before it becomes visible to students.'}</p>
        </header>

        {noticeMessage ? (
          <p className="business-review-publish-notice" role="alert">{noticeMessage}</p>
        ) : null}

        <ol className="business-review-publish-steps" aria-label="Publish opportunity steps">
          <li className={publishStep === 1 ? 'is-active' : 'is-complete'}><span>{publishStep > 1 ? <FiCheckCircle aria-hidden="true" /> : '1'}</span><strong>{isEscrowTopUp ? 'Escrow Shortfall' : 'Budget & Services'}</strong><em>{isEscrowTopUp ? 'Review amount required' : 'Define budget and services'}</em></li>
          <li className={publishStep === 2 ? 'is-active' : publishStep > 2 ? 'is-complete' : ''}><span>{publishStep > 2 ? <FiCheckCircle aria-hidden="true" /> : '2'}</span><strong>Payment Method</strong><em>Choose payment option</em></li>
          <li className={publishStep === 3 ? 'is-active' : ''}><span>3</span><strong>{selectedPaymentMethod.stepLabel}</strong><em>Complete payment</em></li>
        </ol>

        <div className="business-review-publish-body">
          <section className="business-review-publish-summary">
            <h2>Opportunity Summary</h2>
            <div>
              <figure>
                <img src={getOpportunityCoverImage(opportunity)} alt={`${opportunity.title} cover`} style={getSplashCropStyle(opportunity.opportunitySplash) || undefined} />
                <figcaption>{opportunity.title}</figcaption>
              </figure>
              <dl>
                <div><dt>Type</dt><dd>{type}</dd></div>
                <div><dt>Objective</dt><dd>{modalObjective}</dd></div>
                <div><dt>Category</dt><dd>{opportunity.category || 'Education & Learning'}</dd></div>
              </dl>
              <dl>
                <div><dt>Engagement Mode</dt><dd>{opportunity.engagementMode || 'Remote'}</dd></div>
                <div><dt>Visibility</dt><dd>{isEscrowTopUp ? 'Already published' : 'Visible to all creators'}</dd></div>
                <div><dt>Deadline</dt><dd>{modalDeadline}</dd></div>
              </dl>
              <dl>
                <div><dt>Budget</dt><dd>{paymentBudgetLabel}</dd></div>
                <div><dt>Skills</dt><dd>{skills.length ? skills.slice(0, 3).join(', ') : 'Not specified'}</dd></div>
              </dl>
            </div>
          </section>

          {publishStep === 3 ? (
            <section className="business-review-publish-stk">
              <h2>Payment Details</h2>
              <div className="business-review-publish-stk-grid">
                <div className="business-review-publish-stk-main">
                  <div className="business-review-publish-selected-method">
                    <span><FiCreditCard aria-hidden="true" /></span>
                    <strong>You selected: {selectedPaymentMethod.label}</strong>
                    <em>{selectedPaymentMethod.meta}</em>
                  </div>
                  <section className="business-review-publish-amount">
                    <span>Amount to Pay</span>
                    <strong>{paymentBudgetLabel}</strong>
                    <p>{selectedPaymentMethod.amountCopy}</p>
                  </section>
                  {paymentMethod === 'wallet' ? (
                    <section className="business-review-publish-phone">
                      <header>
                        <FiCreditCard aria-hidden="true" />
                        <div>
                          <strong>{selectedPaymentMethod.detailTitle}</strong>
                          <p>{selectedPaymentMethod.detailCopy}</p>
                        </div>
                      </header>
                      <label>
                        <span>Wallet Balance</span>
                        <div><strong>KES</strong><input type="text" defaultValue="32,450" readOnly /><StatusPill tone="green">Enough funds</StatusPill></div>
                        <em>{paymentBudgetLabel} will move into escrow after confirmation.</em>
                      </label>
                    </section>
                  ) : paymentMethod === 'mobile-money' ? (
                    <section className="business-review-publish-phone">
                      <header>
                        <FiMessageSquare aria-hidden="true" />
                        <div>
                          <strong>{selectedPaymentMethod.detailTitle}</strong>
                          <p>{selectedPaymentMethod.detailCopy}</p>
                        </div>
                      </header>
                      <label>
                        <span>Phone Number</span>
                        <div><strong>KE</strong><input type="text" defaultValue="+254 712 345 678" /><StatusPill tone="green">Verified</StatusPill></div>
                        <em>Make sure this is the number registered with M-Pesa.</em>
                      </label>
                    </section>
                  ) : paymentMethod === 'bank' ? (
                    <section className="business-review-publish-phone">
                      <header>
                        <FiCreditCard aria-hidden="true" />
                        <div>
                          <strong>{selectedPaymentMethod.detailTitle}</strong>
                          <p>{selectedPaymentMethod.detailCopy}</p>
                        </div>
                      </header>
                      <label>
                        <span>Bank Reference</span>
                        <div><strong>REF</strong><input type="text" defaultValue={`ZMB-${String(opportunity.id || 'OPP').slice(-6).toUpperCase()}`} /><StatusPill tone="blue">Required</StatusPill></div>
                        <em>Bank: Zumbarl Escrow Account · Account: 123456789 · Branch: Nairobi</em>
                      </label>
                    </section>
                  ) : (
                    <section className="business-review-publish-phone">
                      <header>
                        <FiCreditCard aria-hidden="true" />
                        <div>
                          <strong>{selectedPaymentMethod.detailTitle}</strong>
                          <p>{selectedPaymentMethod.detailCopy}</p>
                        </div>
                      </header>
                      <div className="business-review-card-selector" role="radiogroup" aria-label="Saved cards">
                        {savedCards.map((card) => (
                          <label key={card.id} className={selectedCardId === card.id ? 'is-selected' : ''}>
                            <input
                              type="radio"
                              name="publish-saved-card"
                              checked={selectedCardId === card.id}
                              onChange={() => setSelectedCardId(card.id)}
                            />
                            <span><strong>{card.brand}</strong>{card.label}</span>
                            <em>{card.meta}</em>
                          </label>
                        ))}
                      </div>
                      <Link to="/business/settings#payment-methods" className="business-review-add-card-link">
                        <FiPlus aria-hidden="true" />
                        Add card in Settings
                      </Link>
                      <p className="business-review-card-note">Card details are managed in business settings and encrypted by the payment provider.</p>
                    </section>
                  )}
                </div>
                <aside className="business-review-publish-phone-preview" aria-label={`${selectedPaymentMethod.stepLabel} preview`}>
                  <div>
                    <span>{selectedPaymentMethod.stepLabel}</span>
                    <strong>Zumbarl<br />{paymentBudgetLabel}</strong>
                    <p>{selectedPaymentMethod.summary}</p>
                  </div>
                  <b><FiLock aria-hidden="true" /></b>
                </aside>
              </div>
            </section>
          ) : publishStep === 2 ? (
            <section className="business-review-publish-payment">
              <h2>Payment Method</h2>
              <p>Select how you would like to pay for this opportunity.</p>
              <div className="business-review-publish-payment-options">
                <label className={paymentMethod === 'wallet' ? 'is-selected' : ''}>
                  <input type="radio" name="publish-payment-method" checked={paymentMethod === 'wallet'} onChange={() => setPaymentMethod('wallet')} />
                  <span><FiCreditCard aria-hidden="true" /></span>
                  <strong>Pay with Wallet <em>(Recommended)</em></strong>
                  <small>Use your existing Zumbarl wallet balance.</small>
                  <b>Available Balance<br />KES 32,450</b>
                </label>
                <label className={paymentMethod === 'mobile-money' ? 'is-selected' : ''}>
                  <input type="radio" name="publish-payment-method" checked={paymentMethod === 'mobile-money'} onChange={() => setPaymentMethod('mobile-money')} />
                  <span><FiCreditCard aria-hidden="true" /></span>
                  <strong>Mobile Money STK Push</strong>
                  <small>Send an M-Pesa payment request to your phone.</small>
                  <b>Processing Time<br />Instant</b>
                </label>
                <label className={paymentMethod === 'bank' ? 'is-selected' : ''}>
                  <input type="radio" name="publish-payment-method" checked={paymentMethod === 'bank'} onChange={() => setPaymentMethod('bank')} />
                  <span><FiCreditCard aria-hidden="true" /></span>
                  <strong>Bank Transfer</strong>
                  <small>Make payment directly to our bank account.</small>
                  <b>Processing Time<br />1-2 hours</b>
                </label>
                <label className={paymentMethod === 'card' ? 'is-selected' : ''}>
                  <input type="radio" name="publish-payment-method" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                  <span><FiCreditCard aria-hidden="true" /></span>
                  <strong>Pay with Card</strong>
                  <small>Pay securely using Visa, Mastercard or other cards.</small>
                  <b>Processing Time<br />Instant</b>
                </label>
              </div>
              <aside>
                <FiMessageSquare aria-hidden="true" />
                <span>{selectedPaymentMethod.summary}</span>
              </aside>
            </section>
          ) : (
            <>
              <section className="business-review-publish-breakdown">
                <header>
                  <div>
                    <h2>{isEscrowTopUp ? 'Escrow Shortfall' : 'Budget & Services Breakdown'}</h2>
                    <p>{isEscrowTopUp
                      ? 'Review the additional amount required to cover the agreed project price.'
                      : 'Review the payment schedule from this opportunity\'s saved scope and budget.'}</p>
                  </div>
                </header>
                <div className="business-review-publish-table">
                  <div className="business-review-publish-table-head">
                    <span>Milestone / Deliverable</span>
                    <span>Description</span>
                    <span>Type</span>
                    <span>Payment Split</span>
                    <span>Total (KES)</span>
                    <span />
                  </div>
                  {paymentScopeItems.length ? paymentScopeItems.map((service, index) => (
                    <article key={service.id} className="business-review-publish-table-row">
                      <div>
                        <DeliverableIcon icon="scope" />
                        <strong>{service.title}</strong>
                      </div>
                      <p>{service.description}</p>
                      <span>{service.typeLabel} {index + 1}</span>
                      <span>{service.paymentPercent ? `${service.paymentPercent}%` : 'Auto'}</span>
                      <strong>{service.budgetAmount.toLocaleString()}</strong>
                      <span />
                    </article>
                  )) : (
                    <article className="business-review-publish-table-row">
                      <div>
                        <DeliverableIcon icon="scope" />
                        <strong>{opportunity.title || 'Opportunity budget'}</strong>
                      </div>
                      <p>{isEscrowTopUp ? 'Additional escrow required before project start.' : 'No scoped deliverables were found, so the saved opportunity budget is being used.'}</p>
                      <span>{isEscrowTopUp ? 'Top-up' : 'Budget'}</span>
                      <span>100%</span>
                      <strong>{paymentBudgetTotal.toLocaleString()}</strong>
                      <span />
                    </article>
                  )}
                </div>
                <footer>
                  <p><span>Subtotal</span><strong>{paymentBudgetLabel}</strong></p>
                </footer>
              </section>

              <section className="business-review-publish-total">
                <span>Total Budget</span>
                <strong>{paymentBudgetLabel}</strong>
                <p>This is derived from the opportunity&apos;s deliverable or milestone budgets.</p>
              </section>
            </>
          )}

          {publishStep === 3 ? (
            <section className="business-review-publish-next">
              <h2>What happens next?</h2>
              <div>
                <article><FiUsers aria-hidden="true" /><span><strong>1. {selectedPaymentMethod.stepLabel} Started</strong><em>{paymentMethod === 'wallet' ? 'We will reserve the amount from your wallet.' : paymentMethod === 'mobile-money' ? 'You will receive an STK push on your phone.' : paymentMethod === 'bank' ? 'Use the bank details and reference shown above.' : 'The secure card checkout is ready.'}</em></span></article>
                <article><FiLock aria-hidden="true" /><span><strong>2. Complete {selectedPaymentMethod.stepLabel}</strong><em>{paymentMethod === 'wallet' ? 'Confirm wallet deduction to fund escrow.' : paymentMethod === 'mobile-money' ? 'Enter your PIN to authorize the payment.' : paymentMethod === 'bank' ? 'Send the transfer and keep the reference visible.' : 'Confirm the secure card payment.'}</em></span></article>
                <article><FiCheckCircle aria-hidden="true" /><span><strong>3. Payment Confirmed</strong><em>{isEscrowTopUp ? 'Escrow will update and project start will become available.' : 'We\'ll confirm payment and publish your opportunity.'}</em></span></article>
              </div>
            </section>
          ) : null}
        </div>

        <footer className="business-review-publish-actions">
          {publishStep > 1 ? (
            <Button tone="ghost" onClick={() => setPublishStep(publishStep - 1)}>Back</Button>
          ) : (
            <Button tone="ghost" onClick={onClose}>Cancel</Button>
          )}
          {publishStep === 3 ? <p><FiMessageSquare aria-hidden="true" /> {isEscrowTopUp
            ? 'Project start becomes available after escrow is updated.'
            : paymentMethod === 'bank' ? 'We will publish after the transfer is confirmed.' : paymentMethod === 'wallet' ? 'Your opportunity will publish after wallet escrow is funded.' : 'You will be redirected after successful payment.'}</p> : null}
          {paymentError ? <p role="alert">{paymentError}</p> : null}
          <Button
            tone="brand"
            disabled={isCompletingPayment || paymentBudgetTotal <= 0}
            onClick={publishStep === 3 ? completePaymentAndPublish : () => setPublishStep(Math.min(3, publishStep + 1))}
          >
            {isCompletingPayment
              ? 'Completing payment...'
              : publishStep === 3 ? selectedPaymentMethod.actionLabel : publishStep === 2 ? selectedPaymentMethod.nextLabel : 'Next: Payment Method'}
          </Button>
        </footer>
      </section>
    </div>
  )
}

function ApplicationsPanel({
  activeApplicationStatus,
  applications,
  applicationsError,
  isLoadingApplications,
  onChangeApplicationStatus,
  onScheduleApplicantInterview,
  onStartApplicantInterview,
  onAwardApplicant,
  onCounterOfferApplicant,
  onRequestEscrowTopUp,
  onSetOpportunityCapacity,
  opportunity,
  projectActionState,
  opportunityBudgetAmount = 0,
}) {
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [negotiatingApplication, setNegotiatingApplication] = useState(null)
  const [initialReviewStep, setInitialReviewStep] = useState('review')
  const [searchQuery, setSearchQuery] = useState('')
  const [startError, setStartError] = useState('')
  const isShortlisted = activeApplicationStatus === 'shortlisted'
  const isTaskOpportunity = String(opportunity?.opportunityType || '').toLowerCase() === 'task'
  const applicationsClosed = Boolean(opportunity?.applicationsClosed)
  const isTogglingCapacity = projectActionState?.pending === 'capacity'
  const applicationRows = applications.map(toApplicationRow)
  const normalizedSearch = searchQuery.trim().toLowerCase()
  const filteredApplications = applicationRows.filter((application) => {
    if (activeApplicationStatus !== 'all' && application.statusId !== activeApplicationStatus) return false
    if (!normalizedSearch) return true
    return [
      application.creator,
      application.handle,
      application.course,
      application.campus,
      application.skills.join(' '),
    ].some((value) => String(value || '').toLowerCase().includes(normalizedSearch))
  })
  const applicationCounts = applicationRows.reduce((counts, application) => ({
    ...counts,
    all: counts.all + 1,
    [application.statusId]: (counts[application.statusId] || 0) + 1,
  }), { all: 0, new: 0, shortlisted: 0, accepted: 0, rejected: 0 })

  function openApplicationReview(application, step = 'review') {
    setInitialReviewStep(step)
    setSelectedApplication(application)
  }

  async function handleInterviewAction(application) {
    const interviewStatus = String(application.interview?.status || '').toLowerCase()
    if (interviewStatus === 'confirmed' && application.interview?.meetingUrl) {
      window.open(application.interview.meetingUrl, '_blank', 'noopener,noreferrer')
      setStartError('')
      try {
        await onStartApplicantInterview(application.id)
      } catch (error) {
        setStartError(error instanceof Error ? error.message : 'Could not start the interview.')
      }
      return
    }
    openApplicationReview(application, 'schedule')
  }

  function getInterviewAction(application) {
    const interviewStatus = String(application.interview?.status || '').toLowerCase()
    if (interviewStatus === 'confirmed') {
      return {
        disabled: !application.interview?.meetingUrl,
        label: application.interview?.meetingUrl ? 'Start Interview' : 'Interview Confirmed',
      }
    }
    if (interviewStatus === 'pending') return { disabled: true, label: 'Awaiting RSVP' }
    if (interviewStatus === 'proposed_new_time') return { disabled: false, label: 'Review Proposed Time' }
    if (interviewStatus === 'cancelled') return { disabled: false, label: 'Reschedule Interview' }
    return { disabled: false, label: 'Schedule Interview' }
  }

  return (
    <section className="business-profile-card business-review-applications-card">
      <header>
        <div>
          <h2>All Applications</h2>
          <p>Review, evaluate and manage creator applications.</p>
        </div>
        <div className="business-review-capacity-control">
          {applicationsClosed ? (
            <span className="business-review-capacity-badge is-closed">Applications closed</span>
          ) : (
            <span className="business-review-capacity-badge is-open">Accepting applications</span>
          )}
          {isTaskOpportunity ? (
            !applicationsClosed ? (
              <em>Closes automatically when you hire.</em>
            ) : null
          ) : onSetOpportunityCapacity ? (
            <button
              type="button"
              className="business-profile-ghost-btn"
              disabled={isTogglingCapacity}
              onClick={() => onSetOpportunityCapacity(!applicationsClosed)}
            >
              {isTogglingCapacity
                ? 'Saving...'
                : applicationsClosed ? 'Reopen applications' : 'Mark at capacity'}
            </button>
          ) : null}
        </div>
      </header>

      {projectActionState?.error ? (
        <p className="business-review-capacity-error" role="alert">{projectActionState.error}</p>
      ) : projectActionState?.notice ? (
        <p className="business-review-capacity-notice" role="status">{projectActionState.notice}</p>
      ) : null}

      <TabNav
        activeId={activeApplicationStatus}
        ariaLabel="Application status filters"
        className="business-review-application-tabs"
        items={APPLICATION_FILTERS}
        onChange={onChangeApplicationStatus}
        renderTab={(filter) => (
          <>
            {filter.label}
            <span>{applicationCounts[filter.id] || 0}</span>
          </>
        )}
      />

      <div className={isShortlisted ? 'business-review-shortlisted-toolbar' : 'business-review-application-toolbar'}>
        <label>
          <FiSearch aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            placeholder="Search applicants by name, course, campus or skill..."
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>
        <select defaultValue={isShortlisted ? 'recently-shortlisted' : 'newest'} aria-label="Sort applications">
          <option value="newest">Sort by: Newest</option>
          <option value="recently-shortlisted">Sort by: Recently Shortlisted</option>
        </select>
        <button type="button">
          <FiFilter aria-hidden="true" />
          Filters
        </button>
      </div>

      {isLoadingApplications ? (
        <div className="business-review-applications-empty">
          <FiUsers aria-hidden="true" />
          <strong>Loading applicants...</strong>
          <p>Fetching applications saved for this opportunity.</p>
        </div>
      ) : applicationsError ? (
        <div className="business-review-applications-empty is-error" role="alert">
          <FiUsers aria-hidden="true" />
          <strong>Applicants could not be loaded</strong>
          <p>{applicationsError}</p>
        </div>
      ) : !filteredApplications.length ? (
        <div className="business-review-applications-empty">
          <FiUsers aria-hidden="true" />
          <strong>No matching applications</strong>
          <p>{applicationRows.length ? 'Try another status or search term.' : 'No students have applied for this opportunity yet.'}</p>
        </div>
      ) : isShortlisted ? (
        <div className="business-review-shortlisted-table">
          <div className="business-review-shortlisted-head">
            <span><input type="checkbox" aria-label="Select all shortlisted applications" /></span>
            <span>Applicant</span>
            <span>Course</span>
            <span>Campus</span>
            <span>Bid</span>
            <span>Submitted</span>
            <span>Actions</span>
          </div>
          {filteredApplications.map((row) => {
            const interviewAction = getInterviewAction(row)
            const rowAboveBudget = opportunityBudgetAmount > 0 && getCurrencyAmount(row.bidAmount) > opportunityBudgetAmount
            return (
            <article key={row.id} className="business-review-shortlisted-row">
              <span><input type="checkbox" aria-label={`Select ${row.creator}`} /></span>
              <PersonRow
                avatar={row.avatar}
                className="business-review-application-creator"
                name={row.creator}
                subtitle={row.handle}
                badge={row.status === 'New' ? <em>New</em> : null}
              />
              <span>{row.course}</span>
              <strong>{row.campus}</strong>
              <strong className="business-review-engagement-rate">{row.currency || 'KES'} {Number(row.bidAmount || 0).toLocaleString()}</strong>
              <time>{row.submitted}<span>{row.submittedAgo}</span></time>
              <div className="business-review-shortlisted-actions">
                <button type="button" onClick={() => openApplicationReview(row)}>Review</button>
                <button type="button" disabled={interviewAction.disabled} onClick={() => handleInterviewAction(row)}>
                  {interviewAction.label}
                </button>
                {rowAboveBudget && canNegotiateApplication(row) ? (
                  <button
                    type="button"
                    className="business-review-negotiate-btn"
                    onClick={() => setNegotiatingApplication(row)}
                  >
                    Negotiate
                  </button>
                ) : null}
                <button type="button" aria-label={`More actions for ${row.creator}`}><FiMoreVertical aria-hidden="true" /></button>
              </div>
            </article>
            )
          })}
        </div>
      ) : (
        <div className="business-review-application-table">
        <div className="business-review-application-head">
          <span><input type="checkbox" aria-label="Select all applications" /></span>
          <span>Applicant</span>
          <span>Course</span>
          <span>Campus</span>
          <span>Bid</span>
          <span>Submitted</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {filteredApplications.map((row) => {
          const rowAboveBudget = opportunityBudgetAmount > 0 && getCurrencyAmount(row.bidAmount) > opportunityBudgetAmount
          const isNegotiationLocked = row.statusId === 'accepted' || row.counterOffer?.status === 'accepted'
          return (
          <article key={row.id} className="business-review-application-row">
            <span><input type="checkbox" aria-label={`Select ${row.creator}`} /></span>
            <PersonRow
              avatar={row.avatar}
              className="business-review-application-creator"
              name={row.creator}
              subtitle={row.handle}
              badge={row.status === 'New' ? <em>New</em> : null}
            />
            <span>{row.course}</span>
            <strong>{row.campus}</strong>
            <span className="business-review-engagement-cell">
              <strong className="business-review-engagement-rate">{row.currency || 'KES'} {Number(row.bidAmount || 0).toLocaleString()}</strong>
              {isNegotiationLocked ? (
                <em className="business-review-above-budget-tag is-locked">Agreed price locked</em>
              ) : rowAboveBudget ? (
                <em className="business-review-above-budget-tag">Above budget</em>
              ) : null}
            </span>
            <time>{row.submitted}<span>{row.submittedAgo}</span></time>
            <StatusPill className="business-review-status-pill" tone={row.tone}>{row.status}</StatusPill>
            <div className="business-review-application-actions">
              {rowAboveBudget && canNegotiateApplication(row) ? (
                <button
                  type="button"
                  className="business-review-negotiate-btn"
                  onClick={() => setNegotiatingApplication(row)}
                >
                  Negotiate
                </button>
              ) : null}
              <button type="button" onClick={() => openApplicationReview(row)}>Review</button>
              <button type="button" aria-label={`More actions for ${row.creator}`}>⋮</button>
            </div>
          </article>
        )})}
        </div>
      )}

      <footer className="business-review-application-pagination">
        <p>Showing {filteredApplications.length} of {applicationRows.length} applications</p>
        {startError ? <span role="alert">{startError}</span> : null}
      </footer>
      <ApplicationReviewModal
        application={selectedApplication}
        initialStep={initialReviewStep}
        onClose={() => setSelectedApplication(null)}
        onScheduleInterview={onScheduleApplicantInterview}
        onStartInterview={onStartApplicantInterview}
        onAccept={onAwardApplicant}
        onRequestEscrowTopUp={onRequestEscrowTopUp}
        opportunityBudgetAmount={opportunityBudgetAmount}
      />
      {negotiatingApplication ? (
        <ApplicationNegotiationModal
          key={negotiatingApplication.id}
          application={negotiatingApplication}
          onClose={() => setNegotiatingApplication(null)}
          onCounterOffer={onCounterOfferApplicant}
          opportunityBudgetAmount={opportunityBudgetAmount}
        />
      ) : null}
    </section>
  )
}

function BusinessDeliverableFilesPanel({ opportunity }) {
  const [fileQuery, setFileQuery] = useState('')
  const sampleFiles = getOpportunitySampleFiles(opportunity)
  const normalizedQuery = fileQuery.trim().toLowerCase()
  const visibleFiles = sampleFiles.filter((file) => (
    !normalizedQuery || file.name.toLowerCase().includes(normalizedQuery)
  ))

  return (
    <section className="business-review-files-panel">
      <header>
        <div>
          <h3>Files</h3>
          <p>Reference assets attached to this brief and files submitted against this opportunity.</p>
        </div>
      </header>

      <div className="business-review-files-tools">
        <label>
          <FiSearch aria-hidden="true" />
          <input
            type="search"
            placeholder="Search files..."
            value={fileQuery}
            onChange={(event) => setFileQuery(event.target.value)}
          />
        </label>
      </div>

      <section className="business-review-files-table" aria-label="Opportunity files">
        {visibleFiles.length === 0 ? (
          <p className="business-review-empty-note">
            {sampleFiles.length === 0
              ? 'No files yet. Reference files from the brief and creator submissions will appear here.'
              : 'No files match this search.'}
          </p>
        ) : (
          <>
            <div className="business-review-files-row is-head">
              <span>Name</span>
              <span>Type</span>
              <span>Owner</span>
              <span>Deliverable</span>
              <span>Size</span>
              <span />
            </div>
            {visibleFiles.map((file) => (
              <div key={file.id} className="business-review-files-row">
                <span>
                  <FiFileText className={`is-${file.tone}`} aria-hidden="true" />
                  <strong>{file.name}</strong>
                </span>
                <span>{file.type}</span>
                <span>
                  <img src="/assets/index/bee_nobg.png" alt="" />
                  {file.owner}
                </span>
                <span>{file.updated}</span>
                <span>{file.size}</span>
                {file.url ? (
                  <a href={file.url} target="_blank" rel="noreferrer" aria-label={`Download ${file.name}`}>
                    <FiDownload aria-hidden="true" />
                  </a>
                ) : <span aria-hidden="true" />}
              </div>
            ))}
          </>
        )}
      </section>
    </section>
  )
}

function getSubmissionStatus(status) {
  const key = String(status || '').toLowerCase()
  if (key === 'approved') return { label: 'Approved', tone: 'green' }
  if (key === 'changes_requested') return { label: 'Changes Requested', tone: 'orange' }
  if (key === 'superseded') return { label: 'Replaced by revision', tone: 'gray' }
  return { label: 'Pending Review', tone: 'blue' }
}

function toOrdinal(value) {
  const suffixes = ['th', 'st', 'nd', 'rd']
  const remainder = value % 100
  return `${value}${suffixes[(remainder - 20) % 10] || suffixes[remainder] || suffixes[0]}`
}

function getAttemptLabel(meta) {
  if (!meta) return ''
  if (meta.attempt <= 1) return 'First submission'
  return `Revised work · ${toOrdinal(meta.attempt)} attempt`
}

function SubmissionReviewModal({
  submission,
  attemptMeta,
  completion,
  isCompleted = false,
  isCompleting = false,
  isTeamProject = false,
  opportunityBudgetLabel,
  onClose,
  onComplete,
  onReview,
}) {
  const [feedback, setFeedback] = useState('')
  const [pendingDecision, setPendingDecision] = useState(null)
  const [error, setError] = useState('')
  const [previewFile, setPreviewFile] = useState(null)

  if (!submission) return null

  const status = getSubmissionStatus(submission.status)
  const isReviewed = ['approved', 'changes_requested', 'superseded'].includes(String(submission.status).toLowerCase())
  const payoutAmount = Number(submission.payoutAmount ?? 0)
  const payoutCurrency = submission.payoutCurrency || submission.projectAgreedCurrency || 'KES'
  const payoutLabel = payoutAmount > 0
    ? `${payoutCurrency} ${payoutAmount.toLocaleString()}`
    : submission.milestoneId
      ? (submission.milestoneBudget ? `${payoutCurrency} ${Number(submission.milestoneBudget).toLocaleString()}` : 'Milestone budget')
      : (opportunityBudgetLabel || 'Project budget')
  const files = Array.isArray(submission.files) ? submission.files : []
  const submitted = formatApplicationDate(submission.submittedAt)

  async function submitDecision(decision) {
    if (decision === 'changes_requested' && !feedback.trim()) {
      setError('Add feedback describing the changes needed.')
      return
    }
    setPendingDecision(decision)
    setError('')
    try {
      await onReview(submission.id, { decision, feedback: feedback.trim() || undefined })
      onClose()
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Could not submit the review.')
      setPendingDecision(null)
    }
  }

  return (
    <div className="business-review-modal-backdrop" role="presentation">
      <section className="business-review-application-modal business-review-submission-modal" role="dialog" aria-modal="true" aria-labelledby="submission-review-title">
        <header>
          <div>
            <h2 id="submission-review-title">
              Review Submission <StatusPill tone={status.tone}>{status.label}</StatusPill>
              {attemptMeta ? (
                <StatusPill tone={attemptMeta.attempt > 1 ? 'orange' : 'blue'}>{getAttemptLabel(attemptMeta)}</StatusPill>
              ) : null}
              {submission.isRevision ? <StatusPill tone="orange">Revised work</StatusPill> : null}
            </h2>
            <p>{submission.milestoneTitle ? `Milestone: ${submission.milestoneTitle}` : submission.scopeItemLabel ? `Deliverable: ${submission.scopeItemLabel}` : submission.projectTitle || 'Whole project'}</p>
          </div>
          <button type="button" aria-label="Close submission review" onClick={onClose}>
            <FiX aria-hidden="true" />
          </button>
        </header>

        <div className="business-review-application-modal-body">
          <section className="business-profile-card">
            <div className="business-review-applicant-head">
              <img src={submission.student?.avatarUrl || '/assets/index/bee_nobg.png'} alt={`${submission.student?.name || 'Student'} avatar`} />
              <div>
                <h3>{submission.student?.name || 'Student applicant'}</h3>
                <p>{[submission.student?.course, submission.student?.campus].filter(Boolean).join(' · ') || 'Zumbarl student'}</p>
              </div>
            </div>
            <dl className="business-review-applicant-stats">
              <div><dt>{submission.title}</dt><dd>Work title</dd></div>
              <div><dt>{submitted.date}</dt><dd>Submitted</dd></div>
              {isTeamProject ? (
                <div>
                  <dt>Split by workload</dt>
                  <dd>Paid when the deliverable is marked complete</dd>
                </div>
              ) : (
                <div><dt>{payoutLabel}</dt><dd>Payout on approval</dd></div>
              )}
            </dl>
            {submission.notes ? (
              <>
                <h4>Description</h4>
                <p>{submission.notes}</p>
              </>
            ) : null}
            {submission.feedbackRequest ? (
              <>
                <h4>Feedback requested</h4>
                <p>{submission.feedbackRequest}</p>
              </>
            ) : null}
          </section>

          <section className="business-profile-card">
            <h3>Submitted Files</h3>
            {files.length ? (
              <div className="business-review-submission-files">
                {files.map((file, index) => (
                  <article key={`${file.fileName || file.name || 'file'}-${index}`}>
                    <FiFileText aria-hidden="true" />
                    <div>
                      <strong>{file.fileName || file.name || `File ${index + 1}`}</strong>
                      <span>{file.mimeType || 'Attachment'}</span>
                    </div>
                    {file.url ? (
                      <div className="business-review-submission-file-actions">
                        <button
                          type="button"
                          onClick={() => setPreviewFile(toSubmittedAttachment({
                            fileName: file.fileName || file.name,
                            mimeType: file.mimeType,
                            url: file.url,
                          }, index))}
                        >
                          <FiEye aria-hidden="true" /> Preview
                        </button>
                        <a href={file.url} target="_blank" rel="noreferrer"><FiDownload aria-hidden="true" /> Open</a>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : <p>No files were attached to this submission.</p>}
          </section>

          <section className="business-profile-card">
            <h3>Review &amp; Decision</h3>
            {isReviewed ? (
              <div className="business-review-submission-outcome">
                <FiCheckCircle aria-hidden="true" />
                <div>
                  <strong>{status.label}</strong>
                  {submission.feedback ? <p>{submission.feedback}</p> : null}
                </div>
              </div>
            ) : (
              <>
                <label className="business-review-request-field">
                  <span>Feedback to the creator</span>
                  <textarea
                    value={feedback}
                    maxLength={1000}
                    placeholder="Share what looks good, or exactly what needs to change before approval."
                    onChange={(event) => setFeedback(event.target.value)}
                  />
                </label>
                {error ? <p className="business-review-schedule-error" role="alert">{error}</p> : null}
              </>
            )}
          </section>
        </div>

        {previewFile ? (
          <section className="business-review-attachment-preview-modal" role="dialog" aria-modal="true" aria-labelledby="submission-file-preview-title">
            <header>
              <div>
                <h3 id="submission-file-preview-title">{previewFile.title}</h3>
                <p>{previewFile.fileType} preview</p>
              </div>
              <button type="button" aria-label="Close file preview" onClick={() => setPreviewFile(null)}>
                <FiX aria-hidden="true" />
              </button>
            </header>
            <div>
              <AttachmentPreview attachment={previewFile} />
            </div>
            <footer>
              <a href={previewFile.src} target="_blank" rel="noreferrer">
                <FiDownload aria-hidden="true" />
                Open original
              </a>
              <Button tone="ghost" onClick={() => setPreviewFile(null)}>Close preview</Button>
            </footer>
          </section>
        ) : null}

        <footer>
          <Button tone="ghost" onClick={onClose}>Close</Button>
          {!isReviewed ? (
            <>
              <Button
                tone="ghost"
                disabled={Boolean(pendingDecision)}
                onClick={() => submitDecision('changes_requested')}
              >
                {pendingDecision === 'changes_requested' ? 'Sending…' : 'Request Changes'}
              </Button>
              <Button
                tone="brand"
                disabled={Boolean(pendingDecision)}
                onClick={() => submitDecision('approved')}
              >
                {pendingDecision === 'approved'
                  ? 'Approving…'
                  : isTeamProject ? 'Approve submission' : `Approve & Release (${payoutLabel})`}
              </Button>
              {isTeamProject && onComplete ? (
                <CompleteAndPayButton
                  completion={completion}
                  isCompleted={isCompleted}
                  isCompleting={isCompleting}
                  onComplete={onComplete}
                />
              ) : null}
            </>
          ) : null}
        </footer>
      </section>
    </div>
  )
}

// The business shapes milestone scope: adds milestones and their deliverables,
// sets windows, releases funding and activates. Same panel the team reads on its
// Milestones tab, with the scope controls switched on and no submit action -
// submitting is the team's move.
// The business plans the project the same way the team does: the same milestone
// scope, board, sprints and timeline, from the same components. It shapes scope
// and plans sprints; money (funding, activation, completion) stays its own.
function BusinessProjectPlanningPanel({
  hasStarted = true,
  onCompleteScopeTarget,
  onStartProject,
  projectActionState,
  projectId,
  view,
}) {
  const milestoneWorkspace = useMilestoneWorkspace(projectId, { enabled: Boolean(projectId) })
  const deliverableTasks = useDeliverableTasks(projectId, { enabled: Boolean(projectId) })
  const [openDeliverableId, setOpenDeliverableId] = useState('')

  if (!projectId) {
    return <p className="business-review-empty-note">Planning appears once this opportunity is awarded.</p>
  }
  if (milestoneWorkspace.isLoading) return <p className="business-review-empty-note">Loading project plan…</p>
  if (milestoneWorkspace.error) {
    return <p className="business-review-empty-note is-error" role="alert">{milestoneWorkspace.error}</p>
  }

  if (view === 'timeline') {
    return <ProjectTimelinePanel timeline={milestoneWorkspace.timeline} />
  }

  if (view === 'sprints') {
    return (
      <ProjectSprintsPanel
        canPlan
        deliverables={milestoneWorkspace.deliverablesWithMilestone}
        milestones={milestoneWorkspace.milestones}
        onAddBacklogItem={(payload) => deliverableTasks.onDeclareTask({ ...payload, ownerId: null })}
        pending={milestoneWorkspace.pending}
        sprints={milestoneWorkspace.sprints}
        tasks={deliverableTasks.tasks}
        onAssignTasks={milestoneWorkspace.onAssignTasks}
        onCreateSprint={milestoneWorkspace.onCreateSprint}
        onUpdateSprint={milestoneWorkspace.onUpdateSprint}
      />
    )
  }

  // Opening a deliverable from the milestone list swaps in its board in place,
  // so adding tasks never means hunting for another tab.
  if (view === 'board' || openDeliverableId) {
    return (
      <MilestoneBoardPanel
        deliverableTasks={deliverableTasks}
        deliverablesByMilestone={milestoneWorkspace.deliverablesByMilestone}
        milestones={milestoneWorkspace.milestones}
        openDeliverableId={openDeliverableId}
        sprints={milestoneWorkspace.sprints}
        onOpenDeliverable={setOpenDeliverableId}
      />
    )
  }

  return (
    <>
      <ProjectStartNotice
        hasStarted={hasStarted}
        isPending={projectActionState?.pending === 'start'}
        onStartProject={onStartProject}
      />
      <MilestoneScopePanel
        canPlan
        canSettle
        completionPending={projectActionState?.pending || ''}
        deliverablesByMilestone={milestoneWorkspace.deliverablesByMilestone}
        milestones={milestoneWorkspace.milestones}
        pending={milestoneWorkspace.pending}
        tasks={deliverableTasks.tasks}
        onActivateMilestone={milestoneWorkspace.onActivateMilestone}
        onCompleteMilestone={(milestone) => onCompleteScopeTarget?.(projectId, { milestoneId: milestone.id })}
        onCreateDeliverable={milestoneWorkspace.onCreateDeliverable}
        onCreateMilestone={milestoneWorkspace.onCreateMilestone}
        onFundMilestone={milestoneWorkspace.onFundMilestone}
        onOpenDeliverable={(deliverable) => setOpenDeliverableId(deliverable.id)}
        onUpdateMilestone={milestoneWorkspace.onUpdateMilestone}
      />
      <MilestoneProgramPanel programGates={milestoneWorkspace.programGates} />
    </>
  )
}

function BusinessTeamPanel({ projectId }) {
  const [team, setTeam] = useState({ members: [], invites: [] })
  const [error, setError] = useState('')
  // Its own task read: the Team tab is project-level and no longer sits inside
  // the deliverables panel that used to supply them.
  const { tasks } = useDeliverableTasks(projectId, { enabled: Boolean(projectId) })

  useEffect(() => {
    if (!projectId) return undefined

    let isCurrent = true
    listProjectTeam(projectId)
      .then((response) => {
        if (!isCurrent) return
        setTeam({
          members: Array.isArray(response?.members) ? response.members : [],
          invites: Array.isArray(response?.invites) ? response.invites : [],
        })
      })
      .catch((teamError) => {
        if (isCurrent) setError(teamError?.message || 'Could not load the project team.')
      })

    return () => { isCurrent = false }
  }, [projectId])

  if (!projectId) {
    return <p className="business-review-empty-note">The team appears once this opportunity is awarded.</p>
  }
  if (error) return <p className="business-review-empty-note is-error" role="alert">{error}</p>

  return <TeamPanel invites={team.invites} members={team.members} tasks={tasks} />
}

function DeliverablesPanel({ agreedAmount = 0, agreedCurrency = 'KES', canAddDeliverables = true, hasStarted = true, onRequestPayment, onStartProject, opportunity, submissions = [], submissionsError = '', isLoadingSubmissions = false, onReviewSubmission, onCompleteScopeTarget, projectId, isTeamProject = false, isMilestoneScope = false, projectActionState }) {
  const [activeDeliverableTab, setActiveDeliverableTab] = useState('deliverables')
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [selectedDeliverable, setSelectedDeliverable] = useState(null)
  // Bumped after every review decision so the deliverable's task board reloads.
  const [reviewSignal, setReviewSignal] = useState(0)
  const [addedDeliverableRows, setAddedDeliverableRows] = useState([])
  const [isAddingDeliverable, setIsAddingDeliverable] = useState(false)
  const deliverableTasks = useDeliverableTasks(projectId, {
    enabled: isTeamProject && Boolean(projectId),
  })
  const { refresh: refreshDeliverableTasks } = deliverableTasks

  const handleReviewSubmission = async (...args) => {
    const result = await onReviewSubmission?.(...args)
    setReviewSignal((current) => current + 1)
    return result
  }

  // A review decision moves tasks between states, so the board reloads once the
  // business has ruled on a submission.
  useEffect(() => {
    if (reviewSignal) refreshDeliverableTasks()
  }, [refreshDeliverableTasks, reviewSignal])

  // Settled means the budget was actually released, not that every submission
  // happens to be approved: approving the last task must not close a deliverable
  // the team can still add work to.
  const isScopePaid = (scopeItemId) => (
    submissions.some((item) => item.scopeItemId === scopeItemId && item.scopeItemPaid)
  )

  // Paying out is only offered once the team has actually finished: every task
  // approved, nothing still blocked. A deliverable with no declared tasks stays
  // on the board's own completion rule.
  const getScopeCompletion = (scopeItemId) => {
    const scopeTasks = deliverableTasks.tasks.filter((task) => (
      (task.scopeItemId || '') === (scopeItemId || '') && task.status !== 'dropped'
    ))
    if (!scopeTasks.length) return { hasTasks: false, isReady: false, pending: 0, blocked: 0 }

    const blocked = scopeTasks.filter((task) => task.blockedBy?.length).length
    const pending = scopeTasks.filter((task) => task.status !== 'done').length
    return { hasTasks: true, isReady: pending === 0 && blocked === 0, pending, blocked }
  }

  const isSubmittedWork = activeDeliverableTab === 'submitted-work'
  const isFiles = activeDeliverableTab === 'files'
  const isMessages = activeDeliverableTab === 'messages'
  const deliverableRows = [...addedDeliverableRows, ...getOpportunityDeliverableRows(opportunity, agreedAmount, agreedCurrency)]
  const deliverableCount = deliverableRows.length
  const sampleFiles = getOpportunitySampleFiles(opportunity)
  const deliverableTabCounts = {
    deliverables: deliverableCount,
    files: sampleFiles.length,
    'submitted-work': submissions.length,
  }

  // Real submission count per deliverable (scope item), and the attempt number
  // for each submission (1 = first submission, 2+ = revision/resubmission).
  const submissionCountByScopeId = submissions.reduce((counts, item) => {
    if (item.scopeItemId) counts[item.scopeItemId] = (counts[item.scopeItemId] || 0) + 1
    return counts
  }, {})
  const submissionMeta = {}
  Object.values(submissions.reduce((groups, item) => {
    const key = item.milestoneId || item.scopeItemId || 'project'
    groups[key] = groups[key] || []
    groups[key].push(item)
    return groups
  }, {})).forEach((group) => {
    const ordered = [...group].sort((left, right) => new Date(left.submittedAt) - new Date(right.submittedAt))
    ordered.forEach((item, index) => {
      submissionMeta[item.id] = { attempt: index + 1, total: ordered.length }
    })
  })

  function getDeliverableIcon(type) {
    if (type.includes('Code')) return 'x'
    if (type.includes('Document')) return 'youtube'
    if (type.includes('Proof')) return 'tiktok'
    return 'instagram'
  }

  function createDeliverableRows(drafts) {
    const timestamp = Date.now()

    const rows = drafts.map((draft, index) => {
      const budgetValue = Number(String(draft.budget).replace(/,/g, '') || 0)
      const workflow = getDeliverableWorkflow(draft.workflow)
      const paymentPercent = getDeliverablePaymentPercent(draft, drafts)

      return {
        id: `added-deliverable-${timestamp}-${index}`,
        title: draft.title,
        required: true,
        type: workflow.type,
        description: draft.requirement,
        requirement: draft.requirement,
        workflow: draft.workflow,
        workflowLabel: workflow.label,
        acceptedEvidence: workflow.acceptedEvidence,
        dueDate: 'Scheduled after agreement',
        dueMeta: 'Payment approved',
        submissions: '0',
        status: 'Approved',
        tone: 'green',
        icon: getDeliverableIcon(workflow.type),
        acceptanceCriteria: draft.acceptanceCriteria,
        paymentPercent: `${paymentPercent}%`,
        lockedUntilApproved: draft.lockedUntilApproved,
        budget: `KES ${budgetValue.toLocaleString()}`,
      }
    })

    setAddedDeliverableRows((items) => [...rows, ...items])
    onRequestPayment?.()
  }

  return (
    <section className="business-profile-card business-review-deliverables-card">
      <header>
        <div>
          <h2>
            {isMessages ? 'Messages'
              : isFiles ? 'Files'
                : isSubmittedWork ? 'Submitted Work'
                  : isMilestoneScope ? 'Milestones' : 'Work & Deliverables'}
          </h2>
          <p>
            {isMessages ? 'Coordinate with creators around evidence, revisions and approvals.'
              : isFiles ? 'Access all submitted files and reference assets.'
                : isSubmittedWork ? 'Review and provide feedback on creator submissions.'
                  : isMilestoneScope
                    ? 'Shape the milestones, release their budgets and review the work against them.'
                    : 'Manage the deliverables, review submissions and files.'}
          </p>
        </div>
        {!isSubmittedWork && !isFiles && !isMessages && !isMilestoneScope ? (
          <div>
            {canAddDeliverables ? (
              <button type="button" className="business-profile-primary-btn" onClick={() => setIsAddingDeliverable(true)}>
                <FiPlus aria-hidden="true" />
                Add Deliverable
              </button>
            ) : null}
            <button type="button" className="business-profile-ghost-btn">Actions</button>
          </div>
        ) : null}
      </header>

      <TabNav
        activeId={activeDeliverableTab}
        ariaLabel="Deliverable sections"
        className="business-review-application-tabs"
        items={isMilestoneScope
          ? DELIVERABLE_FILTERS.map((filter) => (
            filter.id === 'deliverables' ? { ...filter, label: 'Milestones' } : filter
          ))
          : DELIVERABLE_FILTERS}
        onChange={setActiveDeliverableTab}
        renderTab={(filter) => (
          <>
            {filter.label}
            {deliverableTabCounts[filter.id] ? <span>{deliverableTabCounts[filter.id]}</span> : null}
          </>
        )}
      />

      {isMessages ? (
        <ProjectConversationPanel opportunity={opportunity} />
      ) : isFiles ? (
        <BusinessDeliverableFilesPanel opportunity={opportunity} />
      ) : isSubmittedWork ? (
        <>
          {isLoadingSubmissions ? (
            <p className="business-review-empty-note">Loading submissions…</p>
          ) : submissionsError ? (
            <p className="business-review-empty-note is-error" role="alert">{submissionsError}</p>
          ) : !submissions.length ? (
            <p className="business-review-empty-note">
              No work submitted yet. When awarded creators submit deliverables, their evidence will appear here for review.
            </p>
          ) : (
            <div className="business-review-submissions-list">
              {submissions.map((item) => {
                const status = getSubmissionStatus(item.status)
                const fileCount = Array.isArray(item.files) ? item.files.length : 0
                const meta = submissionMeta[item.id]
                const targetLabel = item.milestoneTitle
                  ? `Milestone: ${item.milestoneTitle}`
                  : item.scopeItemLabel ? `Deliverable: ${item.scopeItemLabel}` : 'Whole project'
                return (
                  <article
                    key={item.id}
                    className="business-review-submission-row is-clickable"
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedSubmission(item)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        setSelectedSubmission(item)
                      }
                    }}
                  >
                    <div className="business-review-submission-creator">
                      <img src={item.student?.avatarUrl || '/assets/index/bee_nobg.png'} alt="" />
                      <div>
                        <strong>{item.student?.name || 'Student applicant'}</strong>
                        <span>{targetLabel}</span>
                      </div>
                    </div>
                    <div className="business-review-submission-info">
                      <strong>{item.title}</strong>
                      <span>{fileCount} file{fileCount === 1 ? '' : 's'} · {formatApplicationDate(item.submittedAt).date}</span>
                      {meta ? (
                        <em className={meta.attempt > 1 ? 'is-revision' : ''}>{getAttemptLabel(meta)}{meta.total > 1 ? ` (of ${meta.total})` : ''}</em>
                      ) : null}
                    </div>
                    <div className="business-review-submission-statuses">
                      {item.isRevision ? <StatusPill tone="orange">Revised work</StatusPill> : null}
                      <StatusPill tone={status.tone}>{status.label}</StatusPill>
                    </div>
                    <Button tone="ghost" onClick={(event) => { event.stopPropagation(); setSelectedSubmission(item) }}>Review</Button>
                  </article>
                )
              })}
            </div>
          )}
        </>
      ) : isMilestoneScope ? (
        <BusinessProjectPlanningPanel
          hasStarted={hasStarted}
          projectActionState={projectActionState}
          projectId={projectId}
          view="milestones"
          onCompleteScopeTarget={onCompleteScopeTarget}
          onStartProject={onStartProject}
        />
      ) : selectedDeliverable ? (
        <DeliverableDetailPanel
          completion={getScopeCompletion(selectedDeliverable.id)}
          deliverable={selectedDeliverable}
          deliverableTasks={deliverableTasks}
          isCompleted={isScopePaid(selectedDeliverable.id)}
          isCompleting={projectActionState?.pending === `complete-${selectedDeliverable.id}`}
          projectId={isTeamProject ? projectId : null}
          submissions={submissions}
          onClose={() => setSelectedDeliverable(null)}
          onComplete={isTeamProject && projectId
            ? () => onCompleteScopeTarget?.(projectId, { scopeItemId: selectedDeliverable.id })
            : undefined}
          onOpenSubmission={setSelectedSubmission}
        />
      ) : (
        <>
          <div className="business-review-deliverable-toolbar">
            <label>
              <FiSearch aria-hidden="true" />
              <input type="search" placeholder="Search deliverables..." />
            </label>
            <select defaultValue="all-statuses" aria-label="Filter deliverables by status">
              <option value="all-statuses">Status: All</option>
            </select>
            <select defaultValue="all-types" aria-label="Filter deliverables by type">
              <option value="all-types">Type: All</option>
            </select>
          </div>

          {isTeamProject ? (
            projectActionState?.error ? (
              <p className="business-review-capacity-error" role="alert">{projectActionState.error}</p>
            ) : projectActionState?.notice ? (
              <p className="business-review-capacity-notice" role="status">{projectActionState.notice}</p>
            ) : (
              <p className="business-review-deliverable-team-hint">
                This is a team project — approving submissions gives feedback only and marks the covered tasks done.
                Click <strong>Complete &amp; pay</strong> on a deliverable to release its budget, split by the workload
                each student's approved tasks account for.
              </p>
            )
          ) : null}

          <div className="business-review-deliverable-table">
            <div className="business-review-deliverable-head">
              <span aria-hidden="true" />
              <span>Deliverable</span>
              <span>Type</span>
              <span>Description</span>
              <span>Due Date</span>
              <span>Submissions</span>
              <span>Status</span>
              <span>Actions</span>
            </div>

            {deliverableRows.map((row) => {
              const isDraftRow = String(row.id).startsWith('added-deliverable')
              const rowCompleted = isScopePaid(row.id)
              const rowCompleting = projectActionState?.pending === `complete-${row.id}`
              const canComplete = isTeamProject && projectId && !isDraftRow
              return (
              <article
                key={row.id}
                className="business-review-deliverable-row is-clickable"
                role="button"
                tabIndex={0}
                onClick={() => setSelectedDeliverable(row)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setSelectedDeliverable(row)
                  }
                }}
              >
                <button type="button" className="business-review-deliverable-drag" aria-label={`Reorder ${row.title}`} onClick={(event) => event.stopPropagation()}>⋮⋮</button>
                <div className="business-review-deliverable-title">
                  <DeliverableIcon icon={row.icon} />
                  <div>
                    <strong>{row.title}</strong>
                    <em>{row.required ? 'Required' : 'Optional'}</em>
                  </div>
                </div>
                <strong>{row.type}</strong>
                <p>{row.description}</p>
                <time>
                  <span><FiCalendar aria-hidden="true" /> {row.dueDate}</span>
                  <em className={row.dueMeta === 'Overdue' ? 'is-overdue' : ''}>{row.dueMeta}</em>
                </time>
                <strong className="business-review-deliverable-submissions">{submissionCountByScopeId[row.id] ?? row.submissions}</strong>
                <StatusPill className="business-review-status-pill" tone={row.tone}>{row.status}</StatusPill>
                <div className="business-review-deliverable-actions">
                  {canComplete ? (
                    rowCompleted ? (
                      <span className="business-review-deliverable-complete-badge">Completed</span>
                    ) : (
                      <button
                        type="button"
                        className="business-review-deliverable-complete-btn"
                        disabled={rowCompleting}
                        onClick={(event) => { event.stopPropagation(); onCompleteScopeTarget?.(projectId, { scopeItemId: row.id }) }}
                      >
                        {rowCompleting ? 'Completing...' : 'Complete & pay'}
                      </button>
                    )
                  ) : null}
                  <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedDeliverable(row) }}>Open</button>
                  <button type="button" aria-label={`More actions for ${row.title}`} onClick={(event) => event.stopPropagation()}>
                    <FiMoreVertical aria-hidden="true" />
                  </button>
                </div>
              </article>
            )})}
          </div>

          <footer className="business-review-deliverable-footer">
            Showing 1-{deliverableCount} of {deliverableCount} deliverables
          </footer>
        </>
      )}
      {canAddDeliverables ? (
        <AddDeliverableModal
          isOpen={isAddingDeliverable}
          onClose={() => setIsAddingDeliverable(false)}
          onCreate={createDeliverableRows}
        />
      ) : null}

      <SubmissionReviewModal
        submission={selectedSubmission}
        attemptMeta={selectedSubmission ? submissionMeta[selectedSubmission.id] : null}
        completion={selectedSubmission ? getScopeCompletion(selectedSubmission.scopeItemId) : null}
        isCompleted={selectedSubmission ? isScopePaid(selectedSubmission.scopeItemId) : false}
        isCompleting={projectActionState?.pending === `complete-${selectedSubmission?.scopeItemId}`}
        isTeamProject={isTeamProject}
        opportunityBudgetLabel={opportunity?.budget}
        onClose={() => setSelectedSubmission(null)}
        onComplete={isTeamProject && projectId && selectedSubmission?.scopeItemId
          ? () => onCompleteScopeTarget?.(projectId, { scopeItemId: selectedSubmission.scopeItemId })
          : undefined}
        onReview={handleReviewSubmission}
      />
    </section>
  )
}


// Read-only mirror of the team's workload board. The business sees exactly what
// the students see — who is on what, what is stuck and for how long — but has no
// write action anywhere: the split is the team's to agree, not the client's to
// direct.
// The business sees the same Deliverable Room the team works in - same stats,
// workload split, task pool and thread - rather than a separate summary that
// could drift from it. Tasks and weights stay read-only; the thread and the
// dependencies the business is holding up are shared ground.
function DeliverableWorkloadPanel({ deliverable, deliverableTasks, onOpenSubmission, projectId, submissions = [] }) {
  if (!projectId) return null

  const scopeKey = deliverable?.id || ''
  const submissionById = new Map(submissions.map((submission) => [submission.id, submission]))
  const openSubmissionForTask = (task) => {
    // Tasks carry the submission they were included in. Older tasks predate that
    // link, so fall back to the deliverable's latest live submission.
    const submission = (task.submissionId && submissionById.get(task.submissionId))
      || submissions.find((item) => item.scopeItemId === scopeKey && item.status !== 'superseded')
    if (submission) onOpenSubmission?.(submission)
  }

  return (
    <DeliverableRoom
      canEdit={false}
      canParticipate={deliverableTasks.canParticipate}
      deliverable={deliverable}
      dependencies={deliverableTasks.dependencies}
      embedded
      error={deliverableTasks.error}
      isLoading={deliverableTasks.isLoading}
      isPending={Boolean(deliverableTasks.pendingTaskId)}
      notes={deliverableTasks.notesByScopeItem.get(scopeKey) || []}
      splitLock={deliverableTasks.splitLockByScopeItem.get(scopeKey)}
      tasks={deliverableTasks.tasksByScopeItem.get(scopeKey) || []}
      viewerStudentId={deliverableTasks.viewerStudentId}
      onAddNote={(payload) => deliverableTasks.onAddNote({ ...payload, scopeItemId: scopeKey })}
      onResolveDependency={deliverableTasks.onResolveDependency}
      onRetry={deliverableTasks.refresh}
      onReviewTask={onOpenSubmission ? openSubmissionForTask : undefined}
    />
  )
}

function PaymentsPanel({ agreedAmount = 0, agreedCurrency = 'KES', applications = [], onRequestPayment = () => {}, opportunity }) {
  const budgetAmount = getCurrencyAmount(agreedAmount || opportunity?.budgetAmount || opportunity?.budget)
  const isFunded = String(opportunity?.escrowStatus || 'unfunded') !== 'unfunded'
  const awardedApplications = applications.filter((application) => (
    ['awarded', 'accepted'].includes(String(application.status || '').toLowerCase())
  ))
  const committedAmount = awardedApplications
    .reduce((total, application) => total + getCurrencyAmount(application.project?.agreedAmount || application.bidAmount), 0)
  const scopeCount = getOpportunityPaymentScopeItems(opportunity).length
  const paymentMetrics = [
    { label: agreedAmount ? 'Agreed Budget' : 'Total Budget', value: formatCurrencyAmount(budgetAmount, agreedCurrency), meta: '100% of budget', tone: 'blue' },
    { label: 'Escrow', value: isFunded ? 'Funded' : 'Not funded', meta: isFunded ? 'Held for payouts' : 'Fund to release payments', tone: isFunded ? 'green' : 'orange' },
    { label: 'Committed', value: formatCurrencyAmount(committedAmount, agreedCurrency), meta: `${awardedApplications.length} awarded bid${awardedApplications.length === 1 ? '' : 's'}`, tone: 'purple' },
    { label: 'Remaining', value: formatCurrencyAmount(Math.max(0, budgetAmount - committedAmount), agreedCurrency), meta: 'Uncommitted budget', tone: 'green' },
  ]

  return (
    <section className="business-profile-card business-review-payments-card">
      <header>
        <div>
          <h2>Payments</h2>
          <p>Manage creator payments, track disbursements and download invoices.</p>
        </div>
        {!isFunded ? (
          <button type="button" className="business-profile-primary-btn" onClick={onRequestPayment}>
            <FiCreditCard aria-hidden="true" />
            Fund escrow
          </button>
        ) : null}
      </header>

      <div className="business-review-payment-metrics">
        {paymentMetrics.map((metric) => (
          <MetricCard
            key={metric.label}
            change={metric.meta}
            icon={metric.tone === 'blue' ? FiDollarSign : FiCreditCard}
            label={metric.label}
            tone={metric.tone}
            value={metric.value}
          />
        ))}
      </div>

      <div className="business-review-payment-table">
        <div className="business-review-payment-head">
          <span>Creator</span>
          <span>Deliverables</span>
          <span>Total Amount</span>
          <span>Payment Status</span>
          <span>Awarded</span>
          <span>Actions</span>
        </div>
        {awardedApplications.length === 0 ? (
          <p className="business-review-empty-note">
            No payments yet. Award a bid from the Applications tab and creator payments will appear here.
          </p>
        ) : null}
        {awardedApplications.map((row) => (
          <article key={row.id} className="business-review-payment-row">
            <PersonRow
              avatar={row.student?.avatarUrl || '/assets/index/bee_nobg.png'}
              className="business-review-application-creator"
              name={row.student?.name || row.bidderName || 'Student creator'}
              subtitle={row.student?.username ? `@${row.student.username}` : 'Zumbarl student'}
            />
            <strong>{scopeCount ? `${scopeCount} Deliverable${scopeCount === 1 ? '' : 's'}` : 'Full scope'}</strong>
            <strong>{formatCurrencyAmount(getCurrencyAmount(row.project?.agreedAmount || row.bidAmount), row.project?.agreedCurrency || agreedCurrency)}</strong>
            <StatusPill className="business-review-status-pill" tone={isFunded ? 'green' : 'blue'}>
              {isFunded ? 'Escrow funded' : 'Awaiting funding'}
            </StatusPill>
            <time>{formatApplicationDate(row.respondedAt || row.appliedAt).date}</time>
            <div className="business-review-payment-actions">
              <button type="button" onClick={onRequestPayment}>
                {isFunded ? 'View escrow' : 'Make Payment'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function PerformancePanel() {
  return (
    <section className="business-profile-card business-review-performance-card">
      <header>
        <div>
          <h2>Performance</h2>
          <p>Reach, impressions and engagement for this campaign.</p>
        </div>
      </header>
      <p className="business-review-empty-note">
        No performance data yet. Once creators start posting and submitting evidence, reach and engagement metrics will appear here.
      </p>
    </section>
  )
}

const ACTIVITY_TYPE_PRESENTATION = {
  bid_submitted: { type: 'Application', tone: 'purple', icon: FiUsers },
  created: { type: 'Opportunity', tone: 'blue', icon: FiFileText },
  invites_sent: { type: 'Invites', tone: 'orange', icon: FiSend },
  published: { type: 'Published', tone: 'green', icon: FiCheckCircle },
  updated: { type: 'Update', tone: 'blue', icon: FiFileText },
}

function getActivityPresentation(action) {
  if (ACTIVITY_TYPE_PRESENTATION[action]) return ACTIVITY_TYPE_PRESENTATION[action]
  if (String(action || '').startsWith('interview')) return { type: 'Interview', tone: 'green', icon: FiVideo }
  return { type: 'Update', tone: 'blue', icon: FiFileText }
}

function ActivityPanel({ opportunityId }) {
  const [activityEventsByRequest, setActivityEventsByRequest] = useState({})
  const requestKey = opportunityId || 'all'
  const activityEvents = activityEventsByRequest[requestKey] || []
  const isLoading = activityEventsByRequest[requestKey] === undefined

  useEffect(() => {
    let isCurrent = true

    listBackendBusinessActivity()
      .then((response) => {
        if (!isCurrent) return
        const events = Array.isArray(response?.data) ? response.data : []
        setActivityEventsByRequest((current) => ({
          ...current,
          [requestKey]: opportunityId ? events.filter((event) => event.opportunityId === opportunityId) : events,
        }))
      })
      .catch(() => {
        if (isCurrent) setActivityEventsByRequest((current) => ({ ...current, [requestKey]: [] }))
      })

    return () => { isCurrent = false }
  }, [opportunityId, requestKey])

  const activityGroups = activityEvents.reduce((groups, event) => {
    const date = event.createdAt
      ? new Date(event.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
      : 'Recently'
    const group = groups.find((item) => item.date === date)
    if (group) {
      group.items.push(event)
    } else {
      groups.push({ date, items: [event] })
    }
    return groups
  }, [])

  return (
    <section className="business-profile-card business-review-activity-card">
      <header>
        <div>
          <h2>Activity Timeline</h2>
          <p>A chronological view of all actions and updates for this opportunity.</p>
        </div>
      </header>

      <div className="business-review-activity-timeline">
        {!isLoading && activityEvents.length === 0 ? (
          <p className="business-review-empty-note">
            No activity yet. Publishing, invites, bids and interviews will show up here.
          </p>
        ) : null}
        {activityGroups.map((group) => (
          <section key={group.date}>
            <h3>{group.date}</h3>
            <div>
              {group.items.map((item) => {
                const presentation = getActivityPresentation(item.action)
                const Icon = presentation.icon
                const time = item.createdAt
                  ? new Date(item.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                  : ''

                return (
                  <article key={item.id} className="business-review-activity-row">
                    <time>{time}</time>
                    <span className={`business-review-activity-icon tone-${presentation.tone}`}>
                      <Icon aria-hidden="true" />
                    </span>
                    <strong>{presentation.type}</strong>
                    <p>{item.note || `${item.actorName} ${String(item.action || 'updated').replace(/_/g, ' ')}`}</p>
                    <div className="business-review-activity-actor">
                      <span><b>{item.actorName}</b><em>{item.opportunityTitle || ''}</em></span>
                    </div>
                    <span aria-hidden="true" />
                  </article>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}

function DetailBlock({ items, title }) {
  return (
    <section className="business-review-detail-block">
      <h3>{title}</h3>
      <dl>
        {items.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value || 'Not set'}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function OverviewPanel({ agreedAmount = 0, agreedCurrency = 'KES', applications = [], onInviteApplicants, onViewSchedule = () => {}, opportunity, skills, type }) {
  const deadline = opportunity.deadline === 'Rolling' ? 'Rolling' : formatOpportunityDate(opportunity.deadline, 'Rolling')
  const paymentScopeItems = getContractPaymentScopeItems(opportunity, agreedAmount)
  const scopedBudgetTotal = paymentScopeItems.reduce((total, item) => total + item.budgetAmount, 0)
  const budget = formatCurrencyAmount(agreedAmount || scopedBudgetTotal || opportunity.budget || opportunity.budgetAmount, agreedCurrency)
  const newApplicationCount = applications
    .filter((application) => getApplicationStatus(application.status).id === 'new').length
  const isTeamProject = String(opportunity?.opportunityType || '').toLowerCase() !== 'task'
  const acceptedMembers = applications
    .filter((application) => application.projectId && ['accepted', 'awarded'].includes(String(application.status || '').toLowerCase()))
    .map((application) => {
      const projectStatus = String(application.project?.status || '').toLowerCase()
      const memberStatus = application.project?.endedAt || ['ended', 'closed'].includes(projectStatus)
        ? 'Ended'
        : application.project?.startedAt || ['active', 'in_progress', 'in progress'].includes(projectStatus)
          ? 'In progress'
          : projectStatus === 'completed' || projectStatus === 'approved'
            ? 'Completed'
            : 'Awarded'
      const amount = Number(application.bidAmount || application.project?.agreedAmount || 0)
      return {
        id: application.id,
        name: application.student?.name || application.bidderName || 'Team member',
        handle: application.handle || application.student?.username || '',
        avatar: application.student?.avatarUrl || '/assets/index/bee_nobg.png',
        status: memberStatus,
        amountLabel: amount ? formatCurrencyAmount(amount, application.currency || application.project?.agreedCurrency || 'KES') : '',
      }
    })
  const upcomingInterviews = applications
    .filter((application) => application.interview && application.interview.status !== 'cancelled')
    .map((application) => {
      const interview = application.interview
      const scheduled = interview.scheduledAt ? new Date(interview.scheduledAt) : null
      const hasSchedule = scheduled && !Number.isNaN(scheduled.getTime())
      const interviewType = String(interview.interviewType || 'video').toLowerCase()

      return {
        id: interview.id,
        icon: interviewType === 'phone' ? FiPhone : FiVideo,
        name: application.student?.name || application.bidderName || 'Applicant',
        time: hasSchedule
          ? `${scheduled.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}, ${scheduled.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
          : 'Time pending',
        note: interviewType === 'phone' ? 'Phone screen' : 'Video interview',
        status: interview.status === 'confirmed' ? 'Confirmed' : interview.status === 'proposed_new_time' ? 'New time proposed' : 'Pending',
      }
    })

  return (
    <section className="business-profile-card business-review-overview-readonly-card">
      <header>
        <div>
          <h2>Opportunity Overview</h2>
          <p>Read-only summary of the brief, applicant access and upcoming hiring actions.</p>
        </div>
        <div>
          <button
            type="button"
            className="business-profile-primary-btn"
            disabled={!opportunity.canInvite || opportunity.applicationsClosed || opportunity.projectEnded}
            onClick={() => onInviteApplicants?.(opportunity)}
          >
            <FiSend aria-hidden="true" />
            {opportunity.projectEnded ? 'Project Ended' : opportunity.applicationsClosed ? 'Applications Closed' : 'Invite Applicants'}
          </button>
        </div>
      </header>

      <div className="business-review-overview-actions">
        <article>
          <FiUsers aria-hidden="true" />
          <span>
            <strong>Review applications</strong>
            <em>{applications.length} application{applications.length === 1 ? '' : 's'} received{newApplicationCount ? ` · ${newApplicationCount} new` : ''}</em>
          </span>
          <button type="button" onClick={onViewSchedule}>Review applicants</button>
        </article>
        <article>
          <FiMessageSquare aria-hidden="true" />
          <span><strong>Accessibility notes</strong><em>Remote-friendly, flexible timing, interview accommodations available</em></span>
        </article>
      </div>

      <section className="business-review-upcoming-interviews">
        <header>
          <div>
            <h3>Immediate Upcoming Interviews</h3>
            <p>Shortlist conversations that need attention this week.</p>
          </div>
          <button type="button" onClick={onViewSchedule}>View schedule</button>
        </header>
        <div>
          {upcomingInterviews.length === 0 ? (
            <p className="business-review-empty-note">
              No interviews scheduled yet. Schedule one from the Applications tab.
            </p>
          ) : null}
          {upcomingInterviews.map((interview) => {
            const InterviewIcon = interview.icon

            return (
              <article key={interview.id}>
                <span><InterviewIcon aria-hidden="true" /></span>
                <div>
                  <strong>{interview.name}</strong>
                  <em>{interview.note}</em>
                </div>
                <time>{interview.time}</time>
                <StatusPill tone={interview.status === 'Confirmed' ? 'green' : 'purple'}>{interview.status}</StatusPill>
              </article>
            )
          })}
        </div>
      </section>

      {acceptedMembers.length ? (
        <section className="business-review-team-roster">
          <header>
            <div>
              <h3>{isTeamProject ? 'Project Team' : 'Hired'}</h3>
              <p>
                {isTeamProject
                  ? `${acceptedMembers.length} student${acceptedMembers.length === 1 ? '' : 's'} accepted into this team project.`
                  : 'The student hired for this task.'}
              </p>
            </div>
          </header>
          <div className="business-review-team-list">
            {acceptedMembers.map((member) => (
              <article key={member.id}>
                <img src={member.avatar} alt="" />
                <div>
                  <strong>{member.name}</strong>
                  {member.handle ? <em>{member.handle}</em> : null}
                </div>
                {member.amountLabel ? <span className="business-review-team-amount">{member.amountLabel}</span> : null}
                <StatusPill tone={member.status === 'Completed' ? 'green' : member.status === 'In progress' ? 'purple' : member.status === 'Ended' ? 'orange' : 'blue'}>{member.status}</StatusPill>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <div className="business-review-readonly-grid">
        <DetailBlock
          title="Brief Details"
          items={[
            { label: 'Opportunity title', value: opportunity.title },
            { label: 'Type', value: type },
            { label: 'Category', value: opportunity.category },
            { label: 'Engagement mode', value: opportunity.engagementMode || opportunity.mode || 'Remote' },
            { label: 'Visibility', value: 'Visible to all creators' },
            { label: 'Deadline', value: deadline },
          ]}
        />

        <section className="business-review-detail-block">
          <h3>Audience & Requirements</h3>
          <p>{opportunity.description || opportunity.summary || 'No summary provided.'}</p>
          <div className="business-review-interest-row" aria-label="Required skills">
            {skills.slice(0, 6).map((skill) => <span key={skill}>{skill}</span>)}
          </div>
          <dl>
            <div><dt>Engagement</dt><dd>{opportunity.engagementMode || opportunity.mode || 'Remote'}</dd></div>
            <div><dt>Duration</dt><dd>{opportunity.duration || 'Flexible'}</dd></div>
            <div><dt>Experience</dt><dd>{opportunity.requiredExperience || opportunity.experienceLevel || 'Open to all levels'}</dd></div>
          </dl>
        </section>

        <section className="business-review-detail-block">
          <h3>Scope & Deliverables</h3>
          <ul>
            {paymentScopeItems.length ? paymentScopeItems.map((item, index) => (
              <li key={item.id}><span>{item.title}</span><strong>{item.paymentPercent ? `${item.paymentPercent}%` : `#${index + 1}`}</strong></li>
            )) : (
              <li><span>Scoped deliverables</span><strong>Not set</strong></li>
            )}
          </ul>
          <p>{opportunity.deliverables || 'Deliverables are listed in the scoped brief.'}</p>
        </section>

        <section className="business-review-detail-block">
          <h3>Budget & Compensation</h3>
          <dl>
            <div><dt>{agreedAmount ? 'Agreed budget' : 'Total budget'}</dt><dd>{budget}</dd></div>
            <div><dt>Compensation model</dt><dd>{opportunity.paymentTerms || 'Pay per deliverable'}</dd></div>
            <div><dt>Duration</dt><dd>{opportunity.duration || 'Flexible'}</dd></div>
          </dl>
          <ul>
            {paymentScopeItems.length ? paymentScopeItems.map((item) => (
              <li key={item.id}><span>{item.title}</span><strong>{formatCurrencyAmount(item.budgetAmount, agreedCurrency)}</strong><em>{item.paymentPercent ? `${item.paymentPercent}%` : 'Auto'}</em></li>
            )) : (
              <li><span>Saved budget</span><strong>{budget}</strong><em>100%</em></li>
            )}
          </ul>
        </section>

        <section className="business-review-detail-block business-review-accessibility-block">
          <h3>Applicant Accessibility</h3>
          <ul>
            <li><FiCheckCircle aria-hidden="true" /><span>Remote interview option available</span></li>
            <li><FiCheckCircle aria-hidden="true" /><span>Flexible scheduling before final selection</span></li>
            <li><FiCheckCircle aria-hidden="true" /><span>Applicants can request communication accommodations</span></li>
          </ul>
        </section>
      </div>
    </section>
  )
}

export function BusinessOpportunityReviewWorkspace({
  activeApplicationStatus,
  activeInterviewConversation,
  activeReviewTab,
  applications = [],
  applicationsError = '',
  isLoadingApplications = false,
  onBack,
  onChangeApplicationStatus,
  onChangeReviewTab,
  onInviteApplicants,
  onPublishOpportunity,
  onScheduleApplicantInterview,
  onStartApplicantInterview,
  onAwardApplicant,
  onCounterOfferApplicant,
  onSetOpportunityCapacity,
  onStartProject,
  onEndProject,
  onFundOpportunity,
  projectActionState,
  submissions = [],
  submissionsError = '',
  isLoadingSubmissions = false,
  onReviewSubmission,
  onCompleteScopeTarget,
  openPublishPayment = false,
  opportunity,
}) {
  const navigate = useNavigate()
  const [fundingModalMode, setFundingModalMode] = useState(openPublishPayment ? 'publish' : null)
  const [escrowTopUpRequest, setEscrowTopUpRequest] = useState(null)

  const acceptedProject = applications.find((application) => (
    application.projectId && ['accepted', 'awarded'].includes(String(application.status || '').toLowerCase())
  ))
  const acceptedProjectId = acceptedProject?.projectId || acceptedProject?.project?.id || ''

  // Once hiring has produced a project, project work belongs in the same
  // dedicated workspace the student uses. Keeping it embedded in the
  // opportunity-review shell gave the two parties conflicting views of the
  // same milestones, board and team.
  useEffect(() => {
    if (!acceptedProjectId) return
    navigate(`/business/projects/${acceptedProjectId}`, { replace: true })
  }, [acceptedProjectId, navigate])

  if (!opportunity) return null

  const skills = getSkillList(opportunity)
  const type = opportunity.category === 'Social Media' ? 'Campaign' : opportunity.mode || 'Project'
  const reviewTabs = getReviewTabs(opportunity, applications.length)
  const canShowPerformance = opportunity.scopeMode === 'milestone'
  const coverImage = getOpportunityCoverImage(opportunity)
  const createdOn = formatOpportunityDate(opportunity.createdAt, 'Just now')
  const deadline = opportunity.deadline === 'Rolling' ? 'Rolling' : formatOpportunityDate(opportunity.deadline, 'Rolling')
  const objective = opportunity.opportunityType || type
  const skillSummary = skills.length ? `${skills.slice(0, 3).join(', ')}${skills.length > 3 ? ` +${skills.length - 3}` : ''}` : 'Not specified'
  const acceptedProjectStatus = String(acceptedProject?.project?.status || '').toLowerCase()
  const acceptedProjectHasStarted = Boolean(acceptedProject?.project?.startedAt)
    || ['active', 'in_progress', 'in progress'].includes(acceptedProjectStatus)
  const acceptedProjectHasEnded = Boolean(acceptedProject?.project?.endedAt)
    || ['ended', 'closed'].includes(acceptedProjectStatus)
  const acceptedProjectCanEnd = acceptedProjectHasStarted
    && ['approved', 'completed'].includes(acceptedProjectStatus)
  const acceptedProjectAgreedAmount = Number(acceptedProject?.project?.agreedAmount || acceptedProject?.bidAmount || 0)
  const acceptedProjectAgreedCurrency = acceptedProject?.project?.agreedCurrency || acceptedProject?.currency || 'KES'
  const workspaceBudgetLabel = acceptedProjectAgreedAmount > 0
    ? formatCurrencyAmount(acceptedProjectAgreedAmount, acceptedProjectAgreedCurrency)
    : opportunity.budget
  const acceptedProjectEscrowCoverage = Number(acceptedProject?.project?.escrowCoverage || 0)
  const acceptedProjectEscrowShortfall = Math.max(0, acceptedProjectAgreedAmount - acceptedProjectEscrowCoverage)

  function startPublishPayment() {
    if (opportunity.canPublish) {
      setFundingModalMode('publish')
    } else if (acceptedProjectEscrowShortfall > 0) {
      setFundingModalMode('topup')
    }
  }

  return (
    <>
      <header className="business-review-workspace-head">
        <nav aria-label="Opportunity breadcrumb">
          <button type="button" onClick={onBack}>Opportunities</button>
          <span>/</span>
          <strong>{opportunity.title}</strong>
        </nav>
        <div>
          <h1>{opportunity.title}</h1>
          <span>{type}</span>
        </div>
        <aside>
          {acceptedProject && !acceptedProjectHasStarted && !acceptedProjectHasEnded && acceptedProjectEscrowShortfall > 0 ? (
            <button
              type="button"
              className="business-profile-primary-btn"
              disabled={projectActionState?.pending === 'fund'}
              onClick={() => setFundingModalMode('topup')}
            >
              <FiCreditCard aria-hidden="true" />
              {projectActionState?.pending === 'fund' ? 'Updating escrow...' : 'Update escrow'}
            </button>
          ) : acceptedProject && !acceptedProjectHasStarted && !acceptedProjectHasEnded ? (
            <button
              type="button"
              className="business-profile-primary-btn"
              disabled={projectActionState?.pending === 'start'}
              onClick={() => onStartProject?.(acceptedProject.projectId)}
            >
              <FiCheckCircle aria-hidden="true" />
              {projectActionState?.pending === 'start' ? 'Starting project...' : 'Start project'}
            </button>
          ) : acceptedProject && acceptedProjectCanEnd && !acceptedProjectHasEnded ? (
            <button
              type="button"
              className="business-profile-ghost-btn"
              disabled={projectActionState?.pending === 'end'}
              onClick={() => onEndProject?.(acceptedProject.projectId)}
            >
              {projectActionState?.pending === 'end' ? 'Ending project...' : 'End project'}
            </button>
          ) : opportunity.canPublish ? (
            <button type="button" className="business-profile-primary-btn" onClick={startPublishPayment}>
              <FiCreditCard aria-hidden="true" />
              Pay &amp; Publish Opportunity
            </button>
          ) : null}
        </aside>
      </header>

      {projectActionState?.error ? (
        <p className="business-project-controls-error" role="alert">{projectActionState.error}</p>
      ) : projectActionState?.notice ? (
        <p className="business-project-controls-notice" role="status">{projectActionState.notice}</p>
      ) : null}

      <section className="business-profile-card business-review-overview-card">
        <div className="business-review-cover">
          <img src={coverImage} alt={`${opportunity.title} opportunity`} style={getSplashCropStyle(opportunity.opportunitySplash) || undefined} />
        </div>
        <dl>
          <div><dt>Type</dt><dd>{type}</dd></div>
          <div><dt>Objective</dt><dd>{objective}</dd></div>
          <div><dt>Category</dt><dd>{opportunity.category}</dd></div>
          <div><dt>Skills</dt><dd>{skillSummary}</dd></div>
        </dl>
        <dl>
          <div><dt>{acceptedProjectAgreedAmount > 0 ? 'Agreed budget' : 'Budget'}</dt><dd>{workspaceBudgetLabel}</dd></div>
          <div><dt>Applications</dt><dd>{applications.length} ({applications.filter((application) => getApplicationStatus(application.status).id === 'new').length} new)</dd></div>
          <div><dt>Status</dt><dd><span>{opportunity.statusLabel || opportunity.status}</span></dd></div>
          <div><dt>Deadline</dt><dd>{deadline}</dd></div>
        </dl>
        <dl>
          <div><dt>Created by</dt><dd>{opportunity.company || 'Business account'}</dd></div>
          <div><dt>Created on</dt><dd>{createdOn}</dd></div>
          <div><dt>Engagement Mode</dt><dd>{opportunity.engagementMode || 'Remote'}</dd></div>
          <div><dt>Visible to</dt><dd>{opportunity.visibility || 'All creators'}</dd></div>
        </dl>
      </section>

      <TabNav
        activeId={activeReviewTab}
        ariaLabel="Opportunity review sections"
        className="business-review-detail-tabs"
        items={reviewTabs}
        onChange={onChangeReviewTab}
        renderTab={(tab) => (
          <>
            {tab.label}
            {tab.count ? <span>{tab.count}</span> : null}
          </>
        )}
      />

      {activeReviewTab === 'applications' ? (
        <ApplicationsPanel
          activeApplicationStatus={activeApplicationStatus}
          applications={applications}
          applicationsError={applicationsError}
          isLoadingApplications={isLoadingApplications}
          onChangeApplicationStatus={onChangeApplicationStatus}
          onScheduleApplicantInterview={onScheduleApplicantInterview}
          onStartApplicantInterview={onStartApplicantInterview}
          onAwardApplicant={onAwardApplicant}
          onCounterOfferApplicant={onCounterOfferApplicant}
          onRequestEscrowTopUp={setEscrowTopUpRequest}
          onSetOpportunityCapacity={onSetOpportunityCapacity}
          opportunity={opportunity}
          projectActionState={projectActionState}
          opportunityBudgetAmount={getCurrencyAmount(opportunity.budgetAmount) || getCurrencyAmount(opportunity.budget)}
        />
      ) : activeReviewTab === 'deliverables' || activeReviewTab === 'milestones' ? (
        <DeliverablesPanel
          isMilestoneScope={opportunity?.scopeMode === 'milestone'}
          hasStarted={acceptedProjectHasStarted}
          onStartProject={acceptedProject && !acceptedProjectHasStarted
            ? () => onStartProject?.(acceptedProject.projectId)
            : undefined}
          agreedAmount={acceptedProjectAgreedAmount}
          agreedCurrency={acceptedProjectAgreedCurrency}
          canAddDeliverables={!isLoadingApplications && !acceptedProjectHasStarted && !acceptedProjectHasEnded}
          onRequestPayment={startPublishPayment}
          opportunity={opportunity}
          submissions={submissions}
          submissionsError={submissionsError}
          isLoadingSubmissions={isLoadingSubmissions}
          onReviewSubmission={onReviewSubmission}
          onCompleteScopeTarget={onCompleteScopeTarget}
          projectId={acceptedProject?.projectId || acceptedProject?.project?.id || null}
          isTeamProject={String(opportunity?.opportunityType || '').toLowerCase() !== 'task'}
          projectActionState={projectActionState}
        />
      ) : activeReviewTab === 'settings' ? (
        <BusinessProjectSettingsPanel
          projectId={acceptedProject?.projectId || acceptedProject?.project?.id || null}
        />
      ) : ['board', 'sprints', 'timeline'].includes(activeReviewTab) ? (
        <BusinessProjectPlanningPanel
          hasStarted={acceptedProjectHasStarted}
          projectActionState={projectActionState}
          projectId={acceptedProject?.projectId || acceptedProject?.project?.id || null}
          view={activeReviewTab}
          onCompleteScopeTarget={onCompleteScopeTarget}
          onStartProject={acceptedProject && !acceptedProjectHasStarted
            ? () => onStartProject?.(acceptedProject.projectId)
            : undefined}
        />
      ) : activeReviewTab === 'team' ? (
        <BusinessTeamPanel
          projectId={acceptedProject?.projectId || acceptedProject?.project?.id || null}
        />
      ) : activeReviewTab === 'payments' ? (
        <PaymentsPanel
          agreedAmount={acceptedProjectAgreedAmount}
          agreedCurrency={acceptedProjectAgreedCurrency}
          applications={applications}
          onRequestPayment={startPublishPayment}
          opportunity={opportunity}
        />
      ) : activeReviewTab === 'performance' && canShowPerformance ? (
        <PerformancePanel />
      ) : activeReviewTab === 'messages' ? (
        <section className="business-profile-card business-review-deliverables-card">
          <header>
            <div>
              <h2>Messages</h2>
              <p>Coordinate with creators around evidence, revisions and approvals.</p>
            </div>
          </header>
          <ProjectConversationPanel conversation={activeInterviewConversation} opportunity={opportunity} />
        </section>
      ) : activeReviewTab === 'activity' ? (
        <ActivityPanel opportunityId={opportunity.backendId || opportunity.id} />
      ) : (
        <OverviewPanel
          agreedAmount={acceptedProjectAgreedAmount}
          agreedCurrency={acceptedProjectAgreedCurrency}
          applications={applications}
          onInviteApplicants={onInviteApplicants}
          onViewSchedule={() => onChangeReviewTab?.('applications')}
          opportunity={opportunity}
          skills={skills}
          type={type}
        />
      )}
      <PublishOpportunityModal
        key={`${opportunity.id}-${escrowTopUpRequest ? 'topup-request' : fundingModalMode || 'closed'}`}
        fundingAmount={escrowTopUpRequest ? escrowTopUpRequest.amount : acceptedProjectEscrowShortfall}
        noticeMessage={escrowTopUpRequest?.message || ''}
        isOpen={Boolean(fundingModalMode) || Boolean(escrowTopUpRequest)}
        mode={escrowTopUpRequest ? 'topup' : fundingModalMode || 'publish'}
        opportunity={opportunity}
        type={type}
        onClose={() => {
          setFundingModalMode(null)
          setEscrowTopUpRequest(null)
        }}
        onFund={async (fundedOpportunity, payment) => {
          const escrow = await onFundOpportunity?.(fundedOpportunity, payment)
          // When the top-up was triggered from an Accept, award the applicant now
          // that the escrow covers the agreed price.
          if (escrowTopUpRequest?.applicationId) {
            await onAwardApplicant?.(escrowTopUpRequest.applicationId)
          }
          return escrow
        }}
        onPublish={onPublishOpportunity}
      />
    </>
  )
}
