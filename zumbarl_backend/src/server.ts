import { buildApp } from './app.js'
import { env } from './config/env.js'
import { migrateLegacyAppRecords, seedDatabase } from './data/index.js'

await migrateLegacyAppRecords()
await seedDatabase()

const app = await buildApp()

await app.listen({ host: env.HOST, port: env.PORT })
