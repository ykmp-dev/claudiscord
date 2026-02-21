/** セッション型定義 */

import type { TextChannel } from 'discord.js'

export type SessionState = 'idle' | 'processing' | 'awaiting_approval'

export interface SessionMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface ApprovalRequest {
  toolName: string
  toolInput: unknown
  messageId: string
  expiresAt: Date
}

export interface Session {
  id: string
  channelId: string
  state: SessionState
  backend: 'claude' | 'glm'
  directory: string
  sessionId: string // Claude Code CLI セッションID
  messages: SessionMessage[]
  createdAt: Date
  lastActivityAt: Date
  pendingApproval?: ApprovalRequest
}

export interface SessionManager {
  create(channelId: string, backend: 'claude' | 'glm', directory: string): Session
  get(channelId: string): Session | undefined
  delete(channelId: string): boolean
  setState(channelId: string, state: SessionState): void
  addMessage(channelId: string, message: SessionMessage): void
  setPendingApproval(channelId: string, approval: ApprovalRequest | undefined): void
  clearMessages(channelId: string): void
  getAll(): Session[]
  cleanupInactive(timeoutMs: number): string[]
}
