import { Breadcrumb } from '../../../components/ui'

export function CheckoutHeader({ breadcrumbs, description, title }) {
  return (
    <header className="campus-checkout-header">
      <div className="campus-cart-head-copy">
        <Breadcrumb className="campus-cart-breadcrumb" items={breadcrumbs} />
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </header>
  )
}
