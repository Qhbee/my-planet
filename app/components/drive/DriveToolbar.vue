<script setup lang="ts">
const { t } = useI18n()

defineProps<{
  disabled?: boolean
  uploading?: boolean
}>()

const emit = defineEmits<{
  upload: []
  uploadFolder: []
  mkdir: []
  refresh: []
}>()
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <UButton
      :label="t('projects.drive.upload')"
      icon="i-lucide-upload"
      :disabled="disabled || uploading"
      @click="emit('upload')"
    />
    <UButton
      :label="t('projects.drive.uploadFolder')"
      icon="i-lucide-folder-up"
      variant="outline"
      :disabled="disabled || uploading"
      @click="emit('uploadFolder')"
    />
    <UButton
      :label="t('projects.drive.newFolder')"
      icon="i-lucide-folder-plus"
      variant="outline"
      :disabled="disabled"
      @click="emit('mkdir')"
    />
    <UButton
      :icon="uploading ? 'i-lucide-loader-2 animate-spin' : 'i-lucide-refresh-cw'"
      variant="ghost"
      size="sm"
      :aria-label="t('projects.drive.refresh')"
      :disabled="uploading"
      @click="emit('refresh')"
    />
  </div>
</template>
