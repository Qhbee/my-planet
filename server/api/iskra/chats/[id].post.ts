import { createOpenAI } from '@ai-sdk/openai'
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateText,
  generateId,
  simulateReadableStream,
  type ModelMessage,
  type UIMessage,
  type UIMessageChunk
} from 'ai'
import { z } from 'zod'
// import { db, schema } from '../../../utils/db'
import { db, schema } from '#db'
import { and, eq } from 'drizzle-orm'

defineRouteMeta({
  openAPI: {
    description: 'Chat with AI.',
    tags: ['ai']
  }
})

/** 会话标题生成：同时设置 API_KEY、BASE_URL、MODEL 时用 OpenAI 兼容接口，否则仍走 AI Gateway。 */
function resolveTitleGenerationModel() {
  const apiKey = process.env.API_KEY?.trim()
  const baseURL = process.env.BASE_URL?.trim()
  const modelId = process.env.MODEL?.trim()
  if (apiKey && baseURL && modelId) {
    // @ai-sdk/openai v3：`provider(modelId)` 走 Responses API（/v1/responses）；多数第三方只实现 Chat Completions。
    // Responses API（POST …/v1/responses）
    // return createOpenAI({ apiKey, baseURL })(modelId)
    // Chat Completions API（POST …/v1/chat/completions）
    return createOpenAI({ apiKey, baseURL }).chat(modelId)
  }
  return 'xiaomi/mimo-v2.5'
}

const DEFAULT_ISKRA_ENGINE_ORIGIN = 'http://127.0.0.1:8000'

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '')
}

/** 与本机 uvicorn：`iskra-engine` POST /rag/query */
function resolveIskraEngineOrigin(): string {
  // ??：未配置；trim 后 ||：配置成空字符串 / 纯空格时也回退默认
  const envOrigin = (process.env.NUXT_ISKRA_ENGINE_URL ?? '').trim()
  return trimTrailingSlash(envOrigin || DEFAULT_ISKRA_ENGINE_ORIGIN)
}

/** 与 `iskra_engine.api.schemas.rag.RagQueryRequest` 同构。 */
type RagQueryRequest = {
  query: string
  top_k?: number
  path_prefix?: string
  model?: string
}

/** 与 `iskra_engine.api.schemas.rag.RagSourceItem` 对齐。 */
type RagSourceItem = {
  rel_path?: string | null
  title?: string | null
  book?: string | null
  chunk_index?: number | null
  chunk_id?: number | null
  score?: number | null
  snippet?: string
}

/** 与 `iskra_engine.api.schemas.rag.RagQueryResponse` 对齐。 */
type RagQueryResponse = {
  answer: string
  sources: RagSourceItem[]
}

/**
 * `convertToModelMessages` 之后：打成引擎当前仍接受的 `RagQueryRequest`。
 * 整段 `ModelMessage[]` 放在 `query` 字符串内的 JSON 里（引擎现逻辑把整个 `query` 当检索问题用）；
 * 日后 Python 若解析该 JSON，即可把 system / 多轮 / 工具 / 图片 等整段喂 LlamaIndex，无需先改 OpenAI 兼容层。
 */
function modelMessagesToRagQueryRequest(
  modelMessages: ModelMessage[],
  // top_k: number | undefined,
  // path_prefix: string | undefined,
  model: string | undefined
): RagQueryRequest {
  const query = JSON.stringify({ messages: modelMessages })
  return {
    query,
    // ...(top_k !== undefined ? { top_k } : {}),
    // ...(path_prefix !== undefined && path_prefix !== '' ? { path_prefix } : {}),
    ...(model !== undefined ? { model } : {})
  }
}

function escapeDetailsSummary(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function oneLinePreview(text: string, max: number): string {
  const t = text.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return escapeDetailsSummary(t)
  return `${escapeDetailsSummary(t.slice(0, max))}…`
}

function stripMarkdownFootnoteDefinitions(text: string): string {
  return text
    .split('\n')
    .filter(line => !/^\[\^[^\]]+\]:/.test(line.trimStart()))
    .join('\n')
    .trim()
}

