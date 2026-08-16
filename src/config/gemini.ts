import { GoogleGenAI } from '@google/genai'
import { geminiMock } from './gemini.mock'

console.log('gemini.ts loaded, AI_MOCK =', process.env.AI_MOCK)

export const gemini =
  process.env.AI_MOCK === 'true'
    ? (geminiMock as any)
    : new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })