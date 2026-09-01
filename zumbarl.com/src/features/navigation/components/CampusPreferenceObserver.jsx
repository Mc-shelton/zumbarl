import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getAuthUserSnapshot, hydrateAuthUserFromBackend } from '../../auth/services/authUserService'
import { recordRecommendationEventsBestEffort } from '../../recommendations/services/recommendationEventService'
import {
  CAMPUS_LANDING_AREAS,
  campusAreaForPath,
  campusPreferenceOwnerId,
  recordCampusAreaDwell,
  recordCampusAreaVisit,
} from '../campusLandingPreference'

const CHECKPOINT_MS = 30 * 1000
const MIN_SAMPLE_SECONDS = 5

function isActivelyViewed() {
  if (typeof document === 'undefined') return false
  return document.visibilityState === 'visible' && document.hasFocus()
}

function CampusPreferenceObserver() {
  const { pathname } = useLocation()

  useEffect(() => {
    const area = campusAreaForPath(pathname)
    if (!area) return undefined

    let cancelled = false
    let ownerId = null
    let activeSince = null
    let pendingSeconds = 0

    const begin = () => {
      if (!cancelled && ownerId && activeSince === null && isActivelyViewed()) activeSince = performance.now()
    }

    const commit = (force = false) => {
      if (activeSince !== null) {
        pendingSeconds += Math.max(0, (performance.now() - activeSince) / 1000)
        activeSince = null
      }
      if (!ownerId || pendingSeconds < MIN_SAMPLE_SECONDS || (!force && pendingSeconds < CHECKPOINT_MS / 1000)) return

      const durationSeconds = Math.round(pendingSeconds)
      pendingSeconds = 0
      recordCampusAreaDwell(ownerId, area, durationSeconds)
      recordRecommendationEventsBestEffort([{
        surface: CAMPUS_LANDING_AREAS[area].surface,
        entityType: 'campus_area',
        entityId: area,
        eventType: 'dwell',
        metadata: { durationSeconds, pathname, signal: 'campus_area_dwell' },
      }])
    }

    const pause = () => commit(true)
    const resume = () => begin()
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') resume()
      else pause()
    }

    const activate = (snapshot) => {
      if (cancelled) return
      ownerId = campusPreferenceOwnerId(snapshot)
      if (!ownerId) return
      const visitRecorded = recordCampusAreaVisit(ownerId, area)
      if (visitRecorded) {
        recordRecommendationEventsBestEffort([{
          surface: CAMPUS_LANDING_AREAS[area].surface,
          entityType: 'campus_area',
          entityId: area,
          eventType: 'open',
          metadata: { pathname, signal: 'campus_area_visit' },
        }])
      }
      begin()
    }

    const cachedSnapshot = getAuthUserSnapshot()
    if (cachedSnapshot) activate(cachedSnapshot)
    else void hydrateAuthUserFromBackend().then(activate)

    const checkpointId = window.setInterval(() => {
      commit()
      begin()
    }, CHECKPOINT_MS)
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('focus', resume)
    window.addEventListener('blur', pause)
    window.addEventListener('pagehide', pause)

    return () => {
      commit(true)
      cancelled = true
      window.clearInterval(checkpointId)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('focus', resume)
      window.removeEventListener('blur', pause)
      window.removeEventListener('pagehide', pause)
    }
  }, [pathname])

  return null
}

export default CampusPreferenceObserver
