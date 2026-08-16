// config/ai-client.ts
import OpenAI from 'openai'

export const localAI = new OpenAI({
  baseURL: 'http://localhost:11434/v1',
  apiKey: 'ollama', // required by the SDK but unused by Ollama
})