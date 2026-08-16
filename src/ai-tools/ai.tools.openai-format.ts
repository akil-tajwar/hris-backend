import { geminiTools } from './ai.tools.definitions'

export const openAiFormatTools = geminiTools[0].functionDeclarations.map(
  (fn: any) => ({
    type: 'function' as const,
    function: {
      name: fn.name,
      description: fn.description,
      parameters: fn.parameters,
    },
  })
)
