import { z } from 'zod'
import { getDriveStorage } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const userId = session.user?.id ?? session.id
  const body = await readValidatedBody(event, z.object({
    path: z.string().min(1)
  }).parse)

  const storage = getDriveStorage()
  await storage.mkdir(userId, body.path)

  return { success: true }
})
