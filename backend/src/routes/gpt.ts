import express, { Request, Response } from 'express'
import OpenAI from 'openai'
import { config } from '@/config/environment'
import { logger } from '@/utils/logger'

const router: express.Router = express.Router()

// POST /api/gpt/chat
// Body: { messages: Array<{ role: 'system'|'user'|'assistant', content: string }>, model?: string, temperature?: number }
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { messages, model, temperature } = req.body as {
      messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
      model?: string
      temperature?: number
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, error: 'messages array is required' })
    }

    if (!config.openai.apiKey) {
      logger.error('OPENAI_API_KEY is not configured')
      return res.status(500).json({ success: false, error: 'OpenAI is not configured on the server' })
    }

    const client = new OpenAI({ apiKey: config.openai.apiKey })
    const usedModel = model || config.openai.model || 'gpt-4o-mini'
    const usedTemp = typeof temperature === 'number' ? temperature : 0.7

    const completion = await client.chat.completions.create({
      model: usedModel,
      messages,
      temperature: usedTemp,
    })

    const reply = completion.choices?.[0]?.message?.content ?? ''

    return res.json({
      success: true,
      data: {
        reply,
      },
    })
  } catch (error: any) {
    logger.error('GPT chat error:', error?.response?.data || error?.message || error)
    return res.status(500).json({
      success: false,
      error: 'Failed to get response from GPT',
    })
  }
})

export default router