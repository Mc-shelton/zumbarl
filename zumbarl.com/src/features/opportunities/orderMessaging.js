function orderIdentifier(order) {
  return `#${String(order?.id || '').slice(-8).toUpperCase()}`
}

function buyerOrderHref(orderId) {
  return `/campus/opportunities/buy-sell?view=orders&orderId=${encodeURIComponent(orderId)}`
}

function erranderOrderHref(orderId) {
  return `/campus/profile?tab=errands&orderId=${encodeURIComponent(orderId)}`
}

function sellerOrderHref(orderId, shopSlug = '') {
  return shopSlug
    ? `/campus/vendors/${encodeURIComponent(shopSlug)}/manage?tab=orders&orderId=${encodeURIComponent(orderId)}`
    : `/campus/profile?tab=pages&orders=open&orderId=${encodeURIComponent(orderId)}`
}

function orderTitle(order) {
  const first = order?.items?.[0]
  return `${first?.title || 'Marketplace order'}${order?.items?.length > 1 ? ` +${order.items.length - 1}` : ''}`
}

function buildOrderConversationHref({ order, participant, senderHref, recipientHref, messageIntent = 'order_inquiry' }) {
  if (!order?.id || !participant?.userId) return '/messages'
  const params = new URLSearchParams({
    participantId: participant.userId,
    participantName: participant.name || 'Zumbarl member',
    orderId: order.id,
    orderIdentifier: orderIdentifier(order),
    orderTitle: orderTitle(order),
    orderStatus: order.fulfillmentStatus || 'active',
    orderInquiry: '1',
    orderMessageIntent: messageIntent,
    orderSenderHref: senderHref,
    orderRecipientHref: recipientHref,
  })
  if (participant.studentId) params.set('participantStudentId', participant.studentId)
  if (participant.avatarUrl) params.set('participantAvatar', participant.avatarUrl)
  return `/messages?${params.toString()}`
}

function buildPageOrderConversationHref({ order, page, customerUserId, customerHref, pageHref }) {
  if (!order?.id || !page?.id) return '/messages'
  const params = new URLSearchParams({
    pageType: page.type || 'marketplace_shop',
    pageId: page.id,
    pageName: page.name || 'Campus page',
    pageSlug: page.slug || '',
    customerUserId: customerUserId || '',
    orderId: order.id,
    orderIdentifier: orderIdentifier(order),
    orderTitle: orderTitle(order),
    orderStatus: order.fulfillmentStatus || 'active',
    orderInquiry: '1',
    orderTotal: String(Number(order.totalAmount || 0)),
    orderCurrency: order.currency || 'KES',
    orderCustomerHref: customerHref,
    orderPageHref: pageHref,
  })
  if (order.items?.[0]?.image) params.set('orderImage', order.items[0].image)
  if (page.avatarUrl) params.set('pageAvatar', page.avatarUrl)
  return `/messages?${params.toString()}`
}

export { buildOrderConversationHref, buildPageOrderConversationHref, buyerOrderHref, erranderOrderHref, orderIdentifier, sellerOrderHref }
