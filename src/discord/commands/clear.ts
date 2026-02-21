import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { sessionManager } from '../../core/SessionManager.js'
import { formatSuccess, formatError } from '../formatters.js'

export const clearCommand = new SlashCommandBuilder()
  .setName('clear')
  .setDescription('Clear message history (keeps session active)')

export async function handleClear(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  await interaction.deferReply()

  const channelId = interaction.channelId
  const session = sessionManager.get(channelId)

  if (!session) {
    await interaction.editReply(formatError('No active session in this channel'))
    return
  }

  sessionManager.clearMessages(channelId)

  await interaction.editReply(formatSuccess('Message history cleared'))
}
