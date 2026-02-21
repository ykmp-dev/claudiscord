/** ブリッジファクトリー */

import type { Bridge, BridgeOptions } from '../types/bridge.js'
import type { ClaudeLLMConfig, GLMLLMConfig } from '../types/config.js'
import { ClaudeBridge } from './ClaudeBridge.js'
import { GLMBridge } from './GLMBridge.js'

export interface BridgeFactoryOptions {
  claude: ClaudeLLMConfig
  glm: GLMLLMConfig
}

export class BridgeFactory {
  constructor(private readonly options: BridgeFactoryOptions) {}

  create(
    backend: 'claude' | 'glm',
    options: BridgeOptions
  ): Bridge {
    switch (backend) {
      case 'claude':
        if (!this.options.claude.enabled) {
          throw new Error('Claude backend is not enabled')
        }
        return new ClaudeBridge(options)

      case 'glm':
        if (!this.options.glm.enabled) {
          throw new Error('GLM backend is not enabled')
        }
        return new GLMBridge({
          ...options,
          baseUrl: this.options.glm.baseUrl,
          authToken: this.options.glm.authToken,
          model: this.options.glm.model,
          maxTokens: this.options.glm.maxTokens,
        })

      default:
        throw new Error(`Unknown backend: ${backend}`)
    }
  }
}
