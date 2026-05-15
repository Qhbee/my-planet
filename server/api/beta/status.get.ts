import { hasBetaAppsAccess } from '~~/server/utils/beta-invite'

export default defineEventHandler(async (event) => {
  return { unlocked: await hasBetaAppsAccess(event) }
})
