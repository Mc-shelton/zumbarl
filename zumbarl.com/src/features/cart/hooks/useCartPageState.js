import { useCallback, useEffect, useMemo, useState } from 'react'
import { getOrderTotals } from '../pricing'
import { clearMarketplaceCart, quoteZumbarlDelivery, readMarketplaceCart, removeMarketplaceCartItem, updateMarketplaceCartItemFulfilment, updateMarketplaceCartItemQuantity } from '../../opportunities/services/marketplaceInteractionService'
import { normalizeZumbarlFileUrl } from '../../../lib/normalizeZumbarlFileUrl'

function mapCartItem(item) {
  return {
    id: item.listingId,
    title: item.title || 'Marketplace item',
    badge: item.offerId ? 'Accepted offer' : item.kind === 'service' ? (item.serviceMode === 'order_ahead' ? 'Food order' : 'Service booking') : 'Marketplace',
    badgeTone: item.offerId ? 'is-purple' : 'is-orange',
    description: item.description || 'Complete checkout to secure this item.',
    unitPrice: Number(item.unitAmount || 0),
    quantity: Number(item.quantity || 1),
    image: normalizeZumbarlFileUrl(item.image) || '/assets/index/bee_nobg.png',
    shopId: item.shopId,
    shopName: item.shopName,
    vendorType: item.vendorType || '',
    errandsEnabled: Boolean(item.errandsEnabled),
    errandFee: Number(item.errandFee || 0),
    freeCampusDelivery: Boolean(item.freeCampusDelivery),
    pickupSpots: Array.isArray(item.pickupSpots) ? item.pickupSpots : [],
    availableErranderCount: Number(item.availableErranderCount || 0),
    deliveryOptions: item.deliveryOptions || [],
    deliveryZones: item.deliveryZones || [],
    locationLabel: item.locationLabel,
    kind: item.kind || 'product',
    serviceMode: item.serviceMode,
    serviceRequest: item.serviceRequest,
    stock: Number(item.stock ?? 0),
    unavailable: Boolean(item.unavailable),
    availabilityMessage: item.availabilityMessage || '',
    fulfilment: item.fulfilment || { method: 'unquoted', location: 'Arrange with seller', fee: 0, quoted: false },
    lockedQuantity: Boolean(item.lockedQuantity || item.kind === 'service'),
  }
}

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
        setCartItems(cart.items.map(mapCartItem))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const totals = useMemo(() => getOrderTotals(cartItems), [cartItems])

  const handleQuantityChange = useCallback((itemId, delta) => {
    const item = cartItems.find((cartItem) => cartItem.id === itemId)
    if (!item || item.lockedQuantity || item.unavailable) return
    const previousQuantity = item.quantity
    const maximum = Math.max(1, Number(item.stock || 1))
    const quantity = Math.min(maximum, Math.max(1, previousQuantity + delta))
    if (quantity === previousQuantity) return
    setCartItems((current) => current.map((cartItem) => cartItem.id === itemId ? { ...cartItem, quantity } : cartItem))
    updateMarketplaceCartItemQuantity(itemId, quantity, item.serviceRequest).catch(() => {
      setCartItems((current) => current.map((cartItem) => cartItem.id === itemId ? { ...cartItem, quantity: previousQuantity } : cartItem))
    })
  }, [cartItems])

  const handleRemoveItem = useCallback((itemId) => {
    setCartItems((current) => current.filter((item) => item.id !== itemId))
    removeMarketplaceCartItem(itemId).catch(() => {})
  }, [])

  const handleClearCart = useCallback(() => {
    setCartItems([])
    clearMarketplaceCart().catch(() => {})
  }, [])

  const handleFulfilmentChange = useCallback(async (itemId, value) => {
    const item = cartItems.find((cartItem) => cartItem.id === itemId)
    if (!item) return
    let selectedFulfilment = null
    if (value === 'pickup') selectedFulfilment = { method: 'pickup', location: item.locationLabel || 'Campus pickup', fee: 0, quoted: true }
    else if (value.startsWith('pickup:')) selectedFulfilment = { method: 'pickup', location: value.slice('pickup:'.length), fee: 0, quoted: true }
    else if (value === 'digital') selectedFulfilment = { method: 'digital', location: 'Digital delivery', fee: 0, quoted: true }
    else {
      const zone = item.deliveryZones.find((option) => `delivery:${option.location}` === value)
      if (zone) selectedFulfilment = { method: 'seller_delivery', location: zone.location, fee: Number(zone.fee) || 0, quoted: true }
    }
    if (!selectedFulfilment) return
    const itemIds = selectedFulfilment.method === 'pickup' && item.vendorType === 'student_kitchen' && item.shopId
      ? cartItems.filter((cartItem) => cartItem.shopId === item.shopId && cartItem.vendorType === 'student_kitchen').map((cartItem) => cartItem.id)
      : [itemId]
    setCartItems((current) => current.map((cartItem) => itemIds.includes(cartItem.id) ? { ...cartItem, fulfilment: selectedFulfilment } : cartItem))
    try {
      let cart = null
      for (const listingId of itemIds) cart = await updateMarketplaceCartItemFulfilment(listingId, selectedFulfilment)
      if (cart?.items) setCartItems(cart.items.map(mapCartItem))
    } catch {
      const cart = await readMarketplaceCart().catch(() => null)
      if (cart?.items) setCartItems(cart.items.map(mapCartItem))
    }
  }, [cartItems])

  const handleErrandDelivery = useCallback(async (itemId, destination) => {
    const target = cartItems.find((item) => item.id === itemId)
    const itemIds = target?.shopId
      ? cartItems.filter((item) => item.shopId === target.shopId && item.errandsEnabled).map((item) => item.id)
      : [itemId]
    let cart = null
    for (const listingId of itemIds) {
      cart = await updateMarketplaceCartItemFulfilment(listingId, {
        method: 'errand_delivery',
        location: destination,
        fee: 0,
        quoted: true,
      })
    }
    if (cart?.items) setCartItems(cart.items.map(mapCartItem))
    return cart?.items?.find((item) => item.listingId === itemId)?.fulfilment
  }, [cartItems])

  const handleFreeCampusDelivery = useCallback(async (itemId, destination) => {
    const target = cartItems.find((item) => item.id === itemId)
    const itemIds = target?.shopId
      ? cartItems.filter((item) => item.shopId === target.shopId && item.freeCampusDelivery).map((item) => item.id)
      : [itemId]
    let cart = null
    for (const listingId of itemIds) {
      cart = await updateMarketplaceCartItemFulfilment(listingId, {
        method: 'free_campus_delivery',
        location: destination,
        fee: 0,
        quoted: true,
      })
    }
    if (cart?.items) setCartItems(cart.items.map(mapCartItem))
    return cart?.items?.find((item) => item.listingId === itemId)?.fulfilment
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
    handleErrandDelivery,
    handleFreeCampusDelivery,
    handleZumbarlDeliveryQuote,
    handleRemoveItem,
    promoCode,
    setPromoCode,
    totals,
  }
}
