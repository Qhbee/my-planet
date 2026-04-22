<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <blockquote
    class="not-italic border-s-2 border-primary/25 ps-2 space-y-1.5 max-w-none"
  >
    <p class="text-xs leading-relaxed text-highlighted/90">
      <span
        class="font-serif italic text-[0.8rem] tracking-wide"
      >{{ t('projects.drive.tagline.quote') }}</span><br>{{ t('projects.drive.tagline.continuation') }}
    </p>
    <p class="text-[0.65rem] text-muted/90 leading-snug">
      {{ t('projects.drive.tagline.dedication') }}
    </p>
  </blockquote>
</template>
