/** Zod スキーマ定義 */

import { z } from 'zod'

export const DiscordConfigSchema = z.object({
  guildId: z.string(),
})

export const ClaudeLLMConfigSchema = z.object({
  enabled: z.boolean().default(true),
})

export const GLMLLMConfigSchema = z.object({
  enabled: z.boolean().default(true),
  baseUrl: z.string().url(),
  authToken: z.string(),
  model: z.string().default('glm-5'),
  maxTokens: z.number().default(131072),
})

export const LLMConfigSchema = z.object({
  defaultBackend: z.enum(['claude', 'glm']).default('claude'),
  claude: ClaudeLLMConfigSchema,
  glm: GLMLLMConfigSchema,
})

export const ChannelConfigSchema = z.object({
  backend: z.enum(['claude', 'glm']),
  directory: z.string(),
  permissionMode: z.enum(['acceptEdits', 'readOnly']).default('acceptEdits'),
  description: z.string().optional(),
})

export const ToolPolicyConfigSchema = z.object({
  autoApprove: z.array(z.string()).default([
    'Read',
    'Glob',
    'Grep',
    'WebSearch',
    'WebFetch',
  ]),
  logOnly: z.array(z.string()).default(['Write', 'Edit', 'NotebookEdit']),
  requireApproval: z.array(z.string()).default(['Bash']),
  approvalTimeoutSec: z.number().default(300),
})

export const OutputConfigSchema = z.object({
  streamingIntervalMs: z.number().default(1500),
  showToolSummary: z.boolean().default(true),
})

export const LoggingConfigSchema = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
})

export const ConfigSchema = z.object({
  discord: DiscordConfigSchema,
  llm: LLMConfigSchema,
  channels: z.record(z.string(), ChannelConfigSchema),
  toolPolicy: ToolPolicyConfigSchema,
  output: OutputConfigSchema,
  logging: LoggingConfigSchema,
})
