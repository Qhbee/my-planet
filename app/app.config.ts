export default defineAppConfig({
  global: {
    picture: {
      home: {
        dark: '/avatar.jpg',
        light: '/avatar.jpg',
        alt: 'My avatar'
      },
      about: {
        dark: '/XiaoQiao.jpg',
        light: '/XiaoQiao.jpg',
        alt: 'XiaoQiao'
      }
    },
    githubLink: 'https://github.com/Qhbee',
    steamLink: 'https://steamcommunity.com/profiles/76561199433361830/',
    email: 'qhbee@qq.com',
    available: true
  },
  ui: {
    // Avatar：Nuxt UI 用正则取「第一个」`size-*` 来算 IPX 宽高；默认 md 会带 `size-8`，若排在 `size-18` 前会把 640 图压成 32×32。
    // 用专用 size 变体，只保留一个 `size-*`，避免与默认 md 的 `size-8` 冲突。
    avatar: {
      variants: {
        size: {
          profile: {
            root: 'size-18'
          },
          profileLg: {
            root: 'size-36 rounded-lg'
          }
        }
      }
    },
    colors: {
      primary: 'blue',
      neutral: 'neutral'
    },
    pageHero: {
      slots: {
        container: 'py-18 sm:py-24 lg:py-32',
        title: 'mx-auto max-w-xl text-pretty text-3xl sm:text-4xl lg:text-5xl',
        description: 'mt-2 text-md mx-auto max-w-2xl text-pretty sm:text-md text-muted'
      }
    }
  },
  footer: {
    credits: `Built with Nuxt UI • © ${new Date().getFullYear()}`,
    colorMode: false,
    links: [{
      'icon': 'i-simple-icons-discord',
      'to': 'https://go.nuxt.com/discord',
      'target': '_blank',
      'aria-label': 'Nuxt on Discord'
    }, {
      'icon': 'i-simple-icons-x',
      'to': 'https://go.nuxt.com/x',
      'target': '_blank',
      'aria-label': 'Nuxt on X'
    }, {
      'icon': 'i-simple-icons-github',
      'to': 'https://github.com/nuxt/ui',
      'target': '_blank',
      'aria-label': 'Nuxt UI on GitHub'
    }]
  }
})
