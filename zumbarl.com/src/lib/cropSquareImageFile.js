function loadLocalImage(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('The selected image could not be opened.'))
    }
    image.src = objectUrl
  })
}

function canvasBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('The cropped logo could not be created.'))
    }, 'image/png')
  })
}

async function cropSquareImageFile(file, crop, outputSize = 512) {
  const image = await loadLocalImage(file)
  const zoom = Math.min(3, Math.max(1, Number(crop.zoom) || 1))
  const positionX = Math.min(100, Math.max(0, Number(crop.positionX ?? 50)))
  const positionY = Math.min(100, Math.max(0, Number(crop.positionY ?? 50)))
  const sourceSize = Math.min(image.naturalWidth, image.naturalHeight) / zoom
  const sourceX = (image.naturalWidth - sourceSize) * (positionX / 100)
  const sourceY = (image.naturalHeight - sourceSize) * (positionY / 100)
  const canvas = document.createElement('canvas')
  canvas.width = outputSize
  canvas.height = outputSize
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Image cropping is not supported by this browser.')
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, outputSize, outputSize)
  const blob = await canvasBlob(canvas)
  const baseName = String(file.name || 'page-logo').replace(/\.[^.]+$/, '')
  return new File([blob], `${baseName}-square.png`, { type: 'image/png', lastModified: Date.now() })
}

export { cropSquareImageFile }
