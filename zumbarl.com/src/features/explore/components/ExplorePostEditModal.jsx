import { useEffect, useState } from 'react'
import { FiArrowLeft, FiArrowRight, FiPlus, FiTrash2, FiX } from 'react-icons/fi'
import { ImageCropper } from '../../../components/ui'
import { uploadZumbarlFile } from '../../../lib/uploadZumbarlFile'
import { normalizeZumbarlFileUrl } from '../../../lib/normalizeZumbarlFileUrl'

function ExplorePostEditModal({ post, onClose, onSave }) {
  const [body, setBody] = useState('')
  const [items, setItems] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!post) return
    setBody(post.copy || '')
    setItems((post.gallery || []).map((url, index) => ({
      url,
      previewUrl: url,
      edit: post.mediaEdits?.[index] || {
        type: post.tag === 'Video' ? 'video' : 'image',
        zoom: 1,
        positionX: 50,
        positionY: 50,
      },
    })))
    setActiveIndex(0)
    setError('')
  }, [post])

  if (!post) return null
  const active = items[activeIndex]

  function addFiles(files) {
    const additions = [...files].slice(0, 8 - items.length).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      edit: {
        type: file.type.startsWith('video/') ? 'video' : 'image',
        zoom: 1,
        positionX: 50,
        positionY: 50,
        trimStart: 0,
      },
    }))
    setItems((current) => [...current, ...additions])
    if (additions.length) setActiveIndex(items.length)
  }

  function patchActive(patch) {
    setItems((current) => current.map((item, index) => (
      index === activeIndex ? { ...item, edit: { ...item.edit, ...patch } } : item
    )))
  }

  function remove(index) {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))
    setActiveIndex((current) => Math.max(0, Math.min(current > index ? current - 1 : current, items.length - 2)))
  }

  function move(index, direction) {
    const target = index + direction
    if (target < 0 || target >= items.length) return
    setItems((current) => {
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
    setActiveIndex(target)
  }

  async function submit(event) {
    event.preventDefault()
    if (!body.trim() || isSaving) return
    setIsSaving(true)
    setError('')
    try {
      const mediaUrls = await Promise.all(items.map(async (item) => {
        if (!item.file) return item.url
        const upload = await uploadZumbarlFile(item.file, {
          scope: 'connect-post',
          metadata: { purpose: 'post-edit' },
        })
        return normalizeZumbarlFileUrl(upload.url || upload.previewUrl)
      }))
      await onSave(post.id, {
        body: body.trim(),
        mediaUrls,
        mediaEdits: items.map((item) => item.edit),
      })
      onClose()
    } catch (requestError) {
      setError(requestError.message || 'Could not update your post.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="explore-post-edit-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !isSaving) onClose() }}>
      <form className="explore-post-edit-modal is-comprehensive" onSubmit={submit}>
        <header>
          <div><span>Edit post</span><h2>Update your post</h2></div>
          <button type="button" onClick={onClose} aria-label="Close post editor"><FiX /></button>
        </header>
        <div className="explore-post-edit-body">
          <textarea value={body} onChange={(event) => setBody(event.target.value)} autoFocus />
          {items.length ? (
            <>
              {active?.edit.type === 'video' ? (
                <div className="explore-post-media-stage"><video src={active.previewUrl} controls /></div>
              ) : (
                <ImageCropper
                  className="is-compact"
                  src={active?.previewUrl}
                  value={active?.edit}
                  onChange={patchActive}
                  aspectRatio={4 / 3}
                  aspectLabel="4:3 post · locked"
                  alt="Post image being cropped"
                  maxStageHeight={330}
                />
              )}
              <div className="explore-post-media-thumbs">
                {items.map((item, index) => (
                  <article key={`${item.previewUrl}-${index}`} className={index === activeIndex ? 'is-active' : ''}>
                    <button type="button" className="explore-post-thumb-preview" onClick={() => setActiveIndex(index)}>
                      {item.edit.type === 'video' ? <video src={item.previewUrl} /> : <img src={item.previewUrl} alt="" />}
                      <span>{index + 1}</span>
                    </button>
                    <div>
                      <button type="button" disabled={!index} onClick={() => move(index, -1)} aria-label="Move media left"><FiArrowLeft /></button>
                      <button type="button" onClick={() => remove(index)} aria-label="Remove media"><FiTrash2 /></button>
                      <button type="button" disabled={index === items.length - 1} onClick={() => move(index, 1)} aria-label="Move media right"><FiArrowRight /></button>
                    </div>
                  </article>
                ))}
              </div>
              {active?.edit.type === 'video' ? (
                <div className="explore-post-edit-controls">
                  <label>Start<input type="number" min="0" step=".1" value={active?.edit.trimStart || 0} onChange={(event) => patchActive({ trimStart: Number(event.target.value) })} /></label>
                  <label>End<input type="number" min=".1" step=".1" value={active?.edit.trimEnd || ''} onChange={(event) => patchActive({ trimEnd: event.target.value ? Number(event.target.value) : undefined })} /></label>
                </div>
              ) : null}
            </>
          ) : null}
          {items.length < 8 ? (
            <label className="explore-post-edit-add">
              <FiPlus /> Add more media
              <input type="file" multiple accept="image/*,video/*" onChange={(event) => { addFiles(event.target.files); event.target.value = '' }} />
            </label>
          ) : null}
          {error ? <p role="alert">{error}</p> : null}
        </div>
        <footer>
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={!body.trim() || isSaving}>{isSaving ? 'Saving…' : 'Save changes'}</button>
        </footer>
      </form>
    </div>
  )
}

export default ExplorePostEditModal
