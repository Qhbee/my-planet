import { z } from 'zod'
import { getDriveStorage } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const userId = session.user?.id ?? session.id
  const query = await getValidatedQuery(event, z.object({
    path: z.string().min(1)
  }).parse)

  const storage = getDriveStorage()
  const { stream, size } = await storage.get(userId, query.path)

  const pathParts = query.path.split('/')
  const filename = pathParts[pathParts.length - 1] ?? 'download'

  setResponseHeader(event, 'Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
  if (size !== undefined) {
    setResponseHeader(event, 'Content-Length', size)
  }

  return stream
})
