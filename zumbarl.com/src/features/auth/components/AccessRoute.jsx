import { Navigate } from 'react-router-dom'
import { hasAnyAccess } from '../roleConfig'

function AccessRoute({ access, children, redirectTo = '/' }) {
  if (!hasAnyAccess(access)) {
    return <Navigate to={redirectTo} replace />
  }

  return children
}

export default AccessRoute
