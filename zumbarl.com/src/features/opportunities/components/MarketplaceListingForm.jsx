import { useState } from 'react'
import { FiArrowLeft, FiArrowRight, FiBox, FiCheck, FiImage, FiMapPin, FiPackage, FiSave, FiSend, FiTool, FiTruck, FiUploadCloud, FiX } from 'react-icons/fi'

const CATEGORIES = ['Electronics', 'Books & Notes', 'Furniture', 'Fashion', 'Sports', 'Services', 'Other']
const CONDITIONS = ['New', 'Like New', 'Used - Like New', 'Used - Good', 'Used - Fair']
const DELIVERY_OPTIONS = [
  { id: 'Campus pickup', label: 'Campus pickup', copy: 'Meet at a safe, agreed campus location.', Icon: FiMapPin },
  { id: 'Seller delivery', label: 'Seller delivery', copy: 'You deliver the item to the buyer.', Icon: FiTruck },
  { id: 'Digital delivery', label: 'Digital delivery', copy: 'Send files or access details through Zumbarl.', Icon: FiSend },
]

function ListingBasicsStep({ form, updateField }) {
  return (
    <section className="marketplace-studio-step-panel">
      <header><span>01</span><div><h2>Tell buyers what you’re offering</h2><p>Start with the information people use to decide whether to open a listing.</p></div></header>
      <div className="marketplace-studio-type-grid">
        {[{ id: 'product', label: 'Physical or digital product', copy: 'An item with inventory, condition and a handoff.', Icon: FiPackage }, { id: 'service', label: 'Service', copy: 'A skill, booking or outcome you deliver.', Icon: FiTool }].map(({ id, label, copy, Icon }) => (
          <button key={id} type="button" className={form.kind === id ? 'is-selected' : ''} onClick={() => updateField('kind', id)}><Icon aria-hidden="true" /><span><strong>{label}</strong><small>{copy}</small></span>{form.kind === id ? <FiCheck aria-hidden="true" /> : null}</button>
        ))}
      </div>
      <div className="marketplace-studio-form-grid">
        <label className="is-wide">Listing title<span><input value={form.title} onChange={(event) => updateField('title', event.target.value)} placeholder="e.g. MacBook Air M1, 256GB" maxLength="80" /><small>{form.title.length}/80</small></span></label>
        <label className="is-wide">Short selling line<span><input value={form.subtitle} onChange={(event) => updateField('subtitle', event.target.value)} placeholder="One sentence that makes the value clear" maxLength="120" /><small>{form.subtitle.length}/120</small></span></label>
        <label>Category<select value={form.category} onChange={(event) => updateField('category', event.target.value)}>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
        <label>Condition<select value={form.condition} onChange={(event) => updateField('condition', event.target.value)}>{CONDITIONS.map((condition) => <option key={condition}>{condition}</option>)}</select></label>
        <label className="is-wide">Full description<textarea rows="7" value={form.description} onChange={(event) => updateField('description', event.target.value)} placeholder="Describe condition, age, defects, what is included, and why you’re selling…" /><small>{form.description.trim().length} characters · aim for at least 30</small></label>
      </div>
    </section>
  )
}

