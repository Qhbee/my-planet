// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxt/content',
    '@vueuse/nuxt',
    'nuxt-og-image',
    'motion-v/nuxt',
    '@nuxtjs/i18n'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  compatibilityDate: '2024-11-01',

  nitro: {
    prerender: {
      routes: [
        '/',
        '/zh'
      ],
      crawlLinks: true
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  i18n: {
    locales: [
      { code: 'en', name: 'English', language: 'en-US', file: 'en.json' },
      { code: 'zh', name: '简体中文', language: 'zh-CN', file: 'zh.json' }
    ],
    defaultLocale: 'en',
    strategy: 'prefix', // 路由策略：全部语言平等，统一带前缀 (/en => en, /zh => zh)
    // 浏览器语言检测配置
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root', // 仅在访问根路径 / 时检测跳转，有利于 SEO
      alwaysRedirect: false, // 只有在没有 cookie 时才检测，用户手动切换后听用户的
      fallbackLocale: 'en' // 如果浏览器是其他不支持的语言，回退到英文
    }
  }
})
