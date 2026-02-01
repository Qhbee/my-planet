<script setup lang="ts">
import { computed, ref } from 'vue'

const { t } = useI18n()

useSeoMeta({
  title: t('projects.yamlFormatter.seoTitle')
})

const input = ref('')

const formatResult = computed(() => {
  const text = input.value
  if (!text.trim()) {
    return { output: '', error: null }
  }

  try {
    // 处理逻辑：去除行末空格 + 统一换行符
    const processed = text
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map(line => line.replace(/\s+$/g, ''))
      .join('\n')
    return { output: processed, error: null }
  } catch (e) {
    return {
      output: '',
      error: e instanceof Error ? e.message : String(e)
    }
  }
})

const output = computed(() => formatResult.value.output)
const error = computed(() => formatResult.value.error)

const copy = async () => {
  if (!output.value) return
  await navigator.clipboard.writeText(output.value)
}
</script>

<template>
  <UContainer>
    <div class="mt-6 space-y-4">
      <div class="flex items-center gap-3">
        <div class="text-sm text-muted">
          YAML
        </div>
        <div class="flex-1" />
        <UButton
          :disabled="!output"
          variant="soft"
          @click="copy"
        >
          {{ t('projects.common.copy') }}
        </UButton>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <UCard>
          <template #header>
            <div class="font-medium">
              {{ t('projects.common.input') }}
            </div>
          </template>
          <UTextarea
            v-model="input"
            :rows="16"
            class="w-full"
            :placeholder="t('projects.yamlFormatter.placeholder')"
          />
          <template #footer>
            <div
              v-if="error"
              class="text-sm text-red-500"
            >
              {{ error }}
            </div>
            <div
              v-else
              class="text-xs text-muted"
            >
              {{ t('projects.common.localOnly') }}
            </div>
          </template>
        </UCard>

        <UCard>
          <template #header>
            <div class="font-medium">
              {{ t('projects.common.output') }}
            </div>
          </template>
          <UTextarea
            :model-value="output"
            :rows="16"
            readonly
            class="w-full"
          />
        </UCard>
      </div>
    </div>
  </UContainer>
</template>
