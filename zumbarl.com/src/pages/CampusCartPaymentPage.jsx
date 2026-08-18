import { useNavigate } from 'react-router-dom'
import Seo from '../components/Seo'
import { CartShell } from '../features/cart/components/CartShell'
import { CartTopActions } from '../features/cart/components/CartTopActions'
import { CheckoutHeader } from '../features/cart/components/CheckoutHeader'
import { CheckoutOrderSummaryRail } from '../features/cart/components/CheckoutOrderSummaryRail'
import { CheckoutPoweredNote } from '../features/cart/components/CheckoutPoweredNote'
import { CheckoutStepper } from '../features/cart/components/CheckoutStepper'
import { DeliveryEstimateCard } from '../features/cart/components/DeliveryEstimateCard'
import { PaymentMethodPanel } from '../features/cart/components/PaymentMethodPanel'
import {
  CHECKOUT_BREADCRUMBS,
  CHECKOUT_STEPS,
} from '../features/cart/checkoutData'
import { useCartPageState } from '../features/cart/hooks/useCartPageState'
import { CAMPUS_CART_PAYMENT_SEO } from '../features/seo/constants'
import '../styles/campus.css'
import '../styles/cart.css'

function CampusCartPaymentPage() {
  const navigate = useNavigate()
  const { cartItems, totals: orderTotals } = useCartPageState()

  return (
    <CartShell
      checkout
      rail={(
        <CheckoutOrderSummaryRail
          items={cartItems}
          showImages
          totals={orderTotals}
        >
          <DeliveryEstimateCard />
        </CheckoutOrderSummaryRail>
      )}
    >
      <Seo
        title={CAMPUS_CART_PAYMENT_SEO.title}
        description={CAMPUS_CART_PAYMENT_SEO.description}
        path={CAMPUS_CART_PAYMENT_SEO.path}
        keywords={CAMPUS_CART_PAYMENT_SEO.keywords}
        jsonLd={[CAMPUS_CART_PAYMENT_SEO.pageJsonLd]}
      />

      <CartTopActions />
      <CheckoutHeader
        breadcrumbs={CHECKOUT_BREADCRUMBS.payment}
        title="Payment"
        description="Choose your preferred payment method and complete your purchase securely."
      />
      <CheckoutStepper steps={CHECKOUT_STEPS.payment} />
      <PaymentMethodPanel
        onBack={() => navigate('/campus/cart')}
        onNext={() => navigate('/campus/cart/review')}
      />
      <CheckoutPoweredNote />
    </CartShell>
  )
}

export default CampusCartPaymentPage
