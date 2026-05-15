<script setup lang="ts">
import { unref } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

const { t } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const toast = useToast()

useSeoMeta({
  title: () => t('projects.beta.seoTitle')
})

const code = ref('')
const submitting = ref(false)

function safeInternalRedirect(r: unknown): string | null {
  if (typeof r !== 'string' || !r.startsWith('/')) {
    return null
  }
  if (r.startsWith('//')) {
    return null
  }
  return r
}

async function onSubmit() {
  submitting.value = true
  try {
    await $fetch<{ ok: true }>('/api/beta/unlock', {
      method: 'POST' as const,
      body: { code: unref(code).trim() }
    })
    const raw = route.query.redirect
    const first = Array.isArray(raw) ? raw[0] : raw
    const safe = safeInternalRedirect(first)
    const target: RouteLocationRaw = safe ? { path: safe } : { path: localePath('/projects') }
    await navigateTo(target)
  } catch (e: unknown) {
    const err = e as { data?: { message?: string }, message?: string }
    toast.add({
      title: t('projects.beta.unlockErrorTitle'),
      description: err?.data?.message ?? err?.message ?? t('projects.beta.unlockErrorDesc'),
      color: 'error'
    })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <UContainer class="py-16 max-w-md">
    <UCard>
      <template #header>
        <h1 class="text-xl font-semibold text-highlighted">
          {{ t('projects.beta.title') }}
        </h1>
      </template>

      <p class="text-muted text-sm mb-6">
        {{ t('projects.beta.description') }}
      </p>

      <form
        class="space-y-4"
        @submit.prevent="onSubmit"
      >
        <UFormField :label="t('projects.beta.codeLabel')">
          <UInput
            v-model="code"
            type="password"
            autocomplete="off"
            :placeholder="t('projects.beta.codePlaceholder')"
            size="lg"
          />
        </UFormField>
        <UButton
          type="submit"
          block
          size="lg"
          :loading="submitting"
          :disabled="!code.trim()"
        >
          {{ t('projects.beta.submit') }}
        </UButton>
      </form>
    </UCard>
  </UContainer>
</template>
