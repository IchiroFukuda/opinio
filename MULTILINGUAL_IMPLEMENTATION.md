# 多言語対応の実装

このドキュメントでは、データベースに保存している質問を英語対応させるための実装手順を説明します。

## 実装内容

### 1. データベーススキーマの更新

- `questions`テーブルに`text_en`カラムを追加
- 既存の31問に英語版を追加
- 新しい多言語対応の質問を10問追加

### 2. APIエンドポイントの更新

- `/api/today`エンドポイントで言語パラメータ（`lang`）を受け取り
- 言語に応じて適切な質問テキストを返却

### 3. フロントエンドの更新

- 言語切り替え時に質問を再取得
- 表示言語に応じて質問テキストを切り替え

## 実装手順

### ステップ1: データベースの更新

1. Supabaseダッシュボードにアクセス
2. SQLエディタを開く
3. `scripts/add-english-questions.sql`の内容を実行

```sql
-- 英語テキストカラムを追加
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS text_en text;

-- 既存の質問に英語版を追加
UPDATE public.questions SET text_en = CASE id
  WHEN 1 THEN 'Do you think overtime work is necessary?'
  -- ... 他の質問も同様に更新
END;

-- 新しい質問を追加
INSERT INTO public.questions (category, text, text_en) VALUES
('technology', 'AIによる自動化は雇用にどのような影響を与えますか？', 'How does AI automation affect employment?'),
-- ... 他の質問も同様に追加
END;
```

### ステップ2: アプリケーションの再起動

```bash
npm run dev
```

### ステップ3: 動作確認

1. アプリケーションにアクセス
2. 言語切り替えボタンで英語に切り替え
3. 質問が英語で表示されることを確認

## ファイル構成

```
src/
├── app/
│   ├── api/
│   │   └── today/
│   │       └── route.ts          # 多言語対応のAPI
│   └── page.tsx                  # 言語切り替え時の再取得
├── contexts/
│   └── LanguageContext.tsx       # 言語管理コンテキスト
├── types/
│   └── index.ts                  # 多言語対応の型定義
└── locales/
    ├── ja.json                   # 日本語翻訳
    └── en.json                   # 英語翻訳

scripts/
└── add-english-questions.sql     # データベース更新スクリプト
```

## 技術的な詳細

### データベース構造

```sql
CREATE TABLE public.questions (
  id bigserial PRIMARY KEY,
  category text NOT NULL,
  text text NOT NULL,           -- 日本語テキスト
  text_en text,                 -- 英語テキスト（新規追加）
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

### APIレスポンス

```json
{
  "daily_set": { ... },
  "questions": [
    {
      "question": {
        "id": 1,
        "category": "business",
        "text": "残業は必要だと思いますか？",      // 日本語
        "text_en": "Do you think overtime work is necessary?", // 英語
        "is_active": true,
        "created_at": "2024-01-01T00:00:00Z"
      },
      "answer": null,
      "feedback": null
    }
  ],
  "language": "ja"
}
```

### 言語切り替えの流れ

1. ユーザーが言語切り替えボタンをクリック
2. `LanguageContext`の`language`状態が更新
3. `page.tsx`の`useEffect`が発火
4. `fetchTodayQuestions()`が呼び出される
5. APIに言語パラメータを送信
6. データベースから該当言語の質問テキストを取得
7. フロントエンドで表示を更新

## 注意事項

- 既存の質問データは保持されます
- 新しい質問は日本語と英語の両方で追加されます
- 言語切り替え時は質問が再取得されるため、少し時間がかかる場合があります
- 英語版が存在しない質問は日本語版がフォールバックとして使用されます

## 今後の拡張

- 他の言語（中国語、韓国語など）への対応
- 質問のカテゴリ別言語設定
- ユーザーごとの言語設定の保存
- 機械翻訳による自動翻訳機能

## トラブルシューティング

### 質問が英語で表示されない場合

1. データベースに`text_en`カラムが追加されているか確認
2. 既存の質問に英語版が設定されているか確認
3. ブラウザの開発者ツールでAPIレスポンスを確認

### 言語切り替えが動作しない場合

1. `LanguageContext`が正しく設定されているか確認
2. ブラウザのローカルストレージに言語設定が保存されているか確認
3. コンソールにエラーが表示されていないか確認 
