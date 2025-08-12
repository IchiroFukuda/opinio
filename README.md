# Opinio

1日3問で即答力を鍛えるアプリケーション

## 概要

Opinioは、会議・面接で即答力を鍛えたい人のためのWebアプリケーションです。
毎日3つの質問がランダムで出題され、45秒の制限時間内で回答することで、
AIが「結論の明確さ」「理由の妥当性」「視点の多様性」の3軸で評価します。

## 機能

- 1日3問のランダム出題
- 45秒タイマー付き回答
- AIによる3軸評価（0-10点）
- 100字以内のAI短評
- 回答履歴の閲覧
- NextAuth.jsによる認証

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **バックエンド**: Next.js API Routes
- **データベース**: Supabase (PostgreSQL)
- **認証**: NextAuth.js
- **AI**: OpenAI GPT-4
- **デプロイ**: Vercel

## セットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd opinion
npm install
```

### 2. 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Internal API
INTERNAL_TOKEN=your_internal_token

# App
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app

# NextAuth.js
NEXTAUTH_SECRET=your_nextauth_secret_key_here
NEXTAUTH_URL=http://localhost:3000
```

### 3. Supabaseのセットアップ

1. [Supabase](https://supabase.com/)でプロジェクトを作成
2. SQL Editorで`supabase-schema.sql`の内容を実行
3. Authentication > Settings > URL ConfigurationでリダイレクトURLを設定

### 4. OpenAI APIキーの取得

[OpenAI Platform](https://platform.openai.com/)でAPIキーを取得し、環境変数に設定

### 5. NextAuth.jsの設定

NextAuth.jsのシークレットキーを生成：

```bash
openssl rand -base64 32
```

生成されたキーを`NEXTAUTH_SECRET`環境変数に設定してください。

### 6. 開発サーバーの起動

```bash
npm run dev
```

## データベーススキーマ

### テーブル

- `users`: NextAuth.js用のユーザー管理テーブル
- `profiles`: ユーザープロフィール情報
- `questions`: 質問プール
- `daily_sets`: ユーザーごとの日次出題セット
- `answers`: ユーザーの回答
- `feedback`: AI評価結果

### テーブル構造

```sql
-- users（NextAuth.js用）
users (
  id: text (primary key),
  email: text (unique),
  name: text,
  email_verified: timestamptz,
  image: text,
  created_at: timestamptz,
  updated_at: timestamptz
)

-- profiles（ユーザープロフィール情報）
profiles (
  id: text (references users.id),
  display_name: text,
  created_at: timestamptz
)
```

### RLSポリシー

- ユーザーは自分のデータのみアクセス可能
- 質問は全ユーザーが閲覧可能
- フィードバックはサーバーサイドでのみ作成
- JWTクレームベースの認証

### RPC関数

- `get_or_create_daily_set()`: 日次出題セットの取得・作成
- `can_answer_today()`: 当日の回答制限チェック

## API エンドポイント

- `GET /api/today`: 今日の出題を取得
- `POST /api/answer`: 回答を送信
- `POST /api/feedback`: AIフィードバック生成（内部専用）
- `GET /api/history`: 回答履歴を取得
- `GET/POST /api/auth/[...nextauth]`: NextAuth.js認証

## 認証フロー

1. ユーザーがメールアドレスを入力
2. NextAuth.jsが認証を処理
3. 新規ユーザーの場合、Supabaseの`users`テーブルに自動作成
4. JWTセッションが作成される
5. 保護されたAPIエンドポイントにアクセス可能
6. セッションは30日間有効

## 使用方法

1. ログインページでメールアドレスを入力
2. 認証後、今日の3問に回答（各45秒制限）
3. AI評価と短評を確認
4. 履歴ページで過去の回答を振り返り

## 開発

### コーディング規約

- TypeScript strict mode
- Zodによるバリデーション
- 環境変数の存在チェック
- エラーハンドリングの徹底

### テスト

```bash
npm run test
```

### ビルド

```bash
npm run build
```

## デプロイ

### Vercel

1. Vercelでプロジェクトを作成
2. 環境変数を設定
3. GitHubリポジトリと連携
4. 自動デプロイ

## ライセンス

MIT License

## 貢献

プルリクエストやイシューの報告を歓迎します。
