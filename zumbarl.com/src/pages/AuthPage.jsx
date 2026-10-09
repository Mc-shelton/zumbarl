import { useState } from 'react'
import {
  HiOutlineAcademicCap,
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlineBriefcase,
  HiOutlineCheckCircle,
  HiOutlineClipboardDocumentCheck,
  HiOutlineEnvelope,
  HiOutlineIdentification,
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
import { LOGIN_SEO } from '../features/seo/constants'
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

const ACCESS_CONTENT = {
  eyebrow: 'Your campus, connected',
  heading: 'Continue to Zumbarl',
  intro: 'Enter your email and we’ll send you a secure access code.',
  submitLabel: 'Email me a code',
}

const PROFILE_FIELDS = [
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
]

const PROFILE_STAGE_COUNT = 3

function AuthPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [accountType, setAccountType] = useState('student')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoginReady, setIsLoginReady] = useState(hasCompletedLoginOnboarding)
  const [authStep, setAuthStep] = useState('email')
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpChallenge, setOtpChallenge] = useState(null)
  const [registrationToken, setRegistrationToken] = useState('')
  const [profileStage, setProfileStage] = useState(0)
  const [profileDetails, setProfileDetails] = useState({
    firstName: '',
    lastName: '',
    username: '',
    businessName: '',
    yearJoined: '',
  })
  const [campus, setCampus] = useState(null)
  const [course, setCourse] = useState(null)
  const returnTo = safeReturnPath(searchParams.get('returnTo'))
  const visualMode = authStep === 'profile' ? 'register' : 'login'
  const stepContent = authStep === 'otp'
    ? {
        eyebrow: 'Check your inbox',
        heading: 'Enter your code',
        intro: `If ${email} can access Zumbarl, a six-digit code will arrive shortly.`,
        submitLabel: 'Verify code',
      }
    : authStep === 'profile'
      ? {
          eyebrow: 'Email verified',
          heading: 'Build your profile',
          intro: 'Tell us a little about yourself to finish joining Zumbarl.',
          submitLabel: 'Create my account',
        }
      : ACCESS_CONTENT
  const profileStages = [
    { label: 'About you', Icon: HiOutlineIdentification },
    { label: accountType === 'student' ? 'Campus' : 'Work', Icon: accountType === 'student' ? HiOutlineAcademicCap : HiOutlineBriefcase },
    { label: 'Review', Icon: HiOutlineClipboardDocumentCheck },
  ]

  const updateProfileDetail = (key, value) => {
    setProfileDetails((current) => ({ ...current, [key]: value }))
  }

  const finishAuthentication = (response, { isNewUser = false } = {}) => {
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
          ? (isNewUser ? '/business/onboarding' : '/business/workspace')
          : '/campus/landing'
    navigate(returnTo || defaultPath)
  }

  const requestEmailCode = async (address = email) => {
    const normalizedEmail = String(address || '').trim().toLowerCase()
    const response = await sendZumbarlApiRequest('/auth/email-otp/request', {
      method: 'POST',
      body: JSON.stringify({ email: normalizedEmail, purpose: 'access' }),
    })
    setEmail(normalizedEmail)
    setOtpChallenge(response)
    setOtpCode(response?.developmentCode || '')
    setAuthStep('otp')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')

    if (authStep === 'profile' && profileStage < PROFILE_STAGE_COUNT - 1) {
      if (profileStage === 1 && accountType === 'student' && !campus) {
        setErrorMessage('Select an existing campus or add your campus and choose its location.')
        return
      }
      if (profileStage === 1 && accountType === 'student' && !course) {
        setErrorMessage('Select an existing course or create yours.')
        return
      }
      setProfileStage((current) => Math.min(current + 1, PROFILE_STAGE_COUNT - 1))
      return
    }

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

      const payload = {
        email,
        registrationToken,
        firstName: profileDetails.firstName,
        lastName: profileDetails.lastName,
        username: profileDetails.username,
        name: `${profileDetails.firstName} ${profileDetails.lastName}`,
        acceptedTerms: formData.get('acceptedTerms') === 'on',
        acceptedPrivacy: formData.get('acceptedPrivacy') === 'on',
        role: accountType === 'professional' ? 'COMPANY_STANDARD' : 'STUDENT_STANDARD',
        businessName: accountType === 'professional' ? profileDetails.businessName : undefined,
        campus: accountType === 'student' ? campus : undefined,
        course: accountType === 'student' ? course : undefined,
        yearJoined: accountType === 'student' ? Number(profileDetails.yearJoined) : undefined,
      }
      const response = await sendZumbarlApiRequest('/auth/register', { method: 'POST', body: JSON.stringify(payload) })
      finishAuthentication(response, { isNewUser: true })
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
    setProfileStage(0)
    setOtpCode('')
    setOtpChallenge(null)
    setErrorMessage('')
  }

  const returnToPreviousProfileStage = () => {
    setErrorMessage('')
    setProfileStage((current) => Math.max(0, current - 1))
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
    <main className={`page auth-page is-${visualMode} is-step-${authStep}`}>
      <Seo
        title={LOGIN_SEO.title}
        description={LOGIN_SEO.description}
        path={LOGIN_SEO.path}
        keywords={LOGIN_SEO.keywords}
        jsonLd={[LOGIN_SEO.pageJsonLd]}
      />
      {isLoginReady ? <Header brandOnly /> : null}
      {!isLoginReady ? (
        <LoginOnboarding onComplete={completeLoginOnboarding} />
      ) : (
      <section className="auth-stage" aria-label="Authentication">
        <div className="auth-card">
          <div className="auth-form-panel">
            <div className="auth-login-illustration" aria-hidden="true">
              <img
                className="auth-login-illustration-art"
                src={visualMode === 'login'
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

              {authStep === 'profile' ? (
                <>
                  <div className="auth-verified-email">
                    <HiOutlineCheckCircle aria-hidden="true" />
                    <span><small>Verified email</small><strong>{email}</strong></span>
                    <button type="button" onClick={changeEmail}>Change</button>
                  </div>

                  <ol className="auth-profile-progress" aria-label="Profile setup progress">
                    {profileStages.map(({ label, Icon }, index) => (
                      <li key={label} className={index === profileStage ? 'is-current' : index < profileStage ? 'is-complete' : ''}>
                        <button
                          type="button"
                          onClick={() => { setErrorMessage(''); setProfileStage(index) }}
                          disabled={index > profileStage}
                          aria-current={index === profileStage ? 'step' : undefined}
                        >
                          <span>{index < profileStage ? <HiOutlineCheckCircle aria-hidden="true" /> : <Icon aria-hidden="true" />}</span>
                          <small>{label}</small>
                        </button>
                      </li>
                    ))}
                  </ol>

                  {profileStage === 0 ? (
                    <section className="auth-profile-step-card" aria-labelledby="profile-basics-title">
                      <header className="auth-profile-step-heading">
                        <span><HiOutlineIdentification aria-hidden="true" /></span>
                        <div>
                          <small>Step 1 of 3</small>
                          <h2 id="profile-basics-title">Start with the basics</h2>
                          <p>Choose how you’ll use Zumbarl and tell us what to call you.</p>
                        </div>
                      </header>
                      <div className="auth-account-toggle" role="radiogroup" aria-label="Personal profile type">
                        {[{ id: 'student', label: 'Student', detail: 'Campus life, learning, work and connections.' }, { id: 'professional', label: 'Professional', detail: 'Represent yourself, then create or manage business pages.' }].map((option) => (
                          <button key={option.id} type="button" className={accountType === option.id ? 'is-active' : ''} aria-pressed={accountType === option.id} onClick={() => setAccountType(option.id)}>
                            <strong>{option.label}</strong><span>{option.detail}</span>
                          </button>
                        ))}
                      </div>
                      <p className="auth-account-note">This creates your personal profile. Organizations stay separate and can have shared managers.</p>
                      <div className="auth-profile-field-grid">
                        {PROFILE_FIELDS.map(({ id, label, type, minLength, autoComplete, placeholder, Icon }) => (
                          <div key={id} className={`auth-field ${id === 'username' ? 'auth-profile-field-wide' : ''}`}>
                            <label className="auth-field-label" htmlFor={id}>{label}</label>
                            <input
                              id={id}
                              name={id}
                              type={type}
                              minLength={minLength}
                              autoComplete={autoComplete}
                              placeholder={placeholder}
                              className="auth-input"
                              value={profileDetails[id]}
                              onChange={(event) => updateProfileDetail(id, event.target.value)}
                              required
                            />
                            <Icon className="auth-input-icon" aria-hidden="true" />
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null}

                  {profileStage === 1 ? (
                    <section className="auth-profile-step-card" aria-labelledby="profile-context-title">
                      <header className="auth-profile-step-heading">
                        <span>{accountType === 'student' ? <HiOutlineAcademicCap aria-hidden="true" /> : <HiOutlineBriefcase aria-hidden="true" />}</span>
                        <div>
                          <small>Step 2 of 3</small>
                          <h2 id="profile-context-title">{accountType === 'student' ? 'Add your campus' : 'Add your work identity'}</h2>
                          <p>{accountType === 'student' ? 'This personalizes people, learning and opportunities around you.' : 'You can invite teammates and create more organization pages later.'}</p>
                        </div>
                      </header>
                      {accountType === 'professional' ? (
                        <div className="auth-field">
                          <label className="auth-field-label" htmlFor="businessName">Business name</label>
                          <input
                            id="businessName"
                            name="businessName"
                            type="text"
                            autoComplete="organization"
                            placeholder="Your business"
                            className="auth-input"
                            value={profileDetails.businessName}
                            onChange={(event) => updateProfileDetail('businessName', event.target.value)}
                            required
                          />
                          <HiOutlineBriefcase className="auth-input-icon" aria-hidden="true" />
                        </div>
                      ) : (
                        <div className="auth-profile-campus-fields">
                          <CampusRegistrationField onChange={setCampus} />
                          <CoursePicker value={course} onChange={setCourse} required />
                          <label className="auth-field" htmlFor="yearJoined">
                            <span className="auth-field-label">Year joined campus</span>
                            <select
                              id="yearJoined"
                              name="yearJoined"
                              className="auth-input"
                              value={profileDetails.yearJoined}
                              onChange={(event) => updateProfileDetail('yearJoined', event.target.value)}
                              required
                            >
                              <option value="" disabled>Select year</option>
                              {Array.from({ length: 11 }, (_, index) => new Date().getFullYear() - index).map((year) => <option key={year} value={year}>{year}</option>)}
                            </select>
                            <HiOutlineAcademicCap className="auth-input-icon" aria-hidden="true" />
                          </label>
                        </div>
                      )}
                    </section>
                  ) : null}

                  {profileStage === 2 ? (
                    <section className="auth-profile-step-card" aria-labelledby="profile-review-title">
                      <header className="auth-profile-step-heading">
                        <span><HiOutlineClipboardDocumentCheck aria-hidden="true" /></span>
                        <div>
                          <small>Step 3 of 3</small>
                          <h2 id="profile-review-title">Review and join</h2>
                          <p>Make sure these details look right, then accept the policies to continue.</p>
                        </div>
                      </header>
                      <dl className="auth-profile-summary">
                        <div><dt>Name</dt><dd>{profileDetails.firstName} {profileDetails.lastName}</dd></div>
                        <div><dt>Username</dt><dd>{profileDetails.username}</dd></div>
                        <div><dt>Profile</dt><dd>{accountType === 'student' ? 'Student' : 'Professional'}</dd></div>
                        {accountType === 'student' ? <>
                          <div><dt>Campus</dt><dd>{campus?.name || 'Selected campus'}</dd></div>
                          <div><dt>Course</dt><dd>{course?.name || 'Selected course'}</dd></div>
                          <div><dt>Joined</dt><dd>{profileDetails.yearJoined}</dd></div>
                        </> : <div><dt>Business</dt><dd>{profileDetails.businessName}</dd></div>}
                      </dl>
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
                    </section>
                  ) : null}
                </>
              ) : null}

              {authStep === 'email' ? <p className="auth-passwordless-note"><HiOutlineKey aria-hidden="true" /> No password needed. Your code expires in 10 minutes.</p> : null}

              {errorMessage ? <p className="auth-error-message">{errorMessage}</p> : null}

              {authStep === 'profile' ? (
                <div className="auth-profile-actions">
                  {profileStage > 0 ? (
                    <button type="button" className="auth-profile-back-btn" onClick={returnToPreviousProfileStage}>
                      <HiOutlineArrowLeft aria-hidden="true" /> Back
                    </button>
                  ) : <span aria-hidden="true" />}
                  <button type="submit" className="auth-primary-btn" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating your account...' : profileStage === PROFILE_STAGE_COUNT - 1 ? 'Create my account' : <>Continue <HiOutlineArrowRight aria-hidden="true" /></>}
                  </button>
                </div>
              ) : (
                <button type="submit" className="auth-primary-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Please wait...' : stepContent.submitLabel}
                </button>
              )}
            </form>

            {authStep === 'email' ? <>
              <p className="auth-disclaimer">
                We use your email to securely access your account. If you’re new, we’ll help you set up your profile after verification.
              </p>
            </> : null}
          </div>

          <aside className="auth-promo-panel">
            <img
              className="auth-promo-illustration"
              src={visualMode === 'login'
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
