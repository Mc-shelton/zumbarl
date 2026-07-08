export function getSplashCropStyle(splash) {
  const crop = splash?.crop
  if (!crop) return null

  const zoom = Number(crop.zoom) || 1
  const positionX = Number(crop.positionX ?? 50)
  const positionY = Number(crop.positionY ?? 50)
  const maxShift = ((zoom - 1) / (2 * zoom)) * 100
  const translateX = ((50 - positionX) / 50) * maxShift
  const translateY = ((50 - positionY) / 50) * maxShift

  return {
    objectPosition: `${positionX}% ${positionY}%`,
    transform: `translate(${translateX}%, ${translateY}%) scale(${zoom})`,
  }
}
