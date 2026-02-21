/** 設定型定義 */

export interface DiscordConfig {
  guildId: string
}

export interface ClaudeLLMConfig {
  enabled: boolean
}

export interface GLMLLMConfig {
  enabled: boolean
  baseUrl: string
  authToken: string
  model: string
  maxTokens: number
}

export interface LLMConfig {
  defaultBackend: 'claude' | 'glm'
  claude: ClaudeLLMConfig
  glm: GLMLLMConfig
}

export interface ChannelConfig {
  backend: 'claude' | 'glm'
  directory: string
  permissionMode: 'acceptEdits' | 'readOnly'
  description?: string
}

export interface ToolPolicyConfig {
  autoApprove: string[]
  logOnly: string[]
  requireApproval: string[]
  approvalTimeoutSec: number
}

export interface OutputConfig {
  streamingIntervalMs: number
  showToolSummary: boolean
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error'
}

export interface Config {
  discord: DiscordConfig
  llm: LLMConfig
  channels: Record<string, ChannelConfig>
  toolPolicy: ToolPolicyConfig
  output: OutputConfig
  logging: LoggingConfig
}
