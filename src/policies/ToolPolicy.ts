/** ツールポリシー管理 */

import type { ToolPolicyConfig } from '../types/config.js'
import { ToolPolicyError } from '../lib/errors.js'
import logger from '../lib/logger.js'

export enum ToolApprovalResult {
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REQUIRES_APPROVAL = 'requires_approval',
  LOG_ONLY = 'log_only',
}

export class ToolPolicy {
  constructor(private readonly config: ToolPolicyConfig) {}

  /** ツール実行の可否を判定 */
  checkTool(toolName: string): ToolApprovalResult {
    if (this.config.autoApprove.includes(toolName)) {
      logger.debug({ toolName }, 'Tool auto-approved')
      return ToolApprovalResult.APPROVED
    }

    if (this.config.logOnly.includes(toolName)) {
      logger.debug({ toolName }, 'Tool marked as log-only')
      return ToolApprovalResult.LOG_ONLY
    }

    if (this.config.requireApproval.includes(toolName)) {
      logger.debug({ toolName }, 'Tool requires approval')
      return ToolApprovalResult.REQUIRES_APPROVAL
    }

    // デフォルトは承認必要
    logger.debug({ toolName }, 'Tool requires approval (default)')
    return ToolApprovalResult.REQUIRES_APPROVAL
  }

  /** 承認の有効期限チェック */
  isApprovalValid(expiresAt: Date): boolean {
    return new Date() < expiresAt
  }

  /** 承認タイムアウト取得 */
  getApprovalTimeout(): number {
    return this.config.approvalTimeoutSec * 1000
  }

  /** ログのみのツール判定 */
  isLogOnly(toolName: string): boolean {
    return this.config.logOnly.includes(toolName)
  }

  /** 承認不要のツール判定 */
  isAutoApproved(toolName: string): boolean {
    return this.config.autoApprove.includes(toolName)
  }
}
