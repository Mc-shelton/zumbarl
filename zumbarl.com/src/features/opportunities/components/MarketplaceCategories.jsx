import {
  FiBookOpen,
  FiBox,
  FiGrid,
  FiHome,
  FiMoreHorizontal,
  FiShoppingBag,
  FiSmartphone,
  FiTool,
} from 'react-icons/fi'
import { MARKETPLACE_CATEGORIES } from '../../../data/marketplace'

const CATEGORY_ICON_MAP = {
  grid: FiGrid,
  smartphone: FiSmartphone,
  book: FiBookOpen,
  home: FiHome,
  'shopping-bag': FiShoppingBag,
  box: FiBox,
  tool: FiTool,
  more: FiMoreHorizontal,
}

function MarketplaceCategories({
  activeCategory,
  onCategoryChange,
  onCategoryKeyDown,
}) {
  return (
    <section className="opportunities-marketplace-categories" aria-label="Marketplace categories">
      {MARKETPLACE_CATEGORIES.map(({ label, count, icon }) => {
        const Icon = CATEGORY_ICON_MAP[icon] || FiMoreHorizontal
        const isActive = label === activeCategory

        return (
          <article
            key={label}
            className={`opportunities-marketplace-category is-clickable${isActive ? ' is-active' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => onCategoryChange(label)}
            onKeyDown={(event) => onCategoryKeyDown(event, label)}
            aria-pressed={isActive}
            aria-label={`Filter by ${label}`}
          >
            <div className="opportunities-marketplace-category-icon">
              <Icon aria-hidden="true" />
            </div>
            <h3>{label}</h3>
            <p>{count.toLocaleString()}</p>
          </article>
        )
      })}
    </section>
  )
}

export default MarketplaceCategories
