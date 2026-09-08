import { prisma } from '../src/lib/prisma.js'

const CONFIRMATION = 'DELETE-ALL-MARKETPLACE-ORDERS'

function objectValue(value: unknown): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {}
}

function cents(value: number) {
  return Math.round(value * 100) / 100
}

async function main() {
  const execute = process.argv.includes(`--confirm=${CONFIRMATION}`)
  const orders = await prisma.marketplaceOrder.findMany({ include: { errands: true } })
  const orderIds = orders.map((order) => order.id)
  if (!orderIds.length) {
    console.log(JSON.stringify({ executed: execute, orders: 0, message: 'No marketplace orders found.' }, null, 2))
    return
  }

  const [transactions, notifications, carts] = await Promise.all([
    prisma.transaction.findMany({
      where: { OR: orderIds.map((orderId) => ({ metadata: { path: ['orderId'], equals: orderId } })) },
      orderBy: { createdAt: 'asc' }
    }),
    prisma.notification.findMany({ select: { id: true, data: true } }),
    prisma.marketplaceCart.findMany({
      where: { OR: [{ orderId: { in: orderIds } }, { id: { in: orders.map((order) => order.cartId).filter(Boolean) as string[] } }] },
      select: { id: true }
    })
  ])
  const orderIdSet = new Set(orderIds)
  const notificationIds = notifications
    .filter((notification) => orderIdSet.has(String(objectValue(notification.data).orderId || '')))
    .map((notification) => notification.id)

  const groupedEffects = new Map<string, { walletId: string, balance: number, pending: number, entries: typeof transactions }>()
  for (const transaction of transactions) {
    if (!transaction.walletId) continue
    const metadata = objectValue(transaction.metadata)
    const orderId = String(metadata.orderId || '')
    const key = `${transaction.walletId}:${orderId}`
    const effect = groupedEffects.get(key) || { walletId: transaction.walletId, balance: 0, pending: 0, entries: [] }
    const amount = Math.abs(Number(transaction.amount))
    const buyerDebit = metadata.direction === 'buyer_debit' || String(transaction.description || '').startsWith('Marketplace payment held')
    const pendingHold = transaction.type === 'ESCROW_HOLD' && !buyerDebit && Number(transaction.amount) > 0
    if (metadata.reviewRequired === true) {
      // Older refund-review entries were audit markers only and never changed a wallet.
    } else if (buyerDebit) effect.balance -= amount
    else if (pendingHold) effect.pending += amount
    else if (Number(transaction.amount) > 0) effect.balance += amount
    else if (Number(transaction.amount) < 0) effect.pending -= amount
    effect.entries.push(transaction)
    groupedEffects.set(key, effect)
  }

  for (const effect of groupedEffects.values()) {
    const pendingHeld = effect.entries
      .filter((entry) => {
        const metadata = objectValue(entry.metadata)
        return entry.type === 'ESCROW_HOLD'
          && metadata.direction !== 'buyer_debit'
          && !String(entry.description || '').startsWith('Marketplace payment held')
          && Number(entry.amount) > 0
      })
      .reduce((sum, entry) => sum + Math.abs(Number(entry.amount)), 0)
    const released = effect.entries
      .filter((entry) => ['STUDENT_PAYOUT', 'ESCROW_RELEASE'].includes(entry.type) && Number(entry.amount) > 0)
      .reduce((sum, entry) => sum + Math.abs(Number(entry.amount)), 0)
    effect.pending -= Math.min(pendingHeld, released)
  }

  const effectsByWallet = new Map<string, { balance: number, pending: number }>()
  for (const effect of groupedEffects.values()) {
    const total = effectsByWallet.get(effect.walletId) || { balance: 0, pending: 0 }
    total.balance += effect.balance
    total.pending += effect.pending
    effectsByWallet.set(effect.walletId, total)
  }
  const wallets = await prisma.wallet.findMany({
    where: { id: { in: [...effectsByWallet.keys()] } },
    include: {
      student: { select: { firstName: true, lastName: true } },
      transactions: { select: { metadata: true } }
    }
  })
  const walletUpdates = wallets.map((wallet) => {
    const effect = effectsByWallet.get(wallet.id) || { balance: 0, pending: 0 }
    const latestOrderEntry = transactions
      .filter((entry) => entry.walletId === wallet.id)
      .reduce((latest, entry) => Math.max(latest, entry.createdAt.getTime()), 0)
    const hasNonOrderLedger = wallet.transactions.some((entry) => !orderIdSet.has(String(objectValue(entry.metadata).orderId || '')))
    const preservedBecauseRebased = hasNonOrderLedger && wallet.updatedAt.getTime() > latestOrderEntry + 5_000
    return {
      id: wallet.id,
      owner: `${wallet.student.firstName} ${wallet.student.lastName}`.trim(),
      balance: preservedBecauseRebased ? wallet.balance : cents(wallet.balance - effect.balance),
      pendingBalance: preservedBecauseRebased ? wallet.pendingBalance : cents(wallet.pendingBalance - effect.pending),
      removedBalanceEffect: preservedBecauseRebased ? 0 : cents(effect.balance),
      removedPendingEffect: preservedBecauseRebased ? 0 : cents(effect.pending),
      preservedBecauseRebased
    }
  })
  const invalidWallet = walletUpdates.find((wallet) => wallet.balance < 0 || wallet.pendingBalance < 0)
  if (invalidWallet) throw new Error(`Cleanup would make ${invalidWallet.owner || invalidWallet.id}'s wallet negative; aborting. ${JSON.stringify(invalidWallet)}`)

  const inventoryRestores = new Map<string, number>()
  const convertedOfferIds = new Set<string>()
  for (const order of orders) {
    const payload = objectValue(order.payload)
    const cancelled = ['cancelled', 'cannot_fulfil'].includes(order.fulfillmentStatus) || order.status === 'refunded'
    for (const item of Array.isArray(order.items) ? order.items as Record<string, any>[] : []) {
      if (payload.inventoryReserved === true && !cancelled && item.listingId) {
        inventoryRestores.set(String(item.listingId), (inventoryRestores.get(String(item.listingId)) || 0) + Number(item.quantity || 1))
      }
      if (item.offerId) convertedOfferIds.add(String(item.offerId))
    }
  }
  const deliveredByErrander = new Map<string, number>()
  for (const errand of orders.flatMap((order) => order.errands)) {
    if (errand.status === 'DELIVERED' && errand.assignedErranderId) {
      deliveredByErrander.set(errand.assignedErranderId, (deliveredByErrander.get(errand.assignedErranderId) || 0) + 1)
    }
  }

  const summary = {
    executed: execute,
    orders: orders.length,
    errands: orders.reduce((sum, order) => sum + order.errands.length, 0),
    orderTransactions: transactions.length,
    orderNotifications: notificationIds.length,
    orderedCarts: carts.length,
    restoredInventoryUnits: [...inventoryRestores.values()].reduce((sum, quantity) => sum + quantity, 0),
    walletUpdates
  }
  if (!execute) {
    console.log(JSON.stringify({ ...summary, next: `Re-run with --confirm=${CONFIRMATION}` }, null, 2))
    return
  }

  await prisma.$transaction(async (tx) => {
    for (const [listingId, quantity] of inventoryRestores) {
      await tx.marketplaceListing.updateMany({ where: { id: listingId }, data: { stockCount: { increment: quantity } } })
    }
    for (const [studentId, deliveredCount] of deliveredByErrander) {
      const enrollment = await tx.errandEnrollment.findUnique({ where: { studentId } })
      if (enrollment) await tx.errandEnrollment.update({
        where: { studentId },
        data: { completedCount: Math.max(0, enrollment.completedCount - deliveredCount) }
      })
    }
    for (const wallet of walletUpdates) {
      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: wallet.balance, pendingBalance: wallet.pendingBalance } })
    }
    if (notificationIds.length) await tx.notification.deleteMany({ where: { id: { in: notificationIds } } })
    if (transactions.length) await tx.transaction.deleteMany({ where: { id: { in: transactions.map((entry) => entry.id) } } })
    if (convertedOfferIds.size) await tx.marketplaceOffer.updateMany({ where: { id: { in: [...convertedOfferIds] }, status: 'converted' }, data: { status: 'accepted' } })
    if (carts.length) await tx.marketplaceCart.deleteMany({ where: { id: { in: carts.map((cart) => cart.id) } } })
    await tx.marketplaceOrder.deleteMany({ where: { id: { in: orderIds } } })
  })
  console.log(JSON.stringify(summary, null, 2))
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
