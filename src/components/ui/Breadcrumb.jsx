import { FiChevronRight } from 'react-icons/fi'
import { Link } from 'react-router-dom'

function Breadcrumb({ items, className = '', currentClassName = '', label = 'Breadcrumb' }) {
  const classes = ['ui-breadcrumb', className].filter(Boolean).join(' ')

  return (
    <nav className={classes} aria-label={label}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        const key = `${item.label}-${index}`

        return (
          <span key={key} className={isLast ? currentClassName : undefined}>
            {item.href && !isLast ? (
              <Link to={item.href}>{item.label}</Link>
            ) : isLast ? (
              <strong>{item.label}</strong>
            ) : (
              item.label
            )}
            {!isLast ? <FiChevronRight aria-hidden="true" /> : null}
          </span>
        )
      })}
    </nav>
  )
}

export default Breadcrumb
