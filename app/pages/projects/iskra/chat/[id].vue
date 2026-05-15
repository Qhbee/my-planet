<script setup lang="ts">
import type { DefineComponent } from 'vue'
import { Chat } from '@ai-sdk/vue'
import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import { z } from 'zod'
import { useClipboard } from '@vueuse/core'
import { getTextFromMessage } from '@nuxt/ui/utils/ai'
import { useModels } from '~/composables/projects/iskra/useModels'
import { IskraProsePreStream } from '#components'
import { useFileUploadWithStatus } from '~/composables/projects/iskra/useFileUpload'

definePageMeta({ layout: 'iskra' })

const chatTitleDataSchema = z.object({
  message: z.string()
})

const ragSourceItemSchema = z.object({
  rel_path: z.string().nullish(),
  title: z.string().nullish(),
  book: z.string().nullish(),
  chunk_index: z.number().nullish(),
  chunk_id: z.number().nullish(),
  score: z.number().nullish(),
  snippet: z.string().optional()
})

const ragSourcesDataSchema = z.object({
  sources: z.array(ragSourceItemSchema)
})

type IskraChatMessage = UIMessage<unknown, {
  'chat-title': z.infer<typeof chatTitleDataSchema>
  'rag-sources': z.infer<typeof ragSourcesDataSchema>
}>

type IskraMessagePart = IskraChatMessage['parts'][number]

type RagSourcesPart = Extract<IskraMessagePart, { type: 'data-rag-sources' }>

const components = {
  pre: IskraProsePreStream as unknown as DefineComponent
}

const route = useRoute()
const toast = useToast()
const clipboard = useClipboard()
const { model } = useModels()

function getFileName(url: string): string {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const filename = pathname.split('/').pop() || 'file'
    return decodeURIComponent(filename)
  } catch {
    return 'file'
  }
}

const {
  dropzoneRef,
  isDragging,
  files,
  isUploading,
  uploadedFiles,
  addFiles,
  removeFile,
  clearFiles
} = useFileUploadWithStatus(route.params.id as string)

const { data } = await useFetch(`/api/iskra/chats/${route.params.id}`, {
  cache: 'force-cache'
})
if (!data.value) {
  throw createError({ statusCode: 404, statusMessage: 'Chat not found' })
}

const { t } = useI18n()
useSeoMeta({
  title: computed(() => data.value?.title || t('projects.iskra.seoTitle'))
})

const input = ref('')

const chat = new Chat<IskraChatMessage>({
  id: data.value.id,
  dataPartSchemas: {
    'chat-title': chatTitleDataSchema,
    'rag-sources': ragSourcesDataSchema
  },
  messages: data.value.messages as IskraChatMessage[],
  transport: new DefaultChatTransport<IskraChatMessage>({
    api: `/api/iskra/chats/${data.value.id}`,
    body: {
      model: model.value
    }
  }),
  onData: (dataPart) => {
    if (dataPart.type === 'data-chat-title') {
      refreshNuxtData('iskra-chats')
    }
  },
  onError(error) {
    // API 有时把错误放在 error.message 的 JSON 里（如 "{\"message\":\"...\"}"），需 parse 后取 message
    const { message } = typeof error.message === 'string' && error.message[0] === '{' ? JSON.parse(error.message) : error
    toast.add({
      description: message,
      icon: 'i-lucide-alert-circle',
      color: 'error',
      duration: 0
    })
  }
})

async function handleSubmit(e: Event) {
  e.preventDefault()
  if (input.value.trim() && !isUploading.value) {
    await chat.sendMessage({
      text: input.value,
      files: uploadedFiles.value.length > 0 ? uploadedFiles.value : undefined
    })
    input.value = ''
    clearFiles()
  }
}

const copied = ref(false)

function copy(_e: MouseEvent, message: UIMessage) {
  clipboard.copy(getTextFromMessage(message))

  copied.value = true

  setTimeout(() => {
    copied.value = false
  }, 2000)
}

