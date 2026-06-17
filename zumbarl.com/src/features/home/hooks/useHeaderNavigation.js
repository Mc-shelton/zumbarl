import { useCallback, useEffect, useRef, useState } from 'react'

export function useHeaderNavigation() {
  const [activeMegaMenu, setActiveMegaMenu] = useState(null)
  const [topNavHeight, setTopNavHeight] = useState(90)
  const [isNavVisible, setIsNavVisible] = useState(true)
  const shellRef = useRef(null)
  const topNavRef = useRef(null)
  const lastScrollYRef = useRef(0)
  const isMegaMenuOpen = activeMegaMenu !== null

  const closeMegaMenu = useCallback(() => {
    setActiveMegaMenu(null)
  }, [])

  const openMegaMenu = useCallback((menuKey) => {
    setActiveMegaMenu(menuKey)
  }, [])

  useEffect(() => {
    const updateTopNavHeight = () => {
      if (!topNavRef.current) {
        return
      }

      const nextHeight = Math.round(topNavRef.current.getBoundingClientRect().height)
      setTopNavHeight(nextHeight > 0 ? nextHeight : 90)
    }

    updateTopNavHeight()
    window.addEventListener('resize', updateTopNavHeight)

    return () => {
      window.removeEventListener('resize', updateTopNavHeight)
    }
  }, [])

  useEffect(() => {
    lastScrollYRef.current = window.scrollY || 0

    const scrollDelta = 6
    const hideOffset = Math.max(topNavHeight, 72)

    const handleScroll = () => {
      const currentY = window.scrollY || 0
      const previousY = lastScrollYRef.current
      const delta = currentY - previousY

      if (currentY <= hideOffset) {
        setIsNavVisible(true)
        lastScrollYRef.current = currentY
        return
      }

      if (delta > scrollDelta) {
        setIsNavVisible(false)
        closeMegaMenu()
      } else if (delta < -scrollDelta) {
        setIsNavVisible(true)
      }

      lastScrollYRef.current = currentY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [closeMegaMenu, topNavHeight])

  useEffect(() => {
    if (!isMegaMenuOpen) {
      return undefined
    }

    const handlePointerDown = (event) => {
      if (!shellRef.current?.contains(event.target)) {
        closeMegaMenu()
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeMegaMenu()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeMegaMenu, isMegaMenuOpen])

  return {
    activeMegaMenu,
    closeMegaMenu,
    isMegaMenuOpen,
    isNavVisible,
    openMegaMenu,
    shellRef,
    topNavHeight,
    topNavRef,
  }
}
