import OpenAI from 'openai'

export const localAI = new OpenAI({
  baseURL: 'http://localhost:11434/v1',
  apiKey: 'ollama', // required by SDK, ignored by Ollama
})

export const LOCAL_MODEL = 'llama3.1'