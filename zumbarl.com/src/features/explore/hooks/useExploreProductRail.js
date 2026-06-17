import { useState } from 'react'
import { getWrappedGalleryIndex } from '../utils/gallery'

function useExploreProductRail({ productDetails }) {
  const [activeRailProductId, setActiveRailProductId] = useState(null)
  const [activeRailProductImageIndex, setActiveRailProductImageIndex] = useState(0)
  const [activeRailProductTab, setActiveRailProductTab] = useState('details')

  const resetRailProduct = () => {
    setActiveRailProductId(null)
    setActiveRailProductImageIndex(0)
    setActiveRailProductTab('details')
  }

  const handleViewProduct = (post) => {
    if (!post.shopProductRef || !productDetails[post.shopProductRef]) {
      return
    }

    setActiveRailProductId(post.shopProductRef)
    setActiveRailProductImageIndex(0)
    setActiveRailProductTab('details')
  }

  const activeRailProduct = activeRailProductId ? productDetails[activeRailProductId] || null : null
  const activeRailProductGallery = activeRailProduct?.gallery || []
  const normalizedRailProductImageIndex = activeRailProductGallery.length
    ? getWrappedGalleryIndex(activeRailProductImageIndex, activeRailProductGallery.length)
    : 0
  const activeRailProductImage = activeRailProductGallery[normalizedRailProductImageIndex] || null

  const handleStepRailProductImage = (direction) => {
    if (!activeRailProductGallery.length) {
      return
    }

    setActiveRailProductImageIndex((current) => getWrappedGalleryIndex(current + direction, activeRailProductGallery.length))
  }

  return {
    activeRailProduct,
    activeRailProductGallery,
    activeRailProductImage,
    activeRailProductTab,
    handleStepRailProductImage,
    handleViewProduct,
    normalizedRailProductImageIndex,
    resetRailProduct,
    setActiveRailProductId,
    setActiveRailProductImageIndex,
    setActiveRailProductTab,
  }
}

export default useExploreProductRail
