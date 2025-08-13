-- 多言語対応のためのデータベーススキーマ更新
-- このファイルをSupabaseダッシュボードのSQLエディタで実行してください

-- questionsテーブルに英語テキストカラムを追加
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS text_en text;

-- 既存の質問に英語版を追加
UPDATE public.questions SET text_en = CASE id
  WHEN 1 THEN 'Do you think overtime work is necessary?'
  WHEN 2 THEN 'Which do you prioritize: quality or speed?'
  WHEN 3 THEN 'Should side jobs be completely legalized?'
  WHEN 4 THEN 'Which is more productive: morning person or night person?'
  WHEN 5 THEN 'Should public transportation be free?'
  WHEN 6 THEN 'Remote work vs office work: what''s the conclusion?'
  WHEN 7 THEN 'Which is better: paper books or e-books?'
  WHEN 8 THEN 'Do you support expanding foreign worker acceptance?'
  WHEN 9 THEN 'How to cut meeting time in half? (conclusion → reason)'
  WHEN 10 THEN 'Are you a "packed schedule" or "rest" person on holidays?'
  WHEN 11 THEN 'Is it unavoidable that AI will take over human jobs?'
  WHEN 12 THEN 'Should university education be free?'
  WHEN 13 THEN 'Should plastic product usage be banned?'
  WHEN 14 THEN 'Which is more effective: performance-based or seniority-based?'
  WHEN 15 THEN 'Do you support introducing basic income?'
  WHEN 16 THEN 'Should SNS usage time be limited?'
  WHEN 17 THEN 'Do you support autonomous vehicle adoption?'
  WHEN 18 THEN 'Should female management promotion be mandatory?'
  WHEN 19 THEN 'Do you support abolishing the death penalty?'
  WHEN 20 THEN 'Which is better: living alone or living with family?'
  WHEN 21 THEN 'Should English education be mandatory from elementary school?'
  WHEN 22 THEN 'Do you support restarting nuclear power plants?'
  WHEN 23 THEN 'Should overtime pay be mandatory?'
  WHEN 24 THEN 'Do you support legalizing same-sex marriage?'
  WHEN 25 THEN 'Should smartphone usage have age restrictions?'
  WHEN 26 THEN 'Which do you prefer: cash or cashless payments?'
  WHEN 27 THEN 'Should freelancer rights protection be strengthened?'
  WHEN 28 THEN 'Do you support free medical care?'
  WHEN 29 THEN 'Should programming education be mandatory?'
  WHEN 30 THEN 'Should renewable energy adoption be accelerated?'
  WHEN 31 THEN 'Which is healthier: cooking at home or eating out?'
END;

-- 新しい多言語対応の質問を追加
INSERT INTO public.questions (category, text, text_en) VALUES
('technology', 'AIによる自動化は雇用にどのような影響を与えますか？', 'How does AI automation affect employment?'),
('society', '少子化問題の解決策として何が最も効果的ですか？', 'What is the most effective solution to the declining birthrate problem?'),
('business', '働き方改革の成功の鍵は何ですか？', 'What is the key to successful work style reform?'),
('education', 'オンライン教育は従来の教育を置き換えますか？', 'Will online education replace traditional education?'),
('environment', '気候変動対策として個人でできることは何ですか？', 'What can individuals do to address climate change?'),
('daily', 'デジタルデトックスの効果は実感できますか？', 'Do you feel the effects of digital detox?'),
('technology', 'ブロックチェーン技術の将来性はどうですか？', 'What is the future potential of blockchain technology?'),
('society', '高齢化社会での介護問題をどう解決しますか？', 'How do you solve caregiving issues in an aging society?'),
('business', '企業の社会的責任はどこまで求められますか？', 'How much corporate social responsibility is required?'),
('daily', '睡眠の質を向上させる最良の方法は何ですか？', 'What is the best way to improve sleep quality?');

-- インデックスを更新
CREATE INDEX IF NOT EXISTS idx_questions_multilingual ON public.questions(text, text_en) WHERE is_active = true;

-- 多言語対応のためのビューを作成
CREATE OR REPLACE VIEW public.questions_multilingual AS
SELECT 
  id,
  category,
  text as text_ja,
  text_en,
  is_active,
  created_at
FROM public.questions
WHERE is_active = true;

-- 多言語対応のRPC関数を更新
CREATE OR REPLACE FUNCTION public.get_or_create_daily_set(
  p_user_id text, 
  d date default (current_timestamp at time zone 'Asia/Tokyo')::date, 
  c int default 10,
  p_language text default 'ja'
)
RETURNS public.daily_sets
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE 
  ds public.daily_sets;
  question_ids bigint[];
BEGIN
  -- ユーザーIDを設定
  ds.user_id := p_user_id;
  
  IF ds.user_id IS NULL THEN
    RAISE EXCEPTION 'User ID is required';
  END IF;
  
  -- 既存の日次セットを確認
  SELECT * INTO ds FROM public.daily_sets
    WHERE user_id = ds.user_id AND date = d;
  IF FOUND THEN RETURN ds; END IF;

  -- プロフィールが存在しない場合は作成
  INSERT INTO public.profiles (id, display_name)
  VALUES (p_user_id, split_part((SELECT email FROM public.users WHERE id = p_user_id), '@', 1))
  ON CONFLICT (id) DO NOTHING;

  -- ランダムで質問を選択
  SELECT array(
    SELECT id FROM public.questions
    WHERE is_active
    ORDER BY random()
    LIMIT c
  ) INTO question_ids;

  -- 日次セットを作成
  INSERT INTO public.daily_sets(user_id, date, question_ids)
  VALUES (p_user_id, d, question_ids)
  RETURNING * INTO ds;

  RETURN ds;
END $$; 
