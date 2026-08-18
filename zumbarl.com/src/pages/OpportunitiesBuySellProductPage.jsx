import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMarketplaceItemPath } from '../data/marketplace'
import { MARKETPLACE_DEFAULT_SELLER } from '../data/marketplace'
import CampusSidebar from '../components/layout/CampusSidebar'
import Seo from '../components/Seo'
import MarketplaceHeader from '../features/opportunities/components/MarketplaceHeader'
import MarketplaceOfferModal from '../features/opportunities/components/MarketplaceOfferModal'
import MarketplaceProductDetails from '../features/opportunities/components/MarketplaceProductDetails'
import MarketplaceProductHead from '../features/opportunities/components/MarketplaceProductHead'
import MarketplaceProductRail from '../features/opportunities/components/MarketplaceProductRail'
import MarketplaceProductRelated from '../features/opportunities/components/MarketplaceProductRelated'
import useMarketplaceProductState from '../features/opportunities/hooks/useMarketplaceProductState'
import { addAcceptedOfferToCart, addMarketplaceListingToCart, readMarketplaceSeller, recordMarketplaceSellerView, sendMarketplaceOffer, startMarketplaceChat, updateMarketplaceListing } from '../features/opportunities/services/marketplaceInteractionService'
import { getAuthUserSnapshot, hydrateAuthUserFromBackend, subscribeAuthUser } from '../features/auth/services/authUserService'
import { CAMPUS_BUY_SELL_SEO } from '../features/seo/constants'
import { normalizeZumbarlFileUrl } from '../lib/normalizeZumbarlFileUrl'
import '../styles/campus.css'
import '../styles/opportunities.css'

