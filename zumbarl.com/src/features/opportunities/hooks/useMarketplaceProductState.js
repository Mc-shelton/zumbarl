import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  FEATURED_ITEMS,
  getMarketplaceItem,
  getMarketplaceItemPath,
  getMarketplaceRelatedItems,
} from '../../../data/marketplace'
import { mapMarketplaceApiListing, readMarketplaceListing } from '../services/marketplaceInteractionService'

function useMarketplaceProductState() {
  const { itemId } = useParams()
  const navigate = useNavigate()
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [remoteItem, setRemoteItem] = useState(null)
  const [activeOffer, setActiveOffer] = useState(null)
  const fallbackItem = useMemo(() => getMarketplaceItem(itemId) || FEATURED_ITEMS[0], [itemId])
  const item = remoteItem?.id === itemId ? remoteItem : fallbackItem
  const galleryImages = item?.galleryImages?.length > 0 ? item.galleryImages : [item.image]
  const activeImage = galleryImages[activeImageIndex] || galleryImages[0]
  const relatedItems = useMemo(() => getMarketplaceRelatedItems(item.id, 5), [item.id])
  const suggestedItems = useMemo(() => getMarketplaceRelatedItems(item.id, 3), [item.id])
  const showThumbOverflow = galleryImages.length > 5
  const visibleThumbs = showThumbOverflow ? galleryImages.slice(0, 5) : galleryImages
  const overflowCount = Math.max(galleryImages.length - 5, 0)

  useEffect(() => {
    let cancelled = false
    readMarketplaceListing(itemId)
      .then((response) => {
        if (!cancelled) {
          setRemoteItem(mapMarketplaceApiListing(response?.listing))
          setActiveOffer(response?.activeOffer || null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRemoteItem(null)
          setActiveOffer(null)
        }
      })
    return () => { cancelled = true }
  }, [itemId])

  const stepImage = (delta) => {
    const total = galleryImages.length
    setActiveImageIndex((previous) => (previous + delta + total) % total)
  }

  const openItemDetail = (nextItemId) => {
    if (!nextItemId) {
      return
    }

    navigate(getMarketplaceItemPath(nextItemId))
    setActiveImageIndex(0)
  }

  const handleCardKeyDown = (event, nextItemId) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openItemDetail(nextItemId)
    }
  }

  return {
    activeImage,
    activeImageIndex,
    activeOffer,
    galleryImages,
    handleCardKeyDown,
    item,
    onImageSelect: setActiveImageIndex,
    onOpenItemDetail: openItemDetail,
    onStepImage: stepImage,
    overflowCount,
    relatedItems,
    replaceItem: (listing) => setRemoteItem(mapMarketplaceApiListing(listing)),
    setActiveOffer,
    showThumbOverflow,
    suggestedItems,
    visibleThumbs,
  }
}

export default useMarketplaceProductState
