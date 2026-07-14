import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function getFocusableItems(container) {
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR))
    .filter((element) => element.offsetParent !== null)
}

/**
 * Keyboard and focus behaviour for a modal dialog: Escape closes it, Tab stays
 * inside it, and focus returns to whatever opened it.
 *
 * Returns a ref to attach to the element carrying role="dialog". Call it above
 * any early return so hook order stays stable when the dialog is closed.
 */
export function useDialog({ isOpen, onClose }) {
  const dialogRef = useRef(null)
  // Held in a ref so an inline onClose prop doesn't re-run the effect and steal
  // focus back to the top of the dialog on every parent render.
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    const dialog = dialogRef.current
    if (!isOpen || !dialog) return undefined

    const previouslyFocused = document.activeElement

    const initialItems = getFocusableItems(dialog)
    if (initialItems.length > 0) {
      initialItems[0].focus()
    } else {
      dialog.setAttribute('tabindex', '-1')
      dialog.focus()
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onCloseRef.current?.()
        return
      }

      if (event.key !== 'Tab') return

      const items = getFocusableItems(dialog)
      if (items.length === 0) {
        event.preventDefault()
        return
      }

      const first = items[0]
      const last = items[items.length - 1]

      // Pull focus back in if it has escaped the dialog, then wrap at the ends.
      if (!dialog.contains(document.activeElement)) {
        event.preventDefault()
        first.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      if (previouslyFocused instanceof HTMLElement && document.contains(previouslyFocused)) {
        previouslyFocused.focus()
      }
    }
  }, [isOpen])

  return dialogRef
}

export default useDialog
