import { drizzle } from 'drizzle-orm/bun-sqlite'
import { Database } from 'bun:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { useRuntimeConfig } from 'nitropack/runtime/internal/config'
import * as schema from '../db/schema'

const dbPath = String(useRuntimeConfig().sqlitePath)
mkdirSync(dirname(dbPath), { recursive: true })
const sqlite = new Database(dbPath)
export const db = drizzle(sqlite, { schema })
export { schema }
