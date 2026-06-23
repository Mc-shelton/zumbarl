import { Prisma } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'

function normalizeSkillName(name: string) {
  return name.trim().replace(/\s+/g, ' ')
}

function createSkillSlug(name: string) {
  return normalizeSkillName(name)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function toSkillResponse(skill: Record<string, any>) {
  return {
    id: skill.id,
    name: skill.name,
    slug: skill.slug,
    categoryId: skill.categoryId,
    category: skill.category,
    status: skill.status,
    source: skill.source,
    usageCount: skill.usageCount,
    aliases: skill.aliases?.map((alias: Record<string, any>) => alias.name) ?? [],
    isSeed: skill.isSeed,
    createdAt: skill.createdAt,
    updatedAt: skill.updatedAt
  }
}

async function ensureSkillCategory(transaction: Prisma.TransactionClient, payload: Record<string, any>) {
  const categoryName = normalizeSkillName(String(payload.categoryName ?? ''))
  if (!categoryName) return payload.categoryId

  const slug = createSkillSlug(categoryName)
  const category = await transaction.skillCategory.upsert({
    where: { slug },
    update: { status: 'active' },
    create: {
      name: categoryName,
      slug,
      status: 'active',
      isSeed: false
    }
  })
  return category.id
}

class SkillsRepository {
  async listSkills(query: Record<string, any>) {
    const search = normalizeSkillName(String(query.q ?? ''))
    const limit = Number(query.limit ?? 20)
    const where: Prisma.SkillWhereInput = {
      status: query.status ? String(query.status) : { not: 'archived' },
      ...(query.categoryId ? { categoryId: String(query.categoryId) } : {}),
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { slug: { contains: createSkillSlug(search), mode: 'insensitive' } },
          { aliases: { some: { name: { contains: search, mode: 'insensitive' } } } }
        ]
      } : {})
    }

    const skills = await prisma.skill.findMany({
      where,
      include: {
        aliases: true,
        category: true
      },
      orderBy: [
        { usageCount: 'desc' },
        { name: 'asc' }
      ],
      take: limit
    })

    return {
      data: skills.map(toSkillResponse),
      meta: {
        page: 1,
        pageSize: skills.length,
        total: skills.length
      }
    }
  }

  async createSkill(payload: Record<string, any>, actorId: string | undefined) {
    return prisma.$transaction(async (transaction) => {
      const name = normalizeSkillName(String(payload.name ?? ''))
      const slug = createSkillSlug(name)
      const categoryId = await ensureSkillCategory(transaction, payload)

      const skill = await transaction.skill.upsert({
        where: { slug },
        update: {
          categoryId: categoryId ?? undefined,
          status: 'active',
          usageCount: { increment: 1 }
        },
        create: {
          name,
          slug,
          categoryId: categoryId ?? undefined,
          status: 'active',
          source: payload.source ?? 'user_created',
          createdByUserId: actorId,
          usageCount: 1,
          isSeed: false
        },
        include: {
          aliases: true,
          category: true
        }
      })

      const aliases = Array.isArray(payload.aliases) ? payload.aliases : []
      for (const alias of aliases) {
        const aliasName = normalizeSkillName(String(alias ?? ''))
        if (!aliasName) continue
        await transaction.skillAlias.upsert({
          where: { slug: createSkillSlug(aliasName) },
          update: { skillId: skill.id },
          create: {
            skillId: skill.id,
            name: aliasName,
            slug: createSkillSlug(aliasName),
            source: 'user_created'
          }
        })
      }

      const refreshed = await transaction.skill.findUnique({
        where: { id: skill.id },
        include: {
          aliases: true,
          category: true
        }
      })
      return toSkillResponse(refreshed ?? skill)
    })
  }

  async ensureSkills(names: string[], payload: { actorId?: string; source?: string } = {}) {
    return prisma.$transaction(async (transaction) => {
      const uniqueNames = Array.from(new Map(names
        .map((name) => normalizeSkillName(String(name ?? '')))
        .filter(Boolean)
        .map((name) => [createSkillSlug(name), name])).values())

      const skills = []
      for (const name of uniqueNames) {
        const slug = createSkillSlug(name)
        const skill = await transaction.skill.upsert({
          where: { slug },
          update: { status: 'active', usageCount: { increment: 1 } },
          create: {
            name,
            slug,
            status: 'active',
            source: payload.source ?? 'system',
            createdByUserId: payload.actorId,
            usageCount: 1,
            isSeed: payload.source === 'seed'
          }
        })
        skills.push(skill)
      }
      return skills
    })
  }
}

const skillsRepository = new SkillsRepository()

export {
  SkillsRepository,
  createSkillSlug,
  normalizeSkillName,
  skillsRepository
}
