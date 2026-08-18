import { useEffect, useRef, useState } from 'react'
import { FiCheckCircle, FiSave } from 'react-icons/fi'
import {
  getBusinessProfileSnapshot,
  hydrateBusinessProfileFromBackend,
  saveBusinessProfile,
} from '../services/businessProfileService'
import {
  BusinessCreateInputField,
  BusinessCreateSelectField,
  BusinessCreateTextareaField,
} from './BusinessOpportunityCreateFields'

const TEAM_SIZE_OPTIONS = ['1', '2-10', '11-50', '51+']

function toFormValues(profile) {
  return {
    name: profile?.name || '',
    industry: profile?.industry || profile?.sector || '',
    website: profile?.website || '',
    teamSize: profile?.teamSize || profile?.size || '',
    location: profile?.locationCity || profile?.location || '',
    description: profile?.description || '',
  }
}

export function BusinessCompanyProfileCard() {
  const [form, setForm] = useState(() => toFormValues(getBusinessProfileSnapshot()))
  const [isSaving, setIsSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')
  const [saveError, setSaveError] = useState('')
  const isDirtyRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    hydrateBusinessProfileFromBackend().then((profile) => {
      if (!cancelled && profile && !isDirtyRef.current) setForm(toFormValues(profile))
    })
    return () => { cancelled = true }
  }, [])

  function updateField(name, value) {
    isDirtyRef.current = true
    setSavedMessage('')
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSave(event) {
    event.preventDefault()
    setIsSaving(true)
    setSaveError('')
    setSavedMessage('')

    try {
      await saveBusinessProfile({
        name: form.name.trim(),
        description: form.description.trim(),
        industry: form.industry.trim() || undefined,
        website: form.website.trim() || undefined,
        teamSize: form.teamSize || undefined,
        location: form.location.trim() || undefined,
        locationCity: form.location.trim() || undefined,
      })
      isDirtyRef.current = false
      setSavedMessage('Company profile saved. New opportunities will use these details automatically.')
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save the company profile.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section id="company-profile" className="business-profile-card business-settings-company-card">
      <header>
        <div>
          <h2>Company Profile</h2>
          <p>Set these details once — they appear on every opportunity you post so students know who they will work with.</p>
        </div>
      </header>

      <form className="business-create-form" onSubmit={handleSave}>
        <BusinessCreateInputField
          label="Company Name"
          name="name"
          placeholder="e.g. Zetech Studios"
          required
          value={form.name}
          onUpdateField={updateField}
        />
        <BusinessCreateInputField
          label="Industry"
          name="industry"
          placeholder="e.g. Media & Design"
          value={form.industry}
          onUpdateField={updateField}
        />
        <BusinessCreateInputField
          label="Website"
          name="website"
          placeholder="https://your-company.com"
          value={form.website}
          onUpdateField={updateField}
        />
        <BusinessCreateSelectField
          label="Team Size"
          name="teamSize"
          options={TEAM_SIZE_OPTIONS}
          placeholder="Select a team size"
          value={form.teamSize}
          onUpdateField={updateField}
        />
        <BusinessCreateInputField
          isWide
          label="Location"
          name="location"
          placeholder="e.g. Nairobi"
          value={form.location}
          onUpdateField={updateField}
        />
        <BusinessCreateTextareaField
          isWide
          label="Company Description"
          name="description"
          placeholder="Briefly introduce your company and the work students will support."
          required
          value={form.description}
          onUpdateField={updateField}
        />

        <footer className="business-settings-company-footer">
          <div aria-live="polite">
            {saveError ? <p className="business-settings-company-error" role="alert">{saveError}</p> : null}
            {savedMessage ? (
              <p className="business-settings-company-saved">
                <FiCheckCircle aria-hidden="true" />
                {savedMessage}
              </p>
            ) : null}
          </div>
          <button type="submit" className="business-profile-primary-btn" disabled={isSaving}>
            <FiSave aria-hidden="true" />
            {isSaving ? 'Saving...' : 'Save Company Profile'}
          </button>
        </footer>
      </form>
    </section>
  )
}
