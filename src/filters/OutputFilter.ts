/** 出力フィルター */

const MAX_MESSAGE_LENGTH = 1900
const THINKING_TAG = '<thinking>'
const THINKING_END_TAG = '</thinking>'

export class OutputFilter {
  private buffer = ''
  private isInThinking = false

  /** ストリーミングチャンクを処理 */
  process(chunk: string): {
    display: string
    isComplete: boolean
  } {
    let processed = chunk

    // thinkingタグ内をスキップ
    if (this.isInThinking) {
      if (chunk.includes(THINKING_END_TAG)) {
        const idx = chunk.indexOf(THINKING_END_TAG)
        processed = chunk.slice(idx + THINKING_END_TAG.length)
        this.isInThinking = false
      } else {
        return { display: '', isComplete: false }
      }
    } else if (processed.includes(THINKING_TAG)) {
      const idx = processed.indexOf(THINKING_TAG)
      processed = processed.slice(0, idx)
      this.isInThinking = true
    }

    // アンエスケープ処理
    processed = processed
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')

    this.buffer += processed

    // 表示部分とバッファを分離
    let display = ''
    if (this.buffer.length >= MAX_MESSAGE_LENGTH) {
      display = this.buffer.slice(0, MAX_MESSAGE_LENGTH)
      this.buffer = this.buffer.slice(MAX_MESSAGE_LENGTH)
    } else {
      display = this.buffer
      this.buffer = ''
    }

    return {
      display,
      isComplete: this.buffer.length === 0,
    }
  }

  /** 残りをフラッシュ */
  flush(): string {
    const remaining = this.buffer
    this.buffer = ''
    return remaining
  }

  /** リセット */
  reset(): void {
    this.buffer = ''
    this.isInThinking = false
  }

  /** メッセージ長制限 */
  static truncate(message: string, maxLength = MAX_MESSAGE_LENGTH): string {
    if (message.length <= maxLength) return message
    return message.slice(0, maxLength - 3) + '...'
  }
}
