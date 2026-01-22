<script setup lang="ts">
import { computed, ref } from 'vue'

useSeoMeta({
  title: 'JSON Formatter'
})

const input = ref(`{
  "hello": "world",
  "arr": [1, 2, 3]
}`)

const indent = ref(2)

const error = ref<string | null>(null)

const output = computed(() => {
  error.value = null
  if (!input.value.trim()) return ''

  try {
    const parsed = JSON.parse(input.value)
    return JSON.stringify(parsed, null, indent.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
    return ''
  }
})

const copy = async () => {
  if (!output.value) return
  await navigator.clipboard.writeText(output.value)
}
</script>

<template>
  <UContainer>
    <div class="mt-6 space-y-4">
      <div class="flex items-center gap-3">
        <div class="text-sm text-muted">Indent</div>
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
          Copy
        </UButton>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <UCard>
          <template #header>
            <div class="font-medium">Input</div>
          </template>
          <UTextarea v-model="input" :rows="16" class="w-full" />
          <template #footer>
            <div v-if="error" class="text-sm text-red-500">{{ error }}</div>
            <div v-else class="text-xs text-muted">Local-only, no server request.</div>
          </template>
        </UCard>

        <UCard>
          <template #header>
            <div class="font-medium">Output</div>
          </template>
          <UTextarea :model-value="output" :rows="16" readonly class="w-full" />
        </UCard>
      </div>
    </div>
  </UContainer>
</template>
