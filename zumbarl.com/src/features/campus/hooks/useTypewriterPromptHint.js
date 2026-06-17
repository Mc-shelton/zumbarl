import { useEffect, useState } from 'react'

function useTypewriterPromptHint(activeHints) {
  const [hintIndex, setHintIndex] = useState(0)
  const [hintText, setHintText] = useState('')
  const [hintDeleting, setHintDeleting] = useState(false)

  useEffect(() => {
    const currentHint = activeHints[hintIndex % activeHints.length]
    const hintFullyTyped = hintText === currentHint
    const hintEmpty = hintText.length === 0

    let delay = hintDeleting ? 42 : 72
    if (!hintDeleting && hintFullyTyped) {
      delay = 1300
    }
    if (hintDeleting && hintEmpty) {
      delay = 240
    }

    const timeoutId = setTimeout(() => {
      if (!hintDeleting && !hintFullyTyped) {
        setHintText(currentHint.slice(0, hintText.length + 1))
        return
      }

      if (!hintDeleting && hintFullyTyped) {
        setHintDeleting(true)
        return
      }

      if (hintDeleting && !hintEmpty) {
        setHintText(currentHint.slice(0, hintText.length - 1))
        return
      }

      setHintDeleting(false)
      setHintIndex((previous) => (previous + 1) % activeHints.length)
    }, delay)

    return () => clearTimeout(timeoutId)
  }, [activeHints, hintDeleting, hintIndex, hintText])

  const resetHint = () => {
    setHintIndex(0)
    setHintText('')
    setHintDeleting(false)
  }

  return {
    hintDeleting,
    hintText,
    resetHint,
  }
}

export default useTypewriterPromptHint
