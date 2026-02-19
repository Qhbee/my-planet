<script setup lang="ts">
const { t } = useI18n()
const props = defineProps<{
  currentPath: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  uploading: [boolean]
  progress: [current: number, total: number]
  done: [count: number]
  error: [message: string]
}>()

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB, 与 server 一致
const CONCURRENCY = 3

const fileInputRef = ref<HTMLInputElement | null>(null)
const folderInputRef = ref<HTMLInputElement | null>(null)
const isUploading = ref(false)

function openFileDialog(mode: 'file' | 'folder') {
  if (props.disabled) return
  const input = mode === 'folder' ? folderInputRef.value : fileInputRef.value
  if (input) {
    input.value = ''
    input.click()
  }
}

async function uploadSingle(
  file: File,
  relativePath: string,
  basePath: string
): Promise<void> {
  const formData = new FormData()
  formData.append('path', basePath)
  formData.append('relativePaths', relativePath)
  formData.append('files', file)

  await $fetch('/api/drive/upload', {
    method: 'POST',
    body: formData
  })
}

async function handleChange(e: Event, isFolder: boolean) {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (!files?.length) {
    target.value = ''
    return
  }

  const fileList = Array.from(files).filter(file => !file.name.startsWith('~$'))
  if (!fileList.length) {
    target.value = ''
    return
  }

  const relativePaths: string[] = fileList.map((file) => {
    if (isFolder) {
      const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name
      return rel
    }
    return file.name
  })

  // 上传前检查单个文件大小
  const oversized = fileList.find(f => f.size > MAX_FILE_SIZE)
  if (oversized) {
    emit('error', t('projects.drive.fileTooLarge'))
    target.value = ''
    return
  }

  isUploading.value = true
  emit('uploading', true)

  try {
    const total = fileList.length
    emit('progress', 0, total)

    let nextIndex = 0
    let completedCount = 0
    let uploadError: string | null = null

    async function worker() {
      while (!uploadError) {
        const i = nextIndex++
        if (i >= total) break
        const file = fileList[i]
        const path = relativePaths[i]
        if (!file || path === undefined) break
        try {
          await uploadSingle(file, path, props.currentPath)
          completedCount++
          emit('progress', completedCount, total)
        } catch (err: any) {
          const msg = err.data?.message ?? err.message ?? 'Upload failed'
          uploadError = msg
          emit('error', msg)
          break
        }
      }
    }

    const workerCount = Math.min(CONCURRENCY, total)
    await Promise.all(Array.from({ length: workerCount }, () => worker()))

    if (!uploadError) {
      emit('done', total)
    }
  } catch (err: any) {
    emit('error', err.data?.message ?? err.message ?? 'Upload failed')
  } finally {
    isUploading.value = false
    emit('uploading', false)
    target.value = ''
  }
}

function handleFileChange(e: Event) {
  handleChange(e, false)
}

function handleFolderChange(e: Event) {
  handleChange(e, true)
}

defineExpose({
  openFileDialog
})
</script>

<template>
  <input
    ref="fileInputRef"
    type="file"
    multiple
    class="hidden"
    @change="handleFileChange"
  >
  <input
    ref="folderInputRef"
    type="file"
    webkitdirectory
    multiple
    class="hidden"
    @change="handleFolderChange"
  >
</template>
