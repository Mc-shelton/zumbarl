import { useEffect, useRef, useState } from 'react'
import { FiCheck, FiMapPin, FiSearch, FiUploadCloud, FiX } from 'react-icons/fi'
import { uploadZumbarlFile } from '../../../lib/uploadZumbarlFile'
import { searchMarketplaceLocations } from '../../opportunities/services/marketplaceInteractionService'

const CATEGORIES = ['General', 'Electronics', 'Books & Notes', 'Fashion', 'Furniture', 'Digital Services', 'Food', 'Other']

function ProfileShopEditor({ onClose, onSave, shop }) {
  const [form, setForm] = useState(() => ({
    name: shop?.name || '', category: shop?.category || 'General', tagline: shop?.tagline || '', description: shop?.description || '',
    logoUrl: shop?.logoUrl || '', coverImageUrl: shop?.coverImageUrl || '', locationLabel: shop?.locationLabel || shop?.campus || '',
    latitude: shop?.latitude ?? '', longitude: shop?.longitude ?? '',
  }))
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [locationResults, setLocationResults] = useState([])
  const [isSearchingLocation, setIsSearchingLocation] = useState(false)
  const [isLocationSelected, setIsLocationSelected] = useState(Boolean(shop?.latitude != null && shop?.longitude != null))
  const searchRequestRef = useRef(0)
  const [uploadingField, setUploadingField] = useState('')
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  async function uploadImage(field, file) {
    if (!file) return
    setUploadingField(field); setError('')
    try { const result = await uploadZumbarlFile(file, { scope: 'marketplace', metadata: { shopId: shop?.id, purpose: field } }); update(field, result.url || result.previewUrl) }
    catch (uploadError) { setError(uploadError.message || 'Could not upload the image.') }
    finally { setUploadingField('') }
  }

  useEffect(() => {
    const query = form.locationLabel.trim()
    if (isLocationSelected || query.length < 3) { setLocationResults([]); setIsSearchingLocation(false); return undefined }
    const requestId = ++searchRequestRef.current
    setIsSearchingLocation(true)
    const timer = window.setTimeout(() => {
      searchMarketplaceLocations(query)
        .then((response) => { if (requestId === searchRequestRef.current) setLocationResults(response.results || []) })
        .catch(() => { if (requestId === searchRequestRef.current) setLocationResults([]) })
        .finally(() => { if (requestId === searchRequestRef.current) setIsSearchingLocation(false) })
    }, 450)
    return () => window.clearTimeout(timer)
  }, [form.locationLabel, isLocationSelected])

  function changeLocationQuery(value) {
    setForm((current) => ({ ...current, locationLabel: value, latitude: '', longitude: '' }))
    setIsLocationSelected(false)
    setError('')
  }

  function selectLocation(result) {
    setForm((current) => ({ ...current, locationLabel: result.label, latitude: result.latitude, longitude: result.longitude }))
    setIsLocationSelected(true)
    setLocationResults([])
  }

  async function submit(event) {
    event.preventDefault(); setError('')
    if (!isLocationSelected || form.latitude === '' || form.longitude === '') { setError('Select a location from the search results before saving.'); return }
    setIsSaving(true)
    try { await onSave({ ...form, latitude: Number(form.latitude), longitude: Number(form.longitude) }) }
    catch (saveError) { setError(saveError.message || 'Could not update the shop.'); setIsSaving(false) }
  }

  return <div className="profile-shop-editor-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="profile-shop-editor" role="dialog" aria-modal="true" aria-labelledby="shop-editor-title">
      <header><div><span>Seller workspace</span><h2 id="shop-editor-title">Edit shop</h2><p>Keep your storefront identity and fulfilment location accurate.</p></div><button type="button" aria-label="Close shop editor" onClick={onClose}><FiX /></button></header>
      <form onSubmit={submit}>
        <div className="profile-shop-editor-images">
          <label className="is-cover" style={form.coverImageUrl ? { backgroundImage: `url(${form.coverImageUrl})` } : undefined}><FiUploadCloud /><span>{uploadingField === 'coverImageUrl' ? 'Uploading…' : 'Upload shop cover'}</span><input type="file" accept="image/*" onChange={(event) => uploadImage('coverImageUrl', event.target.files?.[0])} /></label>
          <label className="is-logo">{form.logoUrl ? <img src={form.logoUrl} alt="Shop thumbnail preview" /> : <FiUploadCloud />}<span>{uploadingField === 'logoUrl' ? 'Uploading…' : 'Shop thumbnail'}</span><input type="file" accept="image/*" onChange={(event) => uploadImage('logoUrl', event.target.files?.[0])} /></label>
        </div>
        <div className="profile-shop-editor-grid">
          <label>Shop name<input required minLength="2" value={form.name} onChange={(event) => update('name', event.target.value)} /></label>
          <label>Category<select value={form.category} onChange={(event) => update('category', event.target.value)}>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
          <label className="is-wide">Tagline<input maxLength="120" value={form.tagline} onChange={(event) => update('tagline', event.target.value)} placeholder="A short promise to your customers" /></label>
          <label className="is-wide">About your shop<textarea rows="4" value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="What do you sell and what makes your shop different?" /></label>
          <div className="is-wide profile-shop-location-search">
            <label>Shop base location</label>
            <div className={`profile-shop-location-input${isLocationSelected ? ' is-selected' : ''}`}><FiSearch /><input required role="combobox" aria-autocomplete="list" aria-expanded={Boolean(locationResults.length)} value={form.locationLabel} onChange={(event) => changeLocationQuery(event.target.value)} placeholder="Search a campus, building, estate or town" />{isSearchingLocation ? <span>Searching…</span> : isLocationSelected ? <FiCheck className="profile-shop-location-check" /> : null}</div>
            {locationResults.length ? <div className="profile-shop-location-results" role="listbox">{locationResults.map((result) => <button key={result.id} type="button" role="option" onClick={() => selectLocation(result)}><FiMapPin /><span><strong>{result.label.split(',')[0]}</strong><small>{result.label}</small></span></button>)}</div> : null}
            {!isLocationSelected && form.locationLabel.trim().length >= 3 && !isSearchingLocation && !locationResults.length ? <small>No matching Kenyan locations found. Try a nearby landmark or town.</small> : <small>{isLocationSelected ? 'Verified location selected. Its coordinates will be used for road-distance quotes.' : 'Choose a result so the shop receives accurate coordinates.'}</small>}
          </div>
        </div>
        {error ? <p className="profile-shop-editor-error" role="alert">{error}</p> : null}
        <footer><button type="button" onClick={onClose}>Cancel</button><button type="submit" disabled={isSaving || Boolean(uploadingField)}>{isSaving ? 'Saving…' : 'Save shop'}</button></footer>
      </form>
    </section>
  </div>
}

export default ProfileShopEditor
