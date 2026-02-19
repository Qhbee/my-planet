<script setup lang="ts">
const colorMode = useColorMode()

const color = computed(() => colorMode.value === 'dark' ? '#020618' : 'white')

const { locale, t } = useI18n()
const localePath = useLocalePath()

useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: locale
  }
})

useSeoMeta({
  titleTemplate: `%s - Qhbee's Planet`,
  ogImage: 'https://ui.nuxt.com/assets/templates/nuxt/portfolio-light.png',
  twitterImage: 'https://ui.nuxt.com/assets/templates/nuxt/portfolio-light.png',
  twitterCard: 'summary_large_image'
})

const route = useRoute()
/** Iskra / Drive 等使用 UDashboardGroup 的 layout，不需要 UMain */
const usesDashboardLayout = computed(() => {
  const p = String(route.path)
  return p.includes('/projects/iskra') || p.includes('/projects/drive')
})

const [{ data: navigation }, { data: files }] = await Promise.all([
  useAsyncData(
    () => `navigation-${locale.value}`,
    () => Promise.all([queryCollectionNavigation(`blog_${locale.value}`)]),
    { transform: data => data.flat() }
  ),
  useLazyAsyncData(
    () => `search-${locale.value}`,
    () => Promise.all([queryCollectionSearchSections(`blog_${locale.value}`)]),
    { server: false, transform: data => data.flat() }
  )
])

const localizedNavLinks = computed(() =>
  navLinks.map(({ label, to, ...rest }) => ({
    ...rest,
    label: t(label!),
    to: localePath(to!)
  }))
)
</script>

<template>
  <UApp>
    <NuxtLayout>
      <UMain
        v-if="!usesDashboardLayout"
        class="relative"
      >
        <NuxtPage />
      </UMain>
      <NuxtPage v-else />
    </NuxtLayout>

    <ClientOnly>
      <LazyUContentSearch
        :files="files"
        :navigation="navigation"
        shortcut="meta_k"
        :placeholder="t('commandPalette.placeholder')"
        :links="localizedNavLinks"
        :fuse="{ resultLimit: 42 }"
      />
    </ClientOnly>
  </UApp>
</template>
