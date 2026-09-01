export const INITIAL_CART_ITEMS = []

export const ORDER_ITEMS = INITIAL_CART_ITEMS.map(({ id, title, unitPrice, quantity, image }) => ({
  id,
  title,
  price: unitPrice,
  qty: quantity,
  image,
}))

export const SUGGESTED_PRODUCTS = []
