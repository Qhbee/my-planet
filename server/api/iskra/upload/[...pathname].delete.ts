// import { blob } from 'hub:blob'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  // const { user } = await requireUserSession(event)
  // const { username } = user
  await getUserSession(event)

  // const { pathname } = await getValidatedRouterParams(event, z.object({
  await getValidatedRouterParams(event, z.object({
    pathname: z.string().min(1)
  }).parse)

  // if (!pathname.startsWith(`${username}/`)) {
  //   throw createError({
  //     statusCode: 403,
  //     statusMessage: 'You do not have permission to delete this file'
  //   })
  // }

  // await blob.del(pathname)
  // TODO: replace with real blob storage

  return sendNoContent(event)
})
