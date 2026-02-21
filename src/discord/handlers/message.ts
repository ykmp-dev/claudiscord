/** メッセージ処理ハンドラー */

import type { Message, Client } from 'discord.js'
import { sessionManager } from '../../core/SessionManager.js'
import { BridgeFactory } from '../../bridges/BridgeFactory.js'
import { ToolPolicy } from '../../policies/ToolPolicy.js'
import { OutputFilter } from '../../filters/OutputFilter.js'
import { formatError, formatSuccess, formatSessionStatus } from '../formatters.js'
import type { Config } from '../../types/config.js'
import logger from '../../lib/logger.js'

export class MessageHandler {
  private readonly client: Client
  private readonly config: Config
  private readonly bridgeFactory: BridgeFactory
  private readonly toolPolicy: ToolPolicy
  private readonly activeBridges = new Map<string, any>()
  private readonly outputFilters = new Map<string, OutputFilter>()

  constructor(
    client: Client,
    config: Config,
    bridgeFactory: BridgeFactory
  ) {
    this.client = client
    this.config = config
    this.bridgeFactory = bridgeFactory
    this.toolPolicy = new ToolPolicy(config.toolPolicy)
  }

  async handle(message: Message): Promise<void> {
    // Botのメッセージは無視
    if (message.author.bot) return

    // チャンネル設定確認
    const channelConfig = this.config.channels[message.channelId]
    if (!channelConfig) {
      logger.debug({ channelId: message.channelId }, 'Channel not configured')
      return
    }

    // セッション確認
    let session = sessionManager.get(message.channelId)
    if (!session) {
      await message.reply(
        formatError('No active session. Use `/start` to begin.')
      )
      return
    }

    if (session.state !== 'idle') {
      await message.reply(
        formatError('Session is busy. Please wait for the current task to complete.')
      )
      return
    }

    // 処理開始
    sessionManager.setState(message.channelId, 'processing')
    sessionManager.addMessage(message.channelId, {
      role: 'user',
      content: message.content,
      timestamp: new Date(),
    })

    // 出力フィルター初期化
    if (!this.outputFilters.has(message.channelId)) {
      this.outputFilters.set(message.channelId, new OutputFilter())
    }
    const filter = this.outputFilters.get(message.channelId)!

    // ブリッジ取得/作成
    let bridge = this.activeBridges.get(message.channelId)
    if (!bridge) {
      bridge = this.bridgeFactory.create(channelConfig.backend, {
        directory: channelConfig.directory,
        sessionId: session.sessionId,
        onStream: async (chunk) => {
          await this.handleStreamChunk(message, chunk, filter)
        },
        onToolUse: async (toolName, toolInput) => {
          return this.handleToolUse(message, toolName, toolInput)
        },
      })
      this.activeBridges.set(message.channelId, bridge)
    }

    try {
      // メッセージ送信
      await bridge.sendMessage({
        role: 'user',
        content: message.content,
      })

      // 完了
      await message.react('✅')
    } catch (error) {
      logger.error({ error, channelId: message.channelId }, 'Message handling error')
      await message.reply(
        formatError(`Failed to process message: ${error instanceof Error ? error.message : 'Unknown error'}`)
      )
    } finally {
      sessionManager.setState(message.channelId, 'idle')
    }
  }

  private async handleStreamChunk(
    message: Message,
    chunk: { type: string; content: string; toolName?: string },
    filter: OutputFilter
  ): Promise<void> {
    if (chunk.type === 'text') {
      const { display } = filter.process(chunk.content)
      if (display) {
        // 編集または新規メッセージ
        // TODO: Implement proper streaming message update
      }
    }
  }

  private async handleToolUse(
    message: Message,
    toolName: string,
    toolInput: unknown
  ): Promise<boolean> {
    const result = this.toolPolicy.checkTool(toolName)

    if (result === ToolApprovalResult.APPROVED) {
      return true
    }

    if (result === ToolApprovalResult.REQUIRES_APPROVAL) {
      // TODO: Implement approval flow
      return false
    }

    if (result === ToolApprovalResult.LOG_ONLY) {
      logger.info({ toolName, toolInput }, 'Tool logged (not executed)')
      return false
    }

    return false
  }

  cleanup(channelId: string): void {
    const bridge = this.activeBridges.get(channelId)
    if (bridge) {
      bridge.close().catch(logger.error)
      this.activeBridges.delete(channelId)
    }
    this.outputFilters.delete(channelId)
  }
}
