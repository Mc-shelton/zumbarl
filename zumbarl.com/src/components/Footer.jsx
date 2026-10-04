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
import '../styles/footer.css'

const PLATFORM_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Join Zumbarl', href: '/register' },
  { label: 'Sign in', href: '/login' },
]

const SUPPORT_LINKS = [
  { label: 'Support', href: '/help' },
  { label: 'Email help', href: 'mailto:help@zumbarl.com' },
  { label: 'Report fraud', href: 'mailto:fraud@zumbarl.com' },
]

const LEGAL_LINKS = [
  { label: 'Privacy Notice', href: '/privacy' },
  { label: 'Terms of Use', href: '/terms' },
  { label: 'Safety', href: '/safety' },
]

const SOCIAL_LINKS = [
  { label: 'Facebook', href: 'https://www.facebook.com/zumbarl', Icon: TbBrandFacebook },
  { label: 'X', href: 'https://twitter.com/Zumbarl', Icon: TbBrandX },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/zumbarl', Icon: TbBrandLinkedin },
  { label: 'Github', href: 'https://github.com/zumbarl/zumbarl', Icon: TbBrandGithub },
  { label: 'Instagram', href: 'https://www.instagram.com/zumbarl.official', Icon: TbBrandInstagram },
  { label: 'TikTok', href: 'https://www.tiktok.com/@zumbarl', Icon: TbBrandTiktok },
  { label: 'Phone', href: 'tel:+254716225073', Icon: TbPhone },
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
              <FooterList title="Platform" links={PLATFORM_LINKS} />
              <FooterList title="Support" links={SUPPORT_LINKS} />
              <FooterList title="Legal" links={LEGAL_LINKS} />
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
          <span>A subsidiary of<span className="footer-credit-brand">olscorpe.</span></span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
