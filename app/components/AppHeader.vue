<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { t } = useI18n()
const localePath = useLocalePath()

const props = defineProps<{
  links: NavigationMenuItem[]
}>()

const localizedLinks = computed<NavigationMenuItem[]>(() =>
  props.links.map(link => ({
    ...link, // ← 把原 link 的所有属性复制过来
    label: typeof link.label === 'string' ? t(link.label) : link.label,
    to: typeof link.to === 'string' ? localePath(link.to) : link.to
  }))
)
</script>

<template>
  <div class="fixed top-2 sm:top-4 mx-auto left-1/2 transform -translate-x-1/2 z-10">
    <UNavigationMenu
      :items="localizedLinks"
      variant="link"
      color="neutral"
      class="bg-muted/80 backdrop-blur-sm rounded-full px-2 sm:px-4 border border-muted/50 shadow-lg shadow-neutral-950/5"
      :ui="{
        link: 'px-2 py-1',
        linkLeadingIcon: 'hidden'
      }"
    >
      <template #list-trailing>
        <ColorModeButton />
      </template>
    </UNavigationMenu>
  </div>
</template>
