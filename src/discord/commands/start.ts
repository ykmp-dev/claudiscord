import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { sessionManager } from '../../core/SessionManager.js'
import { formatSuccess, formatError } from '../formatters.js'
import type { Config } from '../../types/config.js'

export const startCommand = new SlashCommandBuilder()
  .setName('start')
  .setDescription('Start a new LLM session')
  .addStringOption((option) =>
    option
      .setName('backend')
      .setDescription('LLM backend to use')
      .addChoices({ name: 'Claude', value: 'claude' }, { name: 'GLM', value: 'glm' })
  )

export async function handleStart(
  interaction: ChatInputCommandInteraction,
  config: Config
): Promise<void> {
  await interaction.deferReply()

  const channelId = interaction.channelId
  const backend = (interaction.options.getString('backend') as 'claude' | 'glm' | null) ||
    config.llm.defaultBackend

  const channelConfig = config.channels[channelId]
  if (!channelConfig) {
    await interaction.editReply(
      formatError('Channel not configured. Please add this channel to config.yaml')
    )
    return
  }

  // 既存セッションのクリーンアップ
  const existing = sessionManager.get(channelId)
  if (existing) {
    sessionManager.delete(channelId)
  }

  // 新規セッション作成
  const session = sessionManager.create(
    channelId,
    backend,
    channelConfig.directory
  )

  await interaction.editReply(
    formatSuccess(
      `Session started!\nBackend: ${session.backend}\nDirectory: ${channelConfig.directory}`
    )
  )
}
