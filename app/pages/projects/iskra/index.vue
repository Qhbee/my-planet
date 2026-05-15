<script setup lang="ts">
import { useModels } from '~/composables/projects/iskra/useModels'
import { useFileUploadWithStatus } from '~/composables/projects/iskra/useFileUpload'

definePageMeta({ layout: 'iskra' })

const { t } = useI18n()
useSeoMeta({
  title: t('projects.iskra.seoTitle')
})

const localePath = useLocalePath()
const toast = useToast()

const input = ref('')
const loading = ref(false)
const chatId = crypto.randomUUID()

const { model } = useModels()

const {
  dropzoneRef,
  isDragging,
  files,
  isUploading,
  uploadedFiles,
  addFiles,
  removeFile,
  clearFiles
} = useFileUploadWithStatus(chatId)

/** @returns 是否已发起并成功完成创建与跳转（用于避免连点时误 clearFiles） */
async function createChat(prompt: string): Promise<boolean> {
  if (!prompt.trim() || loading.value || isUploading.value) {
    return false
  }

  input.value = prompt
  loading.value = true

  const parts: Array<{ type: string, text?: string, mediaType?: string, url?: string }> = [{ type: 'text', text: prompt }]

  if (uploadedFiles.value.length > 0) {
    parts.push(...uploadedFiles.value)
  }

  try {
    const chat = await $fetch('/api/iskra/chats', {
      method: 'POST',
      body: {
        id: chatId,
        message: {
          role: 'user',
          parts
        }
      }
    })

    await refreshNuxtData('iskra-chats')
    await navigateTo(localePath(`/projects/iskra/chat/${chat?.id}`))
    return true
  } catch {
    toast.add({
      description: t('projects.iskra.createChatError'),
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
    return false
  } finally {
    loading.value = false
  }
}

async function onSubmit() {
  if (await createChat(input.value)) {
    clearFiles()
  }
}

const quickChats = [
  {
    label: '从早期经济学手稿，到雇佣劳动与资本，再到政治经济学批判和资本论，马克思对商品、货币、资本的分析有过什么变化吗？',
    icon: 'icon-park:commodity'
  },
  {
    label: '巴黎公社中有哪些错误被马克思所批评？',
    icon: 'entypo:flag'
  },
  {
    label: '马克思和恩格斯借钱的书信，按时间顺序总结。',
    icon: 'noto:fire'
  },
  {
    label: '列宁谈论过中国革命吗？',
    icon: 'emojione:star'
  },
  {
    label: '二月革命到十月革命期间，列宁的主张有变化吗？',
    icon: 'mdi:hammer-sickle'
  },
  {
    label: '斯大林有关于二战的演讲吗？',
    icon: 'circle-flags:soviet-union'
  },
  {
    label: '毛泽东选集里的哲学相关的篇目有哪些？',
    icon: 'twemoji:closed-book'
  },
  {
    label: '建国后毛泽东多次接见美国作家记者斯诺，说了什么？',
    icon: 'twemoji:flag-china'
  }
]
</script>

<template>
  <UDashboardPanel
    id="home"
    :ui="{ body: 'p-0 sm:p-0' }"
  >
    <template #header>
      <IskraDashboardNavbar />
    </template>

    <template #body>
      <IskraDragDropOverlay :show="!!isDragging" />
      <UContainer
        ref="dropzoneRef"
        class="flex-1 flex flex-col justify-center gap-4 sm:gap-6 py-8"
      >
        <h1 class="text-3xl sm:text-4xl text-highlighted font-bold">
          How can I help you today?
        </h1>

        <UChatPrompt
          v-model="input"
          :status="loading ? 'streaming' : 'ready'"
          :disabled="isUploading || loading"
          class="[view-transition-name:chat-prompt]"
          variant="subtle"
          :ui="{ base: 'px-1.5' }"
          @submit="onSubmit"
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
              color="neutral"
              size="sm"
              :disabled="isUploading || loading"
            />
          </template>
        </UChatPrompt>

        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="quickChat in quickChats"
            :key="quickChat.label"
            :icon="quickChat.icon"
            :label="quickChat.label"
            size="sm"
            color="neutral"
            variant="outline"
            class="rounded-full"
            :disabled="isUploading || loading"
            @click="createChat(quickChat.label)"
          />
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
