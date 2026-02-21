/** ブリッジ共通インターフェース */

export type ToolResult = {
  name: string
  input: unknown
  output?: unknown
  error?: string
}

export interface StreamChunk {
  type: 'text' | 'tool_use' | 'tool_result'
  content: string
  toolName?: string
  toolInput?: unknown
}

export interface BridgeMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface BridgeOptions {
  directory: string
  sessionId: string
  onStream?: (chunk: StreamChunk) => void
  onToolUse?: (toolName: string, toolInput: unknown) => Promise<boolean>
}

export interface Bridge {
  sendMessage(message: BridgeMessage): Promise<void>
  sendToolResults(results: ToolResult[]): Promise<void>
  close(): Promise<void>
  getSessionId(): string
}
