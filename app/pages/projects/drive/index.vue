<script setup lang="ts">
import type { DriveUpload } from '#components'

definePageMeta({ layout: 'drive' })

const { t } = useI18n()
const toast = useToast()
const { loggedIn } = useUserSession()

useSeoMeta({
  title: t('projects.drive.seoTitle')
})

interface FileEntry {
  name: string
  path: string
  size: number
  modified: Date
  isDirectory: boolean
}

const currentPath = ref('/')
const entries = ref<FileEntry[]>([])
const loading = ref(false)
const uploading = ref(false)
const uploadProgress = ref<{ current: number, total: number } | null>(null)
const uploadRef = ref<InstanceType<typeof DriveUpload> | null>(null)

const mkdirModalOpen = ref(false)
const mkdirName = ref('')
const renameModalOpen = ref(false)
const renameEntry = ref<FileEntry | null>(null)
const renameValue = ref('')
const selectedPaths = ref<string[]>([])
const moveModalOpen = ref(false)
const moveEntries = ref<FileEntry[]>([])
const moveTargetPath = ref('')
const deleteModalOpen = ref(false)
const deleteEntries = ref<FileEntry[]>([])

async function loadEntries() {
  if (!loggedIn.value) return
  loading.value = true
  try {
    const data = await $fetch<{ entries: FileEntry[] }>('/api/drive/list', {
      query: { path: currentPath.value }
    })
    entries.value = data.entries
  } catch (err: any) {
    toast.add({
      title: t('projects.drive.error'),
      description: err.data?.message ?? err.message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

function navigateToPath(path: string) {
  currentPath.value = path
  selectedPaths.value = []
  loadEntries()
}

function downloadFile(entry: FileEntry) {
  const url = `/api/drive/download?path=${encodeURIComponent(entry.path)}`
  window.open(url, '_blank')
}

async function createFolder() {
  if (!mkdirName.value.trim()) return
  const path = currentPath.value === '/' ? `/${mkdirName.value.trim()}` : `${currentPath.value}/${mkdirName.value.trim()}`
  try {
    await $fetch('/api/drive/mkdir', {
      method: 'POST',
      body: { path }
    })
    toast.add({ title: t('projects.drive.folderCreated') })
    mkdirModalOpen.value = false
    mkdirName.value = ''
    loadEntries()
  } catch (err: any) {
    toast.add({
      title: t('projects.drive.error'),
      description: err.data?.message ?? err.message,
      color: 'error'
    })
  }
}

function openRename(entry: FileEntry) {
  renameEntry.value = entry
  renameValue.value = entry.name
  renameModalOpen.value = true
}

async function confirmRename() {
  if (!renameEntry.value || !renameValue.value.trim()) return
  const dir = renameEntry.value.path.split('/').slice(0, -1).join('/') || '/'
  const newPath = dir === '/' ? `/${renameValue.value.trim()}` : `${dir}/${renameValue.value.trim()}`
  try {
    await $fetch('/api/drive/rename', {
      method: 'PUT',
      body: { oldPath: renameEntry.value.path, newPath }
    })
    toast.add({ title: t('projects.drive.renamed') })
    renameModalOpen.value = false
    renameEntry.value = null
    loadEntries()
  } catch (err: any) {
    toast.add({
      title: t('projects.drive.error'),
      description: err.data?.message ?? err.message,
      color: 'error'
    })
  }
}

function openMove(entry: FileEntry | FileEntry[]) {
  moveEntries.value = Array.isArray(entry) ? entry : [entry]
  moveTargetPath.value = currentPath.value
  moveModalOpen.value = true
}

async function confirmMove() {
  if (!moveEntries.value.length) return
  const targetPath = moveTargetPath.value || '/'
  try {
    for (const entry of moveEntries.value) {
      const newPath = targetPath === '/' ? `/${entry.name}` : `${targetPath}/${entry.name}`
      await $fetch('/api/drive/move', {
        method: 'PUT',
        body: { oldPath: entry.path, newPath }
      })
    }
    toast.add({ title: t('projects.drive.moved') })
    moveModalOpen.value = false
    moveEntries.value = []
    selectedPaths.value = []
    loadEntries()
  } catch (err: any) {
    toast.add({
      title: t('projects.drive.error'),
      description: err.data?.message ?? err.message,
      color: 'error'
    })
  }
}

function openDelete(entry: FileEntry | FileEntry[]) {
  deleteEntries.value = Array.isArray(entry) ? entry : [entry]
  deleteModalOpen.value = true
}

async function confirmDelete() {
  if (!deleteEntries.value.length) return
  try {
    for (const entry of deleteEntries.value) {
      await $fetch('/api/drive/delete', {
        method: 'DELETE',
        query: { path: entry.path }
      })
    }
    toast.add({ title: t('projects.drive.deleted') })
    deleteModalOpen.value = false
    deleteEntries.value = []
    selectedPaths.value = []
    loadEntries()
  } catch (err: any) {
    toast.add({
      title: t('projects.drive.error'),
      description: err.data?.message ?? err.message,
      color: 'error'
    })
  }
}

function getSelectedEntries(): FileEntry[] {
  return entries.value.filter(e => selectedPaths.value.includes(e.path))
}

function clearSelection() {
  selectedPaths.value = []
}

function onShare(_entry: FileEntry) {
  toast.add({ title: t('projects.drive.shareLinkComing'), color: 'neutral' })
}

function onUploadProgress(current: number, total: number) {
  uploadProgress.value = { current, total }
}

function onUploadDone(count: number) {
  uploadProgress.value = null
  toast.add({ title: t('projects.drive.uploadSuccess', { count }) })
  loadEntries()
}

function onUploadError(msg: string) {
  uploadProgress.value = null
  toast.add({ title: t('projects.drive.error'), description: msg, color: 'error' })
}

watch(loggedIn, (v) => {
  if (v) loadEntries()
}, { immediate: true })
</script>

<template>
  <UDashboardPanel
    id="drive-main"
    :ui="{ body: 'p-4 sm:p-6' }"
  >
    <template #body>
      <div
        v-if="!loggedIn"
        class="flex flex-col items-center justify-center min-h-[40vh] gap-4"
      >
        <UIcon
          name="i-lucide-hard-drive"
          class="size-16 text-muted"
        />
        <p class="text-muted text-center">
          {{ t('projects.drive.loginRequired') }}
        </p>
      </div>

      <div
        v-else
        class="space-y-4"
      >
        <div class="flex flex-col gap-3 pt-2">
          <DriveBreadcrumb
            :path="currentPath"
            @navigate="navigateToPath"
          />
          <div class="flex flex-wrap items-center justify-between gap-4">
            <h1 class="text-xl font-semibold">
              {{ t('projects.drive.title') }}
            </h1>
            <div class="flex items-center gap-2">
              <template v-if="selectedPaths.length > 0">
                <span class="text-sm text-muted">
                  {{ t('projects.drive.selectedCount', { count: selectedPaths.length }) }}
                </span>
                <UButton
                  size="xs"
                  variant="soft"
                  icon="i-lucide-folder-input"
                  :label="t('projects.drive.batchMove')"
                  @click="openMove(getSelectedEntries())"
                />
                <UButton
                  size="xs"
                  variant="soft"
                  color="error"
                  icon="i-lucide-trash"
                  :label="t('projects.drive.batchDelete')"
                  @click="openDelete(getSelectedEntries())"
                />
                <UButton
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  :label="t('projects.drive.clearSelection')"
                  @click="clearSelection"
                />
              </template>
              <DriveToolbar
                :disabled="loading"
                :uploading="uploading"
                @upload="uploadRef?.openFileDialog('file')"
                @upload-folder="uploadRef?.openFileDialog('folder')"
                @mkdir="mkdirModalOpen = true"
                @refresh="loadEntries()"
              />
            </div>
          </div>
        </div>

        <DriveUpload
          ref="uploadRef"
          :current-path="currentPath"
          :disabled="loading"
          @uploading="(v) => { uploading = v; if (!v) uploadProgress = null }"
          @progress="onUploadProgress"
          @done="onUploadDone"
          @error="onUploadError"
        />

        <div
          v-if="uploadProgress"
          class="rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-2 bg-gray-50 dark:bg-gray-900/50"
        >
          <div class="flex justify-between text-sm">
            <span class="text-muted">{{ t('projects.drive.uploading') }}</span>
            <span class="font-medium">{{ uploadProgress.current }} / {{ uploadProgress.total }}</span>
          </div>
          <UProgress
            :model-value="uploadProgress.current"
            :max="uploadProgress.total"
            size="sm"
          />
        </div>

        <DriveFileList
          v-model:selected-paths="selectedPaths"
          :entries="entries"
          :current-path="currentPath"
          :loading="loading"
          @navigate="navigateToPath"
          @download="downloadFile"
          @rename="openRename"
          @move="openMove"
          @delete="openDelete"
          @share="onShare"
        />
      </div>

      <UModal
        v-model:open="mkdirModalOpen"
        :title="t('projects.drive.newFolder')"
        :ui="{ footer: 'justify-end' }"
        @update:open="(v: boolean) => { if (!v) mkdirName = '' }"
      >
        <template #body>
          <UFormField :label="t('projects.drive.folderName')">
            <UInput
              v-model="mkdirName"
              :placeholder="t('projects.drive.folderNamePlaceholder')"
              autofocus
              @keydown.enter="createFolder"
            />
          </UFormField>
        </template>
        <template #footer>
          <UButton
            color="neutral"
            variant="ghost"
            :label="t('projects.drive.cancel')"
            @click="mkdirModalOpen = false"
          />
          <UButton
            :label="t('projects.drive.create')"
            :disabled="!mkdirName.trim()"
            @click="createFolder"
          />
        </template>
      </UModal>

      <UModal
        v-model:open="renameModalOpen"
        :title="t('projects.drive.rename')"
        :ui="{ footer: 'justify-end' }"
      >
        <template #body>
          <UFormField :label="t('projects.drive.newName')">
            <UInput
              v-model="renameValue"
              autofocus
              @keydown.enter="confirmRename"
            />
          </UFormField>
        </template>
        <template #footer>
          <UButton
            color="neutral"
            variant="ghost"
            :label="t('projects.drive.cancel')"
            @click="renameModalOpen = false"
          />
          <UButton
            :label="t('projects.drive.confirm')"
            :disabled="!renameValue.trim()"
            @click="confirmRename"
          />
        </template>
      </UModal>

      <UModal
        v-model:open="moveModalOpen"
        :title="t('projects.drive.move')"
        :ui="{ footer: 'justify-end' }"
      >
        <template #body>
          <UFormField :label="t('projects.drive.moveTarget')">
            <UInput
              v-model="moveTargetPath"
              :placeholder="'/'"
            />
          </UFormField>
        </template>
        <template #footer>
          <UButton
            color="neutral"
            variant="ghost"
            :label="t('projects.drive.cancel')"
            @click="moveModalOpen = false"
          />
          <UButton
            :label="t('projects.drive.confirm')"
            @click="confirmMove"
          />
        </template>
      </UModal>

      <UModal
        v-model:open="deleteModalOpen"
        :title="t('projects.drive.delete')"
        :description="deleteEntries.length === 1 ? t('projects.drive.deleteConfirm', { name: deleteEntries[0]?.name }) : t('projects.drive.deleteConfirmBatch', { count: deleteEntries.length })"
        :ui="{ footer: 'justify-end' }"
      >
        <template #footer>
          <UButton
            color="neutral"
            variant="ghost"
            :label="t('projects.drive.cancel')"
            @click="deleteModalOpen = false"
          />
          <UButton
            color="error"
            :label="t('projects.drive.delete')"
            @click="confirmDelete"
          />
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
