import type { Prisma } from '@prisma/client'
import { prisma } from '../../../lib/prisma.js'

type ProjectPortfolioDraft = {
  studentId: string
  opportunityId: string
  projectId: string
  title: string
  description: string
  category: string
  fileUrls: string[]
  thumbnailUrl?: string | null
  companyName?: string | null
  clientFeedback?: string | null
  impactMetrics?: Prisma.InputJsonValue
}

class StudentPortfolioRepository {
  findOwned(studentId: string, id: string) {
    return prisma.portfolioItem.findFirst({ where: { id, studentId } })
  }

  async upsertProjectDraft(payload: ProjectPortfolioDraft) {
    const id = `project-portfolio-${payload.projectId}-${payload.studentId}`
    const existing = await prisma.portfolioItem.findUnique({ where: { id } })
    const item = await prisma.portfolioItem.upsert({
      where: { id },
      create: {
        id,
        ...payload,
        sourceFileUrls: payload.fileUrls,
        isPublic: false,
        status: 'DRAFT',
        showClientName: false,
        metricsVerified: true
      },
      update: {
        metricsVerified: true,
        clientFeedback: payload.clientFeedback ?? undefined,
        impactMetrics: payload.impactMetrics,
        sourceFileUrls: payload.fileUrls
      }
    })
    return { item, created: !existing }
  }

  updateOwned(studentId: string, id: string, data: Prisma.PortfolioItemUpdateInput) {
    return prisma.portfolioItem.updateMany({ where: { id, studentId, status: { not: 'ARCHIVED' } }, data })
  }

  markShared(studentId: string, id: string, sharedPostId: string) {
    return prisma.portfolioItem.updateMany({ where: { id, studentId, status: 'PUBLISHED' }, data: { sharedPostId } })
  }
}

const studentPortfolioRepository = new StudentPortfolioRepository()

export {
  StudentPortfolioRepository,
  studentPortfolioRepository,
  type ProjectPortfolioDraft
}
