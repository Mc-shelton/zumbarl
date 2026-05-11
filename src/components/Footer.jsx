import {
  TbBrandFacebook,
  TbBrandGithub,
  TbBrandInstagram,
  TbBrandLinkedin,
  TbBrandTiktok,
  TbBrandX,
  TbPhone,
} from 'react-icons/tb'
import { Link } from 'react-router-dom'

const COMMUNITY_LINKS = [
  { label: 'Tutorials', href: 'slides/all/tag/zumbarl-tutorials-9.html' },
  { label: 'Documentation', href: 'page/docs.html' },
  { label: 'Forum', href: 'forum/help-1.html' },
]

const OPEN_SOURCE_LINKS = [
  { label: 'Download', href: 'page/download.html' },
  { label: 'Github', href: 'https://github.com/zumbarl/zumbarl' },
  { label: 'Runbot', href: 'https://runbot.zumbarl.com/' },
  { label: 'Translations', href: 'https://github.com/zumbarl/zumbarl/wiki/Translations' },
]

const SERVICES_LINKS = [
  { label: 'Zumbarl.sh hosting', href: 'https://www.zumbarl.sh/' },
  { label: 'Support', href: '/help' },
  { label: 'Higher version', href: 'https://upgrade.zumbarl.com/' },
  { label: 'Custom Developments', href: 'page/developers-on-demand.html' },
  { label: 'Education', href: 'education/program.html' },
  { label: 'Find an accountant', href: 'accounting-firms.html' },
  { label: 'Find a partner', href: 'partners.html' },
  { label: 'Become a partner', href: 'become-a-partner.html' },
]

const ABOUT_LINKS = [
  { label: 'Our company', href: 'page/about-us.html' },
  { label: 'Brand assets', href: 'page/brand-assets.html' },
  { label: 'Contact us', href: 'contactus.html' },
  { label: 'Job offers', href: 'jobs.html' },
  { label: 'Events', href: 'events.html' },
  { label: 'Podcasts', href: 'https://podcast.zumbarl.com/' },
  { label: 'Blog', href: 'blog.html' },
  { label: 'Customers', href: 'blog/6.html' },
]

const SOCIAL_LINKS = [
  { label: 'Facebook', href: 'https://www.facebook.com/zumbarl', Icon: TbBrandFacebook },
  { label: 'X', href: 'https://twitter.com/Zumbarl', Icon: TbBrandX },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/zumbarl', Icon: TbBrandLinkedin },
  { label: 'Github', href: 'https://github.com/zumbarl/zumbarl', Icon: TbBrandGithub },
  { label: 'Instagram', href: 'https://www.instagram.com/zumbarl.official', Icon: TbBrandInstagram },
  { label: 'TikTok', href: 'https://www.tiktok.com/@zumbarl', Icon: TbBrandTiktok },
  { label: 'Phone', href: 'tel:+3222903490', Icon: TbPhone },
]

const isInternalRoute = (href) => typeof href === 'string' && href.startsWith('/')

function FooterLink({ href, children, ...props }) {
  if (isInternalRoute(href)) {
    return (
      <Link to={href} {...props}>
        {children}
      </Link>
    )
  }

  const isExternal = typeof href === 'string' && href.startsWith('http')

  return (
    <a href={href} target={isExternal ? '_blank' : undefined} rel={isExternal ? 'noreferrer noopener' : undefined} {...props}>
      {children}
    </a>
  )
}

function FooterList({ title, links }) {
  return (
    <section className="footer-list">
      <h3 className="footer-list-title">{title}</h3>
      <ul className="footer-list-links">
        {links.map((link) => (
          <li key={link.label}>
            <FooterLink href={link.href}>
              {link.label}
            </FooterLink>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Footer() {
  return (
    <footer className="site-footer" id="bottom" data-anchor="true">
      <div className="footer-shell">
        <div className="container">
          <Link className="footer-brand" to="/" aria-label="Zumbarl logo">
            <img className="footer-brand-logo" src="/assets/index/bee_nobg.png" alt="Zumbarl bee logo" />
            <span className="footer-brand-text">zumbarl.</span>
          </Link>

          <div className="footer-grid">
            <div className="footer-links-grid">
              <div className="footer-links-column">
                <FooterList title="Community" links={COMMUNITY_LINKS} />
                <FooterList title="Open Source" links={OPEN_SOURCE_LINKS} />
              </div>

              <FooterList title="Services" links={SERVICES_LINKS} />

              <section className="footer-list">
                <h3 className="footer-list-title">About us</h3>
                <ul className="footer-list-links">
                  {ABOUT_LINKS.map((link) => (
                    <li key={link.label}>
                      <FooterLink href={link.href}>
                        {link.label}
                      </FooterLink>
                    </li>
                  ))}
                  <li className="footer-legal-links">
                    <a href="legal.html">Legal Documents</a>
                    <span aria-hidden="true"> | </span>
                    <a href="privacy.html">Privacy</a>
                  </li>
                  <li>
                    <a href="security.html">Safety</a>
                  </li>
                </ul>
              </section>
            </div>

            <aside className="footer-info">
              <button type="button" className="footer-language" aria-label="Zumbarl domain">
                <span className="footer-language-domain">Zumbarl.com</span>
              </button>

              <hr className="footer-divider" />

              <p className="footer-note">
                Zumbarl is a suite of integrated campus tools that helps students balance campus reality, social life, and professional growth.
              </p>
              <p className="footer-note">
                Zumbarl connects students to work, support, opportunities, and everyday campus essentials.
              </p>

              <nav className="footer-social" aria-label="Social media">
                {SOCIAL_LINKS.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target={item.href.startsWith('http') ? '_blank' : undefined}
                    rel="noreferrer"
                    aria-label={item.label}
                    className="footer-social-link"
                  >
                    <item.Icon className="footer-social-icon" aria-hidden="true" />
                  </a>
                ))}
              </nav>
            </aside>
          </div>
        </div>
      </div>

      <div className="footer-credit">
        <div className="container">
          <a href="app/website.html">
            Website made with <span className="footer-credit-brand">zumbarl.</span>
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
