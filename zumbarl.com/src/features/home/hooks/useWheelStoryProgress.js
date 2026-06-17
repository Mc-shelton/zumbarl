import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { WHEEL_TOPICS, clamp } from '../constants'

export function useWheelStoryProgress() {
  const sectionRef = useRef(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const sectionNode = sectionRef.current

    if (!sectionNode) {
      return undefined
    }

    let frameId = 0

    const updateProgress = () => {
      frameId = 0
      const viewportHeight = window.innerHeight || 1
      const rect = sectionNode.getBoundingClientRect()
      const maxScrollable = Math.max(sectionNode.offsetHeight - viewportHeight, 1)
      const scrolledDistance = clamp(-rect.top, 0, maxScrollable)
      const nextProgress = scrolledDistance / maxScrollable

      setProgress((current) => (Math.abs(current - nextProgress) > 0.002 ? nextProgress : current))
    }

    const onChange = () => {
      if (!frameId) {
        frameId = window.requestAnimationFrame(updateProgress)
      }
    }

    onChange()
    window.addEventListener('scroll', onChange, { passive: true })
    window.addEventListener('resize', onChange)

    return () => {
      window.removeEventListener('scroll', onChange)
      window.removeEventListener('resize', onChange)
      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }
    }
  }, [])

  const wheelRotation = useMemo(() => clamp((progress - 0.06) / 0.78) * 320, [progress])
  const detailsProgress = useMemo(() => clamp((progress - 0.24) / 0.68), [progress])
  const activeIndex = useMemo(() => {
    const scaled = Math.floor(detailsProgress * WHEEL_TOPICS.length)
    return Math.min(WHEEL_TOPICS.length - 1, Math.max(0, scaled))
  }, [detailsProgress])

  const getCalloutState = useCallback((step) => {
    if (step === activeIndex) {
      return 'is-active'
    }
    if (step < activeIndex) {
      return 'is-done'
    }
    return 'is-upcoming'
  }, [activeIndex])

  return {
    activeIndex,
    getCalloutState,
    sectionRef,
    wheelRotation,
  }
}
