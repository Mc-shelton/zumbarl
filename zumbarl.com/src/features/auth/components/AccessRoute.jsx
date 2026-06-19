import { Navigate } from 'react-router-dom'
import { AUTH_TOKEN_KEY } from '../../../lib/sendZumbarlApiRequest'
import { hasAnyAccess } from '../roleConfig'

function AccessRoute({ access, children, redirectTo = '/' }) {
  const hasSession = typeof window !== 'undefined' && Boolean(window.localStorage.getItem(AUTH_TOKEN_KEY))

  if (!hasSession) {
    return <Navigate to="/login" replace />
  }

  if (!hasAnyAccess(access)) {
    return <Navigate to={redirectTo} replace />
  }

  return children
}

export default AccessRoute
