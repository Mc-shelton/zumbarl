import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { seedDatabase } from '../../../data/index.js'
import { prisma } from '../../../lib/prisma.js'
import { progressErrandService } from '../../services/marketplace/manageMarketplaceOrdersService.js'
import { marketplaceOrdersRepository } from './marketplaceOrders.repository.js'

const createdOrderIds: string[] = []

beforeAll(async () => {
  await seedDatabase()
})

afterAll(async () => {
  for (const orderId of createdOrderIds) {
    await prisma.notification.deleteMany({
      where: { data: { path: ['orderId'], equals: orderId } }
    })
  }
  await prisma.marketplaceOrder.deleteMany({ where: { id: { in: createdOrderIds } } })
})

describe('marketplace order collection readiness', () => {
  it('notifies the assigned errander exactly once when the vendor marks an order ready', async () => {
    const shop = await prisma.marketplaceShop.findFirst({
      where: { campusId: { not: null } },
      select: { id: true, campusId: true, ownerId: true, name: true }
    })
    expect(shop).toBeTruthy()
    const errander = await prisma.studentProfile.findFirst({
      where: { id: { not: shop!.ownerId } },
      select: { id: true, userId: true }
    })
    expect(errander).toBeTruthy()

    const order = await prisma.marketplaceOrder.create({
      data: {
        items: [],
        totalAmount: 100,
        currency: 'KES',
        status: 'paid',
        fulfillmentStatus: 'packaging',
        handoffType: 'drop-off',
        handoffSpot: 'Test collection point',
        payload: { fulfillmentStatus: 'packaging' }
      }
    })
    createdOrderIds.push(order.id)
    const errand = await prisma.marketplaceErrand.create({
      data: {
        orderId: order.id,
        shopId: shop!.id,
        campusId: shop!.campusId!,
        assignedErranderId: errander!.id,
        status: 'ASSIGNED',
        pickupLabel: shop!.name,
        dropoffLabel: 'Test collection point',
        feeAmount: 100,
        currency: 'KES'
      }
    })

    const result = await marketplaceOrdersRepository.markOrderReadyForCollection(order.id, shop!.id)
    expect((result?.order as Record<string, any>)?.fulfillmentStatus).toBe('ready')
    expect(result?.notificationUserIds).toEqual([errander!.userId])
    expect(result?.notifications[0]).toMatchObject({
      userId: errander!.userId,
      type: 'ERRAND_READY_FOR_COLLECTION',
      title: 'Order Ready For Collection'
    })
    expect(result?.notifications[0].data).toMatchObject({
      errandId: errand.id,
      orderId: order.id,
      deepLink: '/campus/profile?tab=errands'
    })

    expect(await marketplaceOrdersRepository.markOrderReadyForCollection(order.id, shop!.id)).toBeNull()
    expect(await prisma.notification.count({
      where: { type: 'ERRAND_READY_FOR_COLLECTION', data: { path: ['orderId'], equals: order.id } }
    })).toBe(1)
  })

  it('requires the buyer code, completes the order once, and releases seller and errander escrow', async () => {
    const shop = await prisma.marketplaceShop.findFirst({
      where: { campusId: { not: null } },
      select: { id: true, campusId: true, ownerId: true, name: true }
    })
    expect(shop).toBeTruthy()
    const errander = await prisma.studentProfile.findFirst({
      where: { campusId: shop!.campusId!, id: { not: shop!.ownerId } },
      select: { id: true, userId: true }
    })
    expect(errander).toBeTruthy()
    const buyer = await prisma.studentProfile.findFirst({
      where: { id: { notIn: [shop!.ownerId, errander!.id] } },
      select: { id: true, userId: true }
    })
    expect(buyer).toBeTruthy()

    const originalEnrollment = await prisma.errandEnrollment.findUnique({ where: { studentId: errander!.id } })
    await prisma.errandEnrollment.upsert({
      where: { studentId: errander!.id },
      update: {},
      create: { studentId: errander!.id, campusId: shop!.campusId! }
    })
    const originalSellerWallet = await prisma.wallet.findUnique({ where: { studentId_type: { studentId: shop!.ownerId, type: 'MAIN' } } })
    const originalErranderWallet = await prisma.wallet.findUnique({ where: { studentId_type: { studentId: errander!.id, type: 'MAIN' } } })
    const sellerWallet = await prisma.wallet.upsert({
      where: { studentId_type: { studentId: shop!.ownerId, type: 'MAIN' } },
      update: { pendingBalance: { increment: 300 } },
      create: { studentId: shop!.ownerId, type: 'MAIN', currency: 'KES', pendingBalance: 300 }
    })
    const erranderWallet = await prisma.wallet.upsert({
      where: { studentId_type: { studentId: errander!.id, type: 'MAIN' } },
      update: { pendingBalance: { increment: 100 } },
      create: { studentId: errander!.id, type: 'MAIN', currency: 'KES', pendingBalance: 100 }
    })

    const order = await prisma.marketplaceOrder.create({
      data: {
        studentId: buyer!.id,
        items: [{
          listingId: 'delivery-code-integration-test',
          title: 'Test item',
          sellerId: shop!.ownerId,
          shopId: shop!.id,
          unitAmount: 300,
          quantity: 1,
          fulfilment: { method: 'errand_delivery', fee: 100, location: 'Test drop-off', quoted: true }
        }],
        totalAmount: 400,
        currency: 'KES',
        status: 'paid',
        fulfillmentStatus: 'ready',
        handoffType: 'drop-off',
        handoffSpot: 'Test drop-off',
        payload: { financialVersion: 2, buyerUserId: buyer!.userId }
      }
    })
    createdOrderIds.push(order.id)
    const errand = await prisma.marketplaceErrand.create({
      data: {
        orderId: order.id,
        shopId: shop!.id,
        campusId: shop!.campusId!,
        assignedErranderId: errander!.id,
        status: 'ASSIGNED',
        pickupLabel: shop!.name,
        dropoffLabel: 'Test drop-off',
        feeAmount: 100,
        currency: 'KES'
      }
    })

    try {
      await expect(marketplaceOrdersRepository.readBuyerDeliveryCode(order.id, buyer!.id))
        .rejects.toMatchObject({ code: 'DELIVERY_CODE_NOT_READY' })
      await progressErrandService(errander!.id, errand.id, 'PICKED_UP')
      const inTransitOrder = await prisma.marketplaceOrder.findUniqueOrThrow({ where: { id: order.id } })
      expect(inTransitOrder.fulfillmentStatus).toBe('in_transit')
      expect(inTransitOrder.payload).toMatchObject({ fulfillmentStatus: 'in_transit' })
      const pickupEventId = `errand-picked-up:${errand.id}`
      const pickupMessage = await prisma.message.findFirst({
        where: { context: { path: ['automatedEventId'], equals: pickupEventId } }
      })
      expect(pickupMessage).toMatchObject({
        senderId: errander!.userId,
        recipientId: buyer!.userId
      })
      expect(pickupMessage?.body).toContain("I've picked up your Test Item order")
      expect(pickupMessage?.context).toMatchObject({
        type: 'marketplace_order',
        automatedEventId: pickupEventId,
        order: { id: order.id, status: 'in_transit' }
      })
      await progressErrandService(errander!.id, errand.id, 'PICKED_UP')
      expect(await prisma.message.count({
        where: { context: { path: ['automatedEventId'], equals: pickupEventId } }
      })).toBe(1)

      const delivery = await marketplaceOrdersRepository.readBuyerDeliveryCode(order.id, buyer!.id)
      expect(delivery?.code).toMatch(/^\d{6}$/)
      const incorrectCode = String((Number(delivery!.code) + 1) % 1_000_000).padStart(6, '0')
      await expect(marketplaceOrdersRepository.progressErrand(errander!.id, errand.id, 'DELIVERED', incorrectCode))
        .rejects.toMatchObject({ code: 'INVALID_DELIVERY_CODE' })
      expect((await prisma.marketplaceErrand.findUnique({ where: { id: errand.id } }))?.status).toBe('PICKED_UP')

      const progress = await marketplaceOrdersRepository.progressErrand(errander!.id, errand.id, 'DELIVERED', delivery!.code)
      expect(progress?.orderReadyToComplete).toBe(true)
      const completed = await marketplaceOrdersRepository.completeBuyerOrder(order.id, buyer!.id)
      expect(completed).toMatchObject({ status: 'completed', fulfillmentStatus: 'completed' })

      const [sellerAfter, erranderAfter, activeErrands] = await Promise.all([
        prisma.wallet.findUniqueOrThrow({ where: { id: sellerWallet.id } }),
        prisma.wallet.findUniqueOrThrow({ where: { id: erranderWallet.id } }),
        marketplaceOrdersRepository.readMyErrands(errander!.id)
      ])
      expect(sellerAfter.balance).toBe(sellerWallet.balance + 300)
      expect(sellerAfter.pendingBalance).toBe(sellerWallet.pendingBalance - 300)
      expect(erranderAfter.balance).toBe(erranderWallet.balance + 100)
      expect(erranderAfter.pendingBalance).toBe(erranderWallet.pendingBalance - 100)
      expect(activeErrands?.assigned.some((item: Record<string, any>) => item.id === errand.id)).toBe(false)
      expect(await marketplaceOrdersRepository.completeBuyerOrder(order.id, buyer!.id)).toBeNull()
    } finally {
      await prisma.message.deleteMany({ where: { context: { path: ['order', 'id'], equals: order.id } } })
      await prisma.transaction.deleteMany({ where: { metadata: { path: ['orderId'], equals: order.id } } })
      await prisma.notification.deleteMany({ where: { data: { path: ['orderId'], equals: order.id } } })
      await prisma.marketplaceOrder.delete({ where: { id: order.id } }).catch(() => undefined)
      await prisma.wallet.update({
        where: { id: sellerWallet.id },
        data: { balance: originalSellerWallet?.balance || 0, pendingBalance: originalSellerWallet?.pendingBalance || 0 }
      })
      await prisma.wallet.update({
        where: { id: erranderWallet.id },
        data: { balance: originalErranderWallet?.balance || 0, pendingBalance: originalErranderWallet?.pendingBalance || 0 }
      })
      if (!originalSellerWallet) await prisma.wallet.delete({ where: { id: sellerWallet.id } })
      if (!originalErranderWallet) await prisma.wallet.delete({ where: { id: erranderWallet.id } })
      if (originalEnrollment) {
        await prisma.errandEnrollment.update({ where: { studentId: errander!.id }, data: { completedCount: originalEnrollment.completedCount } })
      } else {
        await prisma.errandEnrollment.delete({ where: { studentId: errander!.id } })
      }
    }
  })

  it('settles a legacy paid errand without consuming unrelated errander pending funds', async () => {
    const shop = await prisma.marketplaceShop.findFirst({
      where: { campusId: { not: null } },
      select: { id: true, campusId: true, ownerId: true, name: true }
    })
    const errander = await prisma.studentProfile.findFirst({
      where: { campusId: shop!.campusId!, id: { not: shop!.ownerId } },
      select: { id: true }
    })
    const buyer = await prisma.studentProfile.findFirst({
      where: { id: { notIn: [shop!.ownerId, errander!.id] } },
      select: { id: true }
    })
    expect(shop && errander && buyer).toBeTruthy()

    const originalSellerWallet = await prisma.wallet.findUnique({ where: { studentId_type: { studentId: shop!.ownerId, type: 'MAIN' } } })
    const originalErranderWallet = await prisma.wallet.findUnique({ where: { studentId_type: { studentId: errander!.id, type: 'MAIN' } } })
    const sellerWallet = await prisma.wallet.upsert({
      where: { studentId_type: { studentId: shop!.ownerId, type: 'MAIN' } },
      update: { pendingBalance: { increment: 300 } },
      create: { studentId: shop!.ownerId, type: 'MAIN', currency: 'KES', pendingBalance: 300 }
    })
    const erranderWallet = await prisma.wallet.upsert({
      where: { studentId_type: { studentId: errander!.id, type: 'MAIN' } },
      update: {},
      create: { studentId: errander!.id, type: 'MAIN', currency: 'KES' }
    })
    const order = await prisma.marketplaceOrder.create({
      data: {
        studentId: buyer!.id,
        items: [{
          listingId: 'legacy-delivery-code-test',
          title: 'Legacy test item',
          sellerId: shop!.ownerId,
          shopId: shop!.id,
          unitAmount: 300,
          quantity: 1,
          fulfilment: { method: 'errand_delivery', fee: 100, location: 'Legacy test drop-off', quoted: true }
        }],
        totalAmount: 400,
        currency: 'KES',
        status: 'paid',
        fulfillmentStatus: 'delivered',
        handoffType: 'drop-off',
        handoffSpot: 'Legacy test drop-off',
        payload: { fulfillmentStatus: 'delivered' }
      }
    })
    createdOrderIds.push(order.id)
    await prisma.marketplaceErrand.create({
      data: {
        orderId: order.id,
        shopId: shop!.id,
        campusId: shop!.campusId!,
        assignedErranderId: errander!.id,
        status: 'DELIVERED',
        pickupLabel: shop!.name,
        dropoffLabel: 'Legacy test drop-off',
        feeAmount: 100,
        currency: 'KES',
        deliveredAt: new Date()
      }
    })

    try {
      const completed = await marketplaceOrdersRepository.completeBuyerOrder(order.id, buyer!.id)
      expect(completed).toMatchObject({ status: 'completed', fulfillmentStatus: 'completed' })
      const [sellerAfter, erranderAfter] = await Promise.all([
        prisma.wallet.findUniqueOrThrow({ where: { id: sellerWallet.id } }),
        prisma.wallet.findUniqueOrThrow({ where: { id: erranderWallet.id } })
      ])
      expect(sellerAfter.balance).toBe(sellerWallet.balance + 300)
      expect(sellerAfter.pendingBalance).toBe(sellerWallet.pendingBalance - 300)
      expect(erranderAfter.balance).toBe(erranderWallet.balance + 100)
      expect(erranderAfter.pendingBalance).toBe(erranderWallet.pendingBalance)
    } finally {
      await prisma.transaction.deleteMany({ where: { metadata: { path: ['orderId'], equals: order.id } } })
      await prisma.marketplaceOrder.delete({ where: { id: order.id } }).catch(() => undefined)
      await prisma.wallet.update({ where: { id: sellerWallet.id }, data: { balance: originalSellerWallet?.balance || 0, pendingBalance: originalSellerWallet?.pendingBalance || 0 } })
      await prisma.wallet.update({ where: { id: erranderWallet.id }, data: { balance: originalErranderWallet?.balance || 0, pendingBalance: originalErranderWallet?.pendingBalance || 0 } })
      if (!originalSellerWallet) await prisma.wallet.delete({ where: { id: sellerWallet.id } })
      if (!originalErranderWallet) await prisma.wallet.delete({ where: { id: erranderWallet.id } })
    }
  })
})
