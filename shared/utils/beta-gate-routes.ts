/**
 * 内测门禁覆盖的应用 slug；与 `server/middleware/beta-apps`、`app/middleware/beta-apps.global`、项目列表角标共用。
 */
export const BETA_GATED_APP_SLUGS = ['iskra', 'drive'] as const

const SLUG_SET = new Set<string>(BETA_GATED_APP_SLUGS)

/** 内容里 `slug` 是否属于内测应用（用于 projects 列表角标等）。 */
export function isBetaGatedAppSlug(slug: string): boolean {
  return SLUG_SET.has(slug)
}

/** Nitro：`/api/{slug}/...` 是否受内测保护。 */
export function isBetaGatedApiPath(path: string): boolean {
  const p = (path.split('?')[0] ?? '').trim()
  return BETA_GATED_APP_SLUGS.some(slug => p.startsWith(`/api/${slug}`))
}

/**
 * 路由：`/…/projects/{slug}/…` 是否需先过内测（兼容 i18n 前缀）。
 * 解锁页本身排除，避免重定向环。
 */
export function isBetaGatedProjectsPagePath(path: string): boolean {
  if (path.includes('/projects/beta-unlock')) {
    return false
  }
  return BETA_GATED_APP_SLUGS.some(slug => path.includes(`/projects/${slug}`))
}
