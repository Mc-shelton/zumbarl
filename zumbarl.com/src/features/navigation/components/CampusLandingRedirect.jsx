import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { getAuthUserSnapshot, hydrateAuthUserFromBackend } from '../../auth/services/authUserService'
import {
  CAMPUS_LANDING_AREAS,
  DEFAULT_CAMPUS_AREA,
  campusPreferenceOwnerId,
  getCampusLandingPreference,
} from '../campusLandingPreference'

const DEFAULT_PATH = CAMPUS_LANDING_AREAS[DEFAULT_CAMPUS_AREA].path

function CampusLandingRedirect() {
  const [destination, setDestination] = useState(null)

  useEffect(() => {
    let active = true
    const resolveDestination = (snapshot) => {
      if (!active) return
      const ownerId = campusPreferenceOwnerId(snapshot)
      setDestination(ownerId ? getCampusLandingPreference(ownerId).path : DEFAULT_PATH)
    }

    const cachedSnapshot = getAuthUserSnapshot()
    if (cachedSnapshot) resolveDestination(cachedSnapshot)
    else void hydrateAuthUserFromBackend().then(resolveDestination).catch(() => resolveDestination(null))

    return () => { active = false }
  }, [])

  if (!destination) {
    return (
      <main className="campus-landing-loading" role="status" aria-live="polite">
        <span className="app-route-spinner" aria-hidden="true" />
        <strong>Opening your campus…</strong>
      </main>
    )
  }

  return <Navigate to={destination} replace />
}

export default CampusLandingRedirect
