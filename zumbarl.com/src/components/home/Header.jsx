import { memo, useEffect, useState } from 'react'
import { HiArrowRight, HiXMark } from 'react-icons/hi2'
import {
  APPS_MEGA_MENU_FOOTER_LINKS,
  APPS_MEGA_MENU_SECTIONS,
  COMMUNITY_MEGA_MENU_QUICK_LINKS,
  COMMUNITY_MEGA_MENU_SECTIONS,
  COMMUNITY_MEGA_MENU_SOCIAL_LINKS,
  INDUSTRIES_MEGA_MENU_FOOTER_LINKS,
  INDUSTRIES_MEGA_MENU_SECTIONS,
  NAV_LINK_HREFS,
  NAV_LINKS,
} from '../../features/home/constants'
import { useHeaderNavigation } from '../../features/home/hooks/useHeaderNavigation'
import '../../styles/header.css'
import HeaderNav from './HeaderNav'
import HeaderLink from './HeaderLink'
import MegaMenu from './MegaMenu'

function Header({ brandOnly = false }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const {
    activeMegaMenu,
    closeMegaMenu,
    isMegaMenuOpen,
    isNavVisible,
    openMegaMenu,
    shellRef,
    topNavHeight,
    topNavRef,
  } = useHeaderNavigation()

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false)
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMobileMenuOpen])

  return (
    <div
      ref={shellRef}
      className={`top-nav-shell${isMegaMenuOpen ? ' is-apps-open' : ''}${isMobileMenuOpen ? ' is-mobile-open' : ''}${!isNavVisible && !isMegaMenuOpen && !isMobileMenuOpen ? ' is-hidden' : ''}`}
      style={{ '--top-nav-height': `${topNavHeight}px` }}
      onMouseLeave={closeMegaMenu}
    >
      <HeaderNav
        activeMegaMenu={activeMegaMenu}
        brandOnly={brandOnly}
        closeMegaMenu={closeMegaMenu}
        isMobileMenuOpen={isMobileMenuOpen}
        openMegaMenu={openMegaMenu}
        toggleMobileMenu={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
        topNavRef={topNavRef}
      />

      {brandOnly ? null : <>

      <button
        type="button"
        className={`mobile-nav-backdrop${isMobileMenuOpen ? ' is-visible' : ''}`}
        aria-label="Close navigation menu"
        tabIndex={isMobileMenuOpen ? 0 : -1}
        onClick={closeMobileMenu}
      />

      <aside
        id="mobile-navigation-sheet"
        className={`mobile-nav-sheet${isMobileMenuOpen ? ' is-open' : ''}`}
        aria-label="Mobile navigation"
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="mobile-nav-sheet-header">
          <div>
            <span>Explore</span>
            <strong>Zumbarl</strong>
          </div>
          <button type="button" aria-label="Close navigation menu" onClick={closeMobileMenu}>
            <HiXMark aria-hidden="true" />
          </button>
        </div>

        <nav className="mobile-nav-sheet-links" aria-label="Mobile primary navigation">
          {NAV_LINKS.map((link) => (
            <HeaderLink key={link} href={NAV_LINK_HREFS[link] || '/'} onClick={closeMobileMenu}>
              <span>{link}</span>
              <HiArrowRight aria-hidden="true" />
            </HeaderLink>
          ))}
        </nav>

        <div className="mobile-nav-sheet-actions">
          <HeaderLink href="/login" onClick={closeMobileMenu}>Sign in</HeaderLink>
          <HeaderLink href="/login" onClick={closeMobileMenu}>Try it free</HeaderLink>
        </div>
      </aside>

      <div
        className={`apps-menu-backdrop${isMegaMenuOpen ? ' is-visible' : ''}`}
        onClick={closeMegaMenu}
        aria-hidden="true"
      />

      <MegaMenu
        id="apps-mega-menu"
        isOpen={activeMegaMenu === 'apps'}
        ariaLabel="Applications menu"
        sections={APPS_MEGA_MENU_SECTIONS}
        footerLinks={APPS_MEGA_MENU_FOOTER_LINKS}
        closeMegaMenu={closeMegaMenu}
      />

      <MegaMenu
        id="industries-mega-menu"
        isOpen={activeMegaMenu === 'industries'}
        ariaLabel="Industries menu"
        sections={INDUSTRIES_MEGA_MENU_SECTIONS}
        footerLinks={INDUSTRIES_MEGA_MENU_FOOTER_LINKS}
        closeMegaMenu={closeMegaMenu}
      />

      <MegaMenu
        id="community-mega-menu"
        isOpen={activeMegaMenu === 'community'}
        ariaLabel="Community menu"
        sections={COMMUNITY_MEGA_MENU_SECTIONS}
        footerLinks={[]}
        variant="community"
        socialLinks={COMMUNITY_MEGA_MENU_SOCIAL_LINKS}
        quickLinks={COMMUNITY_MEGA_MENU_QUICK_LINKS}
        closeMegaMenu={closeMegaMenu}
      />
      </>}
    </div>
  )
}

export default memo(Header)
