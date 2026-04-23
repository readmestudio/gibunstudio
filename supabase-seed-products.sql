-- products 시드 데이터
-- 기존 workbook-catalog.ts와 동기화. 신규 상품 추가 시 이 SQL도 업데이트.
-- Supabase SQL Editor에서 실행 (supabase-create-products.sql 적용 후).
-- ON CONFLICT DO UPDATE로 재실행 가능 (가격·설명 업데이트 용도)

INSERT INTO public.products
  (id, name, description, price, original_price, category, workshop_type, metadata, sort_order, is_active)
VALUES
  (
    'achievement-addiction',
    '마음 챙김 워크북 · 성취 중독',
    '멈출 수 없는 성취 욕구, 쉼에 대한 죄책감. CBT 기반 자가 진단과 실습으로 나만의 순환 패턴을 발견하고 대처법을 찾아보세요.',
    69000,
    99000,
    'workbook',
    'achievement-addiction',
    jsonb_build_object(
      'subtitle', '쉬지 못하는 마음을 위한 워크북',
      'estimated_minutes', '65~100분',
      'illustration', 'anchor-storm',
      'coming_soon', false,
      'features', jsonb_build_array(
        '성취 중독 자가 진단 (20문항)',
        '나의 메커니즘 분석 + AI 교차검증',
        '인지 재구조화 · 행동 실험 · 자기 돌봄 워크시트',
        '전체 요약 리포트'
      )
    ),
    1,
    true
  ),
  (
    'anxiety-loop',
    '마음 챙김 워크북 · 불안',
    '같은 걱정이 끝없이 반복되나요? 불안의 구조를 이해하고, 반복을 끊는 나만의 방법을 만들어 보세요.',
    99000,
    NULL,
    'workbook',
    'anxiety-loop',
    jsonb_build_object(
      'subtitle', '불안이들을 위한 워크북',
      'estimated_minutes', '60~90분',
      'illustration', 'arrow-squiggle',
      'coming_soon', true,
      'features', jsonb_build_array(
        '불안 패턴 자가 진단',
        '걱정 사이클 분석 실습',
        '노출 기반 행동 실험',
        '이완 훈련 가이드'
      )
    ),
    2,
    true
  ),
  (
    'phase2-report',
    '기분 심층 분석 리포트',
    'YouTube 구독 데이터 기반 남편상 분석 Phase 2 리포트. 18문항 서베이 + 10장 카드.',
    14900,
    NULL,
    'phase2_report',
    NULL,
    jsonb_build_object(
      'subtitle', '왜 그런 반응을 일으키는가',
      'card_count', 10,
      'survey_questions', 18
    ),
    10,
    true
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  original_price = EXCLUDED.original_price,
  category = EXCLUDED.category,
  workshop_type = EXCLUDED.workshop_type,
  metadata = EXCLUDED.metadata,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- 제거된 워크북: people-pleasing (타인 중심 사고)
-- 이미 DB에 있을 수 있으므로 안전하게 비활성화 처리 (삭제는 외래키 영향 고려하여 보류)
UPDATE public.products
  SET is_active = false, updated_at = now()
  WHERE id = 'people-pleasing';
