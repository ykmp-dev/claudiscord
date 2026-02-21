/** YAML 設定ローダー */

import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { parse } from 'yaml'
import { ConfigSchema, type Config } from './schema.js'
import { ConfigError } from '../lib/errors.js'
import logger from '../lib/logger.js'

/** 環境変数展開 ${VAR_NAME} → 実際の値 */
function expandEnvVars(obj: unknown): unknown {
  if (typeof obj === 'string') {
    return obj.replace(/\$\{([^}]+)\}/g, (_, key) => {
      return process.env[key] || ''
    })
  }
  if (Array.isArray(obj)) {
    return obj.map(expandEnvVars)
  }
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, expandEnvVars(v)])
    )
  }
  return obj
}

export async function loadConfig(configPath: string): Promise<Config> {
  logger.info({ configPath }, 'Loading configuration...')

  if (!existsSync(configPath)) {
    throw new ConfigError(
      `Configuration file not found: ${configPath}\n` +
        `Copy config/config.yaml.example to config/config.yaml and configure it.`
    )
  }

  const content = await readFile(configPath, 'utf-8')
  const raw = parse(content)
  const expanded = expandEnvVars(raw) as Record<string, unknown>

  const result = ConfigSchema.safeParse(expanded)

  if (!result.success) {
    const errors = result.error.errors
      .map((e) => `  - ${e.path.join('.')}: ${e.message}`)
      .join('\n')
    throw new ConfigError(`Configuration validation failed:\n${errors}`)
  }

  logger.info('Configuration loaded successfully')
  return result.data
}
