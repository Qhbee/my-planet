<script setup lang="ts">
const { t } = useI18n()

interface FileEntry {
  name: string
  path: string
  size: number
  modified: Date
  isDirectory: boolean
}

const props = defineProps<{
  entry: FileEntry
  currentPath: string
}>()

const emit = defineEmits<{
  download: [entry: FileEntry]
  rename: [entry: FileEntry]
  move: [entry: FileEntry]
  delete: [entry: FileEntry]
  share: [entry: FileEntry]
}>()

const menuItems = computed(() => [[
  ...(props.entry.isDirectory
    ? []
    : [{
        label: t('projects.drive.download'),
        icon: 'i-lucide-download',
        onSelect: () => emit('download', props.entry)
      }]),
  {
    label: t('projects.drive.rename'),
    icon: 'i-lucide-pencil-line',
    onSelect: () => emit('rename', props.entry)
  },
  {
    label: t('projects.drive.move'),
    icon: 'i-lucide-folder-input',
    onSelect: () => emit('move', props.entry)
  },
  {
    label: t('projects.drive.share'),
    icon: 'i-lucide-share-2',
    onSelect: () => emit('share', props.entry)
  },
  {
    label: t('projects.drive.delete'),
    icon: 'i-lucide-trash',
    color: 'error' as const,
    onSelect: () => emit('delete', props.entry)
  }
]])
</script>

<template>
  <UDropdownMenu
    :items="menuItems"
    :content="{ align: 'start', collisionPadding: 8 }"
  >
    <slot />
  </UDropdownMenu>
</template>
