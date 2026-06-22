import { useMemo, useState } from 'react'
import { FaGithub, FaGoogle, FaLinkedinIn } from 'react-icons/fa6'
import { HiOutlineEnvelope, HiOutlineLockClosed, HiOutlineUser } from 'react-icons/hi2'
import { Link, useNavigate } from 'react-router-dom'
import Seo from '../components/Seo'
import Header from '../components/home/Header'
import {
  AUTH_ROLE_STORAGE_KEY,
  getAuthRoleIdFromBackendRole,
} from '../features/auth/roleConfig'
import { LOGIN_SEO, REGISTER_SEO } from '../features/seo/constants'
import { AUTH_TOKEN_KEY, sendZumbarlApiRequest } from '../lib/sendZumbarlApiRequest'
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
        minLength: 8,
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
        id: 'firstName',
        label: 'First name',
        type: 'text',
        autoComplete: 'given-name',
        placeholder: 'Jane',
        Icon: HiOutlineUser,
      },
      {
        id: 'lastName',
        label: 'Second name',
        type: 'text',
        autoComplete: 'family-name',
        placeholder: 'Doe',
        Icon: HiOutlineUser,
      },
      {
        id: 'username',
        label: 'Username',
        type: 'text',
        autoComplete: 'username',
        placeholder: '@the_creator',
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
        minLength: 8,
        autoComplete: 'new-password',
        placeholder: 'Create a password',
        Icon: HiOutlineLockClosed,
      },
    ],
  },
}

function AuthPage({ defaultMode = 'login' }) {
  const navigate = useNavigate()
  const mode = defaultMode === 'register' ? 'register' : 'login'
  const content = AUTH_MODE_CONTENT[mode]
  const seoContent = mode === 'register' ? REGISTER_SEO : LOGIN_SEO
  const [accountType, setAccountType] = useState('student')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const disclaimer = useMemo(
    () =>
      mode === 'register'
        ? 'By registering you agree to our Terms and Privacy Policy.'
        : 'Use your Zumbarl email to access your workspace.',
    [mode],
  )

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const payload = mode === 'register'
      ? {
          email: formData.get('email'),
          firstName: formData.get('firstName'),
          lastName: formData.get('lastName'),
          username: formData.get('username'),
          name: `${formData.get('firstName')} ${formData.get('lastName')}`,
          password: formData.get('password'),
          role: accountType === 'business' ? 'COMPANY_STANDARD' : 'STUDENT_STANDARD',
          businessName: accountType === 'business' ? formData.get('businessName') : undefined,
          campus: accountType === 'student' ? formData.get('campus') : undefined,
        }
      : {
          email: formData.get('email'),
          password: formData.get('password'),
        }

    try {
      const response = await sendZumbarlApiRequest(mode === 'register' ? '/auth/register' : '/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (response?.token) {
        window.localStorage.setItem(AUTH_TOKEN_KEY, response.token)
      }
      if (response?.user?.role) {
        window.localStorage.setItem(AUTH_ROLE_STORAGE_KEY, getAuthRoleIdFromBackendRole(response.user.role))
      }

      const nextPath = response?.user?.role === 'SUPER_ADMIN'
        ? '/admin/super-admin'
        : response?.user?.businessId
          ? (mode === 'register' ? '/business/onboarding' : '/business/workspace')
          : '/campus/opportunities'
      navigate(nextPath)
    } catch (error) {
      setErrorMessage(error.message || 'Authentication failed')
    } finally {
      setIsSubmitting(false)
    }
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
              {mode === 'register' ? (
                <div className="auth-account-toggle" role="radiogroup" aria-label="Account type">
                  {[
                    { id: 'student', label: 'Student', detail: 'Find work, services, and campus opportunities.' },
                    { id: 'business', label: 'Business', detail: 'Post opportunities and hire student talent.' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={accountType === option.id ? 'is-active' : ''}
                      aria-pressed={accountType === option.id}
                      onClick={() => setAccountType(option.id)}
                    >
                      <strong>{option.label}</strong>
                      <span>{option.detail}</span>
                    </button>
                  ))}
                </div>
              ) : null}

              {content.fields.map(({ id, label, type, minLength, autoComplete, placeholder, Icon }) => (
                <label key={id} className="auth-field" htmlFor={id}>
                  <span className="auth-field-label">{label}</span>
                  <input
                    id={id}
                    name={id}
                    type={type}
                    minLength={minLength}
                    autoComplete={autoComplete}
                    placeholder={placeholder}
                    className="auth-input"
                    required
                  />
                  <Icon className="auth-input-icon" aria-hidden="true" />
                </label>
              ))}

              {mode === 'register' && accountType === 'student' ? (
                <label className="auth-field" htmlFor="campus">
                  <span className="auth-field-label">Campus</span>
                  <input
                    id="campus"
                    name="campus"
                    type="text"
                    autoComplete="organization"
                    placeholder="Kenyatta University"
                    className="auth-input"
                    required
                  />
                  <HiOutlineUser className="auth-input-icon" aria-hidden="true" />
                </label>
              ) : null}

              {mode === 'register' && accountType === 'business' ? (
                <label className="auth-field" htmlFor="businessName">
                  <span className="auth-field-label">Business name</span>
                  <input
                    id="businessName"
                    name="businessName"
                    type="text"
                    autoComplete="organization"
                    placeholder="Zetech Studios"
                    className="auth-input"
                    required
                  />
                  <HiOutlineUser className="auth-input-icon" aria-hidden="true" />
                </label>
              ) : null}

              {errorMessage ? <p className="auth-error-message">{errorMessage}</p> : null}

              <button type="submit" className="auth-primary-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Please wait...' : content.submitLabel}
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
