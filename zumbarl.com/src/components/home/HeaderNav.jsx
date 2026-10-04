import { Link } from 'react-router-dom'
import { HiBars3 } from 'react-icons/hi2'
import { NAV_LINKS, NAV_LINK_HREFS } from '../../features/home/constants'
import HeaderLink from './HeaderLink'

function HeaderNav({ activeMegaMenu, brandOnly = false, closeMegaMenu, isMobileMenuOpen, openMegaMenu, toggleMobileMenu, topNavRef }) {
  return (
    <header ref={topNavRef} className={`top-nav${brandOnly ? ' is-brand-only' : ''}`}>
      <Link className="logo-link" to="/" aria-label={brandOnly ? 'Zumbarl home' : 'Zumbarl'} onClick={closeMegaMenu}>
        <img className="logo-img" src="/assets/index/bee.png" alt="Zumbarl bee logo" />
        {brandOnly ? <span className="logo-wordmark">zumbarl</span> : null}
      </Link>

      {brandOnly ? null : <nav className="nav-links" aria-label="Primary">
        {NAV_LINKS.map((link) => (
          <PrimaryNavLink
            key={link}
            activeMegaMenu={activeMegaMenu}
            closeMegaMenu={closeMegaMenu}
            link={link}
            openMegaMenu={openMegaMenu}
          />
        ))}
      </nav>}

      {brandOnly ? null : <div className="nav-actions">
        <HeaderLink href="/login" className="sign-in" onClick={closeMegaMenu}>
          Sign in
        </HeaderLink>
        <HeaderLink href="/register" className="try-btn" onClick={closeMegaMenu}>
          Try it free
        </HeaderLink>
      </div>}

      {brandOnly ? null : <button
        type="button"
        className="mobile-nav-toggle"
        aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={isMobileMenuOpen}
        aria-controls="mobile-navigation-sheet"
        onClick={toggleMobileMenu}
      >
        <span>Menu</span>
        <HiBars3 aria-hidden="true" />
      </button>}
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
