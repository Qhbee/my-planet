import { z } from 'zod'
import { getDriveStorage } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const userId = session.user?.id ?? session.id
  const body = await readValidatedBody(event, z.object({
    oldPath: z.string().min(1),
    newPath: z.string().min(1)
  }).parse)

  const storage = getDriveStorage()
  await storage.rename(userId, body.oldPath, body.newPath)

  return { success: true }
})
