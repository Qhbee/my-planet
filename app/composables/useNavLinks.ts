import type { NavigationMenuItem } from '@nuxt/ui'
import { navLinks } from '~/utils/links'

/** 主导航：当前语言下的路径与文案（勿把 `navLinks` 直接当 href 用）。 */
export function useNavLinks() {
  const { t } = useI18n()
  const localePath = useLocalePath()

  return computed<NavigationMenuItem[]>(() =>
    navLinks.map(({ label, to, ...rest }) => ({
      ...rest,
      label: t(label!),
      to: localePath(to!)
    }))
  )
}
