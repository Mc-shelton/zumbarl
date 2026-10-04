import { useState } from 'react'
import {
  HiOutlineAcademicCap,
  HiOutlineCheckCircle,
  HiOutlineEnvelope,
  HiOutlineKey,
  HiOutlineSparkles,
  HiOutlineUser,
} from 'react-icons/hi2'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Seo from '../components/Seo'
import Header from '../components/home/Header'
import {
  AUTH_ROLE_STORAGE_KEY,
  getAuthRoleIdFromBackendRole,
} from '../features/auth/roleConfig'
import { clearAuthUserCache } from '../features/auth/services/authUserService'
import CampusRegistrationField from '../features/auth/components/CampusRegistrationField'
import CoursePicker from '../features/auth/components/CoursePicker'
import LoginOnboarding from '../features/auth/components/LoginOnboarding'
import { clearBusinessProfileCache } from '../features/business/services/businessProfileService'
import { LOGIN_SEO, REGISTER_SEO } from '../features/seo/constants'
import { AUTH_TOKEN_KEY, sendZumbarlApiRequest } from '../lib/sendZumbarlApiRequest'
import '../styles/auth.css'

const LOGIN_ONBOARDING_STORAGE_KEY = 'zumbarl.auth.loginOnboardingComplete'

function hasCompletedLoginOnboarding() {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(LOGIN_ONBOARDING_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function safeReturnPath(value) {
  const path = String(value || '').trim()
  return path.startsWith('/') && !path.startsWith('//') ? path : ''
}

const AUTH_MODE_CONTENT = {
  login: {
    eyebrow: 'Your campus, connected',
    heading: 'Welcome back',
    intro: 'Enter your email and we’ll send you a secure sign-in code.',
    submitLabel: 'Email me a code',
    switchPath: '/register',
  },
  register: {
    eyebrow: 'Make your next move',
    heading: 'Join Zumbarl',
    intro: 'Start with your email. We’ll verify it before you build your profile.',
    submitLabel: 'Continue with email',
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
    ],
  },
}

function AuthPage({ defaultMode = 'login' }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const mode = defaultMode === 'register' ? 'register' : 'login'
  const content = AUTH_MODE_CONTENT[mode]
  const seoContent = mode === 'register' ? REGISTER_SEO : LOGIN_SEO
  const [accountType, setAccountType] = useState('student')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoginReady, setIsLoginReady] = useState(() => mode !== 'login' || hasCompletedLoginOnboarding())
  const [authStep, setAuthStep] = useState('email')
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpChallenge, setOtpChallenge] = useState(null)
  const [registrationToken, setRegistrationToken] = useState('')
  const [campus, setCampus] = useState(null)
  const [course, setCourse] = useState(null)
  const returnTo = safeReturnPath(searchParams.get('returnTo'))
  const switchPath = returnTo ? `${content.switchPath}?returnTo=${encodeURIComponent(returnTo)}` : content.switchPath
  const stepContent = authStep === 'otp'
    ? {
        eyebrow: 'Check your inbox',
        heading: 'Enter your code',
        intro: mode === 'login'
          ? `If an active Zumbarl account uses ${email}, a six-digit code will arrive shortly.`
          : `We sent a six-digit code to ${email}.`,
        submitLabel: 'Verify code',
      }
    : authStep === 'profile'
      ? {
          eyebrow: 'Email verified',
          heading: 'Build your profile',
          intro: 'Tell us a little about yourself to finish joining Zumbarl.',
          submitLabel: 'Create my account',
        }
      : content

  const finishAuthentication = (response) => {
    if (response?.token) {
      clearAuthUserCache()
      clearBusinessProfileCache()
      window.localStorage.setItem(AUTH_TOKEN_KEY, response.token)
    }
    if (response?.user?.role) {
      window.localStorage.setItem(AUTH_ROLE_STORAGE_KEY, getAuthRoleIdFromBackendRole(response.user.role))
    }

    const defaultPath = response?.user?.role === 'SUPER_ADMIN'
      ? '/admin/super-admin'
      : ['OPERATIONS_MANAGER', 'SAFETY_OFFICER'].includes(response?.user?.role)
        ? '/admin/student-care'
        : response?.user?.businessId
          ? (mode === 'register' ? '/business/onboarding' : '/business/workspace')
          : '/campus/landing'
    navigate(returnTo || defaultPath)
  }

  const requestEmailCode = async (address = email) => {
    const normalizedEmail = String(address || '').trim().toLowerCase()
    const response = await sendZumbarlApiRequest('/auth/email-otp/request', {
      method: 'POST',
      body: JSON.stringify({ email: normalizedEmail, purpose: mode }),
    })
    setEmail(normalizedEmail)
    setOtpChallenge(response)
    setOtpCode(response?.developmentCode || '')
    setAuthStep('otp')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const formData = new FormData(event.currentTarget)
      if (authStep === 'email') {
        await requestEmailCode(formData.get('email'))
        return
      }

      if (authStep === 'otp') {
        const response = await sendZumbarlApiRequest('/auth/email-otp/verify', {
          method: 'POST',
          body: JSON.stringify({ challengeId: otpChallenge?.challengeId, code: otpCode }),
        })
        if (response?.purpose === 'register') {
          setRegistrationToken(response.registrationToken)
          setAuthStep('profile')
        } else {
          finishAuthentication(response)
        }
        return
      }

      if (accountType === 'student' && !campus) throw new Error('Select an existing campus or add your campus and choose its location.')
      if (accountType === 'student' && !course) throw new Error('Select an existing course or create yours.')
      const payload = {
        email,
        registrationToken,
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        username: formData.get('username'),
        name: `${formData.get('firstName')} ${formData.get('lastName')}`,
        acceptedTerms: formData.get('acceptedTerms') === 'on',
        acceptedPrivacy: formData.get('acceptedPrivacy') === 'on',
        role: accountType === 'professional' ? 'COMPANY_STANDARD' : 'STUDENT_STANDARD',
        businessName: accountType === 'professional' ? formData.get('businessName') : undefined,
        campus: accountType === 'student' ? campus : undefined,
        course: accountType === 'student' ? course : undefined,
        yearJoined: accountType === 'student' ? Number(formData.get('yearJoined')) : undefined,
      }
      const response = await sendZumbarlApiRequest('/auth/register', { method: 'POST', body: JSON.stringify(payload) })
      finishAuthentication(response)
    } catch (error) {
      setErrorMessage(error.message || 'Authentication failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    setErrorMessage('')
    setIsSubmitting(true)
    try {
      await requestEmailCode(email)
    } catch (error) {
      setErrorMessage(error.message || 'We could not send another code')
    } finally {
      setIsSubmitting(false)
    }
  }

  const changeEmail = () => {
    setAuthStep('email')
    setOtpCode('')
    setOtpChallenge(null)
    setErrorMessage('')
  }

  const completeLoginOnboarding = () => {
    try {
      window.localStorage.setItem(LOGIN_ONBOARDING_STORAGE_KEY, 'true')
    } catch {
      // The sign-in form remains usable when storage is unavailable.
    }
    setIsLoginReady(true)
  }

  return (
    <main className={`page auth-page is-${mode} is-step-${authStep}`}>
      <Seo
        title={seoContent.title}
        description={seoContent.description}
        path={seoContent.path}
        keywords={seoContent.keywords}
        jsonLd={[seoContent.pageJsonLd]}
      />
      {mode !== 'login' || isLoginReady ? <Header brandOnly /> : null}
      {mode === 'login' && !isLoginReady ? (
        <LoginOnboarding onComplete={completeLoginOnboarding} />
      ) : (
      <section className="auth-stage" aria-label="Authentication">
        <div className="auth-card">
          <div className="auth-form-panel">
            <div className="auth-login-illustration" aria-hidden="true">
              <img
                className="auth-login-illustration-art"
                src={mode === 'login'
                  ? '/assets/auth-onboarding/make-your-move.webp'
                  : '/assets/auth-onboarding/find-your-people.webp'}
                alt=""
              />
              <span className="auth-login-illustration-brand">
                <img src="/assets/index/bee_nobg.png" alt="" />
              </span>
            </div>
            <div className="auth-form-brand" aria-hidden="true">
              <span className="auth-form-brand-mark"><img src="/assets/index/bee_nobg.png" alt="" /></span>
              <strong>zumbarl</strong>
            </div>
            <p className="auth-eyebrow">
              {authStep === 'profile' ? <HiOutlineCheckCircle aria-hidden="true" /> : <HiOutlineSparkles aria-hidden="true" />}
              {' '}{stepContent.eyebrow}
            </p>
            <h1 className="auth-title">{stepContent.heading}</h1>
            <p className="auth-intro">{stepContent.intro}</p>
            <form className="auth-form" onSubmit={handleSubmit}>
              {authStep === 'email' ? (
                <div className="auth-field">
                  <label className="auth-field-label" htmlFor="email">Email address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@zumbarl.com"
                    className="auth-input"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoFocus
                    required
                  />
                  <HiOutlineEnvelope className="auth-input-icon" aria-hidden="true" />
                </div>
              ) : null}

              {authStep === 'otp' ? (
                <>
                  <div className="auth-field auth-otp-field">
                    <label className="auth-field-label" htmlFor="otpCode">Six-digit code</label>
                    <input
                      id="otpCode"
                      name="otpCode"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="000000"
                      className="auth-input"
                      value={otpCode}
                      onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                      pattern="[0-9]{6}"
                      maxLength="6"
                      autoFocus
                      required
                    />
                    <HiOutlineKey className="auth-input-icon" aria-hidden="true" />
                  </div>
                  <div className="auth-otp-actions">
                    <button type="button" onClick={changeEmail}>Use a different email</button>
                    <button type="button" onClick={handleResend} disabled={isSubmitting}>Send again</button>
                  </div>
                </>
              ) : null}

              {authStep === 'profile' ? <>
                <div className="auth-verified-email">
                  <HiOutlineCheckCircle aria-hidden="true" />
                  <span><small>Verified email</small><strong>{email}</strong></span>
                  <button type="button" onClick={changeEmail}>Change</button>
                </div>
                <div className="auth-account-toggle" role="radiogroup" aria-label="Personal profile type">{[{ id: 'student', label: 'Student', detail: 'Campus life, learning, work and connections.' }, { id: 'professional', label: 'Professional', detail: 'Represent yourself, then create or manage business pages.' }].map((option) => <button key={option.id} type="button" className={accountType === option.id ? 'is-active' : ''} aria-pressed={accountType === option.id} onClick={() => setAccountType(option.id)}><strong>{option.label}</strong><span>{option.detail}</span></button>)}</div>
                <p className="auth-account-note">This creates your personal profile. Organizations are separate pages with shared management.</p>
              </> : null}

              {authStep === 'profile' ? content.fields.map(({ id, label, type, minLength, autoComplete, placeholder, Icon }) => (
                <div key={id} className="auth-field">
                  <label className="auth-field-label" htmlFor={id}>{label}</label>
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
                </div>
              )) : null}

              {authStep === 'profile' && accountType === 'professional' ? (
                <div className="auth-field">
                  <label className="auth-field-label" htmlFor="businessName">Business name</label>
                  <input id="businessName" name="businessName" type="text" autoComplete="organization" placeholder="Your business" className="auth-input" required />
                  <HiOutlineUser className="auth-input-icon" aria-hidden="true" />
                </div>
              ) : null}

              {authStep === 'profile' && accountType === 'student' ? <>
                <CampusRegistrationField onChange={setCampus} />
                <CoursePicker value={course} onChange={setCourse} required />
                <label className="auth-field" htmlFor="yearJoined">
                  <span className="auth-field-label">Year joined campus</span>
                  <select id="yearJoined" name="yearJoined" className="auth-input" defaultValue="" required>
                    <option value="" disabled>Select year</option>
                    {Array.from({ length: 11 }, (_, index) => new Date().getFullYear() - index).map((year) => <option key={year} value={year}>{year}</option>)}
                  </select>
                  <HiOutlineAcademicCap className="auth-input-icon" aria-hidden="true" />
                </label>
              </> : null}

              {authStep === 'profile' ? (
                <div className="auth-policy-acceptance">
                  <label>
                    <input type="checkbox" name="acceptedTerms" required />
                    <span>I accept the <Link to="/terms" target="_blank">Terms of Use</Link>.</span>
                  </label>
                  <label>
                    <input type="checkbox" name="acceptedPrivacy" required />
                    <span>I acknowledge the <Link to="/privacy" target="_blank">Privacy Notice</Link> and how my data will be used.</span>
                  </label>
                </div>
              ) : null}

              {authStep === 'email' ? <p className="auth-passwordless-note"><HiOutlineKey aria-hidden="true" /> No password needed. Your code expires in 10 minutes.</p> : null}

              {errorMessage ? <p className="auth-error-message">{errorMessage}</p> : null}

              <button type="submit" className="auth-primary-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Please wait...' : stepContent.submitLabel}
              </button>
            </form>

            {authStep === 'email' ? <>
              <p className="auth-disclaimer">
                {mode === 'register'
                  ? <>You will review and accept our <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Notice</Link> before your account is created.</>
                  : 'We use your email to securely access your account.'}
              </p>
              <p className="auth-mobile-switch">
                {mode === 'login' ? 'New to Zumbarl?' : 'Already have an account?'}
                {' '}<Link to={switchPath}>{mode === 'login' ? 'Join Zumbarl' : 'Sign in'}</Link>
              </p>
            </> : null}
          </div>

          <aside className="auth-promo-panel">
            <img
              className="auth-promo-illustration"
              src={mode === 'login'
                ? '/assets/auth-onboarding/make-your-move.webp'
                : '/assets/auth-onboarding/find-your-people.webp'}
              alt=""
              aria-hidden="true"
            />
            <div className="auth-orbit auth-orbit-one" aria-hidden="true" />
            <div className="auth-orbit auth-orbit-two" aria-hidden="true" />
            <div className="auth-login-promo-brand" aria-hidden="true">
              <span><img src="/assets/index/bee_nobg.png" alt="" /></span>
              <strong>zumbarl</strong>
            </div>
          </aside>
        </div>
      </section>
      )}
    </main>
  )
}

export default AuthPage
