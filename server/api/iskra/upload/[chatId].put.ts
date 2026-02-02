// import { blob } from 'hub:blob'
// import { db, schema } from 'hub:db'
// import { db, schema } from '../../utils/db'
import { db, schema } from '#db'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  // const { user } = await requireUserSession(event)
  const session = await getUserSession(event)

  const { chatId } = await getValidatedRouterParams(event, z.object({
    chatId: z.string()
  }).parse)

  // const userId = user.id
  const userId = session.user?.id ?? session.id

  const chat = await db.query.chats.findFirst({
    where: () => eq(schema.chats.id, chatId)
  })

  if (chat && chat.userId !== userId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'You do not have permission to upload files to this chat'
    })
  }

  // const username = user.username

  // return blob.handleUpload(event, {
  //   formKey: 'files',
  //   multiple: false,
  //   ensure: {
  //     maxSize: FILE_UPLOAD_CONFIG.maxSize,
  //     types: [...FILE_UPLOAD_CONFIG.types]
  //   },
  //   put: {
  //     addRandomSuffix: true,
  //     prefix: `${username}/${chatId}`
  //   }
  // TODO: replace with real blob storage (e.g. local fs or S3)
  throw createError({
    statusCode: 501,
    statusMessage: 'Upload not configured'
  })
})
