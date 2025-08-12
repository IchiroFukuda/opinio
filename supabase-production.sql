-- Supabase本番環境用スキーマ
-- このファイルを本番環境のSupabaseダッシュボードのSQLエディタで実行してください

-- テーブル作成
-- users（NextAuth.js用）
create table public.users (
  id text primary key,
  email text unique not null,
  name text,
  email_verified timestamptz,
  image text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- profiles（ユーザープロフィール情報）
create table public.profiles (
  id text primary key references public.users(id) on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

-- questions（出題プール）
create table public.questions (
  id bigserial primary key,
  category text not null,
  text text not null,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

-- daily_sets（ユーザー×日：その日の3問IDs）
create table public.daily_sets (
  id bigserial primary key,
  user_id text not null references public.users(id) on delete cascade,
  date date not null,
  question_ids bigint[] not null,
  created_at timestamptz default now(),
  unique(user_id, date)
);

-- answers（回答）
create table public.answers (
  id bigserial primary key,
  user_id text not null references public.users(id) on delete cascade,
  question_id bigint not null references public.questions(id),
  content text not null,
  elapsed_sec int not null,
  created_at timestamptz default now()
);

-- feedback（AI短評）
create table public.feedback (
  id bigserial primary key,
  answer_id bigint not null references public.answers(id) on delete cascade,
  score_clarity int not null,    -- 0-10
  score_reasoning int not null,  -- 0-10
  score_diversity int not null,  -- 0-10
  summary text not null,
  created_at timestamptz default now(),
  unique(answer_id)
);

-- RLSポリシー（本番環境では適切なセキュリティ設定を行う）
-- 開発段階では無効化してAPIからアクセス可能にする
alter table public.users disable row level security;
alter table public.profiles disable row level security;
alter table public.questions disable row level security;
alter table public.daily_sets disable row level security;
alter table public.answers disable row level security;
alter table public.feedback disable row level security;

-- RPC関数
-- 日次出題セットの取得または作成
create or replace function public.get_or_create_daily_set(p_user_id text, d date default (current_timestamp at time zone 'Asia/Tokyo')::date, c int default 3)
returns public.daily_sets
language plpgsql security definer as $$
declare ds public.daily_sets;
begin
  -- ユーザーIDを設定
  ds.user_id := p_user_id;
  
  if ds.user_id is null then
    raise exception 'User ID is required';
  end if;
  
  -- 既存の日次セットを確認
  select * into ds from public.daily_sets
    where user_id = ds.user_id and date = d;
  if found then return ds; end if;

  -- プロフィールが存在しない場合は作成
  insert into public.profiles (id, display_name)
  values (p_user_id, split_part((select email from public.users where id = p_user_id), '@', 1))
  on conflict (id) do nothing;

  -- ランダムで3問を選択
  select array(
    select id from public.questions
    where is_active
    order by random()
    limit c
  ) into ds.question_ids;

  -- 日次セットを作成
  insert into public.daily_sets(user_id, date, question_ids)
  values (p_user_id, d, ds.question_ids)
  returning * into ds;

  return ds;
end $$;

-- 当日の回答制限チェック
create or replace function public.can_answer_today(p_user_id text)
returns boolean language sql stable as $$
  select (
    select count(*) from public.answers a
    where a.user_id = p_user_id
      and (a.created_at at time zone 'Asia/Tokyo')::date =
          (current_timestamp at time zone 'Asia/Tokyo')::date
  ) < 3;
$$;

-- 初期Seed（10問）
insert into public.questions (category, text) values
('business','残業は必要だと思いますか？'),
('business','品質とスピード、どちらを優先しますか？'),
('society','副業は全面解禁すべきですか？'),
('daily','朝型と夜型、どちらが生産的ですか？'),
('society','公共交通を無料化すべきですか？'),
('business','リモート勤務と出社、結論は？'),
('daily','紙の本と電子書籍、どちらが良いですか？'),
('society','外国人労働者の受け入れ拡大に賛成ですか？'),
('business','会議時間を半分にするには？（結論→理由）'),
('daily','休日は予定詰める派か休養派か？');

-- インデックス作成（パフォーマンス向上）
create index idx_users_email on public.users(email);
create index idx_daily_sets_user_date on public.daily_sets(user_id, date);
create index idx_answers_user_created on public.answers(user_id, created_at);
create index idx_questions_active on public.questions(is_active) where is_active = true; 
