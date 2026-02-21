/** Discord スラッシュコマンド登録スクリプト */

import 'dotenv/config'
import { REST, Routes } from 'discord.js'
import * as commands from '../src/discord/commands/index.js'
import logger from '../src/lib/logger.js'

const token = process.env.DISCORD_BOT_TOKEN
const clientId = process.env.DISCORD_CLIENT_ID
const guildId = process.env.DISCORD_GUILD_ID

if (!token || !clientId) {
  logger.error('DISCORD_BOT_TOKEN and DISCORD_CLIENT_ID are required')
  process.exit(1)
}

const allCommands = [
  commands.startCommand,
  commands.stopCommand,
  commands.clearCommand,
  commands.statusCommand,
]

async function main(): Promise<void> {
  const rest = new REST().setToken(token)

  try {
    logger.info('Started refreshing application (/) commands.')

    const route = guildId
      ? Routes.applicationGuildCommands(clientId, guildId)
      : Routes.applicationCommands(clientId)

    const data = (await rest.put(route, {
      body: allCommands,
    })) as unknown[]

    logger.info(`Successfully registered ${data.length} commands.`)
  } catch (error) {
    logger.error({ error }, 'Failed to register commands')
    process.exit(1)
  }
}

main()
