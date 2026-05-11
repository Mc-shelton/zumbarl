import { memo, useEffect, useRef, useState } from 'react'
import {
  FaFacebookF,
  FaGithub,
  FaInstagram,
  FaLinkedinIn,
  FaTiktok,
  FaXTwitter,
  FaYoutube,
} from 'react-icons/fa6'
import { HiOutlineCalendarDays, HiOutlinePhone } from 'react-icons/hi2'
import {
  APPS_MEGA_MENU_FOOTER_LINKS,
  APPS_MEGA_MENU_SECTIONS,
  COMMUNITY_MEGA_MENU_QUICK_LINKS,
  COMMUNITY_MEGA_MENU_SECTIONS,
  COMMUNITY_MEGA_MENU_SOCIAL_LINKS,
  INDUSTRIES_MEGA_MENU_FOOTER_LINKS,
  INDUSTRIES_MEGA_MENU_SECTIONS,
  NAV_LINKS,
  NAV_LINK_HREFS,
} from '../../features/home/constants'

const COMMUNITY_SOCIAL_ICON_BY_ID = {
  github: FaGithub,
  youtube: FaYoutube,
  x: FaXTwitter,
  linkedin: FaLinkedinIn,
  instagram: FaInstagram,
  facebook: FaFacebookF,
  tiktok: FaTiktok,
}

const COMMUNITY_QUICK_LINK_ICON_BY_ID = {
  phone: HiOutlinePhone,
  calendar: HiOutlineCalendarDays,
}

