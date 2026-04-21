<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps({
  error: {
    type: Object as PropType<NuxtError>,
    required: true
  }
})

const { locale, t } = useI18n()
const localizedNavLinks = useNavLinks()

useHead({
  htmlAttrs: {
    lang: locale
  }
})

useSeoMeta({
  title: t('error.notFound.title'),
  description: t('error.notFound.description')
})

const [{ data: navigation }, { data: files }] = await Promise.all([
  useAsyncData(
    () => `navigation-${locale.value}`,
    () => Promise.all([queryCollectionNavigation(`blog_${locale.value}`)]),
    { transform: data => data.flat(), watch: [locale] }
  ),
  useLazyAsyncData(
    () => `search-${locale.value}`,
    () => Promise.all([queryCollectionSearchSections(`blog_${locale.value}`)]),
    { server: false, transform: data => data.flat(), watch: [locale] }
  )
])
</script>

<template>
  <div>
    <AppHeader :links="localizedNavLinks" />

    <UMain>
      <UContainer>
        <UPage>
          <UError :error="error" />
        </UPage>
      </UContainer>
    </UMain>

    <AppFooter />

    <ClientOnly>
      <LazyUContentSearch
        :files="files"
        shortcut="meta_k"
        :placeholder="t('commandPalette.placeholder')"
        :navigation="navigation"
        :links="localizedNavLinks"
        :fuse="{ resultLimit: 42 }"
      />
    </ClientOnly>

    <UToaster />
  </div>
</template>
