const FOOD_CATEGORIES = new Set([
  'meals',
  'snacks',
  'drinks',
  'baked goods',
  'fresh food',
  'food & drink',
  'food & hospitality',
  'other food',
])

function normalized(value) {
  return String(value || '').trim().toLowerCase()
}

function isFoodListing(listing) {
  if (!listing) return false
  const category = normalized(listing.category)
  const searchable = `${category} ${normalized(listing.title)} ${normalized(listing.shop?.category)}`

  return normalized(listing.inventoryType) === 'food'
    || normalized(listing.serviceMode) === 'order_ahead'
    || FOOD_CATEGORIES.has(category)
    || /\b(food|meal|eatery|restaurant|cafe|coffee|snack|baker|kitchen)\b/.test(searchable)
}

function isCampusEateryListing(listing) {
  return isFoodListing(listing)
    && normalized(listing.shop?.entityType) === 'campus_vendor'
    && normalized(listing.shop?.vendorType) === 'hotel'
}

function isCampusEateryShop(shop) {
  return normalized(shop?.entityType) === 'campus_vendor'
    && normalized(shop?.vendorType || shop?.type) === 'hotel'
}

function isStudentKitchenShop(shop) {
  return normalized(shop?.entityType) === 'campus_vendor'
    && normalized(shop?.vendorType || shop?.type) === 'student_kitchen'
}

function getPreparationMinutes(listing) {
  const explicit = Number(listing?.preparationMinutes)
  if (Number.isFinite(explicit) && explicit >= 0) return explicit
  const duration = Number.parseInt(String(listing?.duration || ''), 10)
  return Number.isFinite(duration) ? duration : null
}

export {
  FOOD_CATEGORIES,
  getPreparationMinutes,
  isCampusEateryListing,
  isCampusEateryShop,
  isFoodListing,
  isStudentKitchenShop,
}
