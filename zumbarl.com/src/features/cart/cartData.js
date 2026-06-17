export const INITIAL_CART_ITEMS = [
  {
    id: 'wireless-earbuds',
    title: 'Wireless Earbuds',
    badge: 'New Arrival',
    badgeTone: 'is-purple',
    description: 'High quality sound, long battery life and noise cancellation for your everyday vibe.',
    unitPrice: 2499,
    quantity: 1,
    image: '/assets/index/business_page_images/optimized/toa-heftiba-O3ymvT7Wf9U-unsplash.webp',
  },
  {
    id: 'aesthetic-hair-clips',
    title: 'Aesthetic Hair Clips (Set of 4)',
    badge: 'Best Seller',
    badgeTone: 'is-orange',
    description: 'Trendy, durable and perfect for every outfit. Includes 4 stylish clips.',
    unitPrice: 650,
    quantity: 1,
    image: '/assets/index/business_page_images/optimized/sable-flow-T74mVg__F_k-unsplash.webp',
  },
  {
    id: 'gold-plated-jewelry-set',
    title: 'Gold Plated Jewelry Set',
    badge: 'Limited Stock',
    badgeTone: 'is-pink',
    description: 'Elegant and timeless pieces to elevate your everyday look.',
    unitPrice: 1299,
    quantity: 1,
    image: '/assets/index/business_page_images/optimized/annie-spratt-hCb3lIB8L8E-unsplash.webp',
  },
]

export const ORDER_ITEMS = INITIAL_CART_ITEMS.map(({ id, title, unitPrice, quantity, image }) => ({
  id,
  title,
  price: unitPrice,
  qty: quantity,
  image,
}))

export const SUGGESTED_PRODUCTS = [
  {
    id: 'portable-speaker',
    title: 'Portable Bluetooth Speaker',
    price: 1799,
    image: '/assets/index/business_page_images/optimized/leeder-bose-ne0gCdlSoew-unsplash.webp',
  },
  {
    id: 'canvas-tote',
    title: 'Canvas Tote Bag',
    price: 980,
    image: '/assets/index/business_page_images/optimized/igor-rodrigues-Wn932wwnpSE-unsplash.webp',
  },
  {
    id: 'scented-candle',
    title: 'Scented Soy Candle',
    price: 850,
    image: '/assets/index/business_page_images/optimized/ernest-malimon-XLIywCaTs_M-unsplash.webp',
  },
  {
    id: 'phone-stand',
    title: 'Phone Stand',
    price: 450,
    image: '/assets/index/business_page_images/optimized/product-school-XZkk5xT8Xrk-unsplash.webp',
  },
]