function ListingMediaStep({ addImageUrl, form, isUploading, removeImage, setCoverImage, updateField, uploadImages }) {
  const [imageUrl, setImageUrl] = useState('')

  function handleAddUrl() {
    if (addImageUrl(imageUrl)) setImageUrl('')
  }

  return (
    <section className="marketplace-studio-step-panel">
      <header><span>02</span><div><h2>Show the product clearly</h2><p>Add up to eight images, then capture the details buyers usually ask about.</p></div></header>
      <label className="marketplace-studio-upload-zone">
        <FiUploadCloud aria-hidden="true" />
        <strong>{isUploading ? 'Uploading images…' : 'Choose product images'}</strong>
        <span>PNG, JPG or WEBP · up to 8 gallery images</span>
        <input type="file" accept="image/*" multiple disabled={isUploading || form.gallery.length >= 8} onChange={(event) => uploadImages(event.target.files)} />
      </label>
      <div className="marketplace-studio-url-row"><input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="Or paste an image URL" /><button type="button" onClick={handleAddUrl}>Add image</button></div>
      {form.gallery.length ? (
        <div className="marketplace-studio-gallery">
          {form.gallery.map((image, index) => <article key={`${image}-${index}`} className={index === 0 ? 'is-cover' : ''}><img src={image} alt={`Listing preview ${index + 1}`} /><button type="button" className="marketplace-studio-cover-action" disabled={index === 0} onClick={() => setCoverImage(index)}>{index === 0 ? 'Cover' : 'Set as cover'}</button><button type="button" className="marketplace-studio-remove-image" aria-label={`Remove image ${index + 1}`} onClick={() => removeImage(index)}><FiX aria-hidden="true" /></button></article>)}
        </div>
      ) : <div className="marketplace-studio-empty-media"><FiImage aria-hidden="true" /><p>Your cover image and gallery will appear here.</p></div>}
      <div className="marketplace-studio-form-grid">
        <label>Brand<input value={form.brand} onChange={(event) => updateField('brand', event.target.value)} placeholder="Apple, Nike, IKEA…" /></label>
        <label>Model or edition<input value={form.model} onChange={(event) => updateField('model', event.target.value)} placeholder="M1 2020, Air Force 1…" /></label>
        <label>Colour<input value={form.color} onChange={(event) => updateField('color', event.target.value)} placeholder="Space Grey" /></label>
        <label>What’s included<input value={form.included} onChange={(event) => updateField('included', event.target.value)} placeholder="Charger, box, receipt…" /></label>
      </div>
    </section>
  )
}

function ListingPricingStep({ form, updateField }) {
  return (
    <section className="marketplace-studio-step-panel">
      <header><span>03</span><div><h2>Set price and availability</h2><p>Control how the listing is priced, negotiated and taken out of stock.</p></div></header>
      <div className="marketplace-studio-price-card">
        <label>Price<span><b>KSh</b><input type="number" min="0" step="1" value={form.priceAmount} onChange={(event) => updateField('priceAmount', event.target.value)} placeholder="0" /></span></label>
        <label>{form.kind === 'service' ? 'Available slots' : 'Units in stock'}<input type="number" min="0" step="1" value={form.stock} onChange={(event) => updateField('stock', event.target.value)} /></label>
      </div>
      <article className="marketplace-studio-toggle-row"><div><strong>Allow buyers to make offers</strong><p>Buyers can propose another price; you still decide whether to accept.</p></div><button type="button" role="switch" aria-checked={form.negotiable} className={form.negotiable ? 'is-on' : ''} onClick={() => updateField('negotiable', !form.negotiable)}><span /></button></article>
      {form.negotiable ? <label className="marketplace-studio-minimum-offer">Minimum offer you want to consider <span><b>KSh</b><input type="number" min="0" step="1" value={form.minimumOffer} onChange={(event) => updateField('minimumOffer', event.target.value)} placeholder="Optional" /></span><small>Buyers will not see this threshold.</small></label> : null}
      <label className="marketplace-studio-variants">Variants or options<input value={form.variantsText} onChange={(event) => updateField('variantsText', event.target.value)} placeholder="e.g. Small, Medium, Large or Black, Blue" /><small>Separate options with commas.</small></label>
      <div className="marketplace-studio-pricing-note"><FiBox aria-hidden="true" /><p><strong>Inventory stays under your control.</strong> Pause a listing at any time, mark it reserved while agreeing a handoff, or mark it sold when the transaction completes.</p></div>
    </section>
  )
}

