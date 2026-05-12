import type * as DbSchema from '../../server/db/schema'

export type Chat = typeof DbSchema.chats.$inferSelect
export type Message = typeof DbSchema.messages.$inferSelect
