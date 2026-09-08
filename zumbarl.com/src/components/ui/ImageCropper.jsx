import { useMemo, useRef, useState } from 'react'
import './image-cropper.css'

const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value))
}

function numberOr(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function getBaseCrop(imageAspect, cropAspect) {
  if (imageAspect >= cropAspect) {
    return { width: (cropAspect / imageAspect) * 100, height: 100 }
  }
  return { width: 100, height: (imageAspect / cropAspect) * 100 }
}

function cropValueToRect(value, imageAspect, cropAspect, maxZoom) {
  const base = getBaseCrop(imageAspect, cropAspect)
  const zoom = clamp(numberOr(value?.zoom, 1), 1, maxZoom)
  const width = base.width / zoom
  const height = base.height / zoom
  return {
    x: (100 - width) * (clamp(numberOr(value?.positionX, 50), 0, 100) / 100),
    y: (100 - height) * (clamp(numberOr(value?.positionY, 50), 0, 100) / 100),
    width,
    height,
  }
}

function rectToCropValue(rect, imageAspect, cropAspect) {
  const base = getBaseCrop(imageAspect, cropAspect)
  const availableX = 100 - rect.width
  const availableY = 100 - rect.height
  return {
    zoom: Number((base.width / rect.width).toFixed(4)),
    positionX: Number((availableX > 0 ? (rect.x / availableX) * 100 : 50).toFixed(3)),
    positionY: Number((availableY > 0 ? (rect.y / availableY) * 100 : 50).toFixed(3)),
  }
}

function ImageCropper({
  src,
  value,
  onChange,
  aspectRatio = 1,
  aspectLabel = 'Locked aspect ratio',
  alt = '',
  maxZoom = 3,
  maxStageHeight = 420,
  className = '',
  onImageError,
}) {
  const stageRef = useRef(null)
  const gestureRef = useRef(null)
  const [imageSize, setImageSize] = useState(null)
  const imageAspect = imageSize ? imageSize.width / imageSize.height : aspectRatio
  const cropRect = useMemo(
    () => cropValueToRect(value, imageAspect, aspectRatio, maxZoom),
    [aspectRatio, imageAspect, maxZoom, value],
  )

  function emitRect(nextRect) {
    onChange?.(rectToCropValue(nextRect, imageAspect, aspectRatio))
  }

  function startGesture(event, mode, handle = '') {
    if (!stageRef.current) return
    event.preventDefault()
    event.stopPropagation()
    const bounds = stageRef.current.getBoundingClientRect()
    const start = {
      x: (cropRect.x / 100) * bounds.width,
      y: (cropRect.y / 100) * bounds.height,
      width: (cropRect.width / 100) * bounds.width,
      height: (cropRect.height / 100) * bounds.height,
    }
    gestureRef.current = {
      mode,
      handle,
      pointerId: event.pointerId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      bounds,
      start,
    }
    stageRef.current.setPointerCapture(event.pointerId)
  }

  function continueGesture(event) {
    const gesture = gestureRef.current
    if (!gesture || gesture.pointerId !== event.pointerId) return
    event.preventDefault()
    const { bounds, start } = gesture
    const dx = event.clientX - gesture.pointerX
    const dy = event.clientY - gesture.pointerY
    let next = { ...start }

    if (gesture.mode === 'move') {
      next.x = clamp(start.x + dx, 0, bounds.width - start.width)
      next.y = clamp(start.y + dy, 0, bounds.height - start.height)
    } else {
      const handle = gesture.handle
      let scale
      if (handle.length === 2) {
        const widthScale = handle.includes('e')
          ? (start.width + dx) / start.width
          : (start.width - dx) / start.width
        const heightScale = handle.includes('s')
          ? (start.height + dy) / start.height
          : (start.height - dy) / start.height
        scale = Math.abs(widthScale - 1) >= Math.abs(heightScale - 1) ? widthScale : heightScale
      } else if (handle === 'e') scale = (start.width + dx) / start.width
      else if (handle === 'w') scale = (start.width - dx) / start.width
      else if (handle === 's') scale = (start.height + dy) / start.height
      else scale = (start.height - dy) / start.height

      const base = getBaseCrop(imageAspect, aspectRatio)
      const minScale = Math.max(
        ((base.width / maxZoom) / 100 * bounds.width) / start.width,
        ((base.height / maxZoom) / 100 * bounds.height) / start.height,
      )
      let maxScale = Math.min(
        ((base.width / 100) * bounds.width) / start.width,
        ((base.height / 100) * bounds.height) / start.height,
      )
      const centerX = start.x + start.width / 2
      const centerY = start.y + start.height / 2
      if (handle.includes('e')) maxScale = Math.min(maxScale, (bounds.width - start.x) / start.width)
      else if (handle.includes('w')) maxScale = Math.min(maxScale, (start.x + start.width) / start.width)
      else maxScale = Math.min(maxScale, centerX / (start.width / 2), (bounds.width - centerX) / (start.width / 2))
      if (handle.includes('s')) maxScale = Math.min(maxScale, (bounds.height - start.y) / start.height)
      else if (handle.includes('n')) maxScale = Math.min(maxScale, (start.y + start.height) / start.height)
      else maxScale = Math.min(maxScale, centerY / (start.height / 2), (bounds.height - centerY) / (start.height / 2))
      scale = clamp(scale, minScale, maxScale)

      next.width = start.width * scale
      next.height = start.height * scale
      next.x = handle.includes('e') ? start.x : handle.includes('w') ? start.x + start.width - next.width : centerX - next.width / 2
      next.y = handle.includes('s') ? start.y : handle.includes('n') ? start.y + start.height - next.height : centerY - next.height / 2
    }

    emitRect({
      x: (next.x / bounds.width) * 100,
      y: (next.y / bounds.height) * 100,
      width: (next.width / bounds.width) * 100,
      height: (next.height / bounds.height) * 100,
    })
  }

  function endGesture(event) {
    if (gestureRef.current?.pointerId !== event.pointerId) return
    if (stageRef.current?.hasPointerCapture(event.pointerId)) stageRef.current.releasePointerCapture(event.pointerId)
    gestureRef.current = null
  }

  function moveWithKeyboard(event) {
    const amount = event.shiftKey ? 5 : 1
    const delta = {
      ArrowLeft: [-amount, 0],
      ArrowRight: [amount, 0],
      ArrowUp: [0, -amount],
      ArrowDown: [0, amount],
    }[event.key]
    if (!delta) return
    event.preventDefault()
    emitRect({
      ...cropRect,
      x: clamp(cropRect.x + delta[0], 0, 100 - cropRect.width),
      y: clamp(cropRect.y + delta[1], 0, 100 - cropRect.height),
    })
  }

  return (
    <div className={`zumbarl-image-cropper ${className}`.trim()}>
      <div className="zumbarl-image-cropper__toolbar">
        <p><strong>Choose the visible area</strong><span>Drag the box to move it. Drag any edge or corner to resize it.</span></p>
        <span className="zumbarl-image-cropper__ratio">{aspectLabel}</span>
      </div>
      <div className="zumbarl-image-cropper__canvas">
        <div
          ref={stageRef}
          className="zumbarl-image-cropper__stage"
          style={{
            '--crop-image-aspect': imageAspect,
            '--crop-max-height': `${maxStageHeight}px`,
            aspectRatio: imageAspect,
            maxWidth: `${maxStageHeight * imageAspect}px`,
          }}
          onPointerMove={continueGesture}
          onPointerUp={endGesture}
          onPointerCancel={endGesture}
        >
          <img
            src={src}
            alt={alt}
            draggable="false"
            onLoad={(event) => setImageSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
            onError={onImageError}
          />
          <span className="zumbarl-image-cropper__shade" aria-hidden="true" style={{ left: 0, top: 0, width: '100%', height: `${cropRect.y}%` }} />
          <span className="zumbarl-image-cropper__shade" aria-hidden="true" style={{ left: 0, top: `${cropRect.y + cropRect.height}%`, width: '100%', bottom: 0 }} />
          <span className="zumbarl-image-cropper__shade" aria-hidden="true" style={{ left: 0, top: `${cropRect.y}%`, width: `${cropRect.x}%`, height: `${cropRect.height}%` }} />
          <span className="zumbarl-image-cropper__shade" aria-hidden="true" style={{ left: `${cropRect.x + cropRect.width}%`, top: `${cropRect.y}%`, right: 0, height: `${cropRect.height}%` }} />
          <div
            className="zumbarl-image-cropper__selection"
            role="application"
            aria-label={`Crop area. ${aspectLabel}. Use arrow keys to move it.`}
            tabIndex="0"
            style={{ left: `${cropRect.x}%`, top: `${cropRect.y}%`, width: `${cropRect.width}%`, height: `${cropRect.height}%` }}
            onPointerDown={(event) => startGesture(event, 'move')}
            onKeyDown={moveWithKeyboard}
          >
            <span className="zumbarl-image-cropper__grid" aria-hidden="true" />
            {HANDLES.map((handle) => (
              <button
                key={handle}
                type="button"
                className={`zumbarl-image-cropper__handle is-${handle}`}
                aria-label={`Resize crop from ${handle}`}
                tabIndex="-1"
                onPointerDown={(event) => startGesture(event, 'resize', handle)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImageCropper
