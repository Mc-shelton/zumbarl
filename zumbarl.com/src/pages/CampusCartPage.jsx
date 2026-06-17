import Seo from '../components/Seo'
import { CartHeader } from '../features/cart/components/CartHeader'
import { CartItemsPanel } from '../features/cart/components/CartItemsPanel'
import { CartShell } from '../features/cart/components/CartShell'
import { CartSummaryRail } from '../features/cart/components/CartSummaryRail'
import { CartTopActions } from '../features/cart/components/CartTopActions'
import { useCartPageState } from '../features/cart/hooks/useCartPageState'
import { CAMPUS_CART_SEO } from '../features/seo/constants'
import '../styles/campus.css'
import '../styles/cart.css'

function CampusCartPage() {
  const {
    cartItems,
    handleClearCart,
    handleQuantityChange,
    handleRemoveItem,
    promoCode,
    setPromoCode,
    totals,
  } = useCartPageState()

  return (
    <CartShell
      rail={(
        <CartSummaryRail
          promoCode={promoCode}
          setPromoCode={setPromoCode}
          totals={totals}
        />
      )}
    >
      <Seo
        title={CAMPUS_CART_SEO.title}
        description={CAMPUS_CART_SEO.description}
        path={CAMPUS_CART_SEO.path}
        keywords={CAMPUS_CART_SEO.keywords}
        jsonLd={[CAMPUS_CART_SEO.pageJsonLd]}
      />

      <CartTopActions />
      <CartHeader itemCount={totals.itemCount} onClearCart={handleClearCart} />
      <CartItemsPanel
        items={cartItems}
        onQuantityChange={handleQuantityChange}
        onRemoveItem={handleRemoveItem}
      />
    </CartShell>
  )
}

export default CampusCartPage
