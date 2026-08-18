import { PrismaClient } from '@prisma/client'
import { normalizeTitleFields } from '../shared/text/titleCase.js'

const prisma = new PrismaClient()

const titleWriteActions = new Set([
  'create',
  'createMany',
  'createManyAndReturn',
  'update',
  'updateMany',
  'updateManyAndReturn',
  'upsert'
])

prisma.$use(async (params, next) => {
  if (titleWriteActions.has(params.action) && params.args) {
    for (const key of ['data', 'create', 'update']) {
      if (key in params.args) params.args[key] = normalizeTitleFields(params.args[key])
    }
  }
  return next(params)
})

export {
  prisma
}
