/** カスタムエラー定義 */

export class BridgeError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message)
    this.name = 'BridgeError'
  }
}

export class SessionError extends Error {
  constructor(message: string, public readonly sessionId: string) {
    super(message)
    this.name = 'SessionError'
  }
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigError'
  }
}

export class ToolPolicyError extends Error {
  constructor(message: string, public readonly toolName: string) {
    super(message)
    this.name = 'ToolPolicyError'
  }
}
