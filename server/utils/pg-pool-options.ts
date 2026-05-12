import type { PoolConfig } from 'pg'

function trim(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

/** `NUXT_PG_SSL`：`require`/`true`/`1` 走 TLS */
function resolvePgSsl(sslRaw: unknown): PoolConfig['ssl'] {
  const ssl = trim(sslRaw).toLowerCase()
  if (!ssl || ssl === 'disable' || ssl === 'false' || ssl === '0') {
    return undefined
  }
  if (ssl === 'require' || ssl === 'true' || ssl === '1') {
    return { rejectUnauthorized: true }
  }
  return undefined
}

/**
 * 仅从进程环境变量解析 `pg` Pool：优先 `NUXT_DATABASE_URL`、`DATABASE_URL`，否则 `NUXT_PG_*` / `PG*`。
 */
export function resolvePgPoolConfig(): PoolConfig {
  const connectionString = trim(process.env.NUXT_DATABASE_URL) || trim(process.env.DATABASE_URL)

  if (connectionString) {
    return { connectionString }
  }

  const host = trim(process.env.NUXT_PG_HOST) || trim(process.env.PGHOST)
  const user = trim(process.env.NUXT_PG_USER) || trim(process.env.PGUSER)
  const database = trim(process.env.NUXT_PG_DATABASE) || trim(process.env.PGDATABASE)

  const portSource = process.env.NUXT_PG_PORT ?? process.env.PGPORT
  const port
    = portSource !== undefined && portSource !== null && `${portSource}`.trim() !== ''
      ? Number(portSource)
      : 5432

  if (Number.isNaN(port)) {
    throw new Error('PostgreSQL 端口无效：请检查 NUXT_PG_PORT 或 PGPORT')
  }

  const password = (process.env.NUXT_PG_PASSWORD ?? process.env.PGPASSWORD) || ''

  const ssl = resolvePgSsl(process.env.NUXT_PG_SSL)

  if (!host || !database || !user) {
    throw new Error(
      'PostgreSQL 未完整配置：请设置 NUXT_DATABASE_URL（或 DATABASE_URL），'
      + '或使用 NUXT_PG_HOST / NUXT_PG_USER / NUXT_PG_DATABASE / NUXT_PG_PASSWORD'
      + '（可选 NUXT_PG_PORT、NUXT_PG_SSL；亦兼容 PGHOST、PGUSER、PGDATABASE 等）。'
    )
  }

  return {
    host,
    port,
    user,
    password,
    database,
    ssl
  }
}

export function hasPgConnectionEnv(): boolean {
  if (trim(process.env.NUXT_DATABASE_URL) || trim(process.env.DATABASE_URL)) {
    return true
  }
  const host = trim(process.env.NUXT_PG_HOST) || trim(process.env.PGHOST)
  const u = trim(process.env.NUXT_PG_USER) || trim(process.env.PGUSER)
  const database = trim(process.env.NUXT_PG_DATABASE) || trim(process.env.PGDATABASE)
  return Boolean(host && u && database)
}

export function pgIntegrationTestsEnabled(): boolean {
  const v = trim(process.env.RUN_PG_INTEGRATION).toLowerCase()
  return v === '1' || v === 'true' || v === 'yes'
}
