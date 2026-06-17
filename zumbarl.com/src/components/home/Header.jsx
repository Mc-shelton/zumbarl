import { memo } from 'react'
import {
  APPS_MEGA_MENU_FOOTER_LINKS,
  APPS_MEGA_MENU_SECTIONS,
  COMMUNITY_MEGA_MENU_QUICK_LINKS,
  COMMUNITY_MEGA_MENU_SECTIONS,
  COMMUNITY_MEGA_MENU_SOCIAL_LINKS,
  INDUSTRIES_MEGA_MENU_FOOTER_LINKS,
  INDUSTRIES_MEGA_MENU_SECTIONS,
} from '../../features/home/constants'
import { useHeaderNavigation } from '../../features/home/hooks/useHeaderNavigation'
import '../../styles/header.css'
import HeaderNav from './HeaderNav'
import MegaMenu from './MegaMenu'

function Header() {
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

  return (
    <div
      ref={shellRef}
      className={`top-nav-shell${isMegaMenuOpen ? ' is-apps-open' : ''}${!isNavVisible && !isMegaMenuOpen ? ' is-hidden' : ''}`}
      style={{ '--top-nav-height': `${topNavHeight}px` }}
      onMouseLeave={closeMegaMenu}
    >
      <HeaderNav
        activeMegaMenu={activeMegaMenu}
        closeMegaMenu={closeMegaMenu}
        openMegaMenu={openMegaMenu}
        topNavRef={topNavRef}
      />

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
    </div>
  )
}

export default memo(Header)
