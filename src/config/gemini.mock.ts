export const geminiMock = {
  models: {
    generateContent: async ({ contents }: any) => {
      const lastEntry = contents[contents.length - 1]

      // Second-round call: mock received a tool result, summarize it
      const functionResponsePart = lastEntry?.parts?.find(
        (p: any) => p.functionResponse
      )
      if (functionResponsePart) {
        const { response } = functionResponsePart.functionResponse
        const count =
          response?.count ??
          (Array.isArray(response) ? response.length : 'unknown')
        return {
          text: `There were ${count} employees absent on that date.`,
          functionCalls: undefined,
          candidates: [
            {
              finishReason: 'STOP',
              content: { parts: [{ text: 'summary' }], role: 'model' },
            },
          ],
        }
      }

      // First-round call: parse the user's message as before
      const lastUserText = lastEntry?.parts?.[0]?.text ?? ''

      if (/absent/i.test(lastUserText)) {
        const match = lastUserText.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/)
        const date = match
          ? `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`
          : '2026-01-01'

        return {
          text: '',
          functionCalls: [{ name: 'get_absent_employees', args: { date } }],
          candidates: [
            { finishReason: 'STOP', content: { parts: [], role: 'model' } },
          ],
        }
      }

      return {
        text: `Mock response for: ${lastUserText}`,
        functionCalls: undefined,
        candidates: [
          {
            finishReason: 'STOP',
            content: { parts: [{ text: 'Mock response' }], role: 'model' },
          },
        ],
      }
    },
  },
}
