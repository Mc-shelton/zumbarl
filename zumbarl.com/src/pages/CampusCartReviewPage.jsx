import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Seo from '../components/Seo'
import { CartShell } from '../features/cart/components/CartShell'
import { CartTopActions } from '../features/cart/components/CartTopActions'
import { CheckoutHeader } from '../features/cart/components/CheckoutHeader'
import { CheckoutOrderSummaryRail } from '../features/cart/components/CheckoutOrderSummaryRail'
import { CheckoutPoweredNote } from '../features/cart/components/CheckoutPoweredNote'
import { CheckoutStepper } from '../features/cart/components/CheckoutStepper'
import { DeliveryEstimateCard } from '../features/cart/components/DeliveryEstimateCard'
import { ReviewOrderPanel } from '../features/cart/components/ReviewOrderPanel'
import {
  CHECKOUT_BREADCRUMBS,
  CHECKOUT_STEPS,
} from '../features/cart/checkoutData'
import { useCartPageState } from '../features/cart/hooks/useCartPageState'
import { CAMPUS_CART_REVIEW_SEO } from '../features/seo/constants'
import { createMarketplaceOrder } from '../features/opportunities/services/marketplaceInteractionService'
import '../styles/campus.css'
import '../styles/cart.css'

function CampusCartReviewPage() {
  const navigate = useNavigate()
  const { cartId, cartItems, totals: orderTotals } = useCartPageState()
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [orderError, setOrderError] = useState('')

  const handlePlaceOrder = async () => {
    if (isPlacingOrder || !cartId || !cartItems.length) return
    setIsPlacingOrder(true)
    setOrderError('')
    const deliveryItems = cartItems.filter((item) => item.fulfilment?.method !== 'pickup')
    const handoffType = deliveryItems.length ? 'drop-off' : 'pickup'
    const handoffSpot = [...new Set(cartItems.map((item) => item.fulfilment?.location).filter(Boolean))].join(' · ')
      || (handoffType === 'pickup' ? 'Campus pickup' : 'Arrange with seller')
    try {
      const order = await createMarketplaceOrder({
        cartId,
        handoffType,
        handoffSpot,
        paymentReference: `ZMB-${Date.now()}`,
      })
      navigate('/campus/cart/order-placed', { state: { order } })
    } catch (error) {
      setOrderError(error?.message || 'Your order could not be placed. Your cart is safe—please try again.')
      setIsPlacingOrder(false)
    }
  }

  return (
    <CartShell
      checkout
      rail={(
        <CheckoutOrderSummaryRail
          compact
          items={cartItems}
          showQuantity={false}
          totals={orderTotals}
        >
          <DeliveryEstimateCard />
        </CheckoutOrderSummaryRail>
      )}
    >
      <Seo
        title={CAMPUS_CART_REVIEW_SEO.title}
        description={CAMPUS_CART_REVIEW_SEO.description}
        path={CAMPUS_CART_REVIEW_SEO.path}
        keywords={CAMPUS_CART_REVIEW_SEO.keywords}
        jsonLd={[CAMPUS_CART_REVIEW_SEO.pageJsonLd]}
      />

      <CartTopActions />
      <CheckoutHeader
        breadcrumbs={CHECKOUT_BREADCRUMBS.review}
        title="Review Order"
        description="Please review your order details before placing your order."
      />
      <CheckoutStepper steps={CHECKOUT_STEPS.review} />
      <ReviewOrderPanel
        error={orderError}
        isPlacingOrder={isPlacingOrder}
        items={cartItems}
        onBack={() => navigate('/campus/cart/payment')}
        onPlaceOrder={handlePlaceOrder}
      />
      <CheckoutPoweredNote />
    </CartShell>
  )
}

export default CampusCartReviewPage
