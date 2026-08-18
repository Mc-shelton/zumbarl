import path from 'node:path'

const CAMPAIGN_FILE_MATCH_THRESHOLD = 0.9

function normalizeForComparison(value: string) {
  return value
    .normalize('NFKD')
    .replace(/\p{Mark}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function levenshteinDistance(left: string, right: string) {
  if (left === right) return 0
  if (!left.length) return right.length
  if (!right.length) return left.length

  let previous = Array.from({ length: right.length + 1 }, (_, index) => index)
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex]
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + substitutionCost
      )
    }
    previous = current
  }
  return previous[right.length]
}

function campaignFileSimilarity(fileName: string, campaignTitle: string) {
  const fileBaseName = path.parse(path.basename(fileName)).name
  const normalizedFileName = normalizeForComparison(fileBaseName)
  const normalizedTitle = normalizeForComparison(campaignTitle)
  const longestLength = Math.max(normalizedFileName.length, normalizedTitle.length)
  if (!longestLength) return 1
  return 1 - (levenshteinDistance(normalizedFileName, normalizedTitle) / longestLength)
}

function campaignTitleFileName(campaignTitle: string, originalFileName: string) {
  const extension = path.extname(path.basename(originalFileName)).toLowerCase()
  const titleBaseName = campaignTitle
    .normalize('NFKD')
    .replace(/\p{Mark}/gu, '')
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'campaign'
  return `${titleBaseName}${extension}`
}

function resolveCampaignFileRename(fileName: string, campaignTitle: string) {
  const nextFileName = campaignTitleFileName(campaignTitle, fileName)
  const similarity = campaignFileSimilarity(fileName, campaignTitle)
  return {
    fileName: nextFileName,
    similarity,
    shouldRename: similarity >= CAMPAIGN_FILE_MATCH_THRESHOLD
      && path.basename(fileName) !== nextFileName
  }
}

export {
  CAMPAIGN_FILE_MATCH_THRESHOLD,
  campaignFileSimilarity,
  campaignTitleFileName,
  levenshteinDistance,
  resolveCampaignFileRename
}
