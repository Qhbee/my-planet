import { isBetaGatedApiPath } from '~~/shared/utils/beta-gate-routes'
import { hasBetaAppsAccess } from '~~/server/utils/beta-invite'

/**
 * 未通过内测邀请时，拒绝访问 Iskra / Drive 的 JSON API（与页面路由中间件配合）。
 * 放行条件与 `hasBetaAppsAccess` 一致：session 内 `betaAppsUnlocked === true`（含已登录 GitHub，亦须邀请码写入 session）。
 */
export default defineEventHandler(async (event) => {
  if (import.meta.prerender) {
    return
  }

  const path = ((event.path || '').split('?')[0]) ?? ''

  if (!isBetaGatedApiPath(path)) {
    return
  }

  if (event.method === 'OPTIONS') {
    return
  }

  if (await hasBetaAppsAccess(event)) {
    return
  }

  throw createError({
    statusCode: 401,
    statusMessage: 'Beta invite required',
    data: { code: 'BETA_REQUIRED' }
  })
})
