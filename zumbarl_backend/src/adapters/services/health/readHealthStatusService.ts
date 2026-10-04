import { readSystemReadinessRepository } from '../../repositories/health/index.js'

function readHealthStatusService() {
  return {
    status: 'ok',
    service: 'zumbarl-backend',
    time: new Date().toISOString()
  }
}

async function readReadinessStatusService() {
  const dependencies = await readSystemReadinessRepository()
  const requiredDependencies = [dependencies.postgres, dependencies.redis]
  if (dependencies.objectStorage !== 'local') requiredDependencies.push(dependencies.objectStorage)
  return {
    status: requiredDependencies.every((status) => status === 'ok') ? 'ready' : 'not_ready',
    dependencies
  }
}

export {
  readHealthStatusService,
  readReadinessStatusService
}
