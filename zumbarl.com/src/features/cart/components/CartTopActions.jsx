import { FiChevronDown, FiPlus } from 'react-icons/fi'
import CampusTopActions from '../../../components/layout/CampusTopActions'

export function CartTopActions({ actionLabel = 'Find Opportunities' }) {
  return (
    <CampusTopActions
      as="section"
      label="Campus cart actions"
      className="campus-cart-top-actions"
      primaryAction={(
        <button type="button" className="campus-cart-find-btn">
          <FiPlus aria-hidden="true" />
          {actionLabel}
          <FiChevronDown aria-hidden="true" />
        </button>
      )}
      userButtonClassName="campus-cart-user-btn"
      showUserChevron
    />
  )
}
