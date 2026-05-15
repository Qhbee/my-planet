import { isBetaGatedProjectsPagePath } from '~~/shared/utils/beta-gate-routes'

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.prerender) {
    return
  }

  if (!isBetaGatedProjectsPagePath(to.path)) {
    return
  }

  const fetch = import.meta.server ? useRequestFetch() : $fetch
  let unlocked = false
  try {
    const res = await fetch<{ unlocked: boolean }>('/api/beta/status')
    unlocked = Boolean(res?.unlocked)
  } catch {
    unlocked = false
  }

  if (unlocked) {
    return
  }

  const localePath = useLocalePath()
  return navigateTo({
    path: localePath('/projects/beta-unlock'),
    query: { redirect: to.fullPath }
  })
})