function Header() {
  const [activeMegaMenu, setActiveMegaMenu] = useState(null)
  const [topNavHeight, setTopNavHeight] = useState(90)
  const shellRef = useRef(null)
  const topNavRef = useRef(null)
  const isAppsMenuOpen = activeMegaMenu === 'apps'
  const isIndustriesMenuOpen = activeMegaMenu === 'industries'
  const isMegaMenuOpen = activeMegaMenu !== null

  useEffect(() => {
    const updateTopNavHeight = () => {
      if (!topNavRef.current) {
        return
      }

      const nextHeight = Math.round(topNavRef.current.getBoundingClientRect().height)
      setTopNavHeight(nextHeight > 0 ? nextHeight : 90)
    }

    updateTopNavHeight()
    window.addEventListener('resize', updateTopNavHeight)

    return () => {
      window.removeEventListener('resize', updateTopNavHeight)
    }
  }, [])

  useEffect(() => {
    if (!isMegaMenuOpen) {
      return undefined
    }

    const handlePointerDown = (event) => {
      if (!shellRef.current?.contains(event.target)) {
        setActiveMegaMenu(null)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setActiveMegaMenu(null)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMegaMenuOpen])

  const handleMegaMenuToggle = (menuKey) => {
    setActiveMegaMenu((currentMenu) => (currentMenu === menuKey ? null : menuKey))
  }

  const closeMegaMenu = () => {
    setActiveMegaMenu(null)
  }

  const renderMegaMenu = ({
    id,
    isOpen,
    ariaLabel,
    sections,
    footerLinks,
    variant = 'default',
    socialLinks = [],
    quickLinks = [],
  }) => {
    const isCommunityMenu = variant === 'community'

    return (
      <section
        id={id}
        className={`apps-mega-menu${isOpen ? ' is-open' : ''}${isCommunityMenu ? ' community-mega-menu' : ''}`}
        aria-label={ariaLabel}
        aria-hidden={!isOpen}
      >
        <div className="container apps-mega-menu-inner">
          <div className="apps-mega-grid">
            {sections.map((section) => (
              <article
                key={section.pillar}
                className={`apps-mega-section${section.tone ? ` tone-${section.tone}` : ''}`}
              >
                <h3 className="apps-mega-section-title">{section.title}</h3>
                {(section.itemGroups || [section.items || []]).map((groupItems, groupIndex) => (
                  <ul
                    key={`${section.pillar}-group-${groupIndex}`}
                    className={`apps-mega-section-list apps-mega-section-group`}
                  >
                    {groupItems.map((item) => (
                      <li key={item.id}>
                        <a href={item.href} onClick={closeMegaMenu} tabIndex={isOpen ? 0 : -1}>
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                ))}
              </article>
            ))}
          </div>

          {isCommunityMenu ? (
            <div className="apps-mega-footer community-mega-footer">
              <div className="community-mega-socials" role="list" aria-label="Community social links">
                {socialLinks.map((item) => {
                  const Icon = COMMUNITY_SOCIAL_ICON_BY_ID[item.icon]
                  const externalProps = item.href.startsWith('http')
                    ? { target: '_blank', rel: 'noreferrer noopener' }
                    : {}

                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      className="community-mega-social-link"
                      onClick={closeMegaMenu}
                      tabIndex={isOpen ? 0 : -1}
                      aria-label={item.label}
                      {...externalProps}
                    >
                      {Icon ? <Icon className="community-mega-social-icon" aria-hidden="true" /> : item.label}
                    </a>
                  )
                })}
              </div>

              <div className="community-mega-quick-links">
                {quickLinks.map((item) => {
                  const Icon = COMMUNITY_QUICK_LINK_ICON_BY_ID[item.icon]

                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      className="community-mega-quick-link"
                      onClick={closeMegaMenu}
                      tabIndex={isOpen ? 0 : -1}
                    >
                      {Icon ? <Icon className="community-mega-quick-icon" aria-hidden="true" /> : null}
                      <span>{item.label}</span>
                    </a>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="apps-mega-footer">
              {footerLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="apps-mega-footer-link"
                  onClick={closeMegaMenu}
                  tabIndex={isOpen ? 0 : -1}
                >
                  {item.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </section>
    )
  }

  return (
    <div
      ref={shellRef}
      className={`top-nav-shell${isMegaMenuOpen ? ' is-apps-open' : ''}`}
      style={{ '--top-nav-height': `${topNavHeight}px` }}
    >
      <header ref={topNavRef} className="top-nav">
        <a className="logo-link" href="index.html" aria-label="Zumbarl">
          <img className="logo-img" src="/assets/index/bee.png" alt="Zumbarl bee logo" />
        </a>

        <nav className="nav-links" aria-label="Primary">
          {NAV_LINKS.map((link) => {
            if (link === 'Apps' || link === 'Industries' || link === 'Community') {
              const menuKey = link.toLowerCase()
              const isActive = activeMegaMenu === menuKey

              return (
                <button
                  key={link}
                  type="button"
                  className={`nav-link-btn${isActive ? ' is-active' : ''}`}
                  aria-expanded={isActive}
                  aria-controls={`${menuKey}-mega-menu`}
                  onClick={() => handleMegaMenuToggle(menuKey)}
                >
                  <span>{link}</span>
                </button>
              )
            }

            if (link === 'Help') {
              return (
                <a
                  key={link}
                  href={NAV_LINK_HREFS.Help || '/help'}
                  onClick={(event) => {
                    event.preventDefault()
                    closeMegaMenu()
                    window.location.assign(NAV_LINK_HREFS.Help || '/help')
                  }}
                >
                  {link}
                </a>
              )
            }

            return (
              <a key={link} href={NAV_LINK_HREFS[link] || 'index.html'} onClick={closeMegaMenu}>
                {link}
              </a>
            )
          })}
        </nav>

        <div className="nav-actions">
          <a href="web/login.html" className="sign-in" onClick={closeMegaMenu}>
            Sign in
          </a>
          <a href="trial.html" className="try-btn" onClick={closeMegaMenu}>
            Try it free
          </a>
        </div>
      </header>

      <div
        className={`apps-menu-backdrop${isMegaMenuOpen ? ' is-visible' : ''}`}
        onClick={closeMegaMenu}
        aria-hidden="true"
      />

      {renderMegaMenu({
        id: 'apps-mega-menu',
        isOpen: isAppsMenuOpen,
        ariaLabel: 'Applications menu',
        sections: APPS_MEGA_MENU_SECTIONS,
        footerLinks: APPS_MEGA_MENU_FOOTER_LINKS,
      })}

      {renderMegaMenu({
        id: 'industries-mega-menu',
        isOpen: isIndustriesMenuOpen,
        ariaLabel: 'Industries menu',
        sections: INDUSTRIES_MEGA_MENU_SECTIONS,
        footerLinks: INDUSTRIES_MEGA_MENU_FOOTER_LINKS,
      })}

      {renderMegaMenu({
        id: 'community-mega-menu',
        isOpen: activeMegaMenu === 'community',
        ariaLabel: 'Community menu',
        sections: COMMUNITY_MEGA_MENU_SECTIONS,
        footerLinks: [],
        variant: 'community',
        socialLinks: COMMUNITY_MEGA_MENU_SOCIAL_LINKS,
        quickLinks: COMMUNITY_MEGA_MENU_QUICK_LINKS,
      })}
    </div>
  )
}

export default memo(Header)
