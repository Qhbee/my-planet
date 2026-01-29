<script setup lang="ts">
import type { Locale } from '#i18n'
import type { DropdownMenuItem } from '@nuxt/ui'

type LocaleEntry = {
  code: Locale
  label: string
}

type LocaleDropdownItem = DropdownMenuItem & {
  code: string
}

// 获取 i18n 核心数据：当前语言(locale) 和 配置列表(locales)
const { locale, locales } = useI18n()
// 获取路径生成器：根据语言代码生成对应的 URL
const switchLocalePath = useSwitchLocalePath()
// 获取路由实例：用于执行页面跳转
const router = useRouter()

// 全部语言列表，格式标准化
const localeEntries = computed<LocaleEntry[]>(() =>
  locales.value.map(l => ({
    code: l.code,
    label: l.name || l.code
  }))
)

// 当前语言信息
const currentLabel = computed(() => {
  const found = localeEntries.value.find(i => i.code === locale.value)
  return found?.label || locale.value
})

// 下拉菜单选项
const items = computed<LocaleDropdownItem[][]>(() => [
  localeEntries.value.map((l): LocaleDropdownItem => ({
    code: l.code,
    label: l.label,
    // icon: l.code === locale.value ? 'i-lucide-check' : 'i-lucide-dot',
    type: 'checkbox',
    checked: l.code === locale.value,
    onSelect: async () => {
      const path = switchLocalePath(l.code)
      if (!path) return
      await router.push(path)
    }
  }))
])
</script>

<template>
  <UDropdownMenu :items="items">
    <UButton
      variant="ghost"
      color="neutral"
      size="sm"
      icon="i-lucide-languages"
      trailing-icon="i-lucide-chevron-down"
    >
      <span class="hidden sm:inline whitespace-nowrap text-xs">{{ currentLabel }}</span>
    </UButton>
  </UDropdownMenu>
</template>
