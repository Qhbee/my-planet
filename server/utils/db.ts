import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from '../db/schema'
import { resolvePgPoolConfig } from './pg-pool-options'

/** 连接参数仅来自环境变量，无需 Nitro runtime 类型。见 `.env.example` 与 `server/utils/pg-pool-options.ts` {@link resolvePgPoolConfig} */
const pool = new Pool(resolvePgPoolConfig())

export const db = drizzle(pool, { schema })
export { schema }
