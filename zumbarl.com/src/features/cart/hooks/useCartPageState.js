import { useCallback, useMemo, useState } from 'react'
import { INITIAL_CART_ITEMS } from '../cartData'
import { getOrderTotals } from '../pricing'

export function useCartPageState() {
  const [cartItems, setCartItems] = useState(INITIAL_CART_ITEMS)
  const [promoCode, setPromoCode] = useState('')

  const totals = useMemo(() => getOrderTotals(cartItems), [cartItems])

  const handleQuantityChange = useCallback((itemId, delta) => {
    setCartItems((current) => current.map((item) => {
      if (item.id !== itemId) {
        return item
      }

      return {
        ...item,
        quantity: Math.max(1, item.quantity + delta),
      }
    }))
  }, [])

  const handleRemoveItem = useCallback((itemId) => {
    setCartItems((current) => current.filter((item) => item.id !== itemId))
  }, [])

  const handleClearCart = useCallback(() => {
    setCartItems([])
  }, [])

  return {
    cartItems,
    handleClearCart,
    handleQuantityChange,
    handleRemoveItem,
    promoCode,
    setPromoCode,
    totals,
  }
}
