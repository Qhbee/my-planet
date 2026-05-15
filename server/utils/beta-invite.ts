import type { H3Event } from 'h3'

/**
 * 内测邀请码：仅服务端读取。
 * `NUXT_BETA_APPS_INVITE_CODE`（Nuxt 运行时）。
 * 未配置时 `/api/beta/unlock` 会拒绝服务（503），避免误用空串与任意输入匹配。
 */
export function getBetaAppsInviteCode(): string {
  return (process.env.NUXT_BETA_APPS_INVITE_CODE ?? '19001224').trim()
}

/**
 * 是否允许访问 Iskra / Drive：仅当加密 session 中 `betaAppsUnlocked === true`（含已 GitHub 登录用户，亦须先过邀请码）。
 * `setUserSession({ betaAppsUnlocked: true })` 与现有 `user` 等字段合并，不替换登录态，聊天记录仍关联 `session.user.id`。
 * 与 `server/middleware/beta-apps.ts`、`/api/beta/status` 共用。
 */
export async function hasBetaAppsAccess(event: H3Event): Promise<boolean> {
  const session = await getUserSession(event)
  if (!session) {
    return false
  }
  return session.betaAppsUnlocked === true
}

/** 邀请码校验通过后：写入 sealed session。 */
export async function setBetaAppsUnlocked(event: H3Event): Promise<void> {
  await setUserSession(event, { betaAppsUnlocked: true })
}

/** 下线内测门时可调用；注意 nuxt-auth-utils 对 merge 删除字段的行为，仅作显式关断用。 */
export async function clearBetaAppsUnlocked(event: H3Event): Promise<void> {
  await setUserSession(event, { betaAppsUnlocked: false })
}