function OpportunitiesBuySellProductPage() {
  const productState = useMarketplaceProductState()
  const navigate = useNavigate()
  const [seller, setSeller] = useState(MARKETPLACE_DEFAULT_SELLER)
  const [isOfferOpen, setIsOfferOpen] = useState(false)
  const [actionStatus, setActionStatus] = useState('')
  const [isActionPending, setIsActionPending] = useState(false)
  const [viewerUserId, setViewerUserId] = useState(() => getAuthUserSnapshot()?.user?.id || '')
  const sellerUsername = productState.item.seller?.username || MARKETPLACE_DEFAULT_SELLER.username
  const isOwner = Boolean(viewerUserId && seller.userId && viewerUserId === seller.userId)

  const productContext = {
    id: productState.item.id,
    title: productState.item.title,
    price: productState.item.price,
    image: productState.item.image,
    href: getMarketplaceItemPath(productState.item.id),
  }

  useEffect(() => {
    const updateViewer = () => setViewerUserId(getAuthUserSnapshot()?.user?.id || '')
    const unsubscribe = subscribeAuthUser(updateViewer)
    hydrateAuthUserFromBackend().then(updateViewer).catch(() => {})
    return unsubscribe
  }, [])

  useEffect(() => {
    let cancelled = false
    readMarketplaceSeller(sellerUsername)
      .then((profile) => {
        if (cancelled) return
        setSeller((current) => ({
          ...current,
          ...profile,
          avatar: normalizeZumbarlFileUrl(profile.avatarUrl) || current.avatar,
          role: 'Student seller',
          itemsSold: profile.itemsListed || current.itemsSold,
          joined: profile.joinedAt
            ? new Date(profile.joinedAt).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })
            : current.joined,
        }))
      })
      .catch((requestError) => setActionStatus(requestError.message))
    return () => { cancelled = true }
  }, [sellerUsername])

  async function handleChatWithSeller() {
    if (isActionPending) return
    setIsActionPending(true)
    setActionStatus('Opening your conversation…')
    try {
      const response = await startMarketplaceChat(productState.item.id, {
        sellerUsername,
        product: productContext,
      })
      navigate(`/messages?participantId=${encodeURIComponent(response.seller.userId)}`)
    } catch (requestError) {
      setActionStatus(requestError.message)
      setIsActionPending(false)
    }
  }

  async function handleSendOffer(amount) {
    const response = await sendMarketplaceOffer(productState.item.id, {
      sellerUsername,
      amount,
      currency: 'KES',
      product: productContext,
    })
    productState.setActiveOffer(response.offer)
    setIsOfferOpen(false)
    const offerAmount = Number(response.offer?.amount ?? amount)
    setActionStatus(response.alreadyPending
      ? `Your KSh ${offerAmount.toLocaleString('en-KE')} offer is already awaiting ${seller.name}'s response.`
      : `Your KSh ${offerAmount.toLocaleString('en-KE')} offer was sent to ${seller.name}.`)
  }

  async function handleViewSellerProfile() {
    if (isOwner) {
      navigate('/campus/profile?tab=shop')
      return
    }
    if (isActionPending) return
    setIsActionPending(true)
    setActionStatus('Opening seller profile…')
    try {
      const profile = await recordMarketplaceSellerView(sellerUsername, productContext)
      navigate(`/campus/profiles/${encodeURIComponent(profile.studentId)}`)
    } catch (requestError) {
      setActionStatus(requestError.message)
      setIsActionPending(false)
    }
  }

  async function handleAcceptedOfferCheckout() {
    if (!productState.activeOffer || isActionPending) return
    setIsActionPending(true)
    setActionStatus('Preparing checkout at your accepted offer price…')
    try {
      await addAcceptedOfferToCart(productState.item.id, productState.activeOffer.id)
      navigate('/campus/cart')
    } catch (requestError) {
      setActionStatus(requestError.message)
      setIsActionPending(false)
    }
  }

  async function handleAddToCart() {
    if (isActionPending) return
    setIsActionPending(true)
    setActionStatus('Adding item to your cart…')
    try {
      await addMarketplaceListingToCart(productState.item.id)
      navigate('/campus/cart')
    } catch (requestError) {
      setActionStatus(requestError.message)
      setIsActionPending(false)
    }
  }

  async function handleUpdateListingStatus() {
    if (isActionPending) return
    setIsActionPending(true)
    const shouldPause = ['published', 'active'].includes(String(productState.item.status || 'published').toLowerCase())
    try {
      const listing = await updateMarketplaceListing(productState.item.id, { status: shouldPause ? 'PAUSED' : 'ACTIVE' })
      productState.replaceItem(listing)
      setActionStatus(shouldPause ? 'Listing paused. Buyers can no longer contact you from it.' : 'Listing published again.')
    } catch (requestError) {
      setActionStatus(requestError.message)
    } finally {
      setIsActionPending(false)
    }
  }

  return (
    <main className="campus-page opportunities-page opportunities-marketplace-page opportunities-marketplace-product-page">
      <Seo
        title={`${productState.item.title} | Zumbarl Buy & Sell`}
        description={productState.item.subtitle || productState.item.description || CAMPUS_BUY_SELL_SEO.description}
        path={getMarketplaceItemPath(productState.item.id)}
        keywords={`${CAMPUS_BUY_SELL_SEO.keywords}, ${productState.item.title}, ${productState.item.category}`}
        jsonLd={[CAMPUS_BUY_SELL_SEO.pageJsonLd]}
      />

      <div className="campus-stage">
        <div className="campus-shell opportunities-marketplace-shell">
          <CampusSidebar activeItemId="marketplace" />

          <section className="campus-main opportunities-main opportunities-marketplace-main opportunities-marketplace-product-main">
            <MarketplaceHeader onOpenOrders={() => navigate('/campus/opportunities/buy-sell?view=orders')} onPostItem={() => navigate('/campus/marketplace/listings/new')} showSearch={false} />
            <MarketplaceProductHead isOwner={isOwner} item={productState.item} />
            <MarketplaceProductDetails
              activeImage={productState.activeImage}
              activeImageIndex={productState.activeImageIndex}
              galleryImages={productState.galleryImages}
              item={productState.item}
              onImageSelect={productState.onImageSelect}
              onStepImage={productState.onStepImage}
              overflowCount={productState.overflowCount}
              showThumbOverflow={productState.showThumbOverflow}
              visibleThumbs={productState.visibleThumbs}
            />
            <MarketplaceProductRelated
              onCardKeyDown={productState.handleCardKeyDown}
              onOpenItemDetail={productState.onOpenItemDetail}
              relatedItems={productState.relatedItems}
            />
          </section>

          <MarketplaceProductRail
            activeOffer={productState.activeOffer}
            item={productState.item}
            isOwner={isOwner}
            seller={seller}
            actionStatus={actionStatus}
            isActionPending={isActionPending}
            onChatWithSeller={handleChatWithSeller}
            onAddToCart={handleAddToCart}
            onCheckoutAcceptedOffer={handleAcceptedOfferCheckout}
            onMakeOffer={() => {
              if (!productState.activeOffer || productState.activeOffer.status === 'declined') setIsOfferOpen(true)
            }}
            onViewSellerProfile={handleViewSellerProfile}
            onCardKeyDown={productState.handleCardKeyDown}
            onOpenItemDetail={productState.onOpenItemDetail}
            onEditListing={() => navigate(`/campus/marketplace/listings/${encodeURIComponent(productState.item.id)}/edit`)}
            onUpdateListingStatus={handleUpdateListingStatus}
            suggestedItems={productState.suggestedItems}
          />
          <MarketplaceOfferModal
            initialAmount={productState.activeOffer?.status === 'declined' ? productState.activeOffer.amount : ''}
            isOpen={isOfferOpen}
            item={productState.item}
            onClose={() => setIsOfferOpen(false)}
            onSubmit={handleSendOffer}
            seller={seller}
          />
        </div>
      </div>
    </main>
  )
}

export default OpportunitiesBuySellProductPage
