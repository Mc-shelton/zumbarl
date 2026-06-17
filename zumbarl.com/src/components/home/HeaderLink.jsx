import { Link } from 'react-router-dom'

const isInternalRoute = (href) => typeof href === 'string' && href.startsWith('/')

function HeaderLink({ href, children, ...props }) {
  if (isInternalRoute(href)) {
    return (
      <Link to={href} {...props}>
        {children}
      </Link>
    )
  }

  const isExternal = typeof href === 'string' && href.startsWith('http')

  return (
    <a
      href={href}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noreferrer noopener' : undefined}
      {...props}
    >
      {children}
    </a>
  )
}

export default HeaderLink
