import { useEffect, useMemo, useRef, useState } from 'react'
import { FiImage, FiSearch, FiShoppingBag, FiUploadCloud, FiX } from 'react-icons/fi'
import { useDialog } from '../../../components/ui'
import { uploadZumbarlFile } from '../../../lib/uploadZumbarlFile'
import { normalizeZumbarlFileUrl } from '../../../lib/normalizeZumbarlFileUrl'
import { readMyMarketplaceInventory } from '../../opportunities/services/marketplaceInteractionService'

const FALLBACK_MEDIA = {
  personal: '/assets/index/business_page_images/optimized/justin-buisson-vIluu0IH6Ps-unsplash.webp',
  product: '/assets/index/business_page_images/optimized/sable-flow-T74mVg__F_k-unsplash.webp',
}

function ExploreStoryComposer({ isOpen, onClose, onPublish }) {
  const dialogRef = useDialog({ isOpen, onClose })
  const [storyKind, setStoryKind] = useState('personal')
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [mediaFile, setMediaFile] = useState(null)
  const [products, setProducts] = useState([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [productQuery, setProductQuery] = useState('')
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [error, setError] = useState('')
  const selectedProduct = useMemo(() => products.find((item) => item.id === selectedProductId) || null, [products, selectedProductId])
  const visibleProducts = useMemo(() => {
    const query = productQuery.trim().toLowerCase()
    if (!query) return products
    return products.filter((product) => `${product.title || ''} ${product.category || ''} ${product.description || ''} ${product.priceAmount || ''}`.toLowerCase().includes(query))
  }, [productQuery, products])
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState('')
  const previewVideoRef = useRef(null)
  const [videoDuration, setVideoDuration] = useState(0)
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(0)

  useEffect(() => {
    if (!isOpen) return
    setStoryKind('personal'); setTitle(''); setCaption(''); setMediaFile(null); setSelectedProductId(''); setProductQuery(''); setVideoDuration(0); setTrimStart(0); setTrimEnd(0); setError('')
  }, [isOpen])

  useEffect(() => {
    if (!mediaFile) { setMediaPreviewUrl(''); return undefined }
    const url = URL.createObjectURL(mediaFile)
    setMediaPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [mediaFile])

  useEffect(() => {
    if (!isOpen || storyKind !== 'product') return
    setIsLoadingProducts(true)
    readMyMarketplaceInventory()
      .then((response) => setProducts((response?.listings || []).filter((item) => ['ACTIVE', 'PUBLISHED'].includes(String(item.status).toUpperCase()))))
      .catch((requestError) => setError(requestError.message || 'Could not load your products.'))
      .finally(() => setIsLoadingProducts(false))
  }, [isOpen, storyKind])

  if (!isOpen) return null

  async function submitStory(event) {
    event.preventDefault()
    setIsPublishing(true)
    setError('')
    try {
      const upload = mediaFile
        ? await uploadZumbarlFile(mediaFile, { scope: 'connect-story', metadata: { storyKind } })
        : null
      const productImages = (selectedProduct?.images || selectedProduct?.gallery || []).map(normalizeZumbarlFileUrl).filter(Boolean)
      const media = normalizeZumbarlFileUrl(upload?.url || upload?.previewUrl) || productImages[0] || FALLBACK_MEDIA[storyKind]
      const mediaType = mediaFile?.type?.startsWith('video/') ? 'video' : 'image'
      const product = storyKind === 'product'
        ? {
          id: selectedProduct.id,
          listingId: selectedProduct.id,
          name: selectedProduct.title,
          price: new Intl.NumberFormat('en-KE', { style: 'currency', currency: selectedProduct.currency || 'KES', maximumFractionDigits: 0 }).format(Number(selectedProduct.priceAmount || 0)),
          description: selectedProduct.description || selectedProduct.subtitle || '',
          image: media,
          gallery: productImages.length ? productImages : [media],
          specs: [
            { label: 'Category', value: selectedProduct.category || 'Other' },
            { label: 'Condition', value: selectedProduct.condition || 'Not specified' },
            { label: 'Stock', value: String(selectedProduct.stockCount ?? selectedProduct.stock ?? 1) },
            { label: 'Fulfilment', value: selectedProduct.fulfilmentType || selectedProduct.fulfillmentType || 'Campus handoff' },
          ],
        }
        : null

      await onPublish({
        type: mediaType,
        media,
        poster: mediaType === 'video' ? FALLBACK_MEDIA[storyKind] : undefined,
        storyKind,
        title: title.trim() || selectedProduct?.title || 'New story',
        caption: caption.trim() || (storyKind === 'product' ? selectedProduct?.description || 'See product details.' : 'Shared a new story.'),
        time: 'Just now',
        likes: 0,
        comments: 0,
        product,
        trimStart: mediaType === 'video' ? trimStart : undefined,
        trimEnd: mediaType === 'video' ? trimEnd : undefined,
      })
    } catch (requestError) {
      setError(requestError?.message || 'Could not prepare that story.')
    } finally {
      setIsPublishing(false)
    }
  }

  const canPublish = storyKind && (storyKind === 'product' ? selectedProduct : mediaFile) && !isPublishing

  return (
    <section ref={dialogRef} className="explore-story-composer-backdrop" role="dialog" aria-modal="true" aria-label="Add a story" onClick={onClose}>
      <form className="explore-story-composer" onSubmit={submitStory} onClick={(event) => event.stopPropagation()}>
        <header>
          <div><span>Stories disappear after 24 hours</span><h2>Add story</h2></div>
          <button type="button" onClick={onClose} aria-label="Close story composer"><FiX aria-hidden="true" /></button>
        </header>

        <fieldset className="explore-story-kind explore-story-kind-tabs">
          <legend>Story type</legend>
          <button type="button" className={storyKind === 'personal' ? 'is-active' : ''} onClick={() => setStoryKind('personal')}>
            <FiImage aria-hidden="true" /><span><strong>Your story</strong><small>Photo or video</small></span>
          </button>
          <button type="button" className={storyKind === 'product' ? 'is-active' : ''} onClick={() => setStoryKind('product')}>
            <FiShoppingBag aria-hidden="true" /><span><strong>Product story</strong><small>Live marketplace listing</small></span>
          </button>
        </fieldset>

        <div className="explore-story-composer-fields">
            {(mediaPreviewUrl || selectedProduct) ? <div className="explore-story-composer-preview">{mediaFile?.type?.startsWith('video/') ? <video ref={previewVideoRef} src={mediaPreviewUrl} controls muted onLoadedMetadata={(event) => { const duration = event.currentTarget.duration || 0; setVideoDuration(duration); setTrimStart(0); setTrimEnd(Math.min(duration, 30)) }} onTimeUpdate={(event) => { if (trimEnd && event.currentTarget.currentTime >= trimEnd) { event.currentTarget.currentTime = trimStart; event.currentTarget.pause() } }} /> : <img src={mediaPreviewUrl || normalizeZumbarlFileUrl((selectedProduct.images || selectedProduct.gallery || [])[0])} alt="Story preview" />}<span>{storyKind === 'product' ? 'Product story' : 'Your story'}</span></div> : null}
            {mediaFile?.type?.startsWith('video/') && videoDuration ? <section className="explore-story-video-trimmer"><header><strong>Trim video</strong><span>{trimStart.toFixed(1)}s – {trimEnd.toFixed(1)}s · {(trimEnd - trimStart).toFixed(1)}s</span></header><label>Start<input type="range" min="0" max={Math.max(0, videoDuration - .5)} step=".1" value={trimStart} onChange={(event) => { const value = Number(event.target.value); setTrimStart(value); setTrimEnd((current) => Math.min(videoDuration, Math.max(value + .5, Math.min(current, value + 30)))); if (previewVideoRef.current) previewVideoRef.current.currentTime = value }} /></label><label>End<input type="range" min={Math.min(videoDuration, trimStart + .5)} max={Math.min(videoDuration, trimStart + 30)} step=".1" value={trimEnd} onChange={(event) => setTrimEnd(Number(event.target.value))} /></label><button type="button" onClick={() => { if (previewVideoRef.current) { previewVideoRef.current.currentTime = trimStart; previewVideoRef.current.play() } }}>Preview trimmed clip</button><small>Stories can use up to 30 seconds from this video.</small></section> : null}
            <label>
              Story title <small>Optional</small>
              <input value={title} placeholder={storyKind === 'product' ? 'Meet my latest product' : 'What is happening?'} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label>
              Caption <small>Optional</small>
              <textarea value={caption} placeholder="Add a caption…" onChange={(event) => setCaption(event.target.value)} />
            </label>

            {storyKind === 'product' ? (
              <section className="explore-story-product-picker">
                <h3>Select a product</h3>
                {products.length ? <label className="explore-story-product-search"><FiSearch aria-hidden="true" /><input type="search" value={productQuery} onChange={(event) => setProductQuery(event.target.value)} placeholder="Search your products" aria-label="Search your products" />{productQuery ? <button type="button" onClick={() => setProductQuery('')} aria-label="Clear product search"><FiX /></button> : null}</label> : null}
                {isLoadingProducts ? <p>Loading your products…</p> : products.length && visibleProducts.length ? <div>{visibleProducts.map((product) => { const image = normalizeZumbarlFileUrl((product.images || product.gallery || [])[0]); return <button type="button" key={product.id} className={selectedProductId === product.id ? 'is-selected' : ''} onClick={() => setSelectedProductId(product.id)}>{image ? <img src={image} alt="" /> : <FiShoppingBag />}<span><strong>{product.title}</strong><small>{new Intl.NumberFormat('en-KE', { style: 'currency', currency: product.currency || 'KES', maximumFractionDigits: 0 }).format(Number(product.priceAmount || 0))}</small></span></button> })}</div> : products.length ? <p>No products match “{productQuery}”.</p> : <p>You have no live products. Publish a marketplace listing first.</p>}
              </section>
            ) : null}

            <label className="explore-story-upload">
              <FiUploadCloud aria-hidden="true" />
              <span><strong>{mediaFile ? mediaFile.name : storyKind === 'product' ? 'Use a different story cover' : 'Choose photo or video'}</strong><small>{mediaFile ? 'Click to replace it' : storyKind === 'product' ? 'Optional—the product cover is used by default' : 'Required for a normal story'}</small></span>
              <input type="file" accept="image/*,video/*" onChange={(event) => setMediaFile(event.target.files?.[0] || null)} />
            </label>
        </div>

        {error ? <p className="explore-story-composer-error" role="alert">{error}</p> : null}

        <footer>
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={!canPublish}>{isPublishing ? 'Sharing…' : 'Share story'}</button>
        </footer>
      </form>
    </section>
  )
}

export default ExploreStoryComposer
