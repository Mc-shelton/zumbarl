import { FiCheckCircle, FiEye, FiImage, FiInfo, FiList, FiPackage, FiSave, FiSend, FiShield } from 'react-icons/fi'

function MarketplaceListingRail({ studio }) {
  const cover = studio.form.gallery[0]
  return (
    <aside className="campus-rail marketplace-studio-rail">
      <section className="marketplace-studio-rail-card marketplace-studio-summary">
        <header><div><h2>Listing preview</h2><p>What buyers will see in the marketplace.</p></div><FiEye aria-hidden="true" /></header>
        <div className="marketplace-studio-summary-image">{cover ? <img src={cover} alt="Listing preview" /> : <FiImage aria-hidden="true" />}</div>
        <span>{studio.form.category} · {studio.form.condition}</span>
        <h3>{studio.form.title || 'Your listing title'}</h3>
        <p>{studio.form.subtitle || studio.form.description || 'Add a short selling line to preview your product card.'}</p>
        <strong>{new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(Number(studio.form.priceAmount) || 0)}</strong>
        <small><FiPackage aria-hidden="true" />{studio.form.stock || 0} {studio.form.kind === 'service' ? 'slots' : 'in stock'}</small>
      </section>

      <section className="marketplace-studio-rail-card marketplace-studio-readiness">
        <header><div><h2>Listing readiness</h2><p>{studio.readinessScore}% complete</p></div><span>{studio.readinessScore}%</span></header>
        <div className="marketplace-studio-progress"><i style={{ width: `${studio.readinessScore}%` }} /></div>
        <ul>
          {studio.readinessChecks.map((check) => <li key={check.id} className={check.complete ? 'is-complete' : ''}><button type="button" onClick={() => studio.goToStep(check.step)}>{check.complete ? <FiCheckCircle aria-hidden="true" /> : <FiList aria-hidden="true" />}<span>{check.label}</span></button></li>)}
        </ul>
      </section>

      <section className="marketplace-studio-rail-card marketplace-studio-publish-card">
        <h2>Visibility</h2>
        <p><FiShield aria-hidden="true" /> Drafts are private. Published listings appear in Marketplace and on your Shop tab.</p>
        <button type="button" onClick={studio.saveProgress} disabled={studio.isSaving || studio.isUploading}><FiSave aria-hidden="true" />{studio.isSaving ? 'Saving…' : 'Save progress'}</button>
        <button type="button" className="is-primary" onClick={studio.publish} disabled={!studio.isPublishReady || studio.isSaving || studio.isUploading}><FiSend aria-hidden="true" />Publish listing</button>
      </section>

      <section className="marketplace-studio-rail-card marketplace-studio-tips">
        <h2><FiInfo aria-hidden="true" />Seller checklist</h2>
        <ul><li>Use your own, well-lit product photos.</li><li>Call out defects and signs of wear.</li><li>Keep payment and messages on Zumbarl.</li><li>Meet buyers at a public campus handoff point.</li></ul>
      </section>
    </aside>
  )
}

export default MarketplaceListingRail
