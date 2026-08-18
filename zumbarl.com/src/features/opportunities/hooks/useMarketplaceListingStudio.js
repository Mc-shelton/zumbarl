import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getMarketplaceItemPath } from '../../../data/marketplace'
import { uploadZumbarlFile } from '../../../lib/uploadZumbarlFile'
import { createMarketplaceListing, readMarketplaceListing, updateMarketplaceListing } from '../services/marketplaceInteractionService'

const DRAFT_STORAGE_KEY = 'zumbarl.marketplaceListingDraft.v1'

const MARKETPLACE_LISTING_STEPS = [
  { id: 'basics', label: 'Listing basics', meta: 'Type, title & description' },
  { id: 'media', label: 'Media & details', meta: 'Images and specifications' },
  { id: 'pricing', label: 'Price & inventory', meta: 'Offers, price and stock' },
  { id: 'fulfilment', label: 'Fulfilment', meta: 'Delivery, pickup & returns' },
  { id: 'review', label: 'Review & publish', meta: 'Preview your listing' },
]

const DEFAULT_FORM = {
  kind: 'product',
  title: '',
  subtitle: '',
  category: 'Electronics',
  condition: 'Like New',
  description: '',
  gallery: [],
  brand: '',
  model: '',
  color: '',
  included: '',
  variantsText: '',
  priceAmount: '',
  currency: 'KES',
  stock: 1,
  negotiable: true,
  minimumOffer: '',
  deliveryOptions: ['Campus pickup'],
  deliveryZones: [],
  locationLabel: '',
  latitude: '',
  longitude: '',
  pickupInstructions: '',
  returnPolicy: '',
  status: 'DRAFT',
}

function readLocalDraft() {
  if (typeof window === 'undefined') return DEFAULT_FORM
  try {
    const value = JSON.parse(window.localStorage.getItem(DRAFT_STORAGE_KEY))
    return value && typeof value === 'object' ? { ...DEFAULT_FORM, ...value } : DEFAULT_FORM
  } catch {
    return DEFAULT_FORM
  }
}

function mapListingToForm(listing) {
  return {
    ...DEFAULT_FORM,
    ...listing,
    kind: String(listing.listingType || listing.kind || 'PRODUCT').toLowerCase() === 'service' ? 'service' : 'product',
    gallery: listing.gallery || listing.images || [],
    deliveryZones: Array.isArray(listing.deliveryZones) ? listing.deliveryZones : [],
    variantsText: (listing.variants || []).join(', '),
    priceAmount: listing.priceAmount ?? '',
    stock: listing.stock ?? listing.stockCount ?? 1,
    minimumOffer: listing.minimumOffer ?? '',
    status: String(listing.status || 'DRAFT').toUpperCase() === 'PUBLISHED' ? 'ACTIVE' : String(listing.status || 'DRAFT').toUpperCase(),
  }
}

function getStepErrors(step, form) {
  const errors = []
  if (step === 1) {
    if (form.title.trim().length < 5) errors.push('Use a title with at least 5 characters.')
    if (form.description.trim().length < 30) errors.push('Describe the item in at least 30 characters.')
    if (!form.category) errors.push('Choose a category.')
  }
  if (step === 2 && !form.gallery.length) errors.push('Add at least one product image.')
  if (step === 3) {
    if (!(Number(form.priceAmount) > 0)) errors.push('Set a price greater than zero.')
    if (!(Number(form.stock) >= 0)) errors.push('Stock cannot be negative.')
    if (form.negotiable && form.minimumOffer && Number(form.minimumOffer) > Number(form.priceAmount)) {
      errors.push('The minimum offer cannot exceed the listed price.')
    }
  }
  if (step === 4) {
    if (!form.deliveryOptions.length) errors.push('Choose at least one fulfilment option.')
    if (!form.locationLabel.trim()) errors.push('Add a pickup or service location.')
    if (!Number.isFinite(Number(form.latitude)) || !Number.isFinite(Number(form.longitude)) || form.latitude === '' || form.longitude === '') errors.push('Use your current location so delivery distance can be calculated.')
    if (form.deliveryOptions.includes('Seller delivery') && !form.deliveryZones.length) errors.push('Add at least one delivery area and price.')
  }
  return errors
}

