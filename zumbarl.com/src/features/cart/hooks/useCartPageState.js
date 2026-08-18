import { useCallback, useEffect, useMemo, useState } from 'react'
import { getOrderTotals } from '../pricing'
import { clearMarketplaceCart, quoteZumbarlDelivery, readMarketplaceCart, removeMarketplaceCartItem, updateMarketplaceCartItemFulfilment } from '../../opportunities/services/marketplaceInteractionService'
import { normalizeZumbarlFileUrl } from '../../../lib/normalizeZumbarlFileUrl'

export function useCartPageState() {
  const [cartItems, setCartItems] = useState([])
  const [cartId, setCartId] = useState('')
  const [promoCode, setPromoCode] = useState('')

  useEffect(() => {
    let cancelled = false
    readMarketplaceCart()
      .then((cart) => {
        if (cancelled) return
        setCartId(cart.id || '')
        if (!Array.isArray(cart.items) || !cart.items.length) return
        setCartItems(cart.items.map((item) => ({
          id: item.listingId,
          title: item.title || 'Marketplace item',
          badge: item.offerId ? 'Accepted offer' : 'Marketplace',
          badgeTone: item.offerId ? 'is-purple' : 'is-orange',
          description: item.description || 'Complete checkout to secure this item.',
          unitPrice: Number(item.unitAmount || 0),
          quantity: Number(item.quantity || 1),
          image: normalizeZumbarlFileUrl(item.image) || '/assets/index/bee_nobg.png',
          deliveryOptions: item.deliveryOptions || [],
          deliveryZones: item.deliveryZones || [],
          locationLabel: item.locationLabel,
          fulfilment: item.fulfilment || { method: 'unquoted', location: 'Arrange with seller', fee: 0, quoted: false },
          lockedQuantity: Boolean(item.lockedQuantity),
        })))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const totals = useMemo(() => getOrderTotals(cartItems), [cartItems])

  const handleQuantityChange = useCallback((itemId, delta) => {
    setCartItems((current) => current.map((item) => {
      if (item.id !== itemId) {
        return item
      }

      return {
        ...item,
        quantity: item.lockedQuantity ? 1 : Math.max(1, item.quantity + delta),
      }
    }))
  }, [])

  const handleRemoveItem = useCallback((itemId) => {
    setCartItems((current) => current.filter((item) => item.id !== itemId))
    removeMarketplaceCartItem(itemId).catch(() => {})
  }, [])

  const handleClearCart = useCallback(() => {
    setCartItems([])
    clearMarketplaceCart().catch(() => {})
  }, [])

  const handleFulfilmentChange = useCallback((itemId, value) => {
    const item = cartItems.find((cartItem) => cartItem.id === itemId)
    if (!item) return
    let selectedFulfilment = null
    if (value === 'pickup') selectedFulfilment = { method: 'pickup', location: item.locationLabel || 'Campus pickup', fee: 0, quoted: true }
    else if (value === 'digital') selectedFulfilment = { method: 'digital', location: 'Digital delivery', fee: 0, quoted: true }
    else {
      const zone = item.deliveryZones.find((option) => `delivery:${option.location}` === value)
      if (zone) selectedFulfilment = { method: 'seller_delivery', location: zone.location, fee: Number(zone.fee) || 0, quoted: true }
    }
    if (!selectedFulfilment) return
    setCartItems((current) => current.map((cartItem) => cartItem.id === itemId ? { ...cartItem, fulfilment: selectedFulfilment } : cartItem))
    if (selectedFulfilment) updateMarketplaceCartItemFulfilment(itemId, selectedFulfilment).catch(() => {})
  }, [cartItems])

  const handleZumbarlDeliveryQuote = useCallback(async (itemId, destination, coordinates) => {
    const quote = await quoteZumbarlDelivery(itemId, destination, coordinates.latitude, coordinates.longitude)
    const fulfilment = { method: 'zumbarl_delivery', location: quote.destination, distanceKm: quote.distanceKm, durationMinutes: quote.durationMinutes, distanceSource: quote.distanceSource, fee: quote.fee, quoted: true, buyerLatitude: coordinates.latitude, buyerLongitude: coordinates.longitude }
    await updateMarketplaceCartItemFulfilment(itemId, fulfilment)
    setCartItems((current) => current.map((item) => item.id === itemId ? { ...item, fulfilment } : item))
    return quote
  }, [])

  return {
    cartItems,
    cartId,
    handleClearCart,
    handleQuantityChange,
    handleFulfilmentChange,
    handleZumbarlDeliveryQuote,
    handleRemoveItem,
    promoCode,
    setPromoCode,
    totals,
  }
}
