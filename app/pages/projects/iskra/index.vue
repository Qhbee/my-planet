<script setup lang="ts">

const { t } = useI18n()

useSeoMeta({
  title: t('projects.iskra.seoTitle')
})
</script>

<template>
  <UContainer>
    <div class="mt-6 py-8">
      <h1 class="text-2xl font-bold">
        Iskra
      </h1>
      <p class="mt-2 text-muted">
        {{ t('projects.iskra.placeholder') }}
      </p>
    </div>
  </UContainer>
</template>
