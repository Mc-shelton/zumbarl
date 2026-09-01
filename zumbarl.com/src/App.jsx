import { Suspense, useEffect } from 'react'
import { createBrowserRouter, RouterProvider, useRouteError } from 'react-router-dom'
import './App.css'
import AccessRoute from './features/auth/components/AccessRoute'
import RealtimeCallAgent from './features/calls/components/RealtimeCallAgent'
import CampusPreferenceObserver from './features/navigation/components/CampusPreferenceObserver'
import { APP_ROUTES } from './features/navigation/routeConfig'

const DYNAMIC_IMPORT_RELOAD_KEY = 'zumbarl.dynamicImportReloaded'

const loadingScreenStyle = {
  minHeight: '100vh',
  display: 'grid',
  placeItems: 'center',
  background: '#f7f8fb',
  color: '#343342',
  fontFamily: 'Inter, system-ui, sans-serif',
}

function AppLoading() {
  return (
    <main style={loadingScreenStyle} role="status" aria-live="polite">
      <div style={{ display: 'grid', justifyItems: 'center', gap: 12 }}>
        <span className="app-route-spinner" style={{ width: 34, height: 34, border: '3px solid #e4deea', borderTopColor: '#79506f', borderRadius: '50%' }} />
        <strong>Loading Zumbarl…</strong>
      </div>
    </main>
  )
}

function renderRouteElement(route) {
  const observedPage = <><CampusPreferenceObserver />{route.element}</>
  const page = route.access
    ? <AccessRoute access={route.access}>{observedPage}</AccessRoute>
    : observedPage
  return <><RealtimeCallAgent />{page}</>
}

function getErrorMessage(error) {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Zumbarl could not load this workspace view.'
}

function isDynamicImportError(message) {
  return /dynamically imported module|importing a module script failed|failed to fetch/i.test(message)
}

function AppRouteError() {
  const error = useRouteError()
  const message = getErrorMessage(error)
  const shouldAutoReload = isDynamicImportError(message)

  useEffect(() => {
    if (!shouldAutoReload || typeof window === 'undefined') return

    const alreadyReloaded = window.sessionStorage.getItem(DYNAMIC_IMPORT_RELOAD_KEY) === 'true'
    if (alreadyReloaded) return

    window.sessionStorage.setItem(DYNAMIC_IMPORT_RELOAD_KEY, 'true')
    const timeoutId = window.setTimeout(() => {
      window.location.reload()
    }, 250)

    return () => window.clearTimeout(timeoutId)
  }, [shouldAutoReload])

  function reloadPage() {
    if (typeof window === 'undefined') return
    window.sessionStorage.removeItem(DYNAMIC_IMPORT_RELOAD_KEY)
    window.location.reload()
  }

  return (
    <main className="app-route-error" style={loadingScreenStyle} role="alert">
      <section style={{ width: 'min(440px, calc(100% - 32px))', padding: 28, borderRadius: 18, background: '#fff', textAlign: 'center', boxSizing: 'border-box' }}>
        <h1>Workspace view could not load</h1>
        <p>
          {shouldAutoReload
            ? 'The app is refreshing this view because the local dev server served a stale module.'
            : 'Zumbarl hit a loading error for this page.'}
        </p>
        <button type="button" onClick={reloadPage}>Reload view</button>
      </section>
    </main>
  )
}

const router = createBrowserRouter(APP_ROUTES.map((route) => ({
  path: route.path,
  element: renderRouteElement(route),
  errorElement: <AppRouteError />,
})))

function App() {
  return (
    <Suspense fallback={<AppLoading />}>
      <RouterProvider router={router} />
    </Suspense>
  )
}

export default App
