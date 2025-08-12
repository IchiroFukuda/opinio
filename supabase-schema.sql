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

-- RLSポリシー
alter table public.users enable row level security;
alter table public.profiles  enable row level security;
alter table public.questions enable row level security;
alter table public.daily_sets enable row level security;
alter table public.answers   enable row level security;
alter table public.feedback  enable row level security;

-- users
create policy p_users_select on public.users
  for select using (auth.jwt() ->> 'email' = email);
create policy p_users_insert on public.users
  for insert with check (auth.jwt() ->> 'email' = email);
create policy p_users_update on public.users
  for update using (auth.jwt() ->> 'email' = email);

-- profiles
create policy p_profiles_select on public.profiles
  for select using (auth.jwt() ->> 'email' = (select email from public.users where id = profiles.id));
create policy p_profiles_upsert on public.profiles
  for insert with check (auth.jwt() ->> 'email' = (select email from public.users where id = profiles.id));
create policy p_profiles_update on public.profiles
  for update using (auth.jwt() ->> 'email' = (select email from public.users where id = profiles.id));

-- questions（公開読み取り）
create policy p_questions_select on public.questions
  for select using (true);

-- daily_sets
create policy p_daily_select on public.daily_sets
  for select using (auth.jwt() ->> 'email' = (select email from public.users where id = daily_sets.user_id));
create policy p_daily_insert on public.daily_sets
  for insert with check (auth.jwt() ->> 'email' = (select email from public.users where id = daily_sets.user_id));

-- answers
create policy p_answers_select on public.answers
  for select using (auth.jwt() ->> 'email' = (select email from public.users where id = answers.user_id));
create policy p_answers_insert on public.answers
  for insert with check (auth.jwt() ->> 'email' = (select email from public.users where id = answers.user_id));

-- feedback（自分の回答分のみ）
create policy p_feedback_select on public.feedback
  for select using (exists (
    select 1 from public.answers a
    join public.users u on a.user_id = u.id
    where a.id = feedback.answer_id and u.email = auth.jwt() ->> 'email'
  ));
-- 追加はサーバー（service role）のみ
create policy p_feedback_insert_block on public.feedback
  for insert with check (false);

-- RPC
-- JST日付での固定出題（3問）
create or replace function public.get_or_create_daily_set(d date default (current_timestamp at time zone 'Asia/Tokyo')::date, c int default 3)
returns public.daily_sets
language plpgsql security definer as $$
declare ds public.daily_sets;
begin
  -- ユーザーIDを取得
  select id into ds.user_id from public.users where email = auth.jwt() ->> 'email';
  
  if ds.user_id is null then
    raise exception 'User not found';
  end if;
  
  -- 既存の日次セットを確認
  select * into ds from public.daily_sets
    where user_id = ds.user_id and date = d;
  if found then return ds; end if;

  -- プロフィールが存在しない場合は作成
  insert into public.profiles (id, display_name)
  values (ds.user_id, split_part(auth.jwt() ->> 'email', '@', 1))
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
  values (ds.user_id, d, ds.question_ids)
  returning * into ds;

  return ds;
end $$;

-- JSTで当日の回答数が3未満か
create or replace function public.can_answer_today()
returns boolean language sql stable as $$
  select (
    select count(*) from public.answers a
    join public.users u on a.user_id = u.id
    where u.email = auth.jwt() ->> 'email'
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
