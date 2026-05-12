import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.spec.ts'],
    /** 路径相对仓库根解析，避免 import.meta 在低 module 配置的 TS 校验里报错 */
    setupFiles: ['tests/setup/load-env.ts']
  }
})
