import { geminiTools } from '../ai-tools/ai.tools.definitions'
import { openAiFormatTools } from '../ai-tools/ai.tools.openai-format'
import { executeAITool } from '../ai-tools/ai.tools.executor'
import { gemini } from '../config/gemini'
import { localAI, LOCAL_MODEL } from '../config/local-ai'
import { redis } from '../middlewares/redis'

const HISTORY_TTL_SECONDS = 60 * 60 // 1 hour of inactivity clears history
const MAX_HISTORY_MESSAGES = 20 // cap to avoid unbounded prompt growth

const getHistoryKey = (tenantId: number, userId: number) =>
  `chat_history:${tenantId}:${userId}`

const getChatHistory = async (
  tenantId: number,
  userId: number
): Promise<any[]> => {
  const raw = await redis.get(getHistoryKey(tenantId, userId))
  return raw ? JSON.parse(raw) : []
}

const saveChatHistory = async (
  tenantId: number,
  userId: number,
  history: any[]
) => {
  const trimmed = history.slice(-MAX_HISTORY_MESSAGES)
  await redis.set(
    getHistoryKey(tenantId, userId),
    JSON.stringify(trimmed),
    'EX',
    HISTORY_TTL_SECONDS
  )
}

export const clearChatHistory = async (tenantId: number, userId: number) => {
  await redis.del(getHistoryKey(tenantId, userId))
}

export const warmUpLocalModel = async () => {
  try {
    await localAI.chat.completions.create({
      model: LOCAL_MODEL,
      messages: [{ role: 'user', content: 'hi' }],
    })
    console.log('Ollama model warmed up')
  } catch (err) {
    console.error('Ollama warm-up failed:', err)
  }
}

export const runAIChat = async ({
  message,
  tenantId,
  userId,
}: {
  message: string
  tenantId: number
  userId: number
}) => {
  const useLocal = process.env.AI_MOCK === 'true'
  const todayDate = new Date().toISOString().split('T')[0]

  const systemInstruction = `
You are an AI assistant for an HR management system.

Today's date is ${todayDate}.

When the user gives a date, interpret ambiguous numeric formats as
DD-MM-YYYY (day first). Always resolve the user's input to a specific
calendar date based on what they actually typed — never reuse a date
from earlier in this conversation or from these instructions.

State the resolved date back to the user in "DD Month YYYY" format
(day, full month name, year).

Never call a date-based tool more than once for the same user question
with different date interpretations — if truly ambiguous, ask the user
to confirm the date instead of guessing.

Tailor your response to what was asked — give a count if asked "how
many," list employee names if asked "which" or "who."

Use the conversation history to understand follow-up questions. If the
user refers to something ambiguous like "what about july?" after asking
about august, infer they mean the same kind of question but for July.

Only use the tools explicitly provided to you. Never invent a tool
name that wasn't given to you. If no available tool can answer the
question, say so directly in plain language — do not write JSON,
function names, or pseudo tool-calls as text in your answer.

Important rules:
1. Never invent employee information.
2. Always use tools when the user asks about actual employee, attendance, leave, salary, or HR data.
3. Never guess attendance information.
4. If multiple employees match a name, ask the user to clarify.
5. Never expose tenant IDs.
6. Give concise and clear answers.
`

  const history = await getChatHistory(tenantId, userId)

  console.log('Using client:', useLocal ? 'LOCAL (Ollama)' : 'REAL GEMINI')

  const { answer, updatedHistory } = useLocal
    ? await runLocalChat({ message, tenantId, systemInstruction, history })
    : await runGeminiChat({ message, tenantId, systemInstruction, history })

  await saveChatHistory(tenantId, userId, updatedHistory)

  return answer
}

// ---------- Gemini path ----------

const runGeminiChat = async ({
  message,
  tenantId,
  systemInstruction,
  history,
}: {
  message: string
  tenantId: number
  systemInstruction: string
  history: any[]
}) => {
  const contents: any[] = [
    ...history,
    { role: 'user', parts: [{ text: message }] },
  ]

  let response = await gemini.models.generateContent({
    model: 'gemini-3.6-flash',
    contents,
    config: { systemInstruction, tools: geminiTools as unknown as any },
  })

  while (true) {
    const functionCalls = response.functionCalls

    if (!functionCalls || functionCalls.length === 0) {
      break
    }

    const functionResponses = []

    for (const functionCall of functionCalls) {
      console.log('Tool call:', functionCall.name, functionCall.args)

      const result = await executeAITool({
        name: functionCall.name!,
        arguments: functionCall.args ?? {},
        tenantId,
      })

      console.log('Tool result:', JSON.stringify(result))

      functionResponses.push({
        functionResponse: { name: functionCall.name!, response: result },
      })
    }

    contents.push({
      role: 'model',
      parts: response.candidates?.[0]?.content?.parts ?? [],
    })
    contents.push({ role: 'user', parts: functionResponses })

    response = await gemini.models.generateContent({
      model: 'gemini-3.6-flash',
      contents,
      config: { systemInstruction, tools: geminiTools as unknown as any },
    })
  }

  const finalText = response.text ?? ''

  const updatedHistory = [
    ...history,
    { role: 'user', parts: [{ text: message }] },
    { role: 'model', parts: [{ text: finalText }] },
  ]

  return { answer: finalText, updatedHistory }
}

// ---------- Ollama (local) path ----------

const runLocalChat = async ({
  message,
  tenantId,
  systemInstruction,
  history,
}: {
  message: string
  tenantId: number
  systemInstruction: string
  history: any[]
}) => {
  const messages: any[] = [
    { role: 'system', content: systemInstruction },
    ...history,
    { role: 'user', content: message },
  ]

  let response = await localAI.chat.completions.create({
    model: LOCAL_MODEL,
    messages,
    tools: openAiFormatTools,
    // @ts-ignore - Ollama-specific extension not in OpenAI's types
    keep_alive: '30m',
  })

  while (true) {
    const choice = response.choices[0]
    const toolCalls = choice.message.tool_calls

    if (!toolCalls || toolCalls.length === 0) {
      const finalText = choice.message.content ?? ''

      const updatedHistory = [
        ...history,
        { role: 'user', content: message },
        { role: 'assistant', content: finalText },
      ]

      return { answer: finalText, updatedHistory }
    }

    messages.push(choice.message)

    for (const toolCall of toolCalls) {
      if (toolCall.type !== 'function') {
        console.warn('Skipping non-function tool call:', toolCall.type)
        continue
      }

      const args = JSON.parse(toolCall.function.arguments || '{}')

      console.log('Tool call:', toolCall.function.name, args)

      const result = await executeAITool({
        name: toolCall.function.name,
        arguments: args,
        tenantId,
      })

      console.log('Tool result:', JSON.stringify(result))

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      })
    }

    response = await localAI.chat.completions.create({
      model: LOCAL_MODEL,
      messages,
      tools: openAiFormatTools,
      // @ts-ignore
      keep_alive: '30m',
    })
  }
}
