import { z } from 'zod'
import { getDriveStorage } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const userId = session.user?.id ?? session.id
  const query = await getValidatedQuery(event, z.object({
    path: z.string().default('/')
  }).parse)

  const storage = getDriveStorage()
  const entries = await storage.list(userId, query.path)

  return { entries }
})
