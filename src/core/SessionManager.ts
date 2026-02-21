/** セッション管理 */

import type {
  Session,
  SessionManager,
  SessionMessage,
  SessionState,
  ApprovalRequest,
} from '../types/session.js'
import { SessionError } from '../lib/errors.js'
import logger from '../lib/logger.js'

class SessionManagerImpl implements SessionManager {
  private readonly sessions = new Map<string, Session>()

  create(
    channelId: string,
    backend: 'claude' | 'glm',
    directory: string
  ): Session {
    const existing = this.sessions.get(channelId)
    if (existing) {
      logger.warn({ channelId }, 'Session already exists, replacing')
    }

    const session: Session = {
      id: this.generateSessionId(),
      channelId,
      state: 'idle',
      backend,
      directory,
      sessionId: this.generateSessionId(),
      messages: [],
      createdAt: new Date(),
      lastActivityAt: new Date(),
    }

    this.sessions.set(channelId, session)
    logger.info({ channelId, sessionId: session.id, backend }, 'Session created')
    return session
  }

  get(channelId: string): Session | undefined {
    return this.sessions.get(channelId)
  }

  delete(channelId: string): boolean {
    const result = this.sessions.delete(channelId)
    if (result) {
      logger.info({ channelId }, 'Session deleted')
    }
    return result
  }

  setState(channelId: string, state: SessionState): void {
    const session = this.sessions.get(channelId)
    if (!session) {
      throw new SessionError('Session not found', channelId)
    }
    session.state = state
    session.lastActivityAt = new Date()
    logger.debug({ channelId, state }, 'Session state updated')
  }

  addMessage(channelId: string, message: SessionMessage): void {
    const session = this.sessions.get(channelId)
    if (!session) {
      throw new SessionError('Session not found', channelId)
    }
    session.messages.push(message)
    session.lastActivityAt = new Date()
  }

  setPendingApproval(
    channelId: string,
    approval: ApprovalRequest | undefined
  ): void {
    const session = this.sessions.get(channelId)
    if (!session) {
      throw new SessionError('Session not found', channelId)
    }
    session.pendingApproval = approval
    session.lastActivityAt = new Date()
  }

  clearMessages(channelId: string): void {
    const session = this.sessions.get(channelId)
    if (!session) {
      throw new SessionError('Session not found', channelId)
    }
    session.messages = []
    session.lastActivityAt = new Date()
    logger.info({ channelId }, 'Session messages cleared')
  }

  getAll(): Session[] {
    return Array.from(this.sessions.values())
  }

  cleanupInactive(timeoutMs: number): string[] {
    const now = new Date()
    const removed: string[] = []

    for (const [channelId, session] of this.sessions.entries()) {
      const inactiveTime = now.getTime() - session.lastActivityAt.getTime()
      if (inactiveTime > timeoutMs) {
        this.sessions.delete(channelId)
        removed.push(channelId)
        logger.info({ channelId, inactiveTime }, 'Session cleaned up (inactive)')
      }
    }

    return removed
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
  }
}

export const sessionManager = new SessionManagerImpl()
export default SessionManagerImpl
