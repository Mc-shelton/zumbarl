import type { Prisma, PrismaClient } from '@prisma/client'
import { pageEnvelope } from '../../lib/http.js'
import { prisma } from '../../lib/prisma.js'

type AnyRecord = Record<string, any> & { id: string; createdAt: string; updatedAt: string }
type PrismaRecordClient = Pick<PrismaClient, 'workflowRecord'>
type CreatePrismaRecordRepository = (collection: string) => PrismaRecordRepository

function toRecord(record: { id: string; data: Prisma.JsonValue; createdAt: Date; updatedAt: Date }): AnyRecord {
  const data = record.data && typeof record.data === 'object' && !Array.isArray(record.data) ? record.data as Record<string, any> : {}
  return {
    id: record.id,
    ...data,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  }
}

function toJsonInput(payload: Record<string, any>): Prisma.InputJsonObject {
  return JSON.parse(JSON.stringify(payload)) as Prisma.InputJsonObject
}

class PrismaRecordRepository {
  constructor(
    private readonly prismaClient: PrismaRecordClient,
    private readonly collection: string
  ) {}

  async count(predicate?: (record: AnyRecord) => boolean) {
    if (!predicate) return this.prismaClient.workflowRecord.count({ where: { collection: this.collection } })
    return (await this.listAll(predicate)).length
  }

  async create(payload: Record<string, any>) {
    const record = await this.prismaClient.workflowRecord.create({
      data: {
        collection: this.collection,
        data: toJsonInput(payload)
      }
    })
    return toRecord(record)
  }

  async findByField(field: string, value: unknown) {
    const records = await this.listAll((record) => record[field] === value)
    return records[0] ?? null
  }

  async findById(id: string) {
    const record = await this.prismaClient.workflowRecord.findUnique({ where: { id } })
    return record?.collection === this.collection ? toRecord(record) : null
  }

  async list(query: Record<string, unknown> = {}, predicate: (record: AnyRecord) => boolean = () => true) {
    return pageEnvelope(await this.listAll(predicate), query)
  }

  async listAll(predicate: (record: AnyRecord) => boolean = () => true) {
    const records = await this.prismaClient.workflowRecord.findMany({
      where: { collection: this.collection },
      orderBy: { createdAt: 'desc' }
    })
    return records.map(toRecord).filter(predicate)
  }

  async updateById(id: string, patch: Record<string, any>) {
    const existing = await this.prismaClient.workflowRecord.findUnique({ where: { id } })
    if (!existing || existing.collection !== this.collection) return null

    const current = toRecord(existing)
    const currentData: Record<string, any> = { ...current }
    delete currentData.id
    delete currentData.createdAt
    delete currentData.updatedAt
    const record = await this.prismaClient.workflowRecord.update({
      where: { id },
      data: {
        data: toJsonInput({ ...currentData, ...patch })
      }
    })
    return toRecord(record)
  }
}

function createPrismaRecordRepository(collection: string) {
  return new PrismaRecordRepository(prisma, collection)
}

function createPrismaRecordRepositoryWithClient(prismaClient: PrismaRecordClient, collection: string) {
  return new PrismaRecordRepository(prismaClient, collection)
}

function runPrismaRecordTransaction<T>(
  callback: (createRepository: CreatePrismaRecordRepository, tx: Prisma.TransactionClient) => Promise<T>
) {
  return prisma.$transaction((transactionClient) => callback(
    (collection) => createPrismaRecordRepositoryWithClient(transactionClient, collection),
    transactionClient
  ))
}

export {
  PrismaRecordRepository,
  createPrismaRecordRepository,
  createPrismaRecordRepositoryWithClient,
  runPrismaRecordTransaction,
  type AnyRecord,
  type CreatePrismaRecordRepository
}