/** 将检索来源拼成 Markdown，附在正文后由 `MDCCached` 渲染。外层 `<details>` 折叠整组，内层每条再折叠，summary 仅一行预览。 */
function formatRagSourcesMarkdown(sources: RagSourceItem[]): string {
  if (!sources?.length) return ''
  const blocks = sources.map((s, i) => {
    const head = s.title?.trim() || s.rel_path?.trim() || `来源 ${i + 1}`
    const previewSource = [head, s.rel_path?.trim()].filter(Boolean).join(' · ')
    const summaryText = `${i + 1}. ${oneLinePreview(previewSource, 100)}`

    const meta: string[] = []
    if (s.rel_path) meta.push(`路径: \`${s.rel_path}\``)
    if (s.book) meta.push(`书目: ${s.book}`)
    if (s.chunk_index != null) meta.push(`chunk #${s.chunk_index}`)
    if (s.score != null && Number.isFinite(s.score)) meta.push(`score ${s.score.toFixed(4)}`)
    const metaLine = meta.length ? `\n*${meta.join(' · ')}*` : ''
    const snip = stripMarkdownFootnoteDefinitions((s.snippet ?? '').trim())
    const quote = snip ? `\n\n${snip.split('\n').map(line => '> ' + line).join('\n')}` : ''
    const detailMarkdown = ('**' + (i + 1) + '. ' + head + '**\n\n' + metaLine + quote).trim()
    return `<details>\n<summary>${summaryText}</summary>\n\n${detailMarkdown}\n\n</details>`
  })
  return `\n\n---\n\n<details>\n<summary>参考来源（${sources.length} 条）</summary>\n\n${blocks.join('\n\n')}\n\n</details>`
}

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.string()
  }).parse)

  const { model, messages } = await readValidatedBody(event, z.object({
    model: z.string().optional(),
    messages: z.array(z.custom<UIMessage>()).min(1, '消息不能为空')
  }).parse)

  const chat = await db.query.chats.findFirst({
    where: () => and(
      eq(schema.chats.id, id as string),
      eq(schema.chats.userId, session.user?.id || session.id)
    ),
    with: {
      messages: true
    }
  })
  if (!chat) {
    throw createError({ statusCode: 404, statusMessage: 'Chat not found' })
  }

  if (!chat.title) {
    const { text: title } = await generateText({
      model: resolveTitleGenerationModel(),
      system: `You are a title generator for a chat:
          - Generate a short title based on the first user's message
          - The title should be less than 30 characters long
          - The title should be a summary of the user's message
          - Do not use quotes (' or ") or colons (:) or any other punctuation
          - Do not use markdown, just plain text`,
      prompt: JSON.stringify(messages[0])
    })

    await db.update(schema.chats).set({ title }).where(eq(schema.chats.id, id as string))
  }

  const lastMessage = messages[messages.length - 1]
  if (lastMessage?.role === 'user' && messages.length > 1) {
    await db.insert(schema.messages).values({
      chatId: id as string,
      role: 'user',
      parts: lastMessage.parts
    })
  }

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      /* const system = `You are a knowledgeable and helpful AI assistant. ${session.user?.username ? `The user's name is ${session.user.username}.` : ''} Your goal is to provide clear, accurate, and well-structured responses.

**FORMATTING RULES (CRITICAL):**
- ABSOLUTELY NO MARKDOWN HEADINGS: Never use #, ##, ###, ####, #####, or ######
- NO underline-style headings with === or ---
- Use **bold text** for emphasis and section labels instead
- Examples:
  * Instead of "## Usage", write "**Usage:**" or just "Here's how to use it:"
  * Instead of "# Complete Guide", write "**Complete Guide**" or start directly with content
- Start all responses with content, never with a heading

**RESPONSE QUALITY:**
- Be concise yet comprehensive
- Use examples when helpful
- Break down complex topics into digestible parts
- Maintain a friendly, professional tone` */

      const modelMessages: ModelMessage[] = await convertToModelMessages(messages)

      const queryReq = modelMessagesToRagQueryRequest(modelMessages, model)

      const origin = resolveIskraEngineOrigin()
      let response: string
      try {
        const queryResp = await $fetch<RagQueryResponse>(`${origin}/rag/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: queryReq
        })
        const answer = (queryResp.answer ?? '').trim()
        const sources = formatRagSourcesMarkdown(queryResp.sources ?? [])
        response = answer + sources
      } catch (e) {
        console.error('[iskra] POST /rag/query failed', e)
        throw createError({ statusCode: 502, statusMessage: 'Sorry, Iskra engine query failed' })
      }

      if (!chat.title) {
        writer.write({
          type: 'data-chat-title',
          data: { message: 'Generating title...' },
          transient: true
        })
      }

      const textPartId = generateId()
      const chunks: UIMessageChunk[] = [
        { type: 'text-start', id: textPartId },
        { type: 'text-delta', id: textPartId, delta: response },
        { type: 'text-end', id: textPartId },
        { type: 'finish', finishReason: 'stop' }
      ]

      writer.merge(simulateReadableStream<UIMessageChunk>({
        chunks: chunks,
        initialDelayInMs: null,
        chunkDelayInMs: null
      }))
    },
    onFinish: async ({ messages }) => {
      await db.insert(schema.messages).values(messages.map(message => ({
        chatId: chat.id,
        role: message.role as 'user' | 'assistant',
        parts: message.parts
      })))
    }
  })

  return createUIMessageStreamResponse({
    stream
  })
})
