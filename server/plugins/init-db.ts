import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

export default defineNitroPlugin(() => {
  const root = process.cwd()
  const dataDir = join(root, '.data')
  mkdirSync(dataDir, { recursive: true })
  const sqlite = new Database(join(dataDir, 'iskra.sqlite'))
  const statements = [
    `CREATE TABLE IF NOT EXISTS chats (
      id text PRIMARY KEY NOT NULL,
      title text,
      user_id text NOT NULL,
      created_at integer NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS chats_user_id_idx ON chats (user_id)`,
    `CREATE TABLE IF NOT EXISTS messages (
      id text PRIMARY KEY NOT NULL,
      chat_id text NOT NULL,
      role text NOT NULL,
      parts text,
      created_at integer NOT NULL,
      FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE cascade
    )`,
    `CREATE INDEX IF NOT EXISTS messages_chat_id_idx ON messages (chat_id)`,
    `CREATE TABLE IF NOT EXISTS users (
      id text PRIMARY KEY NOT NULL,
      email text NOT NULL,
      name text NOT NULL,
      avatar text NOT NULL,
      username text NOT NULL,
      provider text NOT NULL,
      provider_id text NOT NULL,
      created_at integer NOT NULL
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS users_provider_id_idx ON users (provider, provider_id)`
  ]
  for (const sql of statements) {
    sqlite.exec(sql)
  }
  sqlite.close()
})
