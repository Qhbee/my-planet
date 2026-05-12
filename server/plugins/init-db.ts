import { sql } from 'drizzle-orm'
import { db } from '#db'

export default defineNitroPlugin(async () => {
  const statements = [
    `CREATE TABLE IF NOT EXISTS chats (
      id text PRIMARY KEY NOT NULL,
      title text,
      user_id text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS chats_user_id_idx ON chats (user_id)`,
    `CREATE TABLE IF NOT EXISTS messages (
      id text PRIMARY KEY NOT NULL,
      chat_id text NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
      role text NOT NULL,
      parts jsonb,
      created_at timestamptz NOT NULL DEFAULT NOW()
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
      created_at timestamptz NOT NULL DEFAULT NOW()
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS users_provider_id_idx ON users (provider, provider_id)`
  ]
  for (const stmt of statements) {
    await db.execute(sql.raw(stmt))
  }
})