function getReadinessChecks(form) {
  return [
    { id: 'basics', label: 'Clear title and description', complete: getStepErrors(1, form).length === 0, step: 1 },
    { id: 'media', label: 'At least one product image', complete: getStepErrors(2, form).length === 0, step: 2 },
    { id: 'price', label: 'Price and stock are ready', complete: getStepErrors(3, form).length === 0, step: 3 },
    { id: 'fulfilment', label: 'Buyer handoff is explained', complete: getStepErrors(4, form).length === 0, step: 4 },
  ]
}

function toPayload(form, status) {
  return {
    title: form.title.trim(),
    subtitle: form.subtitle.trim(),
    description: form.description.trim(),
    kind: form.kind,
    category: form.category,
    condition: form.condition,
    brand: form.brand.trim(),
    model: form.model.trim(),
    color: form.color.trim(),
    included: form.included.trim(),
    gallery: form.gallery,
    variants: form.variantsText.split(',').map((item) => item.trim()).filter(Boolean),
    priceAmount: Number(form.priceAmount) || 0,
    currency: form.currency,
    stock: Number(form.stock) || 0,
    negotiable: Boolean(form.negotiable),
    minimumOffer: form.minimumOffer === '' ? undefined : Number(form.minimumOffer),
    deliveryOptions: form.deliveryOptions,
    deliveryZones: form.deliveryZones.map((zone) => ({ location: zone.location.trim(), fee: Number(zone.fee) || 0 })).filter((zone) => zone.location),
    locationLabel: form.locationLabel.trim(),
    latitude: Number(form.latitude),
    longitude: Number(form.longitude),
    pickupInstructions: form.pickupInstructions.trim(),
    returnPolicy: form.returnPolicy.trim(),
    status,
  }
}

