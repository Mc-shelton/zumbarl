import { FiAlertCircle, FiArrowRight, FiSave, FiX } from 'react-icons/fi'
import { useDialog } from '../../../components/ui'

function OpportunityApplicationLeavePrompt({
  draftError = '',
  isOpen,
  isSaving = false,
  onLeaveWithoutSaving,
  onSaveAndLeave,
  onStay,
}) {
  const dialogRef = useDialog({ isOpen, onClose: onStay })
  if (!isOpen) return null

  return (
    <div className="opportunities-application-leave-backdrop" role="presentation">
      <section
        ref={dialogRef}
        aria-labelledby="application-leave-title"
        aria-modal="true"
        className="opportunities-application-leave-dialog"
        role="dialog"
      >
        <header>
          <span aria-hidden="true"><FiAlertCircle /></span>
          <button type="button" aria-label="Stay on this application" onClick={onStay}>
            <FiX aria-hidden="true" />
          </button>
        </header>
        <div>
          <p className="opportunities-application-leave-eyebrow">Unsaved application changes</p>
          <h2 id="application-leave-title">Save before leaving?</h2>
          <p>Save this application as a draft so you can resume it later, leave without saving, or continue editing.</p>
        </div>
        {draftError ? <p className="opportunities-application-error" role="alert">{draftError}</p> : null}
        <footer>
          <button type="button" className="opportunities-application-leave-link" disabled={isSaving} onClick={onLeaveWithoutSaving}>
            Leave without saving
          </button>
          <div>
            <button type="button" className="opportunities-application-cancel-btn" disabled={isSaving} onClick={onStay}>
              Stay editing
            </button>
            <button type="button" className="opportunities-detail-bid-btn" disabled={isSaving} onClick={onSaveAndLeave}>
              <FiSave aria-hidden="true" />
              {isSaving ? 'Saving...' : 'Save draft and leave'}
              <FiArrowRight aria-hidden="true" />
            </button>
          </div>
        </footer>
      </section>
    </div>
  )
}

export default OpportunityApplicationLeavePrompt
