<script setup lang="ts">
import { computed, ref } from 'vue'

const { t } = useI18n()

useSeoMeta({
  title: t('projects.jsonFormatter.seoTitle')
})

const input = ref(`{
  "hello": "world",
  "arr": [1, 2, 3]
}`)

const indent = ref(2)

const formatResult = computed(() => {
  const text = input.value.trim()
  if (!text) {
    return { output: '', error: null }
  }

  try {
    const parsed = JSON.parse(text)
    return {
      output: JSON.stringify(parsed, null, indent.value),
      error: null
    }
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
          {{ t('projects.jsonFormatter.indent') }}
        </div>
        <USelect
          v-model="indent"
          :options="[2, 4].map(v => ({ label: String(v), value: v }))"
          class="w-28"
        />
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
