import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.js'
import { seedDatabase } from '../src/data/index.js'
import { prisma } from '../src/lib/prisma.js'

const campusId = 'academic-catalog-test-campus'
const courseId = 'academic-catalog-test-course'
const unitId = 'academic-catalog-test-unit'
const studentUserId = 'academic-catalog-test-user'
const studentId = 'academic-catalog-test-student'
const campusPageId = 'academic-catalog-test-page'
const app = await buildApp()
let adminToken = ''

describe('Super Admin academic catalog', () => {
  beforeAll(async () => {
    await seedDatabase()
    const login = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'admin@zumbarl.test', password: 'password123' }
    })
    adminToken = login.json().token
    await prisma.campus.upsert({
      where: { id: campusId },
      update: { name: 'Catalog Test College', city: 'Nairobi', isActive: true },
      create: { id: campusId, name: 'Catalog Test College', city: 'Nairobi' }
    })
    await prisma.course.upsert({
      where: { id: courseId },
      update: { name: 'Catalog Test Course', category: 'OTHER', duration: 2 },
      create: { id: courseId, name: 'Catalog Test Course', category: 'OTHER', duration: 2 }
    })
    await prisma.knowledgeUnit.upsert({
      where: { id: unitId },
      update: { name: 'CAT 100', normalizedName: 'cat 100' },
      create: { id: unitId, name: 'CAT 100', normalizedName: 'cat 100' }
    })
    await prisma.user.upsert({
      where: { id: studentUserId },
      update: {},
      create: {
        id: studentUserId,
        name: 'Campus Link Student',
        firstName: 'Campus',
        lastName: 'Student',
        username: 'campus_link_test',
        email: 'campus-link-test@zumbarl.test',
        phone: '+254799999991',
        passwordHash: 'unused-in-test',
        role: 'STUDENT_STANDARD'
      }
    })
    await prisma.studentProfile.upsert({
      where: { id: studentId },
      update: { campusId, courseId },
      create: {
        id: studentId,
        userId: studentUserId,
        firstName: 'Campus',
        lastName: 'Student',
        dateOfBirth: new Date('2000-01-01T00:00:00.000Z'),
        campusId,
        courseId,
        yearJoined: 2025,
        courseDuration: 2,
        expectedGraduation: new Date('2027-12-31T00:00:00.000Z')
      }
    })
  })

  afterAll(async () => {
    await prisma.managedProfile.deleteMany({ where: { id: campusPageId } })
    await prisma.studentProfile.deleteMany({ where: { id: studentId } })
    await prisma.user.deleteMany({ where: { id: studentUserId } })
    await prisma.auditLog.deleteMany({ where: { entityId: { in: [campusId, courseId, unitId] } } })
    await prisma.knowledgeUnit.deleteMany({ where: { id: unitId } })
    await prisma.course.deleteMany({ where: { id: courseId } })
    await prisma.campus.deleteMany({ where: { id: campusId } })
    await app.close()
  })

  it('lists registration-created records and their linked students', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/super-admin/academic-catalog',
      headers: { authorization: `Bearer ${adminToken}` }
    })

    expect(response.statusCode).toBe(200)
    const zetech = response.json().campuses.find((campus: Record<string, any>) => campus.name === 'Zetech University')
    expect(zetech).toBeTruthy()
    expect(zetech.students).toEqual(expect.arrayContaining([
      expect.objectContaining({ firstName: 'Aisha', lastName: 'Mwangi' })
    ]))
  })

  it('edits campuses, courses, and units and audits every change', async () => {
    const headers = { authorization: `Bearer ${adminToken}` }
    const campusResponse = await app.inject({
      method: 'PATCH',
      url: `/api/v1/admin/super-admin/academic-catalog/campuses/${campusId}`,
      headers,
      payload: {
        name: 'Catalog Test University',
        branch: 'Town Campus',
        city: 'Ruiru',
        locationLabel: 'Ruiru, Kiambu',
        latitude: -1.145,
        longitude: 36.96,
        isActive: true,
        reason: 'Correct registration entry'
      }
    })
    expect(campusResponse.statusCode).toBe(200)
    expect(campusResponse.json()).toMatchObject({ name: 'Catalog Test University', branch: 'Town Campus', city: 'Ruiru' })

    const courseResponse = await app.inject({
      method: 'PATCH',
      url: `/api/v1/admin/super-admin/academic-catalog/courses/${courseId}`,
      headers,
      payload: { name: 'Catalog Administration', category: 'BUSINESS', duration: 3, reason: 'Correct course details' }
    })
    expect(courseResponse.statusCode).toBe(200)
    expect(courseResponse.json()).toMatchObject({ name: 'Catalog Administration', category: 'BUSINESS', duration: 3 })

    const unitResponse = await app.inject({
      method: 'PATCH',
      url: `/api/v1/admin/super-admin/academic-catalog/units/${unitId}`,
      headers,
      payload: { name: 'CAT 101', reason: 'Correct unit code' }
    })
    expect(unitResponse.statusCode).toBe(200)
    expect(unitResponse.json()).toMatchObject({ name: 'CAT 101', normalizedName: 'cat 101' })

    expect(await prisma.auditLog.count({ where: { entityId: { in: [campusId, courseId, unitId] } } })).toBe(3)
  })

  it('returns a campus destination only while an active campus page exists', async () => {
    const headers = { authorization: `Bearer ${adminToken}` }
    const withoutPage = await app.inject({ method: 'GET', url: `/api/v1/campus/profiles/${studentId}`, headers })
    expect(withoutPage.statusCode).toBe(200)
    expect(withoutPage.json().header.campusPage).toBeNull()

    await prisma.managedProfile.create({
      data: {
        id: campusPageId,
        type: 'campus',
        slug: 'academic-catalog-test-campus-page',
        name: 'Catalog Test University Page',
        handle: 'catalog_test_university_page',
        campusId,
        status: 'active'
      }
    })
    const withPage = await app.inject({ method: 'GET', url: `/api/v1/campus/profiles/${studentId}`, headers })
    expect(withPage.statusCode).toBe(200)
    expect(withPage.json().header.campusPage).toMatchObject({
      id: campusPageId,
      slug: 'academic-catalog-test-campus-page'
    })

    await prisma.managedProfile.update({ where: { id: campusPageId }, data: { status: 'archived' } })
    const withInactivePage = await app.inject({ method: 'GET', url: `/api/v1/campus/profiles/${studentId}`, headers })
    expect(withInactivePage.statusCode).toBe(200)
    expect(withInactivePage.json().header.campusPage).toBeNull()
  })
})
