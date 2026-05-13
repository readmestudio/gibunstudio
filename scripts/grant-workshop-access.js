/**
 * 특정 사용자에게 마음 챙김 워크북 (achievement-addiction) 접근 권한 부여
 *
 * 사용법:
 *   GRANT_EMAIL=jjongangel0@gmail.com node scripts/grant-workshop-access.js
 *   GRANT_EMAIL=... DRY_RUN=1 node scripts/grant-workshop-access.js   # 확인만
 *   GRANT_EMAIL=... RESET_PROGRESS=1 node scripts/grant-workshop-access.js  # 진행 상태 초기화
 *
 * 동작:
 *   1) auth.users 에서 이메일로 사용자 찾기
 *   2) workshop_purchases 에 confirmed 레코드 보장 (이미 있으면 그대로)
 *   3) workshop_progress 에 current_step=1, status='in_progress' 레코드 보장
 *      (RESET_PROGRESS=1 인 경우, 기존 레코드도 step 1 로 되돌림)
 */

const path = require('path');
const fs = require('fs');

// .env.local 로드
try {
  const { config } = require('dotenv');
  const candidates = [
    path.join(__dirname, '..', '.env.local'),
    path.join(process.cwd(), '.env.local'),
  ];
  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      config({ path: envPath });
      break;
    }
  }
} catch (_) {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eq = trimmed.indexOf('=');
      if (eq <= 0) return;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (key && !process.env[key]) process.env[key] = value;
    });
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.GRANT_EMAIL;
const dryRun = process.env.DRY_RUN === '1';
const resetProgress = process.env.RESET_PROGRESS === '1';
const workshopType = process.env.WORKSHOP_TYPE || 'achievement-addiction';
const amount = Number(process.env.GRANT_AMOUNT || 69000);

if (!url || !serviceRoleKey || !email) {
  console.error('필요한 환경 변수 누락:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL');
  console.error('  SUPABASE_SERVICE_ROLE_KEY');
  console.error('  GRANT_EMAIL');
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, serviceRoleKey);

function makeOrderId() {
  const rand = Math.random().toString(36).slice(2, 10);
  return `WB-GRANT-${Date.now()}-${rand}`;
}

async function main() {
  console.log(`▸ 대상: ${email}`);
  console.log(`▸ 워크북 타입: ${workshopType}`);
  console.log(`▸ DRY_RUN: ${dryRun ? 'yes' : 'no'}`);
  console.log(`▸ RESET_PROGRESS: ${resetProgress ? 'yes' : 'no'}`);
  console.log('');

  // 1) 사용자 찾기 (페이지네이션으로 전체 스캔)
  let user = null;
  let page = 1;
  while (!user) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      console.error('사용자 목록 조회 실패:', error.message);
      process.exit(1);
    }
    user = data.users.find((u) => u.email && u.email.toLowerCase() === email.toLowerCase()) || null;
    if (user) break;
    if (!data.users.length || data.users.length < 1000) break;
    page += 1;
  }

  if (!user) {
    console.error(`✗ 사용자를 찾을 수 없습니다: ${email}`);
    process.exit(1);
  }
  console.log(`✓ 사용자 발견: id=${user.id}`);

  // 2) workshop_purchases 확인
  const { data: existingPurchase, error: purchaseSelectError } = await supabase
    .from('workshop_purchases')
    .select('id, status, order_id, paid_at')
    .eq('user_id', user.id)
    .eq('workshop_type', workshopType)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (purchaseSelectError) {
    console.error('workshop_purchases 조회 실패:', purchaseSelectError.message);
    process.exit(1);
  }

  if (existingPurchase) {
    console.log(`• 기존 purchase 발견: id=${existingPurchase.id} status=${existingPurchase.status}`);
  } else {
    console.log('• 기존 purchase 없음');
  }

  let purchaseId = existingPurchase?.id ?? null;

  if (!dryRun) {
    if (!existingPurchase) {
      const { data: inserted, error: insertError } = await supabase
        .from('workshop_purchases')
        .insert({
          user_id: user.id,
          workshop_type: workshopType,
          amount,
          order_id: makeOrderId(),
          status: 'confirmed',
          paid_at: new Date().toISOString(),
          payment_key: 'MANUAL-GRANT',
        })
        .select('id')
        .single();
      if (insertError) {
        console.error('workshop_purchases 생성 실패:', insertError.message);
        process.exit(1);
      }
      purchaseId = inserted.id;
      console.log(`✓ workshop_purchases 신규 생성: id=${purchaseId}`);
    } else if (existingPurchase.status !== 'confirmed') {
      const { error: updateError } = await supabase
        .from('workshop_purchases')
        .update({
          status: 'confirmed',
          paid_at: existingPurchase.paid_at || new Date().toISOString(),
          payment_key: 'MANUAL-GRANT',
        })
        .eq('id', existingPurchase.id);
      if (updateError) {
        console.error('workshop_purchases 업데이트 실패:', updateError.message);
        process.exit(1);
      }
      console.log(`✓ workshop_purchases confirmed 처리: id=${existingPurchase.id}`);
    } else {
      console.log('✓ workshop_purchases 이미 confirmed — 변경 없음');
    }
  }

  // 3) workshop_progress 확인
  const { data: existingProgress, error: progressSelectError } = await supabase
    .from('workshop_progress')
    .select('id, current_step, status')
    .eq('user_id', user.id)
    .eq('workshop_type', workshopType)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (progressSelectError) {
    console.error('workshop_progress 조회 실패:', progressSelectError.message);
    process.exit(1);
  }

  if (existingProgress) {
    console.log(
      `• 기존 progress 발견: id=${existingProgress.id} step=${existingProgress.current_step} status=${existingProgress.status}`
    );
  } else {
    console.log('• 기존 progress 없음');
  }

  if (!dryRun) {
    if (!existingProgress) {
      const { error: insertError } = await supabase
        .from('workshop_progress')
        .insert({
          user_id: user.id,
          workshop_type: workshopType,
          current_step: 1,
          status: 'in_progress',
          purchase_id: purchaseId,
        });
      if (insertError) {
        console.error('workshop_progress 생성 실패:', insertError.message);
        process.exit(1);
      }
      console.log('✓ workshop_progress 신규 생성: current_step=1');
    } else if (resetProgress) {
      const { error: updateError } = await supabase
        .from('workshop_progress')
        .update({ current_step: 1, status: 'in_progress' })
        .eq('id', existingProgress.id);
      if (updateError) {
        console.error('workshop_progress 초기화 실패:', updateError.message);
        process.exit(1);
      }
      console.log('✓ workshop_progress current_step=1 로 초기화');
    } else {
      console.log('✓ workshop_progress 유지 — RESET_PROGRESS=1 이면 step 1 로 되돌릴 수 있음');
    }
  }

  console.log('');
  console.log('🎉 완료. 해당 사용자로 로그인 후 /dashboard/self-workshop 에서 워크북에 접근할 수 있어요.');
}

main().catch((err) => {
  console.error('스크립트 오류:', err);
  process.exit(1);
});
