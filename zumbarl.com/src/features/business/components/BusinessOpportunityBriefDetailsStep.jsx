import { useState } from 'react'
import { FiCheck, FiUploadCloud, FiX } from 'react-icons/fi'
import {
  BUSINESS_OPPORTUNITY_BRIEF_SELECTS,
  BUSINESS_OPPORTUNITY_BRIEF_TYPE_OPTIONS,
} from '../opportunityBriefCreateData'
import {
  BusinessCreateDateField,
  BusinessCreateInputField,
  BusinessCreateSelectField,
  BusinessCreateTextareaField,
} from './BusinessOpportunityCreateFields'

const DEFAULT_SPLASH_CROP = {
  positionX: 50,
  positionY: 50,
  zoom: 1.15,
}

function toFileMetadata(file, previewUrl) {
  return {
    id: `file-${file.name}-${file.lastModified}`,
    name: file.name,
    previewUrl,
    type: file.type || 'application/octet-stream',
    size: file.size,
    lastModified: file.lastModified,
    crop: DEFAULT_SPLASH_CROP,
    cropConfirmed: !file.type?.startsWith('image/'),
  }
}

function formatFileSize(size = 0) {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
  if (size >= 1024) return `${Math.round(size / 1024)} KB`
  return `${size} B`
}

