/** Claude Code CLI 用ブリッジ */

import type { Bridge, BridgeOptions, StreamChunk, ToolResult } from '../types/bridge.js'
import { BridgeError } from '../lib/errors.js'
import Anthropic from '@anthropic-ai/sdk'
import logger from '../lib/logger.js'

export class ClaudeBridge implements Bridge {
  private readonly directory: string
  private readonly sessionId: string
  private readonly onStream?: (chunk: StreamChunk) => void
  private readonly onToolUse?: (toolName: string, toolInput: unknown) => Promise<boolean>
  private closed = false
  private client?: Anthropic
  private conversationHistory: Array<{ role: string; content: string }> = []

  constructor(options: BridgeOptions) {
    this.directory = options.directory
    this.sessionId = options.sessionId
    this.onStream = options.onStream
    this.onToolUse = options.onToolUse

    // Anthropic API client
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.ZAI_AUTH_TOKEN
    if (apiKey) {
      const baseUrl = process.env.ANTHROPIC_BASE_URL || 'https://api.z.ai/api/anthropic'
      this.client = new Anthropic({
        apiKey,
        baseURL: baseUrl,
      })
    }
  }

  async sendMessage(message: { role: 'user' | 'assistant'; content: string }): Promise<void> {
    if (this.closed) {
      throw new BridgeError('Bridge is closed', 'CLOSED')
    }

    logger.debug({ sessionId: this.sessionId, contentLength: message.content.length }, 'Sending message to Claude')

    this.conversationHistory.push({
      role: message.role === 'user' ? 'user' : 'assistant',
      content: message.content,
    })

    if (!this.client) {
      // フォールバック: 簡易応答
      this.onStream?.({
        type: 'text',
        content: `🤖 Claude Bridge\n\n受信メッセージ: ${message.content}\n\n※Claude Code CLI SDK の統合がまだ完了していません。z.aiトークンを.envに設定してください。`,
      })
      return
    }

    try {
      const stream = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: this.conversationHistory.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        stream: true,
      })

      let currentContent = ''

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          currentContent += event.delta.text
          this.onStream?.({
            type: 'text',
            content: event.delta.text,
          })
        }
      }

      this.conversationHistory.push({
        role: 'assistant',
        content: currentContent,
      })
    } catch (error) {
      logger.error({ error, sessionId: this.sessionId }, 'Claude API error')
      this.onStream?.({
        type: 'text',
        content: `⚠️ エラー: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    }
  }

  async sendToolResults(results: ToolResult[]): Promise<void> {
    if (this.closed) {
      throw new BridgeError('Bridge is closed', 'CLOSED')
    }

    logger.debug({ sessionId: this.sessionId, resultCount: results.length }, 'Sending tool results')
  }

  async close(): Promise<void> {
    if (this.closed) return
    this.closed = true
    logger.info({ sessionId: this.sessionId }, 'Claude bridge closed')
  }

  getSessionId(): string {
    return this.sessionId
  }
}
