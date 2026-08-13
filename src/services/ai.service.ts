import { geminiTools } from "../ai-tools/ai.tools.definitions"
import { executeAITool } from "../ai-tools/ai.tools.executor"
import { gemini } from "../config/gemini"

export const runAIChat = async ({
  message,
  tenantId,
}: {
  message: string
  tenantId: number
}) => {
  const systemInstruction = `
You are an AI assistant for an HR management system.

You answer questions using the available tools.

Important rules:

1. Never invent employee information.
2. Always use tools when the user asks about
   actual employee, attendance, leave, salary,
   or HR data.
3. Never guess attendance information.
4. If multiple employees match a name,
   ask the user to clarify.
5. Never expose tenant IDs.
6. Give concise and clear answers.
7. Today's date should be determined by the
   application, not guessed by you.
`

  let response = await gemini.models.generateContent({
    model: 'gemini-3.6-flash',

    contents: [
      ({
        role: 'user',
        parts: [
          {
            text: message,
          },
        ],
      } as any),
    ],

      config: {
      systemInstruction,

      // cast to any to satisfy gemini SDK ToolUnion typing
      tools: (geminiTools as unknown) as any,
    },
  })

  while (true) {
    const functionCalls = response.functionCalls

    if (!functionCalls || functionCalls.length === 0) {
      break
    }

    const functionResponses = []

    for (const functionCall of functionCalls) {
      const result = await executeAITool({
        name: functionCall.name!,
        // executeAITool expects a string for arguments; stringify the args object
        arguments: JSON.stringify(functionCall.args ?? {}),
        tenantId,
      })

      functionResponses.push({
        functionResponse: {
          name: functionCall.name!,
          response: result,
        },
      })
    }

    response = await gemini.models.generateContent({
      model: 'gemini-3.6-flash',

      contents: [
        ({
          role: 'user',
          parts: [
            {
              text: message,
            },
          ],
        } as any),
        ({
          role: 'model',
          parts: response.candidates?.[0]?.content?.parts ?? [],
        } as any),
        ({
          role: 'user',
          parts: functionResponses,
        } as any),
      ],

      config: {
        systemInstruction,
        // cast to any to satisfy gemini SDK ToolUnion typing
        tools: (geminiTools as unknown) as any,
      },
    })
  }

  return response.text
}
