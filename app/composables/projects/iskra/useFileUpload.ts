import { FILE_UPLOAD_CONFIG } from '#shared/utils'

interface BlobResult {
  pathname: string
  url?: string
  contentType?: string
  size: number
}

function createObjectUrl(file: File): string {
  return URL.createObjectURL(file)
}

function fileToInput(file: File): HTMLInputElement {
  const dataTransfer = new DataTransfer()
  dataTransfer.items.add(file)

  const input = document.createElement('input')
  input.type = 'file'
  input.files = dataTransfer.files

  return input
}

/** 本地实现：原版 useFileUpload 来自 @nuxt/ui 内部，未单独导出；提供 dropzoneRef + isDragging 供拖拽区用 */
function useFileUpload(options: {
  accept?: string
  multiple?: boolean
  onUpdate: (files: File[]) => void
}) {
  const dropzoneRef = ref<HTMLElement | null>(null)
  const isDragging = ref(false)

  function getFilesFromEvent(e: DragEvent): File[] {
    const dt = e.dataTransfer
    if (!dt?.files?.length) return []
    return Array.from(dt.files)
  }

  function onDragEnter(e: DragEvent) {
    e.preventDefault()
    if (e.dataTransfer?.types?.includes('Files')) isDragging.value = true
  }

  function onDragLeave(e: DragEvent) {
    e.preventDefault()
    if (!(e.currentTarget as HTMLElement)?.contains(e.relatedTarget as Node)) {
      isDragging.value = false
    }
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault()
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    isDragging.value = false
    const files = getFilesFromEvent(e)
    if (files.length) options.onUpdate(options.multiple ? files : [files[0]!])
  }

  /** ref 可能绑在 UContainer 等组件上，拿到的是组件实例；需用 $el 取真实 DOM 再绑事件 */
  function getEl(node: unknown): HTMLElement | null {
    if (!node) return null
    const el = (node as { $el?: HTMLElement })?.$el ?? node
    return el instanceof HTMLElement ? el : null
  }

  let cleanup: (() => void) | null = null
  watch(dropzoneRef, (node) => {
    cleanup?.()
    cleanup = null
    if (import.meta.server) return
    const el = getEl(node)
    if (!el) return
    el.addEventListener('dragenter', onDragEnter)
    el.addEventListener('dragleave', onDragLeave)
    el.addEventListener('dragover', onDragOver)
    el.addEventListener('drop', onDrop)
    cleanup = () => {
      el.removeEventListener('dragenter', onDragEnter)
      el.removeEventListener('dragleave', onDragLeave)
      el.removeEventListener('dragover', onDragOver)
      el.removeEventListener('drop', onDrop)
    }
  }, { immediate: true })
  onBeforeUnmount(() => cleanup?.())

  return { dropzoneRef, isDragging }
}

/** 本地实现：原版 useUpload 来自 @nuxthub/core，主站未用 Nuxthub，故用 fetch 替代 */
function createIskraUpload(chatId: string) {
  const url = `/api/iskra/upload/${chatId}`
  return async (input: HTMLInputElement): Promise<BlobResult | BlobResult[] | undefined> => {
    const formData = new FormData()
    const fileList = input.files
    if (!fileList?.length) return undefined
    for (let i = 0; i < fileList.length; i++) {
      formData.append('files', fileList[i]!)
    }
    return await $fetch<BlobResult | BlobResult[]>(url, { method: 'PUT', body: formData })
  }
}

export function useFileUploadWithStatus(chatId: string) {
  const files = ref<FileWithStatus[]>([])
  const toast = useToast()
  const { loggedIn } = useUserSession()

  // const upload = useUpload(`/api/upload/${chatId}`, { method: 'PUT' })
  const upload = createIskraUpload(chatId)

  async function uploadFiles(newFiles: File[]) {
    if (!loggedIn.value) {
      return
    }

    const filesWithStatus: FileWithStatus[] = newFiles.map(file => ({
      file,
      id: crypto.randomUUID(),
      previewUrl: createObjectUrl(file),
      status: 'uploading' as const
    }))

    files.value = [...files.value, ...filesWithStatus]

    const uploadPromises = filesWithStatus.map(async (fileWithStatus) => {
      const index = files.value.findIndex(f => f.id === fileWithStatus.id)
      if (index === -1) return

      try {
        const input = fileToInput(fileWithStatus.file)
        const response = await upload(input) as BlobResult | BlobResult[] | undefined

        if (!response) {
          throw new Error('Upload failed')
        }

        const result = Array.isArray(response) ? response[0] : response

        if (!result) {
          throw new Error('Upload failed')
        }

        files.value[index] = {
          ...files.value[index]!,
          status: 'uploaded',
          uploadedUrl: result.url,
          uploadedPathname: result.pathname
        }
      } catch (error) {
        const errorMessage = (error as { data?: { message?: string } }).data?.message
          || (error as Error).message
          || 'Upload failed'
        toast.add({
          title: 'Upload failed',
          description: errorMessage,
          icon: 'i-lucide-alert-circle',
          color: 'error'
        })
        files.value[index] = {
          ...files.value[index]!,
          status: 'error',
          error: errorMessage
        }
      }
    })

    await Promise.allSettled(uploadPromises)
  }

  const { dropzoneRef, isDragging } = useFileUpload({
    accept: FILE_UPLOAD_CONFIG.acceptPattern,
    multiple: true,
    onUpdate: uploadFiles
  })

  const isUploading = computed(() =>
    files.value.some(f => f.status === 'uploading')
  )

  const uploadedFiles = computed(() =>
    files.value
      .filter(f => f.status === 'uploaded' && f.uploadedUrl)
      .map(f => ({
        type: 'file' as const,
        mediaType: f.file.type,
        url: f.uploadedUrl!
      }))
  )

  function removeFile(id: string) {
    const file = files.value.find(f => f.id === id)
    if (!file) return

    URL.revokeObjectURL(file.previewUrl)
    files.value = files.value.filter(f => f.id !== id)

    if (file.status === 'uploaded' && file.uploadedPathname) {
      fetch(`/api/iskra/upload/${file.uploadedPathname}`, {
        method: 'DELETE'
      }).catch((error) => {
        console.error('Failed to delete file from blob:', error)
      })
    }
  }

  function clearFiles() {
    if (files.value.length === 0) return
    files.value.forEach(fileWithStatus => URL.revokeObjectURL(fileWithStatus.previewUrl))
    files.value = []
  }

  onUnmounted(() => {
    clearFiles()
  })

  return {
    dropzoneRef,
    isDragging,
    files,
    isUploading,
    uploadedFiles,
    addFiles: uploadFiles,
    removeFile,
    clearFiles
  }
}
