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
import { ORDER_ITEMS } from '../features/cart/cartData'
import { getOrderTotals } from '../features/cart/pricing'
import { CAMPUS_CART_REVIEW_SEO } from '../features/seo/constants'
import '../styles/campus.css'
import '../styles/cart.css'

const orderTotals = getOrderTotals(ORDER_ITEMS)

function CampusCartReviewPage() {
  const navigate = useNavigate()

  return (
    <CartShell
      checkout
      rail={(
        <CheckoutOrderSummaryRail
          compact
          items={ORDER_ITEMS}
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
        onBack={() => navigate('/campus/cart/payment')}
        onPlaceOrder={() => navigate('/campus/cart/order-placed')}
      />
      <CheckoutPoweredNote />
    </CartShell>
  )
}

export default CampusCartReviewPage
