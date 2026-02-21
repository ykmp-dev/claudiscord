/** GLM-5/z.ai 用ブリッジ */

import type { Bridge, BridgeOptions, StreamChunk, ToolResult } from '../types/bridge.js'
import Anthropic from '@anthropic-ai/sdk'
import { BridgeError } from '../lib/errors.js'
import logger from '../lib/logger.js'

interface GLMBridgeOptions extends BridgeOptions {
  baseUrl: string
  authToken: string
  model: string
  maxTokens: number
}

export class GLMBridge implements Bridge {
  private readonly client: Anthropic
  private readonly directory: string
  private readonly sessionId: string
  private readonly model: string
  private readonly maxTokens: number
  private readonly onStream?: (chunk: StreamChunk) => void
  private readonly onToolUse?: (toolName: string, toolInput: unknown) => Promise<boolean>
  private closed = false
  private conversationHistory: Array<{ role: string; content: string }> = []

  constructor(options: GLMBridgeOptions) {
    this.client = new Anthropic({
      apiKey: options.authToken,
      baseURL: options.baseUrl,
    })
    this.directory = options.directory
    this.sessionId = options.sessionId
    this.model = options.model
    this.maxTokens = options.maxTokens
    this.onStream = options.onStream
    this.onToolUse = options.onToolUse
  }

  async sendMessage(message: { role: 'user' | 'assistant'; content: string }): Promise<void> {
    if (this.closed) {
      throw new BridgeError('Bridge is closed', 'CLOSED')
    }

    logger.debug({ sessionId: this.sessionId, contentLength: message.content.length }, 'Sending message to GLM-5')

    this.conversationHistory.push({
      role: message.role === 'user' ? 'user' : 'assistant',
      content: message.content,
    })

    try {
      const stream = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
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
      logger.error({ error, sessionId: this.sessionId }, 'GLM API error')
      throw new BridgeError(
        `GLM API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'API_ERROR'
      )
    }
  }

  async sendToolResults(results: ToolResult[]): Promise<void> {
    if (this.closed) {
      throw new BridgeError('Bridge is closed', 'CLOSED')
    }

    logger.debug({ sessionId: this.sessionId, resultCount: results.length }, 'Sending tool results to GLM')

    // TODO: Implement tool result handling for GLM
    // For now, GLM doesn't support tools in the same way
    logger.warn('GLM tool execution not yet implemented - tools should be delegated to Claude Code CLI')
  }

  async close(): Promise<void> {
    if (this.closed) return
    this.closed = true
    logger.info({ sessionId: this.sessionId }, 'GLM bridge closed')
  }

  getSessionId(): string {
    return this.sessionId
  }
}
