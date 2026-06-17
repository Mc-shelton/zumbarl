import { createPrismaRecordRepository } from '../../../shared/repositories/index.js'

const uploads = createPrismaRecordRepository('uploads')

class UploadsRepository {
  createUpload(payload: Record<string, any>) {
    return uploads.create(payload)
  }

  updateUpload(id: string, patch: Record<string, any>) {
    return uploads.updateById(id, patch)
  }
}

const uploadsRepository = new UploadsRepository()

export {
  UploadsRepository,
  uploadsRepository
}
