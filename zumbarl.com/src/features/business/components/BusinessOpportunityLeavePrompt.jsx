import { FiAlertCircle, FiArrowRight, FiSave, FiX } from 'react-icons/fi'
import { useDialog } from '../../../components/ui'

export function BusinessOpportunityLeavePrompt({
  isOpen,
  isSaving = false,
  onLeaveWithoutSaving,
  onSaveAndLeave,
  onStay,
  saveError = '',
}) {
  // Escape means "stay editing" here - the safe choice for an unsaved draft.
  const dialogRef = useDialog({ isOpen, onClose: onStay })

  if (!isOpen) return null

  return (
    <div className="business-create-leave-backdrop" role="presentation">
      <section
        ref={dialogRef}
        aria-labelledby="business-create-leave-title"
        aria-modal="true"
        className="business-create-leave-dialog"
        role="dialog"
      >
        <header>
          <span aria-hidden="true">
            <FiAlertCircle />
          </span>
          <button type="button" aria-label="Stay on this page" onClick={onStay}>
            <FiX aria-hidden="true" />
          </button>
        </header>

        <div>
          <p className="business-create-leave-eyebrow">Unsaved opportunity draft</p>
          <h2 id="business-create-leave-title">Save before leaving?</h2>
          <p>
            You have changes on this opportunity. Save a draft so you can continue later,
            leave without saving, or stay on the form.
          </p>
        </div>

        {saveError ? (
          <p className="business-create-leave-error" role="alert">{saveError}</p>
        ) : null}

        <footer>
          <button type="button" className="business-create-leave-link" onClick={onLeaveWithoutSaving} disabled={isSaving}>
            Leave without saving
          </button>
          <div>
            <button type="button" className="business-profile-ghost-btn" onClick={onStay} disabled={isSaving}>
              Stay editing
            </button>
            <button type="button" className="business-profile-primary-btn" onClick={onSaveAndLeave} disabled={isSaving}>
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
