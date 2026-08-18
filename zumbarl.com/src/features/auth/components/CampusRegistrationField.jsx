import { useEffect, useState } from 'react'
import { HiOutlineCheck, HiOutlineMapPin, HiOutlineMagnifyingGlass } from 'react-icons/hi2'
import { sendZumbarlApiRequest } from '../../../lib/sendZumbarlApiRequest'

function CampusRegistrationField({ onChange }) {
  const [mode, setMode] = useState('existing')
  const [campusQuery, setCampusQuery] = useState('')
  const [campuses, setCampuses] = useState([])
  const [showCampusResults, setShowCampusResults] = useState(false)
  const [selectedCampus, setSelectedCampus] = useState(null)
  const [campusName, setCampusName] = useState('')
  const [branch, setBranch] = useState('')
  const [locationQuery, setLocationQuery] = useState('')
  const [locations, setLocations] = useState([])
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      sendZumbarlApiRequest(`/auth/campuses?q=${encodeURIComponent(campusQuery.trim())}`)
        .then((response) => setCampuses(response.campuses || []))
        .catch(() => setCampuses([]))
    }, 250)
    return () => window.clearTimeout(timer)
  }, [campusQuery])

  useEffect(() => {
    if (locationQuery.trim().length < 3 || selectedLocation) return undefined
    const timer = window.setTimeout(() => {
      setIsSearching(true)
      sendZumbarlApiRequest(`/auth/locations/search?q=${encodeURIComponent(locationQuery.trim())}`)
        .then((response) => setLocations(response.results || []))
        .catch(() => setLocations([]))
        .finally(() => setIsSearching(false))
    }, 350)
    return () => window.clearTimeout(timer)
  }, [locationQuery, selectedLocation])

  function selectExisting(campus) {
    setSelectedCampus(campus)
    setCampusQuery([campus.name, campus.branch].filter(Boolean).join(' · '))
    setShowCampusResults(false)
    onChange({ id: campus.id })
  }

  function startNewCampus() {
    setMode('new')
    setCampusName(campusQuery.trim())
    setSelectedCampus(null)
    onChange(null)
  }

  function selectLocation(location) {
    setSelectedLocation(location)
    setLocationQuery(location.label)
    setLocations([])
    onChange({ name: campusName.trim(), branch: branch.trim() || undefined, city: location.city || location.label.split(',')[0], locationLabel: location.label, latitude: location.latitude, longitude: location.longitude })
  }

  function updateNewCampus(patch) {
    const next = { name: campusName.trim(), branch: branch.trim() || undefined, ...patch }
    if (selectedLocation && next.name) onChange({ name: next.name, branch: next.branch, city: selectedLocation.city || selectedLocation.label.split(',')[0], locationLabel: selectedLocation.label, latitude: selectedLocation.latitude, longitude: selectedLocation.longitude })
    else onChange(null)
  }

  if (mode === 'new') {
    return (
      <fieldset className="auth-campus-create">
        <legend>Add your campus</legend>
        <p>We’ll create it when your account is registered so future students can select it.</p>
        <label className="auth-field">
          <span className="auth-field-label">Campus name</span>
          <input className="auth-input" value={campusName} onChange={(event) => { setCampusName(event.target.value); updateNewCampus({ name: event.target.value.trim() }) }} placeholder="University or college name" required />
        </label>
        <label className="auth-field">
          <span className="auth-field-label">Branch or campus <small>(optional)</small></span>
          <input className="auth-input" value={branch} onChange={(event) => { setBranch(event.target.value); updateNewCampus({ branch: event.target.value.trim() || undefined }) }} placeholder="Main Campus" />
        </label>
        <div className="auth-campus-location">
          <label className="auth-field">
            <span className="auth-field-label">Campus location</span>
            <input className="auth-input" role="combobox" aria-expanded={Boolean(locations.length)} value={locationQuery} onChange={(event) => { setLocationQuery(event.target.value); setSelectedLocation(null); onChange(null) }} placeholder="Search a town, road or campus" required />
            {selectedLocation ? <HiOutlineCheck className="auth-input-icon is-selected" /> : <HiOutlineMapPin className="auth-input-icon" />}
          </label>
          {locations.length ? <div className="auth-campus-results" role="listbox">{locations.map((location) => <button key={location.id} type="button" role="option" onClick={() => selectLocation(location)}><HiOutlineMapPin /><span><strong>{location.label.split(',')[0]}</strong><small>{location.label}</small></span></button>)}</div> : null}
          <small>{isSearching ? 'Searching locations…' : selectedLocation ? `Pin selected: ${selectedLocation.latitude.toFixed(5)}, ${selectedLocation.longitude.toFixed(5)}` : 'Select a search result to capture exact coordinates.'}</small>
        </div>
        <button className="auth-campus-switch" type="button" onClick={() => { setMode('existing'); onChange(selectedCampus ? { id: selectedCampus.id } : null) }}>Choose an existing campus instead</button>
      </fieldset>
    )
  }

  return (
    <div className="auth-campus-picker">
      <label className="auth-field">
        <span className="auth-field-label">Campus</span>
        <input className="auth-input" role="combobox" aria-expanded={showCampusResults} value={campusQuery} onFocus={() => setShowCampusResults(true)} onBlur={() => window.setTimeout(() => setShowCampusResults(false), 150)} onChange={(event) => { setCampusQuery(event.target.value); setSelectedCampus(null); setShowCampusResults(true); onChange(null) }} placeholder="Search existing campuses" required />
        {selectedCampus ? <HiOutlineCheck className="auth-input-icon is-selected" /> : <HiOutlineMagnifyingGlass className="auth-input-icon" />}
      </label>
      {showCampusResults ? <div className="auth-campus-results auth-campus-results-inline" role="listbox">{campuses.map((campus) => <button key={campus.id} type="button" role="option" onClick={() => selectExisting(campus)}><span><strong>{campus.name}</strong><small>{[campus.branch, campus.city].filter(Boolean).join(' · ')}</small></span></button>)}{!campuses.length ? <p>No existing campus matches “{campusQuery}”.</p> : null}<button className="auth-campus-add-result" type="button" onClick={startNewCampus}>Can’t find it? Add your campus</button></div> : null}
      {!showCampusResults ? <button className="auth-campus-switch" type="button" onClick={startNewCampus}>Can’t find it? Add your campus</button> : null}
    </div>
  )
}

export default CampusRegistrationField
