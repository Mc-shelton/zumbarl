import CampusSidebar from '../../../components/layout/CampusSidebar'

export function CartShell({ children, checkout = false, rail, railLabel = 'Order summary' }) {
  const mainClassName = `campus-page campus-cart-page${checkout ? ' campus-checkout-page' : ''}`

  return (
    <main className={mainClassName}>
      <div className="campus-stage">
        <div className="campus-shell campus-cart-shell">
          <CampusSidebar activeItemId="opportunities" />

          <section className="campus-main campus-cart-main">
            {children}
          </section>

          <aside className="campus-rail campus-cart-rail" aria-label={railLabel}>
            {rail}
          </aside>
        </div>
      </div>
    </main>
  )
}
