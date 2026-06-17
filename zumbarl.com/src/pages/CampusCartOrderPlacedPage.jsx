import { useNavigate } from 'react-router-dom'
import Seo from '../components/Seo'
import { CartShell } from '../features/cart/components/CartShell'
import { CartTopActions } from '../features/cart/components/CartTopActions'
import { CheckoutHeader } from '../features/cart/components/CheckoutHeader'
import { CheckoutOrderSummaryRail } from '../features/cart/components/CheckoutOrderSummaryRail'
import { CheckoutPoweredNote } from '../features/cart/components/CheckoutPoweredNote'
import { CheckoutStepper } from '../features/cart/components/CheckoutStepper'
import { OrderDeliverySummaryNote } from '../features/cart/components/OrderDeliverySummaryNote'
import { OrderPlacedPanel } from '../features/cart/components/OrderPlacedPanel'
import {
  CHECKOUT_BREADCRUMBS,
  CHECKOUT_STEPS,
} from '../features/cart/checkoutData'
import { ORDER_ITEMS } from '../features/cart/cartData'
import { getOrderTotals } from '../features/cart/pricing'
import { CAMPUS_CART_ORDER_PLACED_SEO } from '../features/seo/constants'
import '../styles/campus.css'
import '../styles/cart.css'

const orderTotals = getOrderTotals(ORDER_ITEMS)

function CampusCartOrderPlacedPage() {
  const navigate = useNavigate()

  return (
    <CartShell
      checkout
      rail={(
        <CheckoutOrderSummaryRail
          compact
          editLabel="View Orders"
          editPath="/campus/opportunities?tab=service-orders"
          items={ORDER_ITEMS}
          totals={orderTotals}
        >
          <OrderDeliverySummaryNote />
        </CheckoutOrderSummaryRail>
      )}
    >
      <Seo
        title={CAMPUS_CART_ORDER_PLACED_SEO.title}
        description={CAMPUS_CART_ORDER_PLACED_SEO.description}
        path={CAMPUS_CART_ORDER_PLACED_SEO.path}
        keywords={CAMPUS_CART_ORDER_PLACED_SEO.keywords}
        jsonLd={[CAMPUS_CART_ORDER_PLACED_SEO.pageJsonLd]}
      />

      <CartTopActions actionLabel="Explore Campus" />
      <CheckoutHeader
        breadcrumbs={CHECKOUT_BREADCRUMBS.confirmation}
        title="Order Placed"
        description="Your order has been confirmed. Track progress and delivery updates from here."
      />
      <CheckoutStepper steps={CHECKOUT_STEPS.confirmation} />
      <OrderPlacedPanel
        totals={orderTotals}
        onContinueShopping={() => navigate('/campus/opportunities/buy-sell')}
        onViewOrders={() => navigate('/campus/opportunities?tab=service-orders')}
      />
      <CheckoutPoweredNote />
    </CartShell>
  )
}

export default CampusCartOrderPlacedPage