function ListingFulfilmentStep({ form, toggleDeliveryOption, updateField }) {
  const [locationError, setLocationError] = useState('')
  const [isLocating, setIsLocating] = useState(false)

  async function useCurrentLocation() {
    setLocationError('')
    setIsLocating(true)
    try {
      if (!navigator.geolocation) throw new Error('Location is not supported by this browser.')
      const position = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }))
      updateField('latitude', position.coords.latitude)
      updateField('longitude', position.coords.longitude)
    } catch (error) {
      setLocationError(error.code === 1 ? 'Location permission was denied. Allow it in your browser settings to publish this listing.' : (error.message || 'Could not get your location. Please try again.'))
    } finally {
      setIsLocating(false)
    }
  }

  function addDeliveryZone() {
    updateField('deliveryZones', [...form.deliveryZones, { location: '', fee: '' }])
  }

  function updateDeliveryZone(index, field, value) {
    updateField('deliveryZones', form.deliveryZones.map((zone, zoneIndex) => zoneIndex === index ? { ...zone, [field]: value } : zone))
  }

  function removeDeliveryZone(index) {
    updateField('deliveryZones', form.deliveryZones.filter((_, zoneIndex) => zoneIndex !== index))
  }

  return (
    <section className="marketplace-studio-step-panel">
      <header><span>04</span><div><h2>Plan a safe handoff</h2><p>Tell buyers where and how delivery happens before they contact you.</p></div></header>
      <div className="marketplace-studio-delivery-grid">
        {DELIVERY_OPTIONS.map(({ id, label, copy, Icon }) => {
          const selected = form.deliveryOptions.includes(id)
          return <button key={id} type="button" className={selected ? 'is-selected' : ''} onClick={() => toggleDeliveryOption(id)}><Icon aria-hidden="true" /><span><strong>{label}</strong><small>{copy}</small></span><i>{selected ? <FiCheck aria-hidden="true" /> : null}</i></button>
        })}
      </div>
      {form.deliveryOptions.includes('Seller delivery') ? (
        <section className="marketplace-studio-delivery-zones">
          <header><div><strong>Delivery areas and prices</strong><p>Buyers choose one of these options for this item at checkout.</p></div><button type="button" onClick={addDeliveryZone}>Add area</button></header>
          {form.deliveryZones.length ? form.deliveryZones.map((zone, index) => (
            <div key={index}>
              <label>Area or destination<input value={zone.location} onChange={(event) => updateDeliveryZone(index, 'location', event.target.value)} placeholder="e.g. Ruiru town" /></label>
              <label>Delivery price<span><b>KSh</b><input type="number" min="0" step="1" value={zone.fee} onChange={(event) => updateDeliveryZone(index, 'fee', event.target.value)} placeholder="0" /></span></label>
              <button type="button" aria-label={`Remove delivery area ${index + 1}`} onClick={() => removeDeliveryZone(index)}><FiX aria-hidden="true" /></button>
            </div>
          )) : <p className="marketplace-studio-delivery-empty">Add every place you can deliver to and the exact price for each.</p>}
        </section>
      ) : null}
      <div className="marketplace-studio-form-grid">
        <label className="is-wide">Seller base location (required)<input required value={form.locationLabel} onChange={(event) => updateField('locationLabel', event.target.value)} placeholder="e.g. Zetech University, Ruiru campus" /><small>Use a recognizable area name; your exact coordinates are used only to calculate delivery distance.</small></label>
        <div className="is-wide">
          <button type="button" className="marketplace-soft-btn" disabled={isLocating} onClick={useCurrentLocation}><FiMapPin aria-hidden="true" /> {isLocating ? 'Getting location…' : (form.latitude !== '' && form.longitude !== '' ? 'Location captured · Update' : 'Use my current location')}</button>
          {form.latitude !== '' && form.longitude !== '' ? <small role="status">Location captured successfully. Buyers will not enter the distance themselves.</small> : null}
          {locationError ? <small role="alert">{locationError}</small> : null}
        </div>
        <label className="is-wide">Pickup or delivery instructions<textarea rows="4" value={form.pickupInstructions} onChange={(event) => updateField('pickupInstructions', event.target.value)} placeholder="Preferred meeting point, available times, delivery radius…" /></label>
        <label className="is-wide">Returns or cancellation policy<textarea rows="4" value={form.returnPolicy} onChange={(event) => updateField('returnPolicy', event.target.value)} placeholder="Explain when returns, refunds or booking changes are accepted…" /></label>
      </div>
      <div className="marketplace-studio-safety"><FiMapPin aria-hidden="true" /><div><strong>Keep campus handoffs safe</strong><p>Use a public, approved pickup point. Buyers should inspect physical items before confirming delivery.</p></div></div>
    </section>
  )
}

