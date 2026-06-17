import { readSystemReadinessRepository } from '../../repositories/health/index.js'

function readHealthStatusService() {
  return {
    status: 'ok',
    service: 'zumbarl-backend',
    time: new Date().toISOString()
  }
}

async function readReadinessStatusService() {
  return {
    status: 'ready',
    dependencies: await readSystemReadinessRepository()
  }
}

export {
  readHealthStatusService,
  readReadinessStatusService
}
