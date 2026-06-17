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
import HeaderLink from './HeaderLink'

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

function MegaMenu({
  ariaLabel,
  closeMegaMenu,
  footerLinks,
  id,
  isOpen,
  quickLinks = [],
  sections,
  socialLinks = [],
  variant = 'default',
}) {
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
            <MegaMenuSection
              key={section.pillar}
              closeMegaMenu={closeMegaMenu}
              isOpen={isOpen}
              section={section}
            />
          ))}
        </div>

        {isCommunityMenu ? (
          <CommunityMegaFooter
            closeMegaMenu={closeMegaMenu}
            isOpen={isOpen}
            quickLinks={quickLinks}
            socialLinks={socialLinks}
          />
        ) : (
          <DefaultMegaFooter closeMegaMenu={closeMegaMenu} footerLinks={footerLinks} isOpen={isOpen} />
        )}
      </div>
    </section>
  )
}

function MegaMenuSection({ closeMegaMenu, isOpen, section }) {
  const groupList = section.itemGroups || [section.items || []]

  return (
    <article className={`apps-mega-section${section.tone ? ` tone-${section.tone}` : ''}`}>
      <h3 className="apps-mega-section-title">{section.title}</h3>
      {groupList.map((groupItems, groupIndex) => (
        <ul
          key={`${section.pillar}-group-${groupIndex}`}
          className="apps-mega-section-list apps-mega-section-group"
        >
          {groupItems.map((item) => (
            <li key={item.id}>
              <HeaderLink href={item.href} onClick={closeMegaMenu} tabIndex={isOpen ? 0 : -1}>
                {item.label}
              </HeaderLink>
            </li>
          ))}
        </ul>
      ))}
    </article>
  )
}

function DefaultMegaFooter({ closeMegaMenu, footerLinks, isOpen }) {
  return (
    <div className="apps-mega-footer">
      {footerLinks.map((item) => (
        <HeaderLink
          key={item.label}
          href={item.href}
          className="apps-mega-footer-link"
          onClick={closeMegaMenu}
          tabIndex={isOpen ? 0 : -1}
        >
          {item.label}
        </HeaderLink>
      ))}
    </div>
  )
}

function CommunityMegaFooter({ closeMegaMenu, isOpen, quickLinks, socialLinks }) {
  return (
    <div className="apps-mega-footer community-mega-footer">
      <div className="community-mega-socials" role="list" aria-label="Community social links">
        {socialLinks.map((item) => (
          <CommunitySocialLink key={item.label} closeMegaMenu={closeMegaMenu} isOpen={isOpen} item={item} />
        ))}
      </div>

      <div className="community-mega-quick-links">
        {quickLinks.map((item) => (
          <CommunityQuickLink key={item.label} closeMegaMenu={closeMegaMenu} isOpen={isOpen} item={item} />
        ))}
      </div>
    </div>
  )
}

function CommunitySocialLink({ closeMegaMenu, isOpen, item }) {
  const Icon = COMMUNITY_SOCIAL_ICON_BY_ID[item.icon]

  return (
    <HeaderLink
      href={item.href}
      className="community-mega-social-link"
      onClick={closeMegaMenu}
      tabIndex={isOpen ? 0 : -1}
      aria-label={item.label}
    >
      {Icon ? <Icon className="community-mega-social-icon" aria-hidden="true" /> : item.label}
    </HeaderLink>
  )
}

function CommunityQuickLink({ closeMegaMenu, isOpen, item }) {
  const Icon = COMMUNITY_QUICK_LINK_ICON_BY_ID[item.icon]

  return (
    <HeaderLink
      href={item.href}
      className="community-mega-quick-link"
      onClick={closeMegaMenu}
      tabIndex={isOpen ? 0 : -1}
    >
      {Icon ? <Icon className="community-mega-quick-icon" aria-hidden="true" /> : null}
      <span>{item.label}</span>
    </HeaderLink>
  )
}

export default MegaMenu
