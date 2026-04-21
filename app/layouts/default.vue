<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

const localizedNavLinks = computed(() =>
  navLinks.map(({ label, to, ...rest }) => ({
    ...rest,
    label: t(label!),
    to: localePath(to!)
  }))
)
</script>

<template>
  <div>
    <UContainer class="sm:border-x border-default pt-10">
      <AppHeader :links="localizedNavLinks" />
      <slot />
      <AppFooter />
    </UContainer>
  </div>
</template>
