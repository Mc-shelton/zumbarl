import { useEffect, useMemo } from 'react'
import { FiTrash2, FiUploadCloud } from 'react-icons/fi'
import { normalizeZumbarlFileUrl } from '../../../lib/normalizeZumbarlFileUrl'
import './knowledge-avatar-picker.css'

function KnowledgeAvatarPicker({
  currentUrl = '',
  disabled = false,
  fallbackUrl = '/assets/knowledge/default-group-avatar.svg',
  file = null,
  onChange,
  onClear,
}) {
  const previewUrl = useMemo(() => file ? URL.createObjectURL(file) : '', [file])
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  const imageUrl = previewUrl || normalizeZumbarlFileUrl(currentUrl) || fallbackUrl

  return (
    <div className="knowledge-avatar-picker">
      <label>
        <img src={imageUrl} alt="Avatar preview" />
        <FiUploadCloud aria-hidden="true" />
        <span>
          <strong>{file ? file.name : 'Choose avatar image'}</strong>
          <small>JPG, PNG or WebP. A default is used if none is selected.</small>
        </span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={disabled}
          onChange={(event) => onChange(event.target.files?.[0] || null)}
        />
      </label>
      {(file || currentUrl) && onClear ? (
        <button type="button" onClick={onClear} disabled={disabled}>
          <FiTrash2 aria-hidden="true" /> Remove
        </button>
      ) : null}
    </div>
  )
}

export default KnowledgeAvatarPicker
