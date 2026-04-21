<script setup lang="ts">
const localizedNavLinks = useNavLinks()
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
