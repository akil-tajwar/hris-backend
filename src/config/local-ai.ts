import OpenAI from 'openai'

export const localAI = new OpenAI({
  baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1',
  apiKey: 'ollama', // required by SDK, unused by Ollama
})

export const LOCAL_MODEL = process.env.OLLAMA_MODEL || 'llama3.1'
export const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'nomic-embed-text'