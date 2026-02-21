/** Claude Code CLI 用ブリッジ */

import type { Bridge, BridgeOptions, StreamChunk, ToolResult } from '../types/bridge.js'
import { BridgeError } from '../lib/errors.js'
import logger from '../lib/logger.js'

// Claude Code CLI SDK imports would go here
// For now, this is a placeholder implementation

export class ClaudeBridge implements Bridge {
  private readonly directory: string
  private readonly sessionId: string
  private readonly onStream?: (chunk: StreamChunk) => void
  private readonly onToolUse?: (toolName: string, toolInput: unknown) => Promise<boolean>
  private closed = false

  constructor(options: BridgeOptions) {
    this.directory = options.directory
    this.sessionId = options.sessionId
    this.onStream = options.onStream
    this.onToolUse = options.onToolUse
  }

  async sendMessage(message: { role: 'user' | 'assistant'; content: string }): Promise<void> {
    if (this.closed) {
      throw new BridgeError('Bridge is closed', 'CLOSED')
    }

    logger.debug({ sessionId: this.sessionId, contentLength: message.content.length }, 'Sending message to Claude Code CLI')

    // TODO: Implement actual Claude Code CLI integration
    // This would use @anthropic-ai/claude-agent-sdk
    this.onStream?.({
      type: 'text',
      content: `[Claude Bridge] Received: ${message.content.slice(0, 50)}...`,
    })
  }

  async sendToolResults(results: ToolResult[]): Promise<void> {
    if (this.closed) {
      throw new BridgeError('Bridge is closed', 'CLOSED')
    }

    logger.debug({ sessionId: this.sessionId, resultCount: results.length }, 'Sending tool results')
    // TODO: Implement tool result sending
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
