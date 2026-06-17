import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.js'
import { seedDatabase } from '../src/data/index.js'

const app = await buildApp()

async function login(email: string) {
  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email, password: 'password123' }
  })
  expect(response.statusCode).toBe(200)
  return response.json().token as string
}

describe('Zumbarl API', () => {
  beforeAll(async () => {
    await seedDatabase()
  })

  afterAll(async () => {
    await app.close()
  })

  it('reports health', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' })
    expect(response.statusCode).toBe(200)
    expect(response.json().status).toBe('ok')
  })

  it('logs in and returns business dashboard', async () => {
    const token = await login('business@zumbarl.test')
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/business/dashboard',
      headers: { authorization: `Bearer ${token}` }
    })
    expect(response.statusCode).toBe(200)
    expect(response.json().metrics.opportunities).toBeGreaterThan(0)
  })

  it('allows a student to create a roadmap', async () => {
    const token = await login('student@zumbarl.test')
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/learn/roadmaps',
      headers: { authorization: `Bearer ${token}` },
      payload: { ladderId: 'digital-marketer', intent: 'earn-while-learning' }
    })
    expect(response.statusCode).toBe(201)
    expect(response.json().checkpoints.length).toBeGreaterThan(0)
  })
})