function BusinessOpportunitySplashField({ splash, onUpdateField }) {
  const [fileInputKey, setFileInputKey] = useState(0)
  const selectedSplash = splash?.name ? splash : null
  const isImage = selectedSplash?.type?.startsWith('image/')
  const crop = selectedSplash?.crop || DEFAULT_SPLASH_CROP
  const cropZoom = Number(crop.zoom) || DEFAULT_SPLASH_CROP.zoom
  const maxCropShift = ((cropZoom - 1) / (2 * cropZoom)) * 100
  const translateX = ((50 - Number(crop.positionX || 50)) / 50) * maxCropShift
  const translateY = ((50 - Number(crop.positionY || 50)) / 50) * maxCropShift
  const cropConfirmed = selectedSplash?.cropConfirmed === true

  function updateSplashCrop(field, value) {
    if (!selectedSplash) return
    onUpdateField('opportunitySplash', {
      ...selectedSplash,
      crop: {
        ...crop,
        [field]: Number(value),
      },
      cropConfirmed: false,
    })
  }

  function clearSplash() {
    onUpdateField('opportunitySplash', null)
    setFileInputKey((current) => current + 1)
  }

  return (
    <section className="business-create-splash-upload is-wide">
      <header>
        <div>
          <h3>Opportunity Splash</h3>
          <p>Upload a visual preview for opportunity and gig cards. Images must be cropped before they are used.</p>
        </div>
      </header>
      <label className="business-create-upload-card">
        <div>
          <FiUploadCloud aria-hidden="true" />
          <p>
            <strong>Upload splash image or video</strong><br />
            PNG, JPG, WebP, MP4 or MOV.
          </p>
          <b>Browse File</b>
        </div>
        <input
          key={fileInputKey}
          accept="image/*,video/*"
          type="file"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (!file) return
            onUpdateField('opportunitySplash', toFileMetadata(file, URL.createObjectURL(file)))
          }}
        />
      </label>
      {selectedSplash ? (
        <div className="business-create-splash-cropper">
          <div className="business-create-splash-preview" aria-label="Opportunity splash card crop preview">
            {isImage ? (
              <img
                src={selectedSplash.previewUrl}
                alt=""
                style={{
                  objectPosition: `${crop.positionX}% ${crop.positionY}%`,
                  transform: `translate(${translateX}%, ${translateY}%) scale(${cropZoom})`,
                }}
              />
            ) : (
              <video src={selectedSplash.previewUrl} muted playsInline />
            )}
          </div>
          <div className="business-create-splash-controls">
            <em className="business-create-selected-file">
              <span>{selectedSplash.name} · {formatFileSize(selectedSplash.size)}</span>
              <button type="button" aria-label="Remove opportunity splash" onClick={clearSplash}>
                <FiX aria-hidden="true" />
              </button>
            </em>
            {isImage ? (
              <>
                <p className={`business-create-splash-crop-status${cropConfirmed ? ' is-confirmed' : ''}`}>
                  {cropConfirmed ? 'Crop saved for opportunity cards.' : 'Adjust the crop, then save it before publishing.'}
                </p>
                <label>
                  <span>Horizontal crop</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={crop.positionX}
                    onChange={(event) => updateSplashCrop('positionX', event.target.value)}
                  />
                </label>
                <label>
                  <span>Vertical crop</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={crop.positionY}
                    onChange={(event) => updateSplashCrop('positionY', event.target.value)}
                  />
                </label>
                <label>
                  <span>Zoom</span>
                  <input
                    type="range"
                    min="1"
                    max="1.8"
                    step="0.05"
                    value={cropZoom}
                    onChange={(event) => updateSplashCrop('zoom', event.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className={`business-profile-primary-btn${cropConfirmed ? ' is-confirmed' : ''}`}
                  onClick={() => onUpdateField('opportunitySplash', { ...selectedSplash, cropConfirmed: true })}
                >
                  <FiCheck aria-hidden="true" />
                  {cropConfirmed ? 'Crop saved' : 'Use this crop'}
                </button>
              </>
            ) : (
              <p>Video splash selected. It will be fitted to the opportunity card preview area.</p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  )
}

export function BusinessOpportunityBriefDetailsStep({ form, onUpdateField }) {
  return (
    <>
      <div className="business-create-section-head">
        <h2>Basic Information</h2>
        <p>Provide the key details about this opportunity.</p>
      </div>
      <BusinessCreateInputField
        label="Opportunity Title"
        name="title"
        required
        value={form.title}
        onUpdateField={onUpdateField}
      />
      <BusinessCreateSelectField
        label="Category"
        name="category"
        options={BUSINESS_OPPORTUNITY_BRIEF_SELECTS.category}
        required
        value={form.category}
        onUpdateField={onUpdateField}
      />
      <BusinessCreateTextareaField
        helper={`${form.summary.length}/150`}
        isWide
        label="Short Description"
        maxLength={150}
        name="summary"
        required
        value={form.summary}
        onUpdateField={onUpdateField}
      />
      <fieldset className="business-create-type-field">
        <legend>Opportunity Type <b>*</b></legend>
        <div>
          {BUSINESS_OPPORTUNITY_BRIEF_TYPE_OPTIONS.map((option) => (
            <label key={option.id} className={form.opportunityType === option.id ? 'is-active' : ''}>
              <input
                type="radio"
                name="opportunityType"
                checked={form.opportunityType === option.id}
                onChange={() => onUpdateField('opportunityType', option.id)}
              />
              <strong>{option.label}</strong>
              <span>{option.meta}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="business-opportunity-brief-grid-3">
        <BusinessCreateSelectField
          label="Experience Level"
          name="experienceLevel"
          options={BUSINESS_OPPORTUNITY_BRIEF_SELECTS.experienceLevel}
          value={form.experienceLevel}
          onUpdateField={onUpdateField}
        />
        <BusinessCreateSelectField
          label="Engagement Mode"
          name="engagementMode"
          options={BUSINESS_OPPORTUNITY_BRIEF_SELECTS.engagementMode}
          value={form.engagementMode}
          onUpdateField={onUpdateField}
        />
        <BusinessCreateSelectField
          label="Availability"
          name="availability"
          options={BUSINESS_OPPORTUNITY_BRIEF_SELECTS.availability}
          value={form.availability}
          onUpdateField={onUpdateField}
        />
      </div>
      <div className="business-opportunity-brief-grid-2">
        <BusinessCreateSelectField
          label="Estimated Project Duration"
          name="duration"
          options={BUSINESS_OPPORTUNITY_BRIEF_SELECTS.duration}
          required
          value={form.duration}
          onUpdateField={onUpdateField}
        />
        <BusinessCreateDateField
          label="Application Deadline (Optional)"
          name="applicationDeadline"
          required={false}
          value={form.applicationDeadline}
          onUpdateField={onUpdateField}
        />
      </div>
      <BusinessOpportunitySplashField
        splash={form.opportunitySplash}
        onUpdateField={onUpdateField}
      />
      <hr />
      
    </>
  )
}
