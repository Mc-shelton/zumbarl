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

// Treat punctuation, whitespace and casing as presentation differences so
// common variants such as Node.js, node js and nodejs share one catalog item.
function canonicalSkillKey(name: string) {
  return normalizeSkillName(name).toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function editDistance(left: string, right: string) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index)
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex]
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1)
      )
    }
    previous.splice(0, previous.length, ...current)
  }
  return previous[right.length]
}

function skillMatchScore(skill: Record<string, any>, search: string) {
  const searchKey = canonicalSkillKey(search)
  const candidates = [skill.name, ...(skill.aliases || []).map((alias: Record<string, any>) => alias.name)]
  let best = Number.POSITIVE_INFINITY
  for (const candidate of candidates) {
    const key = canonicalSkillKey(String(candidate))
    if (key === searchKey) best = Math.min(best, 0)
    else if (key.startsWith(searchKey) || searchKey.startsWith(key)) best = Math.min(best, 1)
    else if (key.includes(searchKey) || searchKey.includes(key)) best = Math.min(best, 2)
    else if (searchKey.length >= 5 && editDistance(key, searchKey) <= Math.max(1, Math.floor(searchKey.length * 0.2))) best = Math.min(best, 3)
  }
  return best
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
      ...(!search ? { take: limit } : {})
    })

    const matchedSkills = search
      ? skills.map((skill) => ({ skill, score: skillMatchScore(skill, search) }))
        .filter(({ score }) => Number.isFinite(score))
        .sort((left, right) => left.score - right.score || right.skill.usageCount - left.skill.usageCount || left.skill.name.localeCompare(right.skill.name))
        .slice(0, limit)
        .map(({ skill }) => skill)
      : skills

    return {
      data: matchedSkills.map(toSkillResponse),
      meta: {
        page: 1,
        pageSize: matchedSkills.length,
        total: matchedSkills.length
      }
    }
  }

  async createSkill(payload: Record<string, any>, actorId: string | undefined) {
    return prisma.$transaction(async (transaction) => {
      const name = normalizeSkillName(String(payload.name ?? ''))
      const slug = createSkillSlug(name)
      const categoryId = await ensureSkillCategory(transaction, payload)

      const existingSkills = await transaction.skill.findMany({
        where: { status: { not: 'archived' } },
        include: { aliases: true, category: true }
      })
      const canonicalKey = canonicalSkillKey(name)
      const equivalent = existingSkills.find((candidate) => (
        canonicalSkillKey(candidate.name) === canonicalKey
        || candidate.aliases.some((alias) => canonicalSkillKey(alias.name) === canonicalKey)
      ))
      if (equivalent) {
        const existing = await transaction.skill.update({
          where: { id: equivalent.id },
          data: { status: 'active', usageCount: { increment: 1 } },
          include: { aliases: true, category: true }
        })
        return toSkillResponse(existing)
      }

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
  canonicalSkillKey,
  normalizeSkillName,
  skillsRepository
}
