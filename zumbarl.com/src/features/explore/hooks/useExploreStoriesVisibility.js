import { useEffect, useRef, useState } from 'react'

const TOP_LOCK_OFFSET = 40
const HIDE_TRAVEL_THRESHOLD = 72
const SHOW_TRAVEL_THRESHOLD = 40
const SCROLL_DELTA_EPSILON = 1
const TOGGLE_COOLDOWN_MS = 260

function useExploreStoriesVisibility({ isSearchMode }) {
  const mainScrollContainerRef = useRef(null)
  const [isStoriesVisible, setIsStoriesVisible] = useState(true)
  const isStoriesVisibleRef = useRef(true)
  const scrollMetaRef = useRef({
    lastOffset: 0,
    direction: 0,
    travel: 0,
    cooldownUntil: 0,
  })

  const showStories = () => {
    setIsStoriesVisible(true)
    isStoriesVisibleRef.current = true
  }

  useEffect(() => {
    isStoriesVisibleRef.current = isStoriesVisible
  }, [isStoriesVisible])

  useEffect(() => {
    if (isSearchMode) {
      return undefined
    }

    const getCurrentScrollOffset = () => {
      const mainScrollContainer = mainScrollContainerRef.current

      if (mainScrollContainer && mainScrollContainer.scrollHeight > mainScrollContainer.clientHeight) {
        return mainScrollContainer.scrollTop
      }

      return window.scrollY || document.documentElement.scrollTop || 0
    }

    scrollMetaRef.current = {
      lastOffset: getCurrentScrollOffset(),
      direction: 0,
      travel: 0,
      cooldownUntil: 0,
    }

    const handleScroll = () => {
      const now = performance.now()
      const meta = scrollMetaRef.current
      const currentScrollY = getCurrentScrollOffset()
      const delta = currentScrollY - meta.lastOffset

      if (Math.abs(delta) < SCROLL_DELTA_EPSILON || now < meta.cooldownUntil) {
        meta.lastOffset = currentScrollY
        return
      }

      const direction = delta > 0 ? 1 : -1

      if (direction !== meta.direction) {
        meta.direction = direction
        meta.travel = 0
      }

      meta.travel += Math.abs(delta)

      if (currentScrollY <= TOP_LOCK_OFFSET) {
        if (!isStoriesVisibleRef.current) {
          showStories()
        }

        meta.direction = 0
        meta.travel = 0
      } else if (isStoriesVisibleRef.current && direction === 1 && meta.travel >= HIDE_TRAVEL_THRESHOLD) {
        setIsStoriesVisible(false)
        isStoriesVisibleRef.current = false
        meta.direction = 0
        meta.travel = 0
        meta.cooldownUntil = now + TOGGLE_COOLDOWN_MS
      } else if (!isStoriesVisibleRef.current && direction === -1 && meta.travel >= SHOW_TRAVEL_THRESHOLD) {
        showStories()
        meta.direction = 0
        meta.travel = 0
        meta.cooldownUntil = now + TOGGLE_COOLDOWN_MS
      }

      meta.lastOffset = currentScrollY
    }

    const mainScrollContainer = mainScrollContainerRef.current

    if (mainScrollContainer) {
      mainScrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      if (mainScrollContainer) {
        mainScrollContainer.removeEventListener('scroll', handleScroll)
      }

      window.removeEventListener('scroll', handleScroll)
    }
  }, [isSearchMode])

  return {
    areStoriesVisible: isSearchMode || isStoriesVisible,
    mainScrollContainerRef,
    showStories,
  }
}

export default useExploreStoriesVisibility
