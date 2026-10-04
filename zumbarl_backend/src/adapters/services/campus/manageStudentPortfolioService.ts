import { ApiError, notFound } from '../../../lib/http.js'
import { connectCommunityRepository } from '../../repositories/connect/index.js'
import { studentPortfolioRepository } from '../../repositories/campus/index.js'

async function requireOwnedPortfolioItem(studentId: string | undefined, id: string) {
  if (!studentId) return notFound('Student profile')
  return await studentPortfolioRepository.findOwned(studentId, id) ?? notFound('Portfolio item')
}

async function hideSharedPortfolioPost(studentId: string, item: Record<string, any>) {
  if (!item.sharedPostId) return
  const post = await connectCommunityRepository.findPost(item.sharedPostId)
  if (post?.studentId === studentId && post.type === 'project-update') {
    await connectCommunityRepository.updatePost(post.id, { status: 'removed' })
  }
}

function sharedPostPayload(item: Record<string, any>, payload: Record<string, any>) {
  const commentary = String(payload.commentary || '').trim()
  const clientLabel = item.showClientName && item.companyName ? ` for ${item.companyName}` : ''
  return {
    studentId: item.studentId,
    type: 'project-update',
    body: [commentary, `New portfolio project: ${item.title}${clientLabel}`, item.description].filter(Boolean).join('\n\n'),
    visibility: payload.visibility,
    mediaUrls: item.fileUrls.slice(0, 8),
    portfolio: {
      id: item.id,
      title: item.title,
      category: item.category,
      href: `/campus/profiles/${item.studentId}?tab=portfolio&portfolio=${encodeURIComponent(item.id)}`
    },
    status: 'published'
  }
}

async function updateStudentPortfolioItemService(studentId: string | undefined, id: string, payload: Record<string, any>) {
  const item = await requireOwnedPortfolioItem(studentId, id)
  if (item.status === 'ARCHIVED') throw new ApiError(409, 'Archived portfolio work cannot be edited.', 'PORTFOLIO_ITEM_ARCHIVED')

  const allowedFiles = new Set(item.sourceFileUrls)
  const fileUrls = payload.fileUrls === undefined ? item.fileUrls : payload.fileUrls
  if (fileUrls.some((url: string) => !allowedFiles.has(url))) {
    throw new ApiError(400, 'Portfolio files must come from the verified project submission.', 'PORTFOLIO_FILE_NOT_VERIFIED')
  }
  const thumbnailUrl = payload.thumbnailUrl === undefined ? item.thumbnailUrl : payload.thumbnailUrl || null
  if (thumbnailUrl && thumbnailUrl !== item.thumbnailUrl && !allowedFiles.has(thumbnailUrl)) {
    throw new ApiError(400, 'Choose a thumbnail from the verified project files.', 'PORTFOLIO_THUMBNAIL_NOT_VERIFIED')
  }

  await studentPortfolioRepository.updateOwned(studentId!, id, {
    title: payload.title,
    description: payload.description,
    category: payload.category,
    fileUrls,
    thumbnailUrl,
    showClientName: payload.showClientName,
    isFeatured: payload.isFeatured
  })
  if (item.sharedPostId && ['title', 'description', 'category', 'fileUrls', 'showClientName'].some((field) => payload[field] !== undefined)) {
    await hideSharedPortfolioPost(studentId!, item)
    await studentPortfolioRepository.updateOwned(studentId!, id, { sharedPostId: null })
  }
  return studentPortfolioRepository.findOwned(studentId!, id)
}

async function publishStudentPortfolioItemService(studentId: string | undefined, id: string) {
  const item = await requireOwnedPortfolioItem(studentId, id)
  if (item.status === 'ARCHIVED') throw new ApiError(409, 'Restore this work before publishing it.', 'PORTFOLIO_ITEM_ARCHIVED')
  if (!item.title.trim() || !item.description.trim()) {
    throw new ApiError(409, 'Add a title and description before publishing.', 'PORTFOLIO_ITEM_INCOMPLETE')
  }
  await studentPortfolioRepository.updateOwned(studentId!, id, {
    status: 'PUBLISHED',
    isPublic: true,
    publishedAt: item.publishedAt ?? new Date()
  })
  return studentPortfolioRepository.findOwned(studentId!, id)
}

async function unpublishStudentPortfolioItemService(studentId: string | undefined, id: string) {
  const item = await requireOwnedPortfolioItem(studentId, id)
  if (item.status === 'ARCHIVED') throw new ApiError(409, 'This portfolio item is archived.', 'PORTFOLIO_ITEM_ARCHIVED')
  await hideSharedPortfolioPost(studentId!, item)
  await studentPortfolioRepository.updateOwned(studentId!, id, { status: 'DRAFT', isPublic: false })
  return studentPortfolioRepository.findOwned(studentId!, id)
}

async function archiveStudentPortfolioItemService(studentId: string | undefined, id: string) {
  const item = await requireOwnedPortfolioItem(studentId, id)
  await hideSharedPortfolioPost(studentId!, item)
  await studentPortfolioRepository.updateOwned(studentId!, id, { status: 'ARCHIVED', isPublic: false })
  return { id, archived: true }
}

async function shareStudentPortfolioItemService(studentId: string | undefined, id: string, payload: Record<string, any>) {
  const item = await requireOwnedPortfolioItem(studentId, id)
  if (item.status !== 'PUBLISHED' || !item.isPublic) {
    throw new ApiError(409, 'Publish this portfolio item before sharing it.', 'PORTFOLIO_ITEM_NOT_PUBLISHED')
  }

  const postPayload = sharedPostPayload(item, payload)
  const existingPost = item.sharedPostId ? await connectCommunityRepository.findPost(item.sharedPostId) : null
  const canReusePost = Boolean(existingPost && existingPost.studentId === studentId && existingPost.type === 'project-update')
  const post = canReusePost
    ? await connectCommunityRepository.updatePost(existingPost!.id, postPayload)
    : await connectCommunityRepository.createPost(postPayload)
  if (!post) return notFound('Shared portfolio post')
  await studentPortfolioRepository.markShared(studentId!, id, post.id)
  return { post, portfolioItem: await studentPortfolioRepository.findOwned(studentId!, id) }
}

export {
  archiveStudentPortfolioItemService,
  publishStudentPortfolioItemService,
  shareStudentPortfolioItemService,
  unpublishStudentPortfolioItemService,
  updateStudentPortfolioItemService
}
