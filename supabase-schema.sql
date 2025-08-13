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

-- RLSポリシー（一時的に無効化）
-- alter table public.users enable row level security;
-- alter table public.profiles  enable row level security;
-- alter table public.questions enable row level security;
-- alter table public.daily_sets enable row level security;
-- alter table public.answers   enable row level security;
-- alter table public.feedback  enable row level security;

-- RLSを無効化
alter table public.users disable row level security;
alter table public.profiles disable row level security;
alter table public.questions disable row level security;
alter table public.daily_sets disable row level security;
alter table public.answers disable row level security;
alter table public.feedback disable row level security;

-- users（一時的に無効化してAPIからアクセス可能にする）
drop policy if exists p_users_select on public.users;
drop policy if exists p_users_insert on public.users;
drop policy if exists p_users_update on public.users;

-- profiles（一時的に無効化）
drop policy if exists p_profiles_select on public.profiles;
drop policy if exists p_profiles_upsert on public.profiles;
drop policy if exists p_profiles_update on public.profiles;

-- questions（公開読み取り）
create policy p_questions_select on public.questions
  for select using (true);

-- daily_sets（一時的に無効化）
drop policy if exists p_daily_select on public.daily_sets;
drop policy if exists p_daily_insert on public.daily_sets;

-- answers（一時的に無効化）
drop policy if exists p_answers_select on public.answers;
drop policy if exists p_answers_insert on public.answers;

-- feedback（一時的に無効化）
drop policy if exists p_feedback_select on public.feedback;
drop policy if exists p_feedback_insert_block on public.feedback;

-- RPC
-- JST日付での固定出題（10問）
create or replace function public.get_or_create_daily_set(user_id text, d date default (current_timestamp at time zone 'Asia/Tokyo')::date, c int default 10)
returns public.daily_sets
language plpgsql security definer as $$
declare ds public.daily_sets;
begin
  -- ユーザーIDを設定
  ds.user_id := user_id;
  
  if ds.user_id is null then
    raise exception 'User ID is required';
  end if;
  
  -- 既存の日次セットを確認
  select * into ds from public.daily_sets
    where user_id = ds.user_id and date = d;
  if found then return ds; end if;

  -- プロフィールが存在しない場合は作成
  insert into public.profiles (id, display_name)
  values (ds.user_id, split_part((select email from public.users where id = ds.user_id), '@', 1))
  on conflict (id) do nothing;

  -- ランダムで10問を選択
  select array(
    select id from public.questions
    where is_active
    order by random()
    limit c
  ) into ds.question_ids;

  -- 日次セットを作成
  insert into public.daily_sets(user_id, date, question_ids)
  values (ds.user_id, d, ds.question_ids)
  returning * into ds;

  return ds;
end $$;

-- JSTで当日の回答数が10未満か
create or replace function public.can_answer_today(user_id text)
returns boolean language sql stable as $$
  select (
    select count(*) from public.answers a
    where a.user_id = user_id
      and (a.created_at at time zone 'Asia/Tokyo')::date =
          (current_timestamp at time zone 'Asia/Tokyo')::date
  ) < 10;
$$;

-- 初期Seed（30問）
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
('daily','休日は予定詰める派か休養派か？'),
('technology','AIが人間の仕事を奪うことは避けられませんか？'),
('education','大学教育は無償化すべきですか？'),
('environment','プラスチック製品の使用を禁止すべきですか？'),
('business','成果主義と年功序列、どちらが効果的ですか？'),
('society','ベーシックインカムの導入に賛成ですか？'),
('daily','SNSの使用時間を制限すべきですか？'),
('technology','自動運転車の普及に賛成ですか？'),
('business','女性の管理職登用を義務化すべきですか？'),
('society','死刑制度の廃止に賛成ですか？'),
('daily','一人暮らしと家族との同居、どちらが良いですか？'),
('education','英語教育を小学校から必修化すべきですか？'),
('environment','原子力発電の再稼働に賛成ですか？'),
('business','残業代の支払いを義務化すべきですか？'),
('society','同性婚の法制化に賛成ですか？'),
('technology','スマートフォンの使用年齢制限を設けるべきですか？'),
('daily','現金決済とキャッシュレス、どちらを好みますか？'),
('business','フリーランスの権利保護を強化すべきですか？'),
('society','医療費の無償化に賛成ですか？'),
('education','プログラミング教育を必修化すべきですか？'),
('environment','再生可能エネルギーの導入を加速すべきですか？'),
('daily','自炊と外食、どちらが健康的ですか？'); 