// 仅当首页创建后写入的 sessionStorage 存在时触发首答；先 removeItem 再 regenerate，避免带标记刷新或异常时重复打接口。
// key 须与 `iskra/index.vue` createChat 内 setItem 一致。
onMounted(() => {
  if (!import.meta.client) return
  const key = `iskra:bootstrap-assistant-initial-reply:chat-id:${route.params.id as string}`
  if (!sessionStorage.getItem(key)) return
  sessionStorage.removeItem(key)
  const msgs = data.value?.messages
  // 首答 bootstrap 针对的是「首条是用户提问、还没有 assistant」这一状态
  if (msgs?.length === 1 && msgs[0]?.role === 'user') {
    chat.regenerate()
  }
})
</script>

<template>
  <UDashboardPanel
    id="chat"
    class="relative"
    :ui="{ body: 'p-0 sm:p-0' }"
  >
    <template #header>
      <IskraDashboardNavbar />
    </template>

    <template #body>
      <IskraDragDropOverlay :show="!!isDragging" />
      <UContainer
        ref="dropzoneRef"
        class="flex-1 flex flex-col gap-4 sm:gap-6"
      >
        <UChatMessages
          should-auto-scroll
          :messages="chat.messages"
          :status="chat.status"
          :assistant="chat.status !== 'streaming' ? { actions: [{ label: 'Copy', icon: copied ? 'i-lucide-copy-check' : 'i-lucide-copy', onClick: copy }] } : { actions: [] }"
          :spacing-offset="160"
          class="lg:pt-(--ui-header-height) pb-4 sm:pb-6"
        >
          <template #content="{ message }">
            <template
              v-for="(part, index) in (message as IskraChatMessage).parts"
              :key="`${message.id}-${part.type}-${index}${'state' in part ? `-${part.state}` : ''}`"
            >
              <IskraReasoning
                v-if="part.type === 'reasoning'"
                :text="part.text"
                :is-streaming="part.state !== 'done'"
              />
              <!-- Only render markdown for assistant messages to prevent XSS from user input -->
              <MDCCached
                v-else-if="part.type === 'text' && message.role === 'assistant'"
                :value="part.text"
                :cache-key="`${message.id}-${index}`"
                :components="components"
                :parser-options="{ highlight: false }"
                class="*:first:mt-0 *:last:mb-0"
              />
              <IskraRagSourcesPanel
                v-else-if="part.type === 'data-rag-sources'"
                :sources="(part as RagSourcesPart).data.sources"
              />
              <!-- User messages are rendered as plain text (safely escaped by Vue) -->
              <p
                v-else-if="part.type === 'text' && message.role === 'user'"
                class="whitespace-pre-wrap"
              >
                {{ part.text }}
              </p>
              <IskraToolWeather
                v-else-if="part.type === 'tool-weather'"
                :invocation="(part as WeatherUIToolInvocation)"
              />
              <IskraToolChart
                v-else-if="part.type === 'tool-chart'"
                :invocation="(part as ChartUIToolInvocation)"
              />
              <IskraFileAvatar
                v-else-if="part.type === 'file'"
                :name="getFileName(part.url)"
                :type="part.mediaType"
                :preview-url="part.url"
              />
            </template>
          </template>
        </UChatMessages>

        <UChatPrompt
          v-model="input"
          :error="chat.error"
          :disabled="isUploading"
          variant="subtle"
          class="sticky bottom-0 [view-transition-name:chat-prompt] rounded-b-none z-10"
          :ui="{ base: 'px-1.5' }"
          @submit="handleSubmit"
        >
          <template
            v-if="files.length > 0"
            #header
          >
            <div class="flex flex-wrap gap-2">
              <IskraFileAvatar
                v-for="fileWithStatus in files"
                :key="fileWithStatus.id"
                :name="fileWithStatus.file.name"
                :type="fileWithStatus.file.type"
                :preview-url="fileWithStatus.previewUrl"
                :status="fileWithStatus.status"
                :error="fileWithStatus.error"
                removable
                @remove="removeFile(fileWithStatus.id)"
              />
            </div>
          </template>

          <template #footer>
            <div class="flex items-center gap-1">
              <IskraFileUploadButton @files-selected="addFiles($event)" />
              <IskraModelSelect v-model="model" />
            </div>

            <UChatPromptSubmit
              :status="chat.status"
              :disabled="isUploading"
              color="neutral"
              size="sm"
              @stop="chat.stop()"
              @reload="chat.regenerate()"
            />
          </template>
        </UChatPrompt>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
