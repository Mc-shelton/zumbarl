import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Seo from '../components/Seo'
import { BusinessWorkspaceSidebar } from '../features/business/components/BusinessApplicantSidebar'
import { readBusinessKyc, submitBusinessKyc } from '../features/business/services/submitBusinessKyc'
import '../styles/campus.css'
import '../styles/business.css'

const COMPANY_SIZES = ['1', '2-10', '11-50', '51-200', '201+']

const FIELD_GROUPS = [
  {
    title: 'Business identity verification',
    fields: [
      ['registeredBusinessName', 'Registered business name', 'text', true],
      ['businessRegistrationNumber', 'Business registration number', 'text', true],
      ['incorporationCertificate', 'Certificate of Incorporation / CR12 / Registration certificate', 'text', true],
      ['kraPinCertificate', 'KRA PIN certificate', 'text', true],
    ],
  },
  {
    title: 'Owner or representative verification',
    fields: [
      ['representativeFullName', 'Full name of authorised representative', 'text', true],
      ['representativeIdDocument', 'National ID or Passport reference', 'text', true],
      ['representativePhone', 'OTP verified phone number', 'tel', true],
      ['representativeEmail', 'Business email', 'email', true],
      ['representativeRole', 'Job title / role', 'text', true],
    ],
  },
  {
    title: 'Business details',
    fields: [
      ['industry', 'Sector / industry', 'text', true],
      ['physicalAddress', 'Physical office address', 'text', true],
      ['geoCoordinates', 'Geo-coordinates for physical gigs', 'text', false],
      ['website', 'Website', 'url', false],
      ['yearEstablished', 'Year established', 'number', true],
    ],
  },
  {
    title: 'Financial verification',
    fields: [
      ['mpesaTillOrPaybill', 'M-Pesa Till / Paybill number', 'text', false],
      ['bankAccountDetails', 'Business bank account details', 'text', false],
      ['taxComplianceCertificate', 'KRA tax compliance certificate', 'text', false],
    ],
  },
  {
    title: 'Trust signals',
    fields: [
      ['linkedInCompanyPage', 'LinkedIn company page', 'url', false],
      ['socialMediaPresence', 'Social media presence', 'text', false],
      ['verifiedCompanyReferral', 'Verified Zumbarl company referral', 'text', false],
    ],
  },
]

function readFieldValue(formData, key) {
  const value = String(formData.get(key) || '').trim()
  return value || undefined
}

function BusinessKycPage() {
  const [kyc, setKyc] = useState(null)
  const [summary, setSummary] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadKyc() {
      try {
        const response = await readBusinessKyc()
        if (!isMounted) return
        setKyc(response?.data || {})
        setSummary(response?.summary || null)
      } catch (error) {
        if (isMounted) setErrorMessage(error.message || 'Could not load business KYC')
      }
    }

    loadKyc()

    return () => {
      isMounted = false
    }
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)
    const formData = new FormData(event.currentTarget)
    const payload = FIELD_GROUPS.flatMap((group) => group.fields).reduce((result, [key]) => ({
      ...result,
      [key]: readFieldValue(formData, key),
    }), {
      companySize: formData.get('companySize'),
      status: 'in_review',
    })

    try {
      const response = await submitBusinessKyc(payload)
      setKyc(response?.data || {})
      setSummary(response?.summary || null)
    } catch (error) {
      setErrorMessage(error.message || 'Could not submit business KYC')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="campus-page business-workspace-page business-kyc-page">
      <Seo
        title="Business KYC | Zumbarl"
        description="Verify your Zumbarl business identity, representative, financial details and trust signals."
        path="/business/kyc"
      />

      <div className="campus-stage">
        <div className="campus-shell business-workspace-shell">
          <BusinessWorkspaceSidebar activeItemId="kyc" />

          <section className="campus-main business-workspace-main business-kyc-main">
            <nav className="business-workspace-breadcrumb" aria-label="Breadcrumb">
              <Link to="/business/workspace">Workspace</Link>
              <span>Business KYC</span>
            </nav>

            <header className="business-workspace-header">
              <div>
                <h1>Business identity verification</h1>
                <p>Complete the checks needed to build trust, fund escrow, and post higher-volume work.</p>
              </div>
            </header>

            <section className="business-profile-card business-kyc-summary-panel">
              <div>
                <span>{summary?.percent || 0}%</span>
                <strong>{summary?.completed || 0}/{summary?.total || 0} checks complete</strong>
                <p>Status: {String(summary?.status || 'not_started').replace(/_/g, ' ')}</p>
              </div>
              <ul>
                {(summary?.checks || []).map((check) => (
                  <li key={check.key} className={check.complete ? 'is-complete' : ''}>
                    {check.label}
                  </li>
                ))}
              </ul>
            </section>

            <form key={kyc?.id || 'new-kyc'} className="business-profile-card business-kyc-form" onSubmit={handleSubmit}>
              {FIELD_GROUPS.map((group) => (
                <section key={group.title}>
                  <h2>{group.title}</h2>
                  <div className="business-kyc-grid">
                    {group.fields.map(([key, label, type, required]) => (
                      <label key={key}>
                        <span>{label}{required ? ' *' : ''}</span>
                        <input
                          name={key}
                          type={type}
                          required={required}
                          defaultValue={kyc?.[key] || ''}
                        />
                      </label>
                    ))}
                    {group.title === 'Business details' ? (
                      <label>
                        <span>Company size *</span>
                        <select name="companySize" required defaultValue={kyc?.companySize || '2-10'}>
                          {COMPANY_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
                        </select>
                      </label>
                    ) : null}
                  </div>
                </section>
              ))}

              {errorMessage ? <p className="business-dashboard-error">{errorMessage}</p> : null}

              <footer>
                <Link to="/business/workspace" className="business-profile-secondary-btn">Back to dashboard</Link>
                <button type="submit" className="business-profile-primary-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit KYC for review'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      </div>
    </main>
  )
}

export default BusinessKycPage
