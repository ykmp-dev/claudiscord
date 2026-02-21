# claudiscord - Discord LLM Bridge

外出先からDiscord経由でローカル/VPS開発環境のLLM（Claude Code CLI / GLM-5）を操作できるボット。

スマホから「このバグ直して」と送るだけで、帰宅後には修正完了している状態を実現します。

## 機能

- DiscordスラッシュコマンドでのLLM操作
- Claude Code CLI と GLM-5 (z.ai) の切り替え
- ツール実行の承認フロー（リアクション/ボタン）
- チャンネルごとのセッション管理
- ストリーミングレスポンス

## スラッシュコマンド

| コマンド | 説明 |
|---------|------|
| `/start` | 新しいセッションを開始 |
| `/stop` | セッションを終了 |
| `/clear` | 履歴をクリア（セッションは維持） |
| `/status` | 現在のセッション状態を表示 |

## インストール

```bash
git clone https://github.com/yuber/claudiscord.git
cd claudiscord
npm install
```

## 設定

### 1. Discord Bot設定

1. [Discord Developer Portal](https://discord.com/developers/applications) でアプリケーション作成
2. BotトークンとClient IDを取得
3. 適切な権限を付与
4. `.env` に設定

### 2. 環境変数

```bash
cp .env.example .env
```

`.env` を編集:

```env
DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
ZAI_AUTH_TOKEN=your_zai_token_here
LOG_LEVEL=info
```

### 3. チャンネル設定

```bash
cp config/config.yaml.example config/config.yaml
```

`config/config.yaml` を編集:

```yaml
discord:
  guildId: "YOUR_GUILD_ID"

llm:
  defaultBackend: "claude"
  claude:
    enabled: true
  glm:
    enabled: true
    baseUrl: "https://api.z.ai/api/anthropic"
    authToken: "${ZAI_AUTH_TOKEN}"
    model: "glm-5"

channels:
  "CHANNEL_ID":
    backend: "claude"
    directory: "/path/to/project"
    permissionMode: "acceptEdits"
    description: "Project description"

toolPolicy:
  autoApprove:
    - Read
    - Glob
    - Grep
  requireApproval:
    - Bash
```

## 使い方

### 開発

```bash
npm run dev
```

### ビルド

```bash
npm run build
```

### コマンド登録

```bash
npm run register-commands
```

### 本番実行

```bash
npm start
```

### PM2 で実行（VPS推奨）

```bash
npm run build
pm2 start dist/index.js --name claudiscord
pm2 save
pm2 startup
```

## VPS デプロイ

GitHub Actionsで自動デプロイ可能です。

1. リポジトリの Secrets に以下を設定:
   - `VPS_HOST`
   - `VPS_USERNAME`
   - `VPS_SSH_KEY`
   - `VPS_PORT` (オプション、デフォルト22)

2. VPSでPM2をインストール:
   ```bash
   npm install -g pm2
   ```

3. VPSでリポジトリをクローン:
   ```bash
   git clone https://github.com/yuber/claudiscord.git ~/claudiscord
   cd ~/claudiscord
   npm install
   ```

4. mainブランチにプッシュすると自動デプロイ

## ライセンス

MIT
