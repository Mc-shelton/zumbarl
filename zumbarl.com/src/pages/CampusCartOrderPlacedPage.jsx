import { useLocation, useNavigate } from 'react-router-dom'
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
import { CAMPUS_CART_ORDER_PLACED_SEO } from '../features/seo/constants'
import '../styles/campus.css'
import '../styles/cart.css'

function CampusCartOrderPlacedPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const order = location.state?.order || null
  const cartItems = Array.isArray(order?.items) ? order.items.map((item) => ({
    ...item,
    id: item.listingId || item.id,
    unitPrice: Number(item.unitAmount || 0),
  })) : []
  const deliveryFee = Number(order?.settlement?.deliveryFee || 0)
  const orderTotals = {
    deliveryFee,
    deliveryPending: false,
    finalTotal: Number(order?.totalAmount || 0),
    hasDelivery: deliveryFee > 0,
    subtotal: Number(order?.settlement?.subtotal || order?.totalAmount || 0) - deliveryFee,
  }

  return (
    <CartShell
      checkout
      rail={(
        <CheckoutOrderSummaryRail
          compact
          editLabel="View Orders"
          editPath="/campus/opportunities?tab=service-orders"
          items={cartItems}
          totals={orderTotals}
        >
          <OrderDeliverySummaryNote location={order?.handoffSpot} />
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
      {order ? (
        <OrderPlacedPanel
          order={order}
          totals={orderTotals}
          onContinueShopping={() => navigate('/campus/opportunities/buy-sell')}
          onViewOrders={() => navigate('/campus/opportunities?tab=service-orders')}
        />
      ) : (
        <section className="campus-checkout-panel campus-order-placed-stack" role="alert">
          <h2>Order details are not available on this page.</h2>
          <p>Open My Orders to view the current status from the server.</p>
          <button type="button" className="campus-checkout-next-btn" onClick={() => navigate('/campus/opportunities?tab=service-orders')}>View My Orders</button>
        </section>
      )}
      <CheckoutPoweredNote />
    </CartShell>
  )
}

export default CampusCartOrderPlacedPage
