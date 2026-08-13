import { Request, Response } from 'express'
import { runAIChat } from '../services/ai.service'

export const aiChatController = async (req: Request, res: Response) => {
  try {
    const { message } = req.body

    if (!message || typeof message !== 'string') {
      res.status(400).json({
        message: 'Message is required.',
      })
    }

    const tenantId = req.user?.tenantId

    if (!tenantId) {
      res.status(401).json({
        message: 'Tenant not found.',
      })
      return
    }

    const answer = await runAIChat({
      message,
      tenantId,
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
