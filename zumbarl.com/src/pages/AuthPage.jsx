import { useMemo, useState } from 'react'
import { FaGithub, FaGoogle, FaLinkedinIn } from 'react-icons/fa6'
import {
  HiOutlineAcademicCap,
  HiOutlineBriefcase,
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineSparkles,
  HiOutlineUser,
  HiOutlineUserGroup,
} from 'react-icons/hi2'
import { Link, useNavigate } from 'react-router-dom'
import Seo from '../components/Seo'
import Header from '../components/home/Header'
import {
  AUTH_ROLE_STORAGE_KEY,
  getAuthRoleIdFromBackendRole,
} from '../features/auth/roleConfig'
import { clearAuthUserCache } from '../features/auth/services/authUserService'
import CampusRegistrationField from '../features/auth/components/CampusRegistrationField'
import { clearBusinessProfileCache } from '../features/business/services/businessProfileService'
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
    eyebrow: 'Your campus, connected',
    heading: 'Welcome back',
    intro: 'Sign in to pick up where you left off.',
    submitLabel: 'Sign in to Zumbarl',
    helperText: 'Or continue with',
    promoHeading: 'More than a workspace.',
    promoBody: 'Find your people, grow your skills and turn campus potential into real-world progress.',
    promoActionLabel: 'Join Zumbarl',
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
    eyebrow: 'Make your next move',
    heading: 'Join Zumbarl',
    intro: 'Build a profile that grows with your campus journey.',
    submitLabel: 'Create my account',
    helperText: 'Or sign up with',
    promoHeading: 'Your journey starts here.',
    promoBody: 'One campus network for opportunities, learning, collaboration and community.',
    promoActionLabel: 'I already have an account',
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
  const [campus, setCampus] = useState(null)
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
          role: accountType === 'professional' ? 'COMPANY_STANDARD' : 'STUDENT_STANDARD',
          campus: accountType === 'student' ? campus : undefined,
        }
      : {
          email: formData.get('email'),
          password: formData.get('password'),
        }

    try {
      if (mode === 'register' && accountType === 'student' && !campus) throw new Error('Select an existing campus or add your campus and choose its location.')
      const response = await sendZumbarlApiRequest(mode === 'register' ? '/auth/register' : '/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      if (response?.token) {
        // Drop any identity cached from a previous session before this one hydrates.
        clearAuthUserCache()
        clearBusinessProfileCache()
        window.localStorage.setItem(AUTH_TOKEN_KEY, response.token)
      }
      if (response?.user?.role) {
        window.localStorage.setItem(AUTH_ROLE_STORAGE_KEY, getAuthRoleIdFromBackendRole(response.user.role))
      }

      const nextPath = response?.user?.role === 'SUPER_ADMIN'
        ? '/admin/super-admin'
        : response?.user?.businessId
          ? (mode === 'register' ? '/business/onboarding' : '/business/workspace')
          : '/campus/landing'
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
            <div className="auth-form-brand" aria-hidden="true">
              <span className="auth-form-brand-mark"><img src="/assets/index/bee_nobg.png" alt="" /></span>
              <strong>zumbarl</strong>
            </div>
            <p className="auth-eyebrow"><HiOutlineSparkles aria-hidden="true" /> {content.eyebrow}</p>
            <h1 className="auth-title">{content.heading}</h1>
            <p className="auth-intro">{content.intro}</p>
            <form className="auth-form" onSubmit={handleSubmit}>
              {mode === 'register' ? <><div className="auth-account-toggle" role="radiogroup" aria-label="Personal profile type">{[{ id: 'student', label: 'Student', detail: 'Campus life, learning, work and connections.' }, { id: 'professional', label: 'Professional', detail: 'Represent yourself, then create or manage business pages.' }].map((option) => <button key={option.id} type="button" className={accountType === option.id ? 'is-active' : ''} aria-pressed={accountType === option.id} onClick={() => setAccountType(option.id)}><strong>{option.label}</strong><span>{option.detail}</span></button>)}</div><p className="auth-account-note">This creates your personal profile. Organizations are separate pages with shared management.</p></> : null}

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

              {mode === 'register' && accountType === 'student' ? <CampusRegistrationField onChange={setCampus} /> : null}

              {mode === 'login' ? (
                <div className="auth-form-options">
                  <label className="auth-remember"><input type="checkbox" name="remember" /> <span>Keep me signed in</span></label>
                  <Link to="/help">Need help signing in?</Link>
                </div>
              ) : null}

              {errorMessage ? <p className="auth-error-message">{errorMessage}</p> : null}

              <button type="submit" className="auth-primary-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Please wait...' : content.submitLabel}
              </button>
            </form>

            <p className="auth-helper-text"><span>{content.helperText}</span></p>
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
            <div className="auth-orbit auth-orbit-one" aria-hidden="true" />
            <div className="auth-orbit auth-orbit-two" aria-hidden="true" />
            <div className="auth-promo-inner">
              <div className="auth-promo-brand">
                <span><img src="/assets/index/bee_nobg.png" alt="" /></span>
                <strong>zumbarl</strong>
              </div>
              <p className="auth-promo-kicker">Campus life, in motion</p>
              <h2 className="auth-promo-title">{content.promoHeading}</h2>
              <p className="auth-promo-text">{content.promoBody}</p>
              <div className="auth-promo-pill-row" aria-label="What you can do on Zumbarl">
                <span><HiOutlineBriefcase aria-hidden="true" /> Earn</span>
                <span><HiOutlineAcademicCap aria-hidden="true" /> Learn</span>
                <span><HiOutlineUserGroup aria-hidden="true" /> Connect</span>
              </div>
              <Link className="auth-promo-cta" to={content.switchPath}>
                {content.promoActionLabel}
              </Link>
            </div>
            <p className="auth-promo-note"><span aria-hidden="true">●</span> Made for campus. Built for what comes next.</p>
          </aside>
        </div>
      </section>
    </main>
  )
}

export default AuthPage
