import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import CampusSidebar from '../components/layout/CampusSidebar'
import Seo from '../components/Seo'
import { ConfirmDialog } from '../components/ui'
import MarketplaceCategories from '../features/opportunities/components/MarketplaceCategories'
import MarketplaceCommerceGuide from '../features/opportunities/components/MarketplaceCommerceGuide'
import MarketplaceHeader, { MarketplaceSearch } from '../features/opportunities/components/MarketplaceHeader'
import MarketplaceBuyerOrders from '../features/opportunities/components/MarketplaceBuyerOrders'
import MarketplaceItemSections from '../features/opportunities/components/MarketplaceItemSections'
import MarketplaceRail from '../features/opportunities/components/MarketplaceRail'
import useMarketplacePageState from '../features/opportunities/hooks/useMarketplacePageState'
import { CAMPUS_BUY_SELL_SEO } from '../features/seo/constants'
import { cancelMarketplaceOrder, confirmMarketplaceOrderReceived, readMyMarketplaceOrders } from '../features/opportunities/services/marketplaceInteractionService'
import '../styles/campus.css'
import '../styles/opportunities.css'

function OpportunitiesBuySellPage() {
  const marketplaceState = useMarketplacePageState()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const isOrdersOpen = searchParams.get('view') === 'orders'
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState('')
  const [updatingOrderId, setUpdatingOrderId] = useState('')
  const [orderToCancel, setOrderToCancel] = useState(null)
  const marketplaceMainRef = useRef(null)

  useLayoutEffect(() => {
    marketplaceMainRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [isOrdersOpen])

  const updateBuyerOrder = async (order, action) => {
    if (updatingOrderId) return
    setUpdatingOrderId(order.id)
    setOrdersError('')
    try {
      const updated = action === 'received' ? await confirmMarketplaceOrderReceived(order.id) : await cancelMarketplaceOrder(order.id)
      setOrders((current) => current.map((item) => item.id === order.id ? { ...item, ...updated } : item))
    } catch (error) { setOrdersError(error?.message || 'The order could not be updated.') }
    finally { setUpdatingOrderId('') }
  }

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true)
    setOrdersError('')
    try {
      const response = await readMyMarketplaceOrders()
      setOrders(response.data || [])
    } catch (error) { setOrdersError(error?.message || 'We could not load your orders.') }
    finally { setOrdersLoading(false) }
  }, [])

  useEffect(() => {
    if (!isOrdersOpen) return undefined
    let cancelled = false
    readMyMarketplaceOrders()
      .then((response) => { if (!cancelled) { setOrders(response.data || []); setOrdersError('') } })
      .catch((error) => { if (!cancelled) setOrdersError(error?.message || 'We could not load your orders.') })
      .finally(() => { if (!cancelled) setOrdersLoading(false) })
    return () => { cancelled = true }
  }, [isOrdersOpen])

  return (
    <main className="campus-page opportunities-page opportunities-marketplace-page">
      <Seo
        title={CAMPUS_BUY_SELL_SEO.title}
        description={CAMPUS_BUY_SELL_SEO.description}
        path={CAMPUS_BUY_SELL_SEO.path}
        keywords={CAMPUS_BUY_SELL_SEO.keywords}
        jsonLd={[CAMPUS_BUY_SELL_SEO.pageJsonLd]}
      />

      <div className="campus-stage">
        <div className={`campus-shell opportunities-marketplace-shell${isOrdersOpen ? ' is-buyer-orders' : ''}`}>
          <CampusSidebar activeItemId="marketplace" />

          <section ref={marketplaceMainRef} className="campus-main opportunities-main opportunities-marketplace-main">
            <MarketplaceHeader isOrdersOpen={isOrdersOpen} onOpenOrders={() => { if (!isOrdersOpen) setOrdersLoading(true); setSearchParams(isOrdersOpen ? {} : { view: 'orders' }) }} onPostItem={() => navigate('/campus/marketplace/listings/new')} />
            {isOrdersOpen ? <MarketplaceBuyerOrders error={ordersError} isLoading={ordersLoading} onCancel={setOrderToCancel} onConfirmReceived={(order) => updateBuyerOrder(order, 'received')} onContinueShopping={() => setSearchParams({})} onMessageSeller={() => navigate('/messages')} onRefresh={loadOrders} orders={orders} updatingOrderId={updatingOrderId} /> : <>
            <MarketplaceCommerceGuide onSelect={marketplaceState.onCategoryChange} />
            <MarketplaceCategories
              activeCategory={marketplaceState.activeCategory}
              onCategoryChange={marketplaceState.onCategoryChange}
              onCategoryKeyDown={marketplaceState.handleCategoryKeyDown}
            />
            <MarketplaceSearch />
            <MarketplaceItemSections
              activeCategory={marketplaceState.activeCategory}
              activeRecentFilter={marketplaceState.activeRecentFilter}
              filteredFeaturedItems={marketplaceState.filteredFeaturedItems}
              filteredRecentItems={marketplaceState.filteredRecentItems}
              onCardKeyDown={marketplaceState.handleCardKeyDown}
              onCategoryChange={marketplaceState.onCategoryChange}
              onOpenItemDetail={marketplaceState.onOpenItemDetail}
              onRecentFilterChange={marketplaceState.onRecentFilterChange}
              onToggleSavedItem={marketplaceState.onToggleSavedItem}
              savedItemIds={marketplaceState.savedItemIds}
            />
            </>}
          </section>

          {!isOrdersOpen ? <MarketplaceRail
            activeCategory={marketplaceState.activeCategory}
            filteredTrendingItems={marketplaceState.filteredTrendingItems}
            onCardKeyDown={marketplaceState.handleCardKeyDown}
            onOpenItemDetail={marketplaceState.onOpenItemDetail}
          /> : null}
        </div>
      </div>
      <ConfirmDialog
        confirmLabel="Cancel order"
        description="This will stop fulfilment and send your held payment to Zumbarl administrators for refund review under company policy. No funds have been released to the seller. This action cannot be undone."
        isOpen={Boolean(orderToCancel)}
        isPending={Boolean(orderToCancel && updatingOrderId === orderToCancel.id)}
        onCancel={() => setOrderToCancel(null)}
        onConfirm={async () => { await updateBuyerOrder(orderToCancel, 'cancel'); setOrderToCancel(null) }}
        title={orderToCancel ? `Cancel order #${orderToCancel.id.slice(-8).toUpperCase()}?` : 'Cancel order?'}
      />
    </main>
  )
}

export default OpportunitiesBuySellPage
