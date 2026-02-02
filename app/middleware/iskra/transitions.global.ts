// 仅在 iskra 对话页之间切换时关闭 view transition，避免动画卡顿
export default defineNuxtRouteMiddleware((to, from) => {
  if (import.meta.server) return
  const isIskraChat = (path: string) => path.includes('/projects/iskra/chat')
  if (!isIskraChat(to.path) || !isIskraChat(from.path)) return
  if (to.params.id && from.params.id) {
    to.meta.viewTransition = false
  }
})
