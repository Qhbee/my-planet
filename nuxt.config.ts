// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxt/content',
    '@vueuse/nuxt',
    'nuxt-og-image',
    'motion-v/nuxt',
    '@nuxtjs/i18n',
    'nuxt-auth-utils'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  alias: {
    // Server 内稳定引用 db，避免 Nitro 打包时相对路径解析失败
    '#db': join(rootDir, 'server/utils/db')
  },

  compatibilityDate: '2024-11-01',

  nitro: {
    // 关闭 Nitro 服务端 bundle 的 .map（与 vite.build.sourcemap 配合，避免重复产出调试映射）
    sourceMap: false,
    // 默认是 node-server，这里明确说明改用 Bun 服务端（OAuth /api、Drive、Iskra 等），减少歧义。
    // 在部分构建失败场景下 .output/nitro.json 会停留在 prerender 阶段，导致 `nuxt preview` 变成 `npx serve ./public` 纯静态，登录路由全部失效。
    // preset: 'node-server',
    // Bun 运行时 + Drizzle + pg；数据库连接仅进程环境变量，见 .env.example。
    preset: 'bun',
    alias: {
      '#db': join(rootDir, 'server/utils/db')
    },
    prerender: {
      routes: [
        '/en',
        '/zh'
      ],
      crawlLinks: true
    }
  },

  // 生产构建不生成 source map：减少 Rollup 计算与磁盘写入；线上堆栈将指向打包后代码。
  vite: {
    build: {
      sourcemap: false
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
  },

  // @nuxt/ui 内置 @nuxt/icon：避免本地图标解析慢或网络差时 1500ms 内未完成加载而刷屏 WARN
  icon: {
    fetchTimeout: 10000,
    serverBundle: {
      collections: ['lucide']
    }
  }
})
