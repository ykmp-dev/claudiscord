/** Discord メッセージフォーマット */

import {
  codeBlock,
  italic,
  bold,
  userMention,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from 'discord.js'

/** コードブロック付きメッセージ */
export function formatCodeBlock(code: string, language = 'ts'): string {
  return codeBlock(language, code.slice(0, 1900)) // Discord limit
}

/** ツール実行サマリー */
export function formatToolSummary(tools: { name: string; count: number }[]): string {
  if (tools.length === 0) return ''
  const lines = tools.map((t) => `  ${t.name}: ${t.count}`).join('\n')
  return `${bold('🔧 Tools Used:')}\n${codeBlock(lines)}`
}

/** エラーメッセージ */
export function formatError(message: string): string {
  return `❌ ${bold('Error:')}\n${italic(message)}`
}

/** 成功メッセージ */
export function formatSuccess(message: string): string {
  return `✅ ${message}`
}

/** 情報メッセージ */
export function formatInfo(message: string): string {
  return `ℹ️ ${message}`
}

/** 承認リクエストメッセージ */
export function formatApprovalRequest(
  toolName: string,
  toolInput: unknown
): string {
  const inputStr =
    typeof toolInput === 'string'
      ? toolInput.slice(0, 500)
      : JSON.stringify(toolInput, null, 2).slice(0, 500)

  return `⚠️ ${bold('Approval Required')}\n\n${bold('Tool:')} ${toolName}\n${bold('Input:')}\n${codeBlock(inputStr)}\n\nReact with ✅ to approve or ❌ to reject.`
}

/** セッション状態メッセージ */
export function formatSessionStatus(session: {
  state: string
  backend: string
  directory: string
  messageCount: number
  createdAt: Date
  lastActivityAt: Date
}): string {
  const uptime = Math.floor(
    (Date.now() - session.createdAt.getTime()) / 1000 / 60
  )
  const idleTime = Math.floor(
    (Date.now() - session.lastActivityAt.getTime()) / 1000 / 60
  )

  return `${bold('📊 Session Status')}\n` +
    `State: ${session.state}\n` +
    `Backend: ${session.backend}\n` +
    `Directory: ${codeBlock(session.directory)}\n` +
    `Messages: ${session.messageCount}\n` +
    `Uptime: ${uptime}m | Idle: ${idleTime}m`
}

/** 承認ボタン作成 */
export function createApprovalButtons(toolName: string) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`approve_${toolName}`)
      .setLabel('✅ Approve')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`reject_${toolName}`)
      .setLabel('❌ Reject')
      .setStyle(ButtonStyle.Danger)
  )
}
