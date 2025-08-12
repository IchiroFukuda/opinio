-- Supabaseスキーマ更新用SQL
-- このファイルをSupabaseダッシュボードのSQLエディタで実行してください

-- RLSを無効化
alter table public.users disable row level security;
alter table public.profiles disable row level security;
alter table public.questions disable row level security;
alter table public.daily_sets disable row level security;
alter table public.answers disable row level security;
alter table public.feedback disable row level security;

-- 既存の関数を削除
drop function if exists public.get_or_create_daily_set(text, date, integer);
drop function if exists public.can_answer_today(text);

-- RPC関数を新規作成
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

-- can_answer_today関数も新規作成
create or replace function public.can_answer_today(p_user_id text)
returns boolean language sql stable as $$
  select (
    select count(*) from public.answers a
    where a.user_id = p_user_id
      and (a.created_at at time zone 'Asia/Tokyo')::date =
          (current_timestamp at time zone 'Asia/Tokyo')::date
  ) < 3;
$$; 
