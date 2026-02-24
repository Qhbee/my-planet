import { readMultipartFormData } from 'h3'
import { getDriveStorage } from '../../utils/storage'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB per file
const MAX_FILES = 100

function bufferToStream(buffer: Buffer): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(buffer))
      controller.close()
    }
  })
}

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const userId = session.user?.id ?? session.id

  const parts = await readMultipartFormData(event)
  if (!parts || parts.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No upload data' })
  }

  let basePath = '/'
  const relativePaths: string[] = []
  const fileParts: { data: Buffer, filename: string }[] = []

  for (const part of parts) {
    const name = part.name ?? ''
    if (name === 'path' && part.data) {
      basePath = part.data.toString('utf-8').trim() || '/'
    } else if (name === 'relativePaths' && part.data) {
      const str = part.data.toString('utf-8').trim()
      if (str) {
        relativePaths.push(...str.split(/\r?\n/).map(p => p.trim()).filter(Boolean))
      }
    } else if ((name === 'files' || name === 'file') && part.data && part.filename) {
      if (part.data.length > MAX_FILE_SIZE) {
        throw createError({
          statusCode: 400,
          statusMessage: `File ${part.filename} exceeds 100MB limit`
        })
      }
      fileParts.push({ data: part.data, filename: part.filename })
    }
  }

  if (fileParts.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No files to upload' })
  }
  if (fileParts.length > MAX_FILES) {
    throw createError({ statusCode: 400, statusMessage: `Too many files (max ${MAX_FILES})` })
  }

  const storage = getDriveStorage()
  const normalizedBase = basePath === '/' ? '' : basePath.replace(/\/$/, '')

  for (let i = 0; i < fileParts.length; i++) {
    const { data, filename } = fileParts[i]!
    const relativePath = relativePaths[i] ?? filename
    const safePath = relativePath.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\.\./g, '')
    const fullPath = normalizedBase ? `/${normalizedBase}/${safePath}` : `/${safePath}`

    const stream = bufferToStream(data)
    await storage.put(userId, fullPath, stream)
  }

  return { success: true, count: fileParts.length }
})
