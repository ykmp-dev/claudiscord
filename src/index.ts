/** claudiscord - Discord LLM Bridge */

import 'dotenv/config'
import { DiscordBotClient } from './core/DiscordBotClient.js'
import { loadConfig } from './config/loader.js'
import logger from './lib/logger.js'

const CONFIG_PATH = process.env.CONFIG_PATH || 'config/config.yaml'

async function main(): Promise<void> {
  try {
    // 設定読み込み
    const config = await loadConfig(CONFIG_PATH)

    // Discord Botトークン確認
    const token = process.env.DISCORD_BOT_TOKEN
    if (!token) {
      throw new Error('DISCORD_BOT_TOKEN environment variable is required')
    }

    // Bot起動
    const bot = new DiscordBotClient(config)
    await bot.start(token)

    // グレースフルシャットダウン
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down...')
      await bot.stop()
      process.exit(0)
    })

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down...')
      await bot.stop()
      process.exit(0)
    })

  } catch (error) {
    logger.error({ error }, 'Failed to start bot')
    process.exit(1)
  }
}

main()
