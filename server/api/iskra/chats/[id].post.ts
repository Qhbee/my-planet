import { createOpenAI } from '@ai-sdk/openai'
import { convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse, generateText, smoothStream, stepCountIs, streamText } from 'ai'
import { z } from 'zod'
// import { db, schema } from '../../../utils/db'
import { db, schema } from '#db'
import { and, eq } from 'drizzle-orm'
import type { UIMessage } from 'ai'
import { weatherTool, chartTool } from '#shared/utils'

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

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.string()
  }).parse)

  const { model, messages } = await readValidatedBody(event, z.object({
    model: z.string(),
    messages: z.array(z.custom<UIMessage>())
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
      const result = streamText({
        model,
        system: `You are a knowledgeable and helpful AI assistant. ${session.user?.username ? `The user's name is ${session.user.username}.` : ''} Your goal is to provide clear, accurate, and well-structured responses.

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
- Maintain a friendly, professional tone`,
        messages: await convertToModelMessages(messages),
        providerOptions: {
          openai: {
            reasoningEffort: 'low',
            reasoningSummary: 'detailed'
          },
          google: {
            thinkingConfig: {
              includeThoughts: true,
              thinkingBudget: 2048
            }
          }
        },
        stopWhen: stepCountIs(5),
        experimental_transform: smoothStream({ chunking: 'word' }),
        tools: {
          weather: weatherTool,
          chart: chartTool
        }
      })

      if (!chat.title) {
        writer.write({
          type: 'data-chat-title',
          data: { message: 'Generating title...' },
          transient: true
        })
      }

      writer.merge(result.toUIMessageStream({
        sendReasoning: true
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
