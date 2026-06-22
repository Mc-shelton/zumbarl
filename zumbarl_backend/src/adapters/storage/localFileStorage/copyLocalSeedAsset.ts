import fs from 'node:fs/promises'
import path from 'node:path'
import { resolveLocalStoragePath, resolveLocalStorageUrl } from './resolveLocalStoragePaths.js'

async function copyLocalSeedAsset(sourcePath: string, bucket: string, storageKey: string) {
  const destinationPath = resolveLocalStoragePath(bucket, storageKey)
  await fs.mkdir(path.dirname(destinationPath), { recursive: true })
  await fs.copyFile(sourcePath, destinationPath)
  return resolveLocalStorageUrl(bucket, storageKey)
}

export {
  copyLocalSeedAsset
}