function ListingReviewStep({ form, goToStep }) {
  const cover = form.gallery[0] || '/assets/index/business_page_images/optimized/product-school-XZkk5xT8Xrk-unsplash.webp'
  return (
    <section className="marketplace-studio-step-panel marketplace-studio-review">
      <header><span>05</span><div><h2>Review your listing</h2><p>Check the buyer-facing preview and the operational details before publishing.</p></div></header>
      <article className="marketplace-studio-review-preview"><img src={cover} alt="Listing cover preview" /><div><span>{form.category} · {form.condition}</span><h3>{form.title || 'Your listing title'}</h3><p>{form.subtitle || form.description || 'Your listing description will appear here.'}</p><strong>{new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(Number(form.priceAmount) || 0)}</strong><small>{form.stock} {form.kind === 'service' ? 'slots available' : 'in stock'} · {form.locationLabel || 'Location not set'}</small></div></article>
      <div className="marketplace-studio-review-sections">
        <article><header><h3>Listing information</h3><button type="button" onClick={() => goToStep(1)}>Edit</button></header><dl><div><dt>Type</dt><dd>{form.kind}</dd></div><div><dt>Category</dt><dd>{form.category}</dd></div><div><dt>Condition</dt><dd>{form.condition}</dd></div><div><dt>Description</dt><dd>{form.description || 'Not provided'}</dd></div></dl></article>
        <article><header><h3>Media and specifications</h3><button type="button" onClick={() => goToStep(2)}>Edit</button></header><dl><div><dt>Images</dt><dd>{form.gallery.length}</dd></div><div><dt>Brand</dt><dd>{form.brand || 'Not specified'}</dd></div><div><dt>Model</dt><dd>{form.model || 'Not specified'}</dd></div><div><dt>Included</dt><dd>{form.included || 'Item only'}</dd></div></dl></article>
        <article><header><h3>Sale settings</h3><button type="button" onClick={() => goToStep(3)}>Edit</button></header><dl><div><dt>Offers</dt><dd>{form.negotiable ? 'Accepted' : 'Fixed price'}</dd></div><div><dt>Stock</dt><dd>{form.stock}</dd></div><div><dt>Options</dt><dd>{form.variantsText || 'None'}</dd></div></dl></article>
        <article><header><h3>Fulfilment</h3><button type="button" onClick={() => goToStep(4)}>Edit</button></header><dl><div><dt>Methods</dt><dd>{form.deliveryOptions.join(', ') || 'Not selected'}</dd></div><div><dt>Delivery areas</dt><dd>{form.deliveryZones.map((zone) => `${zone.location} (KSh ${zone.fee || 0})`).join(', ') || 'Pickup only'}</dd></div><div><dt>Location</dt><dd>{form.locationLabel || 'Not provided'}</dd></div><div><dt>Returns</dt><dd>{form.returnPolicy || 'Discuss with buyer'}</dd></div></dl></article>
      </div>
    </section>
  )
}

function MarketplaceListingForm({ studio }) {
  const stepProps = { ...studio, updateField: studio.updateField }
  let content = <ListingBasicsStep {...stepProps} />
  if (studio.activeStep === 2) content = <ListingMediaStep {...stepProps} />
  if (studio.activeStep === 3) content = <ListingPricingStep {...stepProps} />
  if (studio.activeStep === 4) content = <ListingFulfilmentStep {...stepProps} />
  if (studio.activeStep === 5) content = <ListingReviewStep {...stepProps} />

  return (
    <section className="marketplace-studio-form-card">
      {content}
      {studio.error ? <p className="marketplace-studio-message is-error" role="alert">{studio.error}</p> : null}
      {studio.notice ? <p className="marketplace-studio-message is-success" role="status">{studio.notice}</p> : null}
      <footer className="marketplace-studio-form-footer">
        <button type="button" className="is-cancel" onClick={studio.cancel}><FiX aria-hidden="true" />Cancel</button>
        <div>
          {!studio.isFirstStep ? <button type="button" onClick={studio.goBack}><FiArrowLeft aria-hidden="true" />Back</button> : null}
          <button type="button" onClick={studio.saveProgress} disabled={studio.isSaving || studio.isUploading}><FiSave aria-hidden="true" />{studio.isSaving ? 'Saving…' : 'Save progress'}</button>
          {studio.isFinalStep ? <button type="button" className="is-primary" onClick={studio.publish} disabled={!studio.isPublishReady || studio.isSaving || studio.isUploading}><FiSend aria-hidden="true" />{studio.isEdit ? 'Publish changes' : 'Publish listing'}</button> : <button type="button" className="is-primary" onClick={studio.continueToNextStep}>Save & Continue<FiArrowRight aria-hidden="true" /></button>}
        </div>
      </footer>
    </section>
  )
}

export default MarketplaceListingForm
