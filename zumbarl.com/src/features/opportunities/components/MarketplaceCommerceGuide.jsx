import { FiCalendar, FiCoffee, FiMessageCircle, FiShoppingBag } from 'react-icons/fi'

const COMMERCE_MODES = [
  {
    id: 'Products',
    eyebrow: 'Buy & sell',
    title: 'Shop products',
    description: 'Pay securely, then arrange pickup or delivery.',
    icon: FiShoppingBag,
    tone: 'product',
  },
  {
    id: 'Book a service',
    eyebrow: 'Appointments',
    title: 'Book a service',
    description: 'Choose an available time for beauty, care or repairs.',
    icon: FiCalendar,
    tone: 'appointment',
  },
  {
    id: 'Food & drink',
    eyebrow: 'Campus eateries',
    title: 'Order ahead',
    description: 'Choose a meal and pickup time without waiting in line.',
    icon: FiCoffee,
    tone: 'food',
  },
  {
    id: 'Book a service',
    eyebrow: 'Custom work',
    title: 'Request a quote',
    description: 'Share a brief, agree the scope, then fund the order.',
    icon: FiMessageCircle,
    tone: 'quote',
  },
]

function MarketplaceCommerceGuide({ onSelect }) {
  return (
    <section className="marketplace-commerce-guide" aria-labelledby="marketplace-commerce-title">
      <header>
        <div>
          <span>One campus marketplace</span>
          <h2 id="marketplace-commerce-title">What do you need today?</h2>
        </div>
        <p>Products and services use the checkout flow that fits how they are fulfilled.</p>
      </header>

      <div>
        {COMMERCE_MODES.map(({ id, eyebrow, title, description, icon: Icon, tone }) => (
          <button key={`${tone}-${title}`} type="button" className={`is-${tone}`} onClick={() => onSelect(id)}>
            <i><Icon aria-hidden="true" /></i>
            <span>
              <small>{eyebrow}</small>
              <strong>{title}</strong>
              <em>{description}</em>
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

export default MarketplaceCommerceGuide
