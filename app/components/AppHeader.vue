<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

/** 由 `useNavLinks()` 传入：已是当前语言的文案与带 locale 前缀的路径，勿再 `t()` / `localePath()`。 */
const { links } = defineProps<{
  links: NavigationMenuItem[]
}>()
</script>

<template>
  <div class="fixed top-2 sm:top-4 mx-auto left-1/2 transform -translate-x-1/2 z-10">
    <UNavigationMenu
      :items="links"
      variant="link"
      color="neutral"
      class="bg-muted/80 backdrop-blur-sm rounded-full px-2 sm:px-4 border border-muted/50 shadow-lg shadow-neutral-950/5"
      :ui="{
        link: 'px-2 py-1',
        linkLeadingIcon: 'hidden'
      }"
    >
      <template #list-trailing>
        <LanguageSwitcher />
        <ColorModeButton />
      </template>
    </UNavigationMenu>
  </div>
</template>
