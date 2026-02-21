/** Discord Bot 本体 */

import {
  Client,
  GatewayIntentBits,
  Partials,
  type Message,
  type ChatInputCommandInteraction,
} from 'discord.js'
import { MessageHandler } from '../discord/handlers/message.js'
import { BridgeFactory } from '../bridges/BridgeFactory.js'
import { handleStart, handleStop, handleClear, handleStatus } from '../discord/commands/index.js'
import { registerCommands } from '../discord/register.js'
import type { Config } from '../types/config.js'
import logger from '../lib/logger.js'

export class DiscordBotClient {
  private readonly client: Client
  private readonly config: Config
  private readonly bridgeFactory: BridgeFactory
  private messageHandler?: MessageHandler

  constructor(config: Config) {
    this.config = config
    this.bridgeFactory = new BridgeFactory({
      claude: config.llm.claude,
      glm: config.llm.glm,
    })

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
      partials: [Partials.Channel],
    })

    this.setupEventHandlers()
  }

  private setupEventHandlers(): void {
    this.client.once('ready', () => {
      logger.info(`Logged in as ${this.client.user?.tag}`)
      this.messageHandler = new MessageHandler(
        this.client,
        this.config,
        this.bridgeFactory
      )
    })

    this.client.on('messageCreate', async (message: Message) => {
      if (this.messageHandler) {
        await this.messageHandler.handle(message)
      }
    })

    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isChatInputCommand()) return

      const { commandName } = interaction

      try {
        switch (commandName) {
          case 'start':
            await handleStart(interaction, this.config)
            break
          case 'stop':
            await handleStop(interaction)
            break
          case 'clear':
            await handleClear(interaction)
            break
          case 'status':
            await handleStatus(interaction)
            break
          default:
            await interaction.reply({ content: 'Unknown command', ephemeral: true })
        }
      } catch (error) {
        logger.error({ error, command: commandName }, 'Command handling error')
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: 'An error occurred while processing the command',
            ephemeral: true,
          })
        }
      }
    })
  }

  async start(token: string): Promise<void> {
    await this.client.login(token)
  }

  async stop(): Promise<void> {
    await this.client.destroy()
    logger.info('Discord bot stopped')
  }

  async registerCommands(token: string, clientId: string): Promise<void> {
    await registerCommands(token, clientId, this.config.discord.guildId)
  }
}
