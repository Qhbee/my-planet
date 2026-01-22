<script setup lang="ts">
import { computed, ref } from 'vue'

useSeoMeta({
  title: 'YAML Formatter'
})

const input = ref('')

const error = ref<string | null>(null)

const output = computed(() => {
  error.value = null
  const text = input.value
  if (!text.trim()) return ''

  // 占位：暂不引入 YAML 解析依赖，后续可用 `yaml` 包实现真正格式化/校验
  // 现在仅做：去除每行末尾多余空格 + 统一换行
  try {
    return text
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map(line => line.replace(/\s+$/g, ''))
      .join('\n')
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
        <div class="text-sm text-muted">YAML</div>
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
          <UTextarea v-model="input" :rows="16" class="w-full" placeholder="Paste YAML here..." />
          <template #footer>
            <div v-if="error" class="text-sm text-red-500">{{ error }}</div>
            <div v-else class="text-xs text-muted">Placeholder formatter (no YAML parser yet).</div>
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
