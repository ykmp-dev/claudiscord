/** 承認フローハンドラー */

import {
  ButtonInteraction,
  ComponentType,
  Message,
  User,
} from 'discord.js'
import { formatApprovalRequest, createApprovalButtons } from '../formatters.js'
import { sessionManager } from '../../core/SessionManager.js'
import { ToolPolicy, ToolApprovalResult } from '../../policies/ToolPolicy.js'
import logger from '../../lib/logger.js'

const pendingApprovals = new Map<string, {
  toolName: string
  toolInput: unknown
  resolve: (approved: boolean) => void
  expiresAt: Date
}>()

export class ApprovalHandler {
  private readonly message: Message
  private readonly toolPolicy: ToolPolicy
  private timeoutTimer?: NodeJS.Timeout

  constructor(message: Message, toolPolicy: ToolPolicy) {
    this.message = message
    this.toolPolicy = toolPolicy
  }

  /** 承認リクエストを送信 */
  async requestApproval(
    toolName: string,
    toolInput: unknown
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const key = `${this.message.channelId}_${toolName}_${Date.now()}`
      const expiresAt = new Date(Date.now() + this.toolPolicy.getApprovalTimeout())

      pendingApprovals.set(key, {
        toolName,
        toolInput,
        resolve,
        expiresAt,
      })

      // タイムアウト設定
      this.timeoutTimer = setTimeout(() => {
        if (pendingApprovals.has(key)) {
          pendingApprovals.delete(key)
          resolve(false)
          this.message.edit({
            content: `⏰ Approval for ${toolName} timed out`,
            components: [],
          }).catch(logger.error)
        }
      }, this.toolPolicy.getApprovalTimeout())

      // メッセージ送信
      this.message.channel
        .send({
          content: formatApprovalRequest(toolName, toolInput),
          components: [createApprovalButtons(key)],
        })
        .then((sent) => {
          // コレクターで待機
          const collector = sent.createMessageComponentCollector<ComponentType.Button>({
            time: this.toolPolicy.getApprovalTimeout(),
          })

          collector.on('collect', async (i: ButtonInteraction) => {
            await i.update({ components: [] })

            if (this.timeoutTimer) {
              clearTimeout(this.timeoutTimer)
            }

            const approved = i.customId === `approve_${key}`
            pendingApprovals.delete(key)
            resolve(approved)

            const response = approved
              ? `✅ ${toolName} approved`
              : `❌ ${toolName} rejected`
            i.followUp({ content: response, ephemeral: true }).catch(logger.error)
          })

          collector.on('end', (collected) => {
            if (collected.size === 0) {
              sent.edit({ components: [] }).catch(logger.error)
            }
          })
        })
        .catch((error) => {
          logger.error({ error }, 'Failed to send approval request')
          resolve(false)
        })
    })
  }
}

/** 承認リクエストを処理 */
export async function handleApprovalInteraction(
  interaction: ButtonInteraction
): Promise<void> {
  // 実際の処理はコレクター内で行われる
  await interaction.reply({ content: 'Processing...', ephemeral: true })
}
