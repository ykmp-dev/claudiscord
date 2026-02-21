import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js'
import { sessionManager } from '../../core/SessionManager.js'
import { formatSessionStatus, formatError } from '../formatters.js'

export const statusCommand = new SlashCommandBuilder()
  .setName('status')
  .setDescription('Show current session status')

export async function handleStatus(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  await interaction.deferReply()

  const channelId = interaction.channelId
  const session = sessionManager.get(channelId)

  if (!session) {
    await interaction.editReply(formatError('No active session in this channel'))
    return
  }

  const status = formatSessionStatus({
    state: session.state,
    backend: session.backend,
    directory: session.directory,
    messageCount: session.messages.length,
    createdAt: session.createdAt,
    lastActivityAt: session.lastActivityAt,
  })

  await interaction.editReply(status)
}
