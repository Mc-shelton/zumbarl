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

export const ORDER_TIMELINE_ITEMS = [
  {
    id: 'confirmed',
    title: 'Order Confirmed',
    detail: 'We have received your order and payment confirmation.',
    state: 'done',
  },
  {
    id: 'packed',
    title: 'Packaging Your Order',
    detail: 'Seller is preparing your products for dispatch.',
    state: 'active',
  },
  {
    id: 'dispatch',
    title: 'Out for Delivery',
    detail: 'A rider will pick and deliver to your selected location.',
    state: 'pending',
  },
  {
    id: 'arrival',
    title: 'Delivered',
    detail: 'Expected between May 27 - May 29, 2024.',
    state: 'pending',
  },
]

export const CUSTOMER_DETAILS = {
  name: 'Brian Mwangi',
  phone: '+254 712 345 678',
  email: 'brian.mwangi@student.ku.ac.ke',
  location: 'Westlands, Nairobi',
  county: 'Nairobi, Nairobi County',
  postal: '00100, Kenya',
}

export const DELIVERY_ESTIMATE = {
  dateRange: 'May 27 - May 29, 2024',
  location: 'Nairobi, Kenya',
  addressSummary: 'Westlands, Nairobi County, 00100',
}

export const PAYMENT_SUMMARY = {
  method: 'Card Payment',
  card: 'Visa ending in 3456',
  brand: 'VISA',
}

export const ORDER_ID = 'ZMB-2026-0525-019'
