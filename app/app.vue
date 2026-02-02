<script setup lang="ts">
const colorMode = useColorMode()

const color = computed(() => colorMode.value === 'dark' ? '#020618' : 'white')

const { locale } = useI18n()

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
/** Iskra 使用自己的 layout（UDashboardGroup），不需要 UMain，否则主内容区会偏左、右侧空白 */
const isIskraRoute = computed(() => String(route.path).includes('/projects/iskra'))

const [{ data: navigation }, { data: files }] = await Promise.all([
  useAsyncData('navigation', () => {
    return Promise.all([
      queryCollectionNavigation(`blog_${locale.value}`)
    ])
  }, {
    transform: data => data.flat()
  }),
  useLazyAsyncData('search', () => {
    return Promise.all([
      queryCollectionSearchSections(`blog_${locale.value}`)
    ])
  }, {
    server: false,
    transform: data => data.flat()
  })
])
</script>

<template>
  <UApp>
    <NuxtLayout>
      <UMain v-if="!isIskraRoute" class="relative">
        <NuxtPage />
      </UMain>
      <NuxtPage v-else />
    </NuxtLayout>

    <ClientOnly>
      <LazyUContentSearch
        :files="files"
        :navigation="navigation"
        shortcut="meta_k"
        :links="navLinks"
        :fuse="{ resultLimit: 42 }"
      />
    </ClientOnly>
  </UApp>
</template>
