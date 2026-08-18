import { FiAlertTriangle, FiX } from 'react-icons/fi'
import { useDialog } from './useDialog'
import './confirm-dialog.css'

function ConfirmDialog({ confirmLabel = 'Confirm', description, isOpen, isPending = false, onCancel, onConfirm, title }) {
  const dialogRef = useDialog({ isOpen, onClose: isPending ? undefined : onCancel })
  if (!isOpen) return null

  return (
    <div className="zumbarl-confirm-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !isPending) onCancel() }}>
      <section ref={dialogRef} className="zumbarl-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="zumbarl-confirm-title" aria-describedby="zumbarl-confirm-description">
        <header>
          <span><FiAlertTriangle aria-hidden="true" /></span>
          <button type="button" aria-label="Close confirmation" disabled={isPending} onClick={onCancel}><FiX aria-hidden="true" /></button>
        </header>
        <h2 id="zumbarl-confirm-title">{title}</h2>
        <p id="zumbarl-confirm-description">{description}</p>
        <footer>
          <button type="button" disabled={isPending} onClick={onCancel}>Keep order</button>
          <button type="button" className="is-destructive" disabled={isPending} onClick={onConfirm}>{isPending ? 'Please wait…' : confirmLabel}</button>
        </footer>
      </section>
    </div>
  )
}

export default ConfirmDialog
