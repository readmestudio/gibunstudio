-- Mind Spill — "오늘 하루 정리하기" 데일리 분석 + 데일리 구독.
--
-- 1. daily_entries 에 daily_analysis 결과/생성시각 컬럼 추가.
--    · mirror_report 를 대체하는 통합 일일 분석.
--    · 월 무료 3회 + 이후 구독. 무료 사용량은 "이번 달 daily_analysis_generated_at
--      이 찍힌 entry 수"로 집계하므로 별도 카운터 테이블이 필요 없다.
-- 2. mind_spill_daily_subscriptions — 데일리 무제한 월 이용권.

-- ── 1. daily_entries 컬럼 추가 ──
alter table mind_spill_daily_entries
  add column if not exists daily_analysis jsonb,
  add column if not exists daily_analysis_generated_at timestamptz;

-- 월간 무료 사용량 집계용 인덱스 (user + 생성시각).
create index if not exists idx_msde_user_daily_analysis_at
  on mind_spill_daily_entries (user_id, daily_analysis_generated_at);

-- ── 2. 데일리 구독 테이블 ──
create table if not exists mind_spill_daily_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  -- 'pending': 결제 생성 후 승인 대기. 승인 시 'active' + expires_at 갱신.
  status text not null default 'active'
    check (status in ('pending', 'active', 'expired', 'cancelled')),
  order_id text unique,
  amount integer,
  payment_key text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_msds_user_active
  on mind_spill_daily_subscriptions (user_id, status, expires_at);

alter table mind_spill_daily_subscriptions enable row level security;

-- 본인 구독만 조회 가능. INSERT/UPDATE 는 서버(admin client)에서 처리.
drop policy if exists "msds_select_own" on mind_spill_daily_subscriptions;
create policy "msds_select_own" on mind_spill_daily_subscriptions
  for select using (auth.uid() = user_id);