function useMarketplaceListingStudio() {
  const { listingId = '' } = useParams()
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(1)
  const [form, setForm] = useState(() => listingId ? DEFAULT_FORM : readLocalDraft())
  const [savedListingId, setSavedListingId] = useState(listingId)
  const [isLoading, setIsLoading] = useState(Boolean(listingId))
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    if (!listingId) return undefined
    let cancelled = false
    readMarketplaceListing(listingId)
      .then((response) => {
        if (cancelled) return
        setForm(mapListingToForm(response.listing))
        setSavedListingId(response.listing.id)
        setIsLoading(false)
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError.message)
          setIsLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [listingId])

  useEffect(() => {
    if (savedListingId || typeof window === 'undefined') return
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(form))
  }, [form, savedListingId])

  useEffect(() => {
    const warnBeforeUnload = (event) => {
      if (!isDirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeUnload)
    return () => window.removeEventListener('beforeunload', warnBeforeUnload)
  }, [isDirty])

  const readinessChecks = useMemo(() => getReadinessChecks(form), [form])
  const readinessScore = Math.round((readinessChecks.filter((check) => check.complete).length / readinessChecks.length) * 100)
  const isPublishReady = readinessChecks.every((check) => check.complete)

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setIsDirty(true)
    setError('')
    setNotice('')
  }

  function toggleDeliveryOption(option) {
    updateField('deliveryOptions', form.deliveryOptions.includes(option)
      ? form.deliveryOptions.filter((item) => item !== option)
      : [...form.deliveryOptions, option])
  }

  async function uploadImages(files) {
    const remainingSlots = Math.max(0, 8 - form.gallery.length)
    const nextFiles = Array.from(files || []).slice(0, remainingSlots)
    if (!nextFiles.length) return
    setIsUploading(true)
    setError('')
    try {
      const uploads = await Promise.all(nextFiles.map((file) => uploadZumbarlFile(file, {
        scope: 'marketplace',
        metadata: { listingId: savedListingId || null, purpose: 'listing-gallery' },
      })))
      updateField('gallery', [...form.gallery, ...uploads.map((upload) => upload.url || upload.previewUrl).filter(Boolean)])
    } catch (requestError) {
      setError(requestError.message || 'Could not upload those images.')
    } finally {
      setIsUploading(false)
    }
  }

  function addImageUrl(value) {
    const url = value.trim()
    if (!url || form.gallery.includes(url) || form.gallery.length >= 8) return false
    updateField('gallery', [...form.gallery, url])
    return true
  }

  function removeImage(index) {
    updateField('gallery', form.gallery.filter((_, itemIndex) => itemIndex !== index))
  }

  function setCoverImage(index) {
    if (index <= 0 || index >= form.gallery.length) return
    const selected = form.gallery[index]
    updateField('gallery', [selected, ...form.gallery.filter((_, itemIndex) => itemIndex !== index)])
    setNotice('Cover image updated. It will appear first in marketplace results.')
  }

  function goToStep(step) {
    setActiveStep(Math.min(Math.max(step, 1), MARKETPLACE_LISTING_STEPS.length))
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function continueToNextStep() {
    const errors = getStepErrors(activeStep, form)
    if (errors.length) {
      setError(errors[0])
      return
    }
    goToStep(activeStep + 1)
  }

  async function persist(status) {
    if (form.title.trim().length < 2) {
      goToStep(1)
      setError('Add a title before saving this listing.')
      return null
    }
    setIsSaving(true)
    setError('')
    setNotice('')
    try {
      const payload = toPayload(form, status)
      const listing = savedListingId
        ? await updateMarketplaceListing(savedListingId, payload)
        : await createMarketplaceListing(payload)
      setSavedListingId(listing.id)
      setForm(mapListingToForm(listing))
      setIsDirty(false)
      window.localStorage.removeItem(DRAFT_STORAGE_KEY)
      return listing
    } catch (requestError) {
      setError(requestError.message || 'Could not save this listing.')
      return null
    } finally {
      setIsSaving(false)
    }
  }

  async function saveProgress() {
    const status = savedListingId && form.status !== 'DRAFT' ? form.status : 'DRAFT'
    const listing = await persist(status)
    if (!listing) return
    setNotice(status === 'DRAFT' ? 'Draft saved. Only you can see it.' : 'Changes saved to your live listing.')
    if (!listingId) navigate(`/campus/marketplace/listings/${listing.id}/edit`, { replace: true })
  }

  async function publish() {
    if (!isPublishReady) {
      const firstMissing = readinessChecks.find((check) => !check.complete)
      if (firstMissing) goToStep(firstMissing.step)
      setError('Complete the highlighted listing requirements before publishing.')
      return
    }
    const listing = await persist('ACTIVE')
    if (listing) navigate(getMarketplaceItemPath(listing.id))
  }

  function cancel() {
    if (isDirty && !window.confirm('Leave the listing studio? Your unsaved changes will be lost.')) return
    navigate(savedListingId ? getMarketplaceItemPath(savedListingId) : '/campus/profile?tab=shop')
  }

  return {
    activeStep,
    activeStepMeta: MARKETPLACE_LISTING_STEPS[activeStep - 1],
    addImageUrl,
    cancel,
    continueToNextStep,
    error,
    form,
    goBack: () => goToStep(activeStep - 1),
    goToStep,
    isEdit: Boolean(savedListingId),
    isFirstStep: activeStep === 1,
    isFinalStep: activeStep === MARKETPLACE_LISTING_STEPS.length,
    isLoading,
    isPublishReady,
    isSaving,
    isUploading,
    notice,
    publish,
    readinessChecks,
    readinessScore,
    removeImage,
    saveProgress,
    setCoverImage,
    steps: MARKETPLACE_LISTING_STEPS,
    toggleDeliveryOption,
    updateField,
    uploadImages,
  }
}

export { MARKETPLACE_LISTING_STEPS }
export default useMarketplaceListingStudio
