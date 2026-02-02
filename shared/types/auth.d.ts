// auth.d.ts：session 里存的用户形状，与 server/db/schema users 表一致。
// provider = 登录来源（OAuth 提供商），目前只有 GitHub，以后可加 'google' 等。
declare module '#auth-utils' {
  interface User {
    id: string
    name: string
    email: string
    avatar: string
    username: string
    /** 登录来源，如 'github'；DB 存的是 text，类型用 string 才能和 Drizzle 推断一致 */
    provider: string
    /** 该提供商下的用户唯一 id（如 GitHub 的 user.id），DB 存的是 text */
    providerId: string
  }
}

export {}
