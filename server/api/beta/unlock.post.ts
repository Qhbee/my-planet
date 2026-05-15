import { z } from 'zod'
import { getBetaAppsInviteCode, setBetaAppsUnlocked } from '~~/server/utils/beta-invite'

export default defineEventHandler(async (event) => {
  const betaAppsInviteCode = getBetaAppsInviteCode()
  if (!betaAppsInviteCode) {
    throw createError({ statusCode: 503, statusMessage: 'Beta invite is not configured. Set NUXT_BETA_APPS_INVITE_CODE.' })
  }

  const { code } = await readValidatedBody(event, z.object({
    code: z.string()
  }).parse)

  if (code.trim() !== betaAppsInviteCode) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid invite code' })
  }

  await setBetaAppsUnlocked(event)
  return { ok: true as const }
})
