# 本番環境セットアップ手順

## 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にアクセス
2. 新しいプロジェクトを作成
3. プロジェクト名とデータベースパスワードを設定
4. プロジェクトが作成されるまで待機（数分）

## 2. データベーススキーマの適用

1. Supabaseダッシュボードで「SQL Editor」を開く
2. `supabase-production.sql`の内容をコピー＆ペースト
3. 「Run」ボタンをクリックしてスキーマを適用

## 3. 環境変数の設定

1. `env.production.example`を`.env.production.local`としてコピー
2. 以下の値を本番環境の値に置き換え：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# NextAuth.js
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=https://your-domain.com
```

## 4. Supabaseの設定

### API Keys
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Settings > API > anon public
- `SUPABASE_SERVICE_ROLE_KEY`: Settings > API > service_role secret

### 認証設定
- Settings > Auth > URL Configuration
- Site URL: `https://your-domain.com`
- Redirect URLs: `https://your-domain.com/api/auth/callback/credentials`

## 5. 本番環境でのデプロイ

### Vercelの場合
1. GitHubリポジトリと連携
2. 環境変数を設定
3. デプロイ

### その他のホスティング
1. 環境変数を適切に設定
2. ビルドとデプロイを実行

## 6. セキュリティ設定

### RLSポリシーの有効化（推奨）
本番環境では適切なセキュリティ設定を行うことを推奨します：

```sql
-- RLSを有効化
alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.daily_sets enable row level security;
alter table public.answers enable row level security;
alter table public.feedback enable row level security;

-- 適切なポリシーを作成
-- （詳細はセキュリティ要件に応じて設定）
```

### 環境変数の管理
- 本番環境では環境変数を適切に管理
- シークレットキーは定期的に更新
- アクセス権限を最小限に制限

## 7. 動作確認

1. 新規登録機能のテスト
2. ログイン機能のテスト
3. 今日の出題取得のテスト
4. 回答送信のテスト

## 8. 監視とログ

- Supabaseダッシュボードでログを確認
- アプリケーションのエラーログを監視
- パフォーマンスメトリクスを確認

## トラブルシューティング

### よくある問題
1. **RLSポリシーエラー**: テーブルのRLSが有効になっている
2. **関数パラメータエラー**: RPC関数のパラメータ名が一致していない
3. **認証エラー**: NextAuth.jsの設定が正しくない

### 解決方法
1. スキーマファイルを再適用
2. 環境変数の確認
3. Supabaseダッシュボードでの設定確認 
