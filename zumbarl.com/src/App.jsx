import { Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import './App.css'
import AccessRoute from './features/auth/components/AccessRoute'
import { APP_ROUTES } from './features/navigation/routeConfig'

function renderRouteElement(route) {
  if (!route.access) {
    return route.element
  }

  return <AccessRoute access={route.access}>{route.element}</AccessRoute>
}

function App() {
  return (
    <Suspense fallback={<div className="app-route-loading" role="status">Loading Zumbarl...</div>}>
      <Routes>
        {APP_ROUTES.map((route) => (
          <Route key={route.path} path={route.path} element={renderRouteElement(route)} />
        ))}
      </Routes>
    </Suspense>
  )
}

export default App
