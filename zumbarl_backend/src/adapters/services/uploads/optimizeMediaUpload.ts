import { spawn } from 'node:child_process'
import type { Buffer } from 'node:buffer'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import sharp from 'sharp'

const IMAGE_QUALITY = 84
const VIDEO_CRF = 22
const VIDEO_TIMEOUT_MS = 3 * 60 * 1000
const PROTECTED_SCOPE_MARKERS = [
  'kyc',
  'identity',
  'kra',
  'certificate',
  'deliverable',
  'submission',
  'proof',
  'stats-evidence',
  'social-metrics'
]

type MediaOptimizationMetadata = {
  status: 'optimized' | 'skipped'
  encoder?: 'sharp-webp' | 'ffmpeg-h264'
  originalFileName: string
  originalMimeType: string
  originalSizeBytes: number
  optimizedSizeBytes: number
  bytesSaved: number
  savingsPercent: number
  width?: number
  height?: number
  reason?: string
}

type MediaOptimizationResult = {
  buffer: Buffer
  fileName: string
  mimeType: string
  optimization: MediaOptimizationMetadata
}

function replaceExtension(fileName: string, extension: string) {
  const parsed = path.parse(fileName)
  return `${parsed.name || 'media'}.${extension.replace(/^\./, '')}`
}

function savings(originalSizeBytes: number, optimizedSizeBytes: number) {
  const bytesSaved = Math.max(0, originalSizeBytes - optimizedSizeBytes)
  return {
    bytesSaved,
    savingsPercent: originalSizeBytes
      ? Math.round((bytesSaved / originalSizeBytes) * 1000) / 10
      : 0
  }
}

function shouldPreserveOriginal(scope: string) {
  const normalizedScope = scope.toLowerCase()
  return PROTECTED_SCOPE_MARKERS.some((marker) => normalizedScope.includes(marker))
}

function shouldOptimizeMedia(mimeType: string, scope: string) {
  if (shouldPreserveOriginal(scope)) return false
  return mimeType.toLowerCase().startsWith('image/') || mimeType.toLowerCase().startsWith('video/')
}

function imageMaxEdge(scope: string) {
  const normalizedScope = scope.toLowerCase()
  if (normalizedScope.includes('avatar') || normalizedScope.includes('profile-picture') || normalizedScope.includes('logo')) return 512
  if (normalizedScope.includes('thumbnail')) return 960
  return 1920
}

function skippedResult(payload: { buffer: Buffer; fileName: string; mimeType: string }, reason: string): MediaOptimizationResult {
  return {
    ...payload,
    optimization: {
      status: 'skipped',
      originalFileName: payload.fileName,
      originalMimeType: payload.mimeType,
      originalSizeBytes: payload.buffer.byteLength,
      optimizedSizeBytes: payload.buffer.byteLength,
      bytesSaved: 0,
      savingsPercent: 0,
      reason
    }
  }
}

async function optimizeImage(payload: { buffer: Buffer; fileName: string; mimeType: string; scope: string }): Promise<MediaOptimizationResult> {
  const maxEdge = imageMaxEdge(payload.scope)
  const source = sharp(payload.buffer, {
    animated: true,
    failOn: 'error',
    limitInputPixels: 100_000_000
  })
  const sourceMetadata = await source.metadata()
  const optimizedBuffer = await source
    .rotate()
    .resize({
      width: maxEdge,
      height: maxEdge,
      fit: 'inside',
      withoutEnlargement: true
    })
    .webp({ quality: IMAGE_QUALITY, effort: 4, smartSubsample: true })
    .toBuffer()

  // Tiny or already-optimized images can grow after transcoding. Retain them
  // rather than spending more storage for no visual benefit.
  if (optimizedBuffer.byteLength >= payload.buffer.byteLength) {
    return skippedResult(payload, 'optimized-output-not-smaller')
  }

  return {
    buffer: optimizedBuffer,
    fileName: replaceExtension(payload.fileName, 'webp'),
    mimeType: 'image/webp',
    optimization: {
      status: 'optimized',
      encoder: 'sharp-webp',
      originalFileName: payload.fileName,
      originalMimeType: payload.mimeType,
      originalSizeBytes: payload.buffer.byteLength,
      optimizedSizeBytes: optimizedBuffer.byteLength,
      ...savings(payload.buffer.byteLength, optimizedBuffer.byteLength),
      width: sourceMetadata.width,
      height: sourceMetadata.height
    }
  }
}

function runFfmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const process = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] })
    let stderr = ''
    const timeout = globalThis.setTimeout(() => {
      process.kill('SIGKILL')
      reject(new Error('Video optimization timed out'))
    }, VIDEO_TIMEOUT_MS)
    timeout.unref()

    process.stderr.on('data', (chunk) => {
      stderr = `${stderr}${String(chunk)}`.slice(-8000)
    })
    process.once('error', (error) => {
      globalThis.clearTimeout(timeout)
      reject(error)
    })
    process.once('exit', (code, signal) => {
      globalThis.clearTimeout(timeout)
      if (code === 0) resolve()
      else reject(new Error(`FFmpeg exited with ${signal || code}: ${stderr.slice(-1200)}`))
    })
  })
}

async function optimizeVideo(payload: { buffer: Buffer; fileName: string; mimeType: string }): Promise<MediaOptimizationResult> {
  const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'zumbarl-media-'))
  const inputExtension = path.extname(payload.fileName) || '.video'
  const inputPath = path.join(temporaryDirectory, `input${inputExtension}`)
  const outputPath = path.join(temporaryDirectory, 'output.mp4')

  try {
    await fs.writeFile(inputPath, payload.buffer)
    await runFfmpeg([
      '-hide_banner',
      '-loglevel', 'error',
      '-y',
      '-i', inputPath,
      '-map', '0:v:0',
      '-map', '0:a?',
      '-map_metadata', '-1',
      '-sn',
      '-vf', "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2",
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', String(VIDEO_CRF),
      '-pix_fmt', 'yuv420p',
      '-threads', '1',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      outputPath
    ])
    const optimizedBuffer = await fs.readFile(outputPath)
    if (optimizedBuffer.byteLength >= payload.buffer.byteLength) {
      return skippedResult(payload, 'optimized-output-not-smaller')
    }
    return {
      buffer: optimizedBuffer,
      fileName: replaceExtension(payload.fileName, 'mp4'),
      mimeType: 'video/mp4',
      optimization: {
        status: 'optimized',
        encoder: 'ffmpeg-h264',
        originalFileName: payload.fileName,
        originalMimeType: payload.mimeType,
        originalSizeBytes: payload.buffer.byteLength,
        optimizedSizeBytes: optimizedBuffer.byteLength,
        ...savings(payload.buffer.byteLength, optimizedBuffer.byteLength)
      }
    }
  } finally {
    await fs.rm(temporaryDirectory, { force: true, recursive: true })
  }
}

async function optimizeMediaBuffer(payload: { buffer: Buffer; fileName: string; mimeType: string; scope: string }) {
  if (!shouldOptimizeMedia(payload.mimeType, payload.scope)) {
    return skippedResult(payload, shouldPreserveOriginal(payload.scope) ? 'protected-scope' : 'unsupported-media-type')
  }
  if (payload.mimeType.toLowerCase().startsWith('image/')) return optimizeImage(payload)
  return optimizeVideo(payload)
}

export {
  optimizeMediaBuffer,
  shouldOptimizeMedia,
  shouldPreserveOriginal,
  type MediaOptimizationMetadata,
  type MediaOptimizationResult
}
