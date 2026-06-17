import { useEffect, useState } from 'react'

function useMarketplaceSlideshow() {
  const [activeMarketplaceHover, setActiveMarketplaceHover] = useState('')
  const [activeMarketplaceSlide, setActiveMarketplaceSlide] = useState(0)

  useEffect(() => {
    if (!activeMarketplaceHover) {
      return undefined
    }

    const intervalId = setInterval(() => {
      setActiveMarketplaceSlide((current) => current + 1)
    }, 1150)

    return () => clearInterval(intervalId)
  }, [activeMarketplaceHover])

  const handleMarketplaceHoverStart = (marketplaceKey, imageCount) => {
    if (imageCount < 2) {
      return
    }
    setActiveMarketplaceHover(marketplaceKey)
    setActiveMarketplaceSlide(1)
  }

  const handleMarketplaceHoverEnd = () => {
    setActiveMarketplaceHover('')
    setActiveMarketplaceSlide(0)
  }

  return {
    activeMarketplaceHover,
    activeMarketplaceSlide,
    handleMarketplaceHoverEnd,
    handleMarketplaceHoverStart,
  }
}

export default useMarketplaceSlideshow
