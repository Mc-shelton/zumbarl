import { Link } from 'react-router-dom'
import { NAV_LINKS, NAV_LINK_HREFS } from '../../features/home/constants'
import HeaderLink from './HeaderLink'

function HeaderNav({ activeMegaMenu, closeMegaMenu, openMegaMenu, topNavRef }) {
  return (
    <header ref={topNavRef} className="top-nav">
      <Link className="logo-link" to="/" aria-label="Zumbarl" onClick={closeMegaMenu}>
        <img className="logo-img" src="/assets/index/bee.png" alt="Zumbarl bee logo" />
      </Link>

      <nav className="nav-links" aria-label="Primary">
        {NAV_LINKS.map((link) => (
          <PrimaryNavLink
            key={link}
            activeMegaMenu={activeMegaMenu}
            closeMegaMenu={closeMegaMenu}
            link={link}
            openMegaMenu={openMegaMenu}
          />
        ))}
      </nav>

      <div className="nav-actions">
        <HeaderLink href="/login" className="sign-in" onClick={closeMegaMenu}>
          Sign in
        </HeaderLink>
        <HeaderLink href="/register" className="try-btn" onClick={closeMegaMenu}>
          Try it free
        </HeaderLink>
      </div>
    </header>
  )
}

function PrimaryNavLink({ activeMegaMenu, closeMegaMenu, link, openMegaMenu }) {
  const menuKey = link.toLowerCase()
  const hasMegaMenu = link === 'Apps' || link === 'Industries' || link === 'Community'
  const isActive = activeMegaMenu === menuKey

  if (!hasMegaMenu) {
    return (
      <HeaderLink
        href={NAV_LINK_HREFS[link] || '/'}
        onMouseEnter={closeMegaMenu}
        onFocus={closeMegaMenu}
        onClick={closeMegaMenu}
      >
        {link}
      </HeaderLink>
    )
  }

  return (
    <HeaderLink
      href={NAV_LINK_HREFS[link] || '/'}
      className={`nav-link-btn${isActive ? ' is-active' : ''}`}
      aria-haspopup="menu"
      aria-expanded={isActive}
      aria-controls={`${menuKey}-mega-menu`}
      onMouseEnter={() => openMegaMenu(menuKey)}
      onFocus={() => openMegaMenu(menuKey)}
      onClick={closeMegaMenu}
    >
      <span>{link}</span>
    </HeaderLink>
  )
}

export default HeaderNav
