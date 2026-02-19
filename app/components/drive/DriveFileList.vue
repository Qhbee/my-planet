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
  entries: FileEntry[]
  currentPath: string
  loading?: boolean
  selectedPaths?: string[]
}>()

const emit = defineEmits<{
  'update:selectedPaths': [paths: string[]]
  'navigate': [path: string]
  'download': [entry: FileEntry]
  'rename': [entry: FileEntry]
  'move': [entry: FileEntry]
  'delete': [entry: FileEntry]
  'share': [entry: FileEntry]
}>()

const selected = computed({
  get: () => new Set(props.selectedPaths ?? []),
  set: (paths: Set<string>) => emit('update:selectedPaths', [...paths])
})

const isAllSelected = computed(() =>
  props.entries.length > 0 && props.entries.every(e => selected.value.has(e.path))
)

const isIndeterminate = computed(() => {
  const n = (props.selectedPaths ?? []).length
  return n > 0 && n < props.entries.length
})

function toggleSelect(path: string) {
  const next = new Set(selected.value)
  if (next.has(path)) next.delete(path)
  else next.add(path)
  selected.value = next
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    selected.value = new Set()
  } else {
    selected.value = new Set(props.entries.map(e => e.path))
  }
}

function onRowClick(entry: FileEntry, e: MouseEvent) {
  if ((e.target as HTMLElement).closest('[data-no-row-click]')) return
  if (entry.isDirectory) emit('navigate', entry.path)
  // 文件不点击即下载，需用下载按钮
}

function formatSize(bytes: number, isDir: boolean): string {
  if (bytes === 0 || isDir) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(d: Date): string {
  return new Date(d).toLocaleString()
}
</script>

<template>
  <div class="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
    <div
      v-if="loading"
      class="p-8 text-center text-muted"
    >
      {{ t('projects.drive.loading') }}
    </div>
    <div
      v-else-if="!entries?.length"
      class="p-8 text-center text-muted"
    >
      {{ t('projects.drive.empty') }}
    </div>
    <ul
      v-else
      class="divide-y divide-gray-200 dark:divide-gray-800"
    >
      <li
        class="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-900/50 text-sm text-muted"
      >
        <button
          type="button"
          class="shrink-0 flex items-center justify-center size-5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          :aria-label="isAllSelected ? 'Deselect all' : 'Select all'"
          @click="toggleSelectAll"
        >
          <UIcon
            :name="isAllSelected ? 'i-lucide-check-square' : isIndeterminate ? 'i-lucide-square-minus' : 'i-lucide-square'"
            class="size-5"
            :class="[isAllSelected || isIndeterminate ? 'text-primary' : 'text-muted']"
          />
        </button>
        <span class="flex-1 font-medium">
          {{ t('projects.drive.nameColumn') }}
        </span>
        <span class="shrink-0 w-28" />
        <span class="shrink-0 w-20 text-right">
          {{ t('projects.drive.sizeColumn') }}
        </span>
        <span class="shrink-0 w-40 ml-6 hidden sm:block">
          {{ t('projects.drive.modifiedColumn') }}
        </span>
        <span class="shrink-0 size-8" />
      </li>
      <li
        v-for="entry in entries"
        :key="entry.path"
        class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
        :class="{ 'bg-primary-50 dark:bg-primary-950/30': selected.has(entry.path) }"
      >
        <button
          type="button"
          data-no-row-click
          class="shrink-0 flex items-center justify-center size-5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-opacity"
          :class="selected.has(entry.path) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
          @click.stop="toggleSelect(entry.path)"
        >
          <UIcon
            :name="selected.has(entry.path) ? 'i-lucide-check-square' : 'i-lucide-square'"
            class="size-5 text-muted"
            :class="selected.has(entry.path) ? 'text-primary' : ''"
          />
        </button>
        <button
          type="button"
          class="flex-1 flex items-center gap-3 min-w-0 text-left"
          @click="onRowClick(entry, $event)"
        >
          <UIcon
            :name="entry.isDirectory ? 'i-lucide-folder' : 'i-lucide-file'"
            class="size-5 shrink-0"
            :class="entry.isDirectory ? 'text-amber-500' : 'text-sky-500'"
          />
          <span class="truncate font-medium">
            {{ entry.name }}
          </span>
        </button>
        <div
          data-no-row-click
          class="flex items-center justify-end gap-0.5 shrink-0 w-28 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <UButton
            v-if="!entry.isDirectory"
            icon="i-lucide-download"
            variant="ghost"
            size="xs"
            color="neutral"
            :aria-label="t('projects.drive.download')"
            @click.stop="emit('download', entry)"
          />
          <UButton
            icon="i-lucide-trash"
            variant="ghost"
            size="xs"
            color="neutral"
            :aria-label="t('projects.drive.delete')"
            @click.stop="emit('delete', entry)"
          />
          <UButton
            icon="i-lucide-share-2"
            variant="ghost"
            size="xs"
            color="neutral"
            :aria-label="t('projects.drive.share')"
            @click.stop="emit('share', entry)"
          />
          <DriveContextMenu
            :entry="entry"
            :current-path="currentPath"
            @download="emit('download', $event)"
            @rename="emit('rename', $event)"
            @move="emit('move', $event)"
            @delete="emit('delete', $event)"
            @share="emit('share', $event)"
          >
            <UButton
              icon="i-lucide-more-vertical"
              variant="ghost"
              size="xs"
              color="neutral"
              :aria-label="t('projects.drive.more')"
            />
          </DriveContextMenu>
        </div>
        <span class="text-muted text-sm shrink-0 w-20 text-right">
          {{ formatSize(entry.size, entry.isDirectory) }}
        </span>
        <span class="text-muted text-sm shrink-0 w-40 ml-6 truncate hidden sm:block">
          {{ formatDate(entry.modified) }}
        </span>
      </li>
    </ul>
  </div>
</template>
