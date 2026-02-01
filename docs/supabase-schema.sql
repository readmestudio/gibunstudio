-- 7일 내면 아이 찾기 Supabase 스키마
-- Supabase 프로젝트 생성 후 SQL Editor에서 실행

-- 사용자 프로필 (auth.users 확장)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  phone TEXT,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 코치 계정 (관리자 수동 지정)
CREATE TABLE IF NOT EXISTS public.coach_accounts (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 프로그램 타입
CREATE TYPE program_type AS ENUM ('7day', 'counseling');
CREATE TYPE purchase_status AS ENUM ('pending', 'confirmed', 'cancelled');

-- 구매 (입금 대기/확인)
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  program_type program_type NOT NULL,
  counseling_type TEXT, -- inner-child, couple, package, individual
  amount INTEGER NOT NULL,
  status purchase_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES public.coach_accounts(id),
  d1_date DATE -- 입금 확인일 = D1
);

-- 온보딩 테스트 결과
CREATE TABLE IF NOT EXISTS public.onboarding_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  step1_words TEXT[] NOT NULL,
  step1_basics TEXT[] NOT NULL,
  step2_answers JSONB NOT NULL,
  primary_emotion TEXT NOT NULL,
  secondary_emotions TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 미션 제출
CREATE TABLE IF NOT EXISTS public.mission_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES public.purchases(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  day INTEGER NOT NULL,
  mission_type TEXT NOT NULL, -- tci, childhood, thought-feeling, core-belief, habit-mapper, cognitive-error, emotion-diary
  data JSONB NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(purchase_id, day, mission_type)
);

-- TCI PDF 업로드 (Supabase Storage)
CREATE TABLE IF NOT EXISTS public.tci_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES public.purchases(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  file_path TEXT NOT NULL, -- Storage path
  uploaded_by UUID REFERENCES public.coach_accounts(id) NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 리포트
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES public.purchases(id) NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  profile TEXT,
  emotion_chart TEXT,
  frequent_thoughts TEXT,
  core_beliefs TEXT,
  origin_story TEXT,
  life_impact TEXT,
  counselor_summary TEXT,
  generated_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES public.coach_accounts(id)
);

-- 1:1 상담 예약
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'rejected', 'completed', 'cancelled');

CREATE TABLE IF NOT EXISTS public.counseling_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES public.purchases(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  requested_slots TIMESTAMPTZ[] NOT NULL,
  survey_data JSONB, -- { concern, goal }
  status booking_status DEFAULT 'pending',
  confirmed_slot TIMESTAMPTZ,
  zoom_link TEXT,
  confirmed_by UUID REFERENCES public.coach_accounts(id),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 코치 가능 시간대
CREATE TABLE IF NOT EXISTS public.coach_available_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES public.coach_accounts(id) NOT NULL,
  slot_time TIMESTAMPTZ NOT NULL,
  is_booked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) 설정
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mission_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counseling_bookings ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 데이터만 조회 가능
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view own purchases" ON public.purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own missions" ON public.mission_submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own reports" ON public.reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own bookings" ON public.counseling_bookings
  FOR SELECT USING (auth.uid() = user_id);

-- 코치는 모든 데이터 조회/수정 가능 (coach_accounts 테이블에 있는 경우)
CREATE POLICY "Coaches can view all" ON public.purchases
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.coach_accounts WHERE id = auth.uid())
  );

CREATE POLICY "Coaches can manage missions" ON public.mission_submissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.coach_accounts WHERE id = auth.uid())
  );

CREATE POLICY "Coaches can manage reports" ON public.reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.coach_accounts WHERE id = auth.uid())
  );

CREATE POLICY "Coaches can manage bookings" ON public.counseling_bookings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.coach_accounts WHERE id = auth.uid())
  );
