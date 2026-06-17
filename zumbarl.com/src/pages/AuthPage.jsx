import { useMemo } from 'react'
import { FaGithub, FaGoogle, FaLinkedinIn } from 'react-icons/fa6'
import { HiOutlineEnvelope, HiOutlineLockClosed, HiOutlineUser } from 'react-icons/hi2'
import { Link } from 'react-router-dom'
import Seo from '../components/Seo'
import Header from '../components/home/Header'
import { LOGIN_SEO, REGISTER_SEO } from '../features/seo/constants'
import '../styles/auth.css'

const SOCIAL_LOGIN_OPTIONS = [
  { label: 'Continue with Google', Icon: FaGoogle },
  { label: 'Continue with GitHub', Icon: FaGithub },
  { label: 'Continue with LinkedIn', Icon: FaLinkedinIn },
]

const AUTH_MODE_CONTENT = {
  login: {
    heading: 'Login',
    submitLabel: 'Login',
    helperText: 'or login with social platforms',
    promoHeading: 'New Here?',
    promoBody: 'Create your Zumbarl account and start collaborating with campus talent.',
    promoActionLabel: 'Register',
    switchPath: '/register',
    fields: [
      {
        id: 'email',
        label: 'Email address',
        type: 'email',
        autoComplete: 'email',
        placeholder: 'you@zumbarl.com',
        Icon: HiOutlineEnvelope,
      },
      {
        id: 'password',
        label: 'Password',
        type: 'password',
        autoComplete: 'current-password',
        placeholder: 'Enter your password',
        Icon: HiOutlineLockClosed,
      },
    ],
  },
  register: {
    heading: 'Registration',
    submitLabel: 'Register',
    helperText: 'or register with social platforms',
    promoHeading: 'Welcome Back!',
    promoBody: 'Already have an account? Sign in to continue your Zumbarl journey.',
    promoActionLabel: 'Login',
    switchPath: '/login',
    fields: [
      {
        id: 'fullName',
        label: 'Full name',
        type: 'text',
        autoComplete: 'name',
        placeholder: 'Jane Doe',
        Icon: HiOutlineUser,
      },
      {
        id: 'email',
        label: 'Email address',
        type: 'email',
        autoComplete: 'email',
        placeholder: 'you@zumbarl.com',
        Icon: HiOutlineEnvelope,
      },
      {
        id: 'password',
        label: 'Password',
        type: 'password',
        autoComplete: 'new-password',
        placeholder: 'Create a password',
        Icon: HiOutlineLockClosed,
      },
    ],
  },
}

function AuthPage({ defaultMode = 'login' }) {
  const mode = defaultMode === 'register' ? 'register' : 'login'
  const content = AUTH_MODE_CONTENT[mode]
  const seoContent = mode === 'register' ? REGISTER_SEO : LOGIN_SEO
  const disclaimer = useMemo(
    () =>
      mode === 'register'
        ? 'By registering you agree to our Terms and Privacy Policy.'
        : 'Use your Zumbarl email to access your workspace.',
    [mode],
  )

  const handleSubmit = (event) => {
    event.preventDefault()
  }

  return (
    <main className="page auth-page">
      <Seo
        title={seoContent.title}
        description={seoContent.description}
        path={seoContent.path}
        keywords={seoContent.keywords}
        jsonLd={[seoContent.pageJsonLd]}
      />
      <Header />
      <section className="auth-stage" aria-label="Authentication">
        <div className="auth-card">
          <div className="auth-form-panel">
            <h1 className="auth-title">{content.heading}</h1>
            <form className="auth-form" onSubmit={handleSubmit}>
              {content.fields.map(({ id, label, type, autoComplete, placeholder, Icon }) => (
                <label key={id} className="auth-field" htmlFor={id}>
                  <span className="auth-field-label">{label}</span>
                  <input
                    id={id}
                    name={id}
                    type={type}
                    autoComplete={autoComplete}
                    placeholder={placeholder}
                    className="auth-input"
                    required
                  />
                  <Icon className="auth-input-icon" aria-hidden="true" />
                </label>
              ))}

              <button type="submit" className="auth-primary-btn">
                {content.submitLabel}
              </button>
            </form>

            <p className="auth-helper-text">{content.helperText}</p>
            <div className="auth-social-grid" role="list" aria-label="Social sign-in options">
              {SOCIAL_LOGIN_OPTIONS.map((provider) => (
                <button
                  key={provider.label}
                  type="button"
                  className="auth-social-btn"
                  aria-label={provider.label}
                  title={provider.label}
                >
                  <provider.Icon aria-hidden="true" />
                </button>
              ))}
            </div>
            <p className="auth-disclaimer">{disclaimer}</p>
          </div>

          <aside className="auth-promo-panel">
            <div className="auth-promo-inner">
              <p className="auth-promo-kicker">Zumbarl Workspace</p>
              <h2 className="auth-promo-title">{content.promoHeading}</h2>
              <p className="auth-promo-text">{content.promoBody}</p>
              <Link className="auth-promo-cta" to={content.switchPath}>
                {content.promoActionLabel}
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}

export default AuthPage
