import { FiLock, FiRefreshCw, FiShield } from 'react-icons/fi'

export const CHECKOUT_FEATURES = [
  { title: 'Secure Payment', detail: 'Your payment information is safe with us.', Icon: FiLock },
  { title: 'Easy Returns', detail: '7-day easy returns on eligible items.', Icon: FiRefreshCw },
  { title: 'Buyer Protection', detail: "Get help if your item doesn't arrive.", Icon: FiShield },
]

export const CHECKOUT_STEPS = {
  payment: [
    { id: 'delivery', label: 'Delivery', copy: 'Enter delivery details', state: 'done' },
    { id: 'payment', label: 'Payment', copy: 'Choose payment method', state: 'active', number: 2 },
    { id: 'review', label: 'Review', copy: 'Review your order', state: 'pending', number: 3 },
    { id: 'confirmation', label: 'Confirmation', copy: 'Order placed successfully', state: 'pending', number: 4 },
  ],
  review: [
    { id: 'delivery', label: 'Delivery', copy: 'Enter delivery details', state: 'done' },
    { id: 'payment', label: 'Payment', copy: 'Choose payment method', state: 'done' },
    { id: 'review', label: 'Review', copy: 'Review your order', state: 'active', number: 3 },
    { id: 'confirmation', label: 'Confirmation', copy: 'Order placed successfully', state: 'pending', number: 4 },
  ],
  confirmation: [
    { id: 'delivery', label: 'Delivery', copy: 'Enter delivery details', state: 'done' },
    { id: 'payment', label: 'Payment', copy: 'Choose payment method', state: 'done' },
    { id: 'review', label: 'Review', copy: 'Review your order', state: 'done' },
    { id: 'confirmation', label: 'Confirmation', copy: 'Order placed successfully', state: 'active', number: 4 },
  ],
}

export const CHECKOUT_BREADCRUMBS = {
  payment: [
    { label: 'Campus' },
    { label: 'Cart' },
    { label: 'Checkout' },
  ],
  review: [
    { label: 'Campus' },
    { label: 'Cart' },
    { label: 'Checkout' },
    { label: 'Payment' },
    { label: 'Review Order' },
  ],
  confirmation: [
    { label: 'Campus' },
    { label: 'Cart' },
    { label: 'Checkout' },
    { label: 'Review Order' },
    { label: 'Order Placed' },
  ],
}
