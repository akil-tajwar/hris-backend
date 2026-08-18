import { Request, Response } from 'express'
import { runAIChat } from '../services/ai.service'

export const aiChatController = async (req: Request, res: Response) => {
  try {
    const { message } = req.body
    console.log("🚀 ~ aiChatController ~ message:", message)

    if (!message || typeof message !== 'string') {
      res.status(400).json({
        message: 'Message is required.',
      })
    }

    const tenantId = req.user?.tenantId
    const userId = req.user?.userId
    console.log("🚀 ~ aiChatController ~ tenantId:", tenantId)

    if (!tenantId || !userId) {
      res.status(401).json({
        message: 'Tenant or user not found.',
      })
      return
    }
    console.log('Using client:', process.env.AI_MOCK === 'true' ? 'MOCK' : 'REAL GEMINI')
    const answer = await runAIChat({
      message,
      tenantId,
      userId,
    })

    res.status(200).json({
      answer,
    })
  } catch (error) {
    console.error('AI Chat Error:', error)

    res.status(500).json({
      message: 'Failed to process AI request.',
    })
  }
}
