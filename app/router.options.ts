import type { RouterConfig } from '@nuxt/schema'

// 匹配 i18n prefix 常见格式：/en、/zh、/en-US、/zh-CN 等，新增语言无需改代码
const stripLocale = (path: string) => path.replace(/^\/([a-z]{2}(?:-[a-z]{2})?)(\/|$)/, '$2') || '/'

export default <RouterConfig>{
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    // 同页切换语言（仅 locale 前缀不同）：保留滚动位置
    if (stripLocale(from.path) === stripLocale(to.path)) return false
    return { top: 0 }
  }
}
