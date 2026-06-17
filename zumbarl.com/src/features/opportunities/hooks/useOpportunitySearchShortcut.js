import { useEffect } from 'react'

function useOpportunitySearchShortcut(searchRef) {
  useEffect(() => {
    const handleShortcutFocus = (event) => {
      const usedCommandOrControl = event.metaKey || event.ctrlKey

      if (!usedCommandOrControl || event.key !== '/') {
        return
      }

      event.preventDefault()
      searchRef.current?.focus()
    }

    window.addEventListener('keydown', handleShortcutFocus)
    return () => window.removeEventListener('keydown', handleShortcutFocus)
  }, [searchRef])
}

export default useOpportunitySearchShortcut
