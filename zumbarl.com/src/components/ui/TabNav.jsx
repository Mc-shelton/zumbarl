function joinTabClassName(tabClassName, isActive) {
  if (!isActive) return tabClassName
  return tabClassName ? `${tabClassName} is-active` : 'is-active'
}

/**
 * Shared tab bar. `items` are `{ id, label }` plus anything a custom
 * `renderTab(item, isActive)` needs (counts, badges, icons).
 */
function TabNav({
  activeId,
  ariaLabel,
  className = '',
  items = [],
  onChange,
  renderTab = null,
  segmented = true,
  tabClassName = '',
}) {
  const navClassName = [segmented ? 'zumbarl-segmented-tabs' : '', className].filter(Boolean).join(' ')

  return (
    <nav className={navClassName} role="tablist" aria-label={ariaLabel}>
      {items.map((item) => {
        const isActive = item.id === activeId

        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={joinTabClassName(tabClassName, isActive)}
            onClick={() => onChange(item.id)}
          >
            {renderTab ? renderTab(item, isActive) : item.label}
          </button>
        )
      })}
    </nav>
  )
}

export default TabNav
