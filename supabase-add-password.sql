-- パスワード認証用のフィールドを追加
-- usersテーブルにpassword_hashフィールドを追加

-- 既存のusersテーブルにpassword_hashカラムを追加
ALTER TABLE public.users 
ADD COLUMN password_hash text;

-- password_hashにインデックスを追加（検索パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_users_password_hash ON public.users(password_hash);

-- 既存のユーザーにはNULLを設定
UPDATE public.users SET password_hash = NULL WHERE password_hash IS NULL;

-- コメントを追加
COMMENT ON COLUMN public.users.password_hash IS 'パスワードのハッシュ値（bcrypt）'; 
