import { FiTrash2 } from 'react-icons/fi'
import { Breadcrumb } from '../../../components/ui'

export function CartHeader({ itemCount, onClearCart }) {
  return (
    <header className="campus-cart-header">
      <div className="campus-cart-head-copy">
        <Breadcrumb
          className="campus-cart-breadcrumb"
          items={[
            { label: 'Campus' },
            { label: 'Cart' },
          ]}
        />
        <h1>My Cart ({itemCount})</h1>
        <p>Review your items and proceed to checkout.</p>
      </div>

      <button type="button" className="campus-cart-clear-btn" onClick={onClearCart}>
        <FiTrash2 aria-hidden="true" />
        Clear Cart
      </button>
    </header>
  )
}
