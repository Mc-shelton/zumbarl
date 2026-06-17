export function getWrappedGalleryIndex(nextIndex, galleryLength) {
  if (galleryLength <= 0) {
    return 0
  }

  return ((nextIndex % galleryLength) + galleryLength) % galleryLength
}
