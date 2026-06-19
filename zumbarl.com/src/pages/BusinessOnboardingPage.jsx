import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Seo from '../components/Seo'
import { BusinessWorkspaceSidebar } from '../features/business/components/BusinessApplicantSidebar'
import { createBusinessIndustry, listBusinessIndustries } from '../features/business/services/persistBusinessIndustries'
import { sendZumbarlApiRequest } from '../lib/sendZumbarlApiRequest'
import '../styles/campus.css'
import '../styles/business.css'

const HIRING_GOALS = [
  'Post paid opportunities',
  'Run marketing campaigns',
  'Browse student talent',
  'Build a talent pipeline',
]

function BusinessOnboardingPage() {
  const navigate = useNavigate()
  const [industries, setIndustries] = useState([])
  const [industry, setIndustry] = useState('')
  const [isIndustryMenuOpen, setIsIndustryMenuOpen] = useState(false)
  const [isLoadingIndustries, setIsLoadingIndustries] = useState(false)
  const [selectedGoals, setSelectedGoals] = useState(['Post paid opportunities'])
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const filteredIndustries = industries.filter((item) => (
    item.toLowerCase().includes(industry.trim().toLowerCase())
  ))
  const hasExactIndustry = industries.some((item) => item.toLowerCase() === industry.trim().toLowerCase())

  useEffect(() => {
    let isMounted = true

    async function loadIndustries() {
      setIsLoadingIndustries(true)
      try {
        const response = await listBusinessIndustries()
        const nextIndustries = (response?.data || [])
          .map((item) => item.name)
          .filter(Boolean)
          .sort((first, second) => first.localeCompare(second))
        if (isMounted) setIndustries(nextIndustries)
      } catch (error) {
        if (isMounted) setErrorMessage(error.message || 'Could not load industries')
      } finally {
        if (isMounted) setIsLoadingIndustries(false)
      }
    }

    loadIndustries()

    return () => {
      isMounted = false
    }
  }, [])

  function toggleGoal(goal) {
    setSelectedGoals((current) => (
      current.includes(goal)
        ? current.filter((item) => item !== goal)
        : [...current, goal]
    ))
  }

  function selectIndustry(nextIndustry) {
    setIndustry(nextIndustry)
    setIsIndustryMenuOpen(false)
  }

  async function createIndustry(event) {
    event?.preventDefault()
    const nextIndustry = industry.trim()
    if (!nextIndustry) return

    if (hasExactIndustry) {
      selectIndustry(nextIndustry)
      return
    }

    try {
      const createdIndustry = await createBusinessIndustry(nextIndustry)
      const createdName = createdIndustry?.name || nextIndustry
      setIndustries((current) => {
        const uniqueIndustries = new Set([...current, createdName])
        return Array.from(uniqueIndustries).sort((first, second) => first.localeCompare(second))
      })
      selectIndustry(createdName)
    } catch (error) {
      setErrorMessage(error.message || 'Could not create industry')
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)

    try {
      await sendZumbarlApiRequest('/business/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name: formData.get('name'),
          registrationNumber: formData.get('registrationNumber') || undefined,
          industry,
          description: formData.get('description'),
          website: formData.get('website') || undefined,
          logoUrl: formData.get('logoUrl') || undefined,
          location: formData.get('locationCity'),
          locationCity: formData.get('locationCity'),
          locationAddress: formData.get('locationAddress') || undefined,
          latitude: formData.get('latitude') || undefined,
          longitude: formData.get('longitude') || undefined,
          teamSize: formData.get('teamSize'),
          hiringGoals: selectedGoals,
          onboardingCompleted: true,
        }),
      })
      navigate('/business/workspace')
    } catch (error) {
      setErrorMessage(error.message || 'Business onboarding failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="campus-page business-workspace-page business-onboarding-page">
      <Seo
        title="Business Onboarding | Zumbarl"
        description="Complete your Zumbarl business profile before posting opportunities."
        path="/business/onboarding"
      />

      <div className="campus-stage">
        <div className="campus-shell business-workspace-shell">
          <BusinessWorkspaceSidebar activeItemId="company-profile" />

          <section className="campus-main business-workspace-main business-onboarding-main">
            <section className="business-onboarding-card">
              <header>
                <span>Business onboarding</span>
                <h1>Set up your company workspace</h1>
                <p>Tell students who they will work with and what kind of talent you want to hire.</p>
              </header>

              <form className="business-onboarding-form" onSubmit={handleSubmit}>
                <div className="business-onboarding-grid">
                  <label>
                    <span>Business name</span>
                    <input name="name" required placeholder="Zetech Studios" />
                  </label>
                  <label>
                    <span>Registration number</span>
                    <input name="registrationNumber" placeholder="BN/2025/123456" />
                  </label>
                  <label className="business-onboarding-industry-field">
                    <span>Industry</span>
                    <input
                      name="industry"
                      required
                      autoComplete="off"
                      value={industry}
                      placeholder="Search or create an industry"
                      onBlur={() => window.setTimeout(() => setIsIndustryMenuOpen(false), 120)}
                      onChange={(event) => {
                        setIndustry(event.target.value)
                        setIsIndustryMenuOpen(true)
                      }}
                      onFocus={() => setIsIndustryMenuOpen(true)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && industry.trim() && !hasExactIndustry) {
                          event.preventDefault()
                          createIndustry()
                        }
                      }}
                    />
                    {isIndustryMenuOpen ? (
                      <div className="business-onboarding-industry-menu">
                        {isLoadingIndustries ? (
                          <span className="business-onboarding-industry-status">Loading industries...</span>
                        ) : null}
                        {filteredIndustries.slice(0, 6).map((item) => (
                          <button key={item} type="button" onMouseDown={() => selectIndustry(item)}>
                            {item}
                          </button>
                        ))}
                        {industry.trim() && !hasExactIndustry ? (
                          <button type="button" className="is-create" onMouseDown={createIndustry}>
                            Add "{industry.trim()}"
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </label>
                  <label>
                    <span>City</span>
                    <input name="locationCity" required placeholder="Nairobi" />
                  </label>
                  <label>
                    <span>Team size</span>
                    <select name="teamSize" defaultValue="2-10">
                      <option value="1">Solo founder</option>
                      <option value="2-10">2-10</option>
                      <option value="11-50">11-50</option>
                      <option value="51+">51+</option>
                    </select>
                  </label>
                  <label className="is-wide">
                    <span>Website</span>
                    <input name="website" type="url" placeholder="https://example.com" />
                  </label>
                  <label className="is-wide">
                    <span>Logo URL</span>
                    <input name="logoUrl" type="url" placeholder="https://example.com/logo.png" />
                  </label>
                  <label className="is-wide">
                    <span>Office address</span>
                    <input name="locationAddress" placeholder="Building, street, area" />
                  </label>
                  <label>
                    <span>Latitude</span>
                    <input name="latitude" type="number" step="any" placeholder="-1.286389" />
                  </label>
                  <label>
                    <span>Longitude</span>
                    <input name="longitude" type="number" step="any" placeholder="36.817223" />
                  </label>
                  <label className="is-wide">
                    <span>Company description</span>
                    <textarea
                      name="description"
                      required
                      placeholder="Describe your business, the kind of work students will do, and what makes your workspace credible."
                    />
                  </label>
                </div>

                <fieldset className="business-onboarding-goals">
                  <legend>Hiring goals</legend>
                  {HIRING_GOALS.map((goal) => (
                    <label key={goal}>
                      <input
                        type="checkbox"
                        checked={selectedGoals.includes(goal)}
                        onChange={() => toggleGoal(goal)}
                      />
                      <span>{goal}</span>
                    </label>
                  ))}
                </fieldset>

                {errorMessage ? <p className="business-onboarding-error">{errorMessage}</p> : null}

                <footer>
                  <button type="button" className="business-profile-secondary-btn" onClick={() => navigate('/business/workspace')}>
                    Skip for now
                  </button>
                  <button type="submit" className="business-profile-primary-btn" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Complete onboarding'}
                  </button>
                </footer>
              </form>
            </section>
          </section>
        </div>
      </div>
    </main>
  )
}

export default BusinessOnboardingPage
