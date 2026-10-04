import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMarketplaceItemPath } from '../data/marketplace'
import CampusSidebar from '../components/layout/CampusSidebar'
import Seo from '../components/Seo'
import MarketplaceHeader from '../features/opportunities/components/MarketplaceHeader'
import MarketplaceOfferModal from '../features/opportunities/components/MarketplaceOfferModal'
import MarketplaceProductDetails from '../features/opportunities/components/MarketplaceProductDetails'
import MarketplaceProductHead from '../features/opportunities/components/MarketplaceProductHead'
import MarketplaceProductRail from '../features/opportunities/components/MarketplaceProductRail'
import MarketplaceServiceRequestModal from '../features/opportunities/components/MarketplaceServiceRequestModal'
import MarketplaceProductRelated from '../features/opportunities/components/MarketplaceProductRelated'
import useMarketplaceProductState from '../features/opportunities/hooks/useMarketplaceProductState'
import { addAcceptedOfferToCart, addMarketplaceListingToCart, readMarketplaceSeller, recordMarketplaceSellerView, sendMarketplaceOffer, startMarketplaceChat, updateMarketplaceListing } from '../features/opportunities/services/marketplaceInteractionService'
import { getAuthUserSnapshot, hydrateAuthUserFromBackend, subscribeAuthUser } from '../features/auth/services/authUserService'
import { CAMPUS_BUY_SELL_SEO } from '../features/seo/constants'
import { normalizeZumbarlFileUrl } from '../lib/normalizeZumbarlFileUrl'
import { isFoodListing } from '../features/eatery/eateryListings'
import '../styles/campus.css'
import '../styles/opportunities.css'

function OpportunitiesBuySellProductPage() {
  const productState = useMarketplaceProductState()
  const navigate = useNavigate()
  const [seller, setSeller] = useState(null)
  const [isOfferOpen, setIsOfferOpen] = useState(false)
  const [isServiceRequestOpen, setIsServiceRequestOpen] = useState(false)
  const [actionStatus, setActionStatus] = useState('')
  const [isActionPending, setIsActionPending] = useState(false)
  const [viewerUserId, setViewerUserId] = useState(() => getAuthUserSnapshot()?.user?.id || '')
  const sellerUsername = productState.item.seller?.username || ''
  const isOwner = Boolean(viewerUserId && seller?.userId && viewerUserId === seller.userId)
  const isEateryItem = isFoodListing(productState.item)
  const isStudentKitchenItem = String(productState.item.shop?.vendorType || '').toLowerCase() === 'student_kitchen'

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
    if (!sellerUsername) return undefined
    let cancelled = false
    readMarketplaceSeller(sellerUsername)
      .then((profile) => {
        if (cancelled) return
        setSeller((current) => ({
          ...current,
          ...profile,
          avatar: normalizeZumbarlFileUrl(profile.avatarUrl) || current?.avatar || '',
          role: 'Student seller',
          itemsSold: profile.itemsListed ?? current?.itemsSold,
          joined: profile.joinedAt
            ? new Date(profile.joinedAt).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })
            : current?.joined,
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
      if (response.pageConversation?.page) {
        navigate(`/messages?${new URLSearchParams({
          pageType: response.pageConversation.page.type,
          pageId: response.pageConversation.page.id,
        }).toString()}`)
      } else {
        navigate(`/messages?participantId=${encodeURIComponent(response.seller.userId)}`)
      }
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
      ? `Your KSh ${offerAmount.toLocaleString('en-KE')} offer is already awaiting ${seller?.name || 'the seller'}'s response.`
      : `Your KSh ${offerAmount.toLocaleString('en-KE')} offer was sent to ${seller?.name || 'the seller'}.`)
  }

  async function handleViewSellerProfile() {
    if (productState.item.shop?.entityType === 'campus_vendor' && productState.item.shop?.slug) {
      const vendorPath = `/campus/vendors/${encodeURIComponent(productState.item.shop.slug)}`
      navigate(isOwner ? `${vendorPath}/manage` : vendorPath)
      return
    }
    if (isOwner) {
      navigate('/campus/profile?tab=shop')
      return
    }
    if (productState.item.shop?.slug) {
      navigate(`/campus/vendors/${encodeURIComponent(productState.item.shop.slug)}`)
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

  async function handleAddToCart(serviceRequest) {
    if (isActionPending) return
    setIsActionPending(true)
    setActionStatus(serviceRequest
      ? 'Saving your service request…'
      : productState.item.serviceMode === 'order_ahead'
        ? 'Preparing your order…'
        : 'Adding item to your cart…')
    try {
      await addMarketplaceListingToCart(productState.item.id, 1, serviceRequest)
      setIsServiceRequestOpen(false)
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
          <CampusSidebar activeItemId={isEateryItem ? 'eatery' : 'marketplace'} />

          <section className="campus-main opportunities-main opportunities-marketplace-main opportunities-marketplace-product-main">
            <MarketplaceHeader
              breadcrumbItems={isEateryItem ? [{ label: 'Campus' }, { label: 'Eatery' }] : undefined}
              createLabel={isEateryItem ? 'List a meal' : 'Create listing'}
              onOpenOrders={() => navigate('/campus/opportunities/buy-sell?view=orders')}
              onPostItem={() => navigate(isEateryItem ? '/campus/marketplace/listings/new?mode=food' : '/campus/marketplace/listings/new')}
              subtitle={isEateryItem ? (isStudentKitchenItem ? 'Place your order, then choose one of the kitchen’s listed campus pickup locations.' : 'Place your order and choose an available in-campus delivery option at checkout.') : undefined}
              title={isEateryItem ? 'Campus Eatery' : undefined}
            />
            <MarketplaceProductHead isEatery={isEateryItem} isOwner={isOwner} item={productState.item} />
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
            onRequestService={() => setIsServiceRequestOpen(true)}
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
          {isServiceRequestOpen && productState.item.serviceMode !== 'order_ahead' ? (
            <MarketplaceServiceRequestModal
              isPending={isActionPending}
              item={productState.item}
              onClose={() => setIsServiceRequestOpen(false)}
              onSubmit={handleAddToCart}
            />
          ) : null}
        </div>
      </div>
    </main>
  )
}

export default OpportunitiesBuySellProductPage
