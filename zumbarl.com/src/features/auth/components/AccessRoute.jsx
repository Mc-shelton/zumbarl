import { useEffect, useState, useSyncExternalStore } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import AppBrandLoader from '../../../components/AppBrandLoader'
import { AUTH_TOKEN_KEY } from '../../../lib/sendZumbarlApiRequest'
import { getAuthUserSnapshot, hydrateAuthUserFromBackend, subscribeAuthUser } from '../services/authUserService'
import { hasAnyAccess } from '../roleConfig'

function AccessRoute({ access, children, redirectTo = '/' }) {
  const location = useLocation()
  useSyncExternalStore(subscribeAuthUser, getAuthUserSnapshot, getAuthUserSnapshot)
  const hasSession = typeof window !== 'undefined' && Boolean(window.localStorage.getItem(AUTH_TOKEN_KEY))
  const [isCheckingSession, setIsCheckingSession] = useState(hasSession)

  useEffect(() => {
    let isActive = true
    if (!hasSession) return undefined

    hydrateAuthUserFromBackend().finally(() => {
      if (isActive) setIsCheckingSession(false)
    })
    return () => { isActive = false }
  }, [hasSession])

  if (!hasSession) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />
  }

  if (isCheckingSession) {
    return (
      <main className="app-auth-check" role="status">
        <AppBrandLoader status="Checking your session…" />
      </main>
    )
  }

  if (!hasAnyAccess(access)) {
    return <Navigate to={redirectTo} replace />
  }

  return children
}

export default AccessRoute
