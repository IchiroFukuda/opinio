# パスワード認証の設定手順

## 概要
このプロジェクトにパスワード認証機能を追加しました。既存のメールアドレスのみの認証から、セキュアなパスワード認証システムに移行できます。

## 設定手順

### 1. データベースの更新
まず、Supabaseデータベースにパスワードフィールドを追加する必要があります。

```sql
-- supabase-add-password.sql の内容を実行
ALTER TABLE public.users 
ADD COLUMN password_hash text;

CREATE INDEX IF NOT EXISTS idx_users_password_hash ON public.users(password_hash);

UPDATE public.users SET password_hash = NULL WHERE password_hash IS NULL;

COMMENT ON COLUMN public.users.password_hash IS 'パスワードのハッシュ値（bcrypt）';
```

### 2. 環境変数の確認
以下の環境変数が設定されていることを確認してください：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

### 3. 依存関係のインストール
パスワードハッシュ化用のライブラリをインストール：

```bash
npm install bcryptjs @types/bcryptjs
```

## 機能

### 新規ユーザー登録
- `/auth` ページでアカウント作成
- パスワード強度チェック（8文字以上、大文字・小文字・数字を含む）
- メールアドレスの重複チェック

### ログイン
- メールアドレスとパスワードでの認証
- セッション管理（NextAuth.js）

### 既存ユーザーの対応
- 既存ユーザーはパスワード設定後にログイン可能
- パスワード設定用のAPIエンドポイント（`/api/auth/set-password`）

## セキュリティ機能

### パスワードハッシュ化
- bcrypt（salt rounds: 12）を使用
- プレーンテキストでのパスワード保存は禁止

### パスワード強度要件
- 最小8文字
- 大文字を含む
- 小文字を含む
- 数字を含む

### セッション管理
- JWTトークンベース
- セキュアなセッション管理

## API エンドポイント

### ユーザー登録
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "ユーザー名"
}
```

### パスワード設定（既存ユーザー用）
```
POST /api/auth/set-password
Authorization: Bearer <session_token>
Content-Type: application/json

{
  "password": "NewSecurePass123"
}
```

## 使用方法

### 1. 新規ユーザー
1. `/auth` ページにアクセス
2. 「アカウント作成」タブを選択
3. 必要情報を入力して登録
4. 登録完了後、ログインフォームでログイン

### 2. 既存ユーザー
1. パスワード設定ページでパスワードを設定
2. 設定完了後、通常のログインが可能

### 3. ログイン
1. `/auth` ページでログインフォームを使用
2. メールアドレスとパスワードを入力
3. 認証成功後、アプリケーションにリダイレクト

## トラブルシューティング

### よくある問題

#### パスワード認証が動作しない
- データベースに `password_hash` カラムが追加されているか確認
- 環境変数が正しく設定されているか確認

#### 既存ユーザーがログインできない
- パスワードが設定されているか確認
- パスワード設定APIを使用してパスワードを設定

#### パスワード強度エラー
- 8文字以上
- 大文字・小文字・数字を含む
- 特殊文字は任意

## 注意事項

- 既存のユーザーは、パスワード設定後にログイン可能
- パスワードは復号化不可能（ハッシュ化のみ）
- セキュリティのため、本番環境ではHTTPS必須
- 定期的なパスワード変更を推奨

## 今後の拡張予定

- パスワードリセット機能
- 二要素認証（2FA）
- ソーシャルログイン連携
- アカウントロック機能 
