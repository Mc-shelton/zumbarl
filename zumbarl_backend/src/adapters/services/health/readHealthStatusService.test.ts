import { beforeEach, describe, expect, it, vi } from 'vitest'

const { readSystemReadinessRepository } = vi.hoisted(() => ({ readSystemReadinessRepository: vi.fn() }))
vi.mock('../../repositories/health/index.js', () => ({ readSystemReadinessRepository }))

const { readReadinessStatusService } = await import('./readHealthStatusService.js')

describe('readReadinessStatusService', () => {
  beforeEach(() => readSystemReadinessRepository.mockReset())

  it('is ready when required dependencies respond', async () => {
    readSystemReadinessRepository.mockResolvedValue({ api: 'ok', postgres: 'ok', redis: 'ok', objectStorage: 'local' })
    await expect(readReadinessStatusService()).resolves.toMatchObject({ status: 'ready' })
  })

  it('is not ready when a required dependency is unavailable', async () => {
    readSystemReadinessRepository.mockResolvedValue({ api: 'ok', postgres: 'unavailable', redis: 'ok', objectStorage: 'ok' })
    await expect(readReadinessStatusService()).resolves.toMatchObject({ status: 'not_ready' })
  })
})
