import { afterAll, describe, expect, it } from 'vitest'
import { prisma } from '../../../lib/prisma.js'
import { createUserWithBusinessProfile } from './authUsers.repository.js'

const marker = `company-registration-${process.pid}-${Date.now()}`

afterAll(async () => {
  const user = await prisma.user.findUnique({ where: { email: `${marker}@example.test` }, include: { companyContact: true } })
  if (user?.companyContact) {
    await prisma.companyWallet.deleteMany({ where: { companyId: user.companyContact.companyId } })
    await prisma.companyContact.deleteMany({ where: { userId: user.id } })
    await prisma.company.deleteMany({ where: { id: user.companyContact.companyId } })
  }
  if (user) await prisma.user.delete({ where: { id: user.id } })
  await prisma.$disconnect()
})

describe('company self-service registration', () => {
  it('atomically creates an owner membership and company wallet', async () => {
    const result = await createUserWithBusinessProfile({
      name: 'Registration Owner',
      firstName: 'Registration',
      lastName: 'Owner',
      username: marker,
      email: `${marker}@example.test`,
      phone: `+25473${String(Date.now()).slice(-7)}`,
      passwordHash: 'test-only',
      role: 'COMPANY_STANDARD',
      status: 'active'
    }, 'Registered Test SME')
    if (!result.business) throw new Error('Expected company profile')
    const membership = await prisma.companyContact.findUnique({ where: { userId: result.user.id } })
    expect(membership).toMatchObject({ companyId: result.business.id, isOwner: true })
    expect(await prisma.companyWallet.findUnique({ where: { companyId: result.business.id } })).not.toBeNull()
  })
})
