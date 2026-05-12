import { describe, it, expect, afterAll } from 'vitest'
import { Pool } from 'pg'
import {
  hasPgConnectionEnv,
  pgIntegrationTestsEnabled,
  resolvePgPoolConfig
} from '../../server/utils/pg-pool-options'

describe.skipIf(!pgIntegrationTestsEnabled() || !hasPgConnectionEnv())(
  'PostgreSQL 连通性（与本项目 Drizzle/pg 配置一致）',
  () => {
    const poolOptions = resolvePgPoolConfig()
    const pool = new Pool(poolOptions)

    afterAll(async () => {
      await pool.end()
    })

    it('原生 pg：SELECT 1', async () => {
      const { rows } = await pool.query('SELECT 1::int AS one')
      expect(rows[0].one).toBe(1)
    })
  }
)
