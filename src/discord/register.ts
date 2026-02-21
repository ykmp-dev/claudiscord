/** Discord コマンド登録 */

import { REST, Routes } from 'discord.js'
import * as commands from './commands/index.js'
import logger from '../lib/logger.js'

const allCommands = [
  commands.startCommand,
  commands.stopCommand,
  commands.clearCommand,
  commands.statusCommand,
]

export async function registerCommands(
  token: string,
  clientId: string,
  guildId?: string
): Promise<void> {
  const rest = new REST().setToken(token)

  try {
    logger.info('Started refreshing application (/) commands.')

    const data = (await rest.put(
      guildId
        ? Routes.applicationGuildCommands(clientId, guildId)
        : Routes.applicationCommands(clientId),
      { body: allCommands }
    )) as unknown[]

    logger.info(`Successfully reloaded ${data.length} application (/) commands.`)
  } catch (error) {
    logger.error({ error }, 'Failed to reload commands')
    throw error
  }
}

export { allCommands }
