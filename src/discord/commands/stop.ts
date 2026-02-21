import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { sessionManager } from '../../core/SessionManager.js'
import { formatSuccess, formatError } from '../formatters.js'

export const stopCommand = new SlashCommandBuilder()
  .setName('stop')
  .setDescription('Stop the current LLM session')

export async function handleStop(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  await interaction.deferReply()

  const channelId = interaction.channelId
  const session = sessionManager.get(channelId)

  if (!session) {
    await interaction.editReply(formatError('No active session in this channel'))
    return
  }

  sessionManager.delete(channelId)

  // TODO: Cleanup bridge

  await interaction.editReply(formatSuccess('Session stopped'))
}
