import { geminiTools } from '../ai-tools/ai.tools.definitions'
import { openAiFormatTools } from '../ai-tools/ai.tools.openai-format'
import { executeAITool } from '../ai-tools/ai.tools.executor'
import { gemini } from '../config/gemini'
import { localAI, LOCAL_MODEL } from '../config/local-ai'

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
}: {
  message: string
  tenantId: number
}) => {
  const useLocal = process.env.AI_MOCK === 'true'

  const todayDate = new Date().toISOString().split('T')[0] // e.g. "2026-08-16"

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

Only use the tools explicitly provided to you. Never invent a tool
name that wasn't given to you. If no available tool can answer the
question, say so directly in plain language — do not write JSON,
function names, or pseudo tool-calls as text in your answer.

You answer questions using the available tools.

Important rules:
1. Never invent employee information.
2. Always use tools when the user asks about actual employee, attendance, leave, salary, or HR data.
3. Never guess attendance information.
4. If multiple employees match a name, ask the user to clarify.
5. Never expose tenant IDs.
6. Give concise and clear answers.
`

  console.log('Using client:', useLocal ? 'LOCAL (Ollama)' : 'REAL GEMINI')

  if (useLocal) {
    return runLocalChat({ message, tenantId, systemInstruction })
  }

  return runGeminiChat({ message, tenantId, systemInstruction })
}

// ---------- Gemini path ----------

const runGeminiChat = async ({
  message,
  tenantId,
  systemInstruction,
}: {
  message: string
  tenantId: number
  systemInstruction: string
}) => {
  const t0 = Date.now()
  let response = await gemini.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: [
      {
        role: 'user',
        parts: [{ text: message }],
      } as any,
    ],
    config: { systemInstruction, tools: geminiTools as unknown as any },
  })
  console.log(`First call: ${Date.now() - t0}ms`)

  while (true) {
    const functionCalls = response.functionCalls

    if (!functionCalls || functionCalls.length === 0) {
      break
    }

    const functionResponses = []

    for (const functionCall of functionCalls) {
      console.log('Tool call:', functionCall.name, functionCall.args)

      const toolStart = Date.now()
      const result = await executeAITool({
        name: functionCall.name!,
        arguments: functionCall.args ?? {},
        tenantId,
      })
      console.log(
        `Tool exec (${functionCall.name}): ${Date.now() - toolStart}ms`
      )
      console.log('Tool result:', JSON.stringify(result))

      functionResponses.push({
        functionResponse: {
          name: functionCall.name!,
          response: result,
        },
      })
    }

    const t1 = Date.now()
    response = await gemini.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        { role: 'user', parts: [{ text: message }] } as any,
        {
          role: 'model',
          parts: response.candidates?.[0]?.content?.parts ?? [],
        } as any,
        { role: 'user', parts: functionResponses } as any,
      ],
      config: { systemInstruction, tools: geminiTools as unknown as any },
    })
    console.log(`Second call: ${Date.now() - t1}ms`)
  }

  return response.text
}

// ---------- Ollama (local) path ----------

const runLocalChat = async ({
  message,
  tenantId,
  systemInstruction,
}: {
  message: string
  tenantId: number
  systemInstruction: string
}) => {
  const messages: any[] = [
    { role: 'system', content: systemInstruction },
    { role: 'user', content: message },
  ]

  const t0 = Date.now()
  let response = await localAI.chat.completions.create({
    model: LOCAL_MODEL,
    messages,
    tools: openAiFormatTools,
    // @ts-ignore - Ollama-specific extension not in OpenAI's types
    keep_alive: '30m',
  })
  console.log(`First call: ${Date.now() - t0}ms`)

  while (true) {
    const choice = response.choices[0]
    const toolCalls = choice.message.tool_calls

    if (!toolCalls || toolCalls.length === 0) {
      return choice.message.content ?? ''
    }

    messages.push(choice.message)

    for (const toolCall of toolCalls) {
      if (toolCall.type !== 'function') {
        console.warn('Skipping non-function tool call:', toolCall.type)
        continue
      }

      const args = JSON.parse(toolCall.function.arguments || '{}')

      console.log('Tool call:', toolCall.function.name, args)

      const toolStart = Date.now()
      const result = await executeAITool({
        name: toolCall.function.name,
        arguments: args,
        tenantId,
      })
      console.log(
        `Tool exec (${toolCall.function.name}): ${Date.now() - toolStart}ms`
      )
      console.log('Tool result:', JSON.stringify(result))

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      })
    }

    const t1 = Date.now()
    response = await localAI.chat.completions.create({
      model: LOCAL_MODEL,
      messages,
      tools: openAiFormatTools,
      // @ts-ignore - Ollama-specific extension not in OpenAI's types
      keep_alive: '30m',
    })
    console.log(`Second call: ${Date.now() - t1}ms`)
  }
}
