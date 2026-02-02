import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { join } from 'node:path'
import * as schema from '../db/schema'

const dbPath = join(process.cwd(), '.data', 'iskra.sqlite')
const sqlite = new Database(dbPath)
export const db = drizzle(sqlite, { schema })
export { schema }
