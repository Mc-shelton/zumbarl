export function AppBrandDefinition() {
  return (
    <div className="app-brand-definition" aria-hidden="true">
      <div>
        <strong>zumbar</strong>
        <span>/sumˈbaɾ/</span>
      </div>
      <small>verb · Spanish</small>
      <p><b>1.</b> to buzz; to hum with energy.</p>
      <em>The word behind zumbarl.</em>
    </div>
  )
}

function AppBrandLoader({ status = 'Loading Zumbarl…' }) {
  return (
    <div className="app-brand-loader">
      <span className="app-brand-loader-mark" aria-hidden="true">
        <img src="/assets/index/bee_nobg.png" alt="" />
      </span>

      <AppBrandDefinition />

      <span className="sr-only">{status}</span>
    </div>
  )
}

export default AppBrandLoader
