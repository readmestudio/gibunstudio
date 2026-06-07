/**
 * 특정 사용자의 워크북 Step 3 데이터를 리셋하여 처음부터 다시 시작할 수 있게 한다.
 *
 * 사용법:
 *   RESET_EMAIL=fibillionwave@gmail.com node scripts/reset-workshop-step3.js
 *   RESET_EMAIL=... DRY_RUN=1 node scripts/reset-workshop-step3.js   # 확인만 (실제 변경 없음)
 *
 * 동작:
 *   1) auth.users 에서 이메일로 사용자 찾기
 *   2) workshop_progress 에서 다음 컬럼을 NULL/되돌림:
 *      - parts_discovery   (Step 3 IFS PART 찾기 대화 + dialogue_recap)
 *      - mechanism_analysis (옛 CBT 흐름 흔적)
 *      - current_step = 3
 *      - status = 'in_progress'
 *
 * 보존되는 것:
 *   - Step 1·2 진단 결과 (workshop_progress 의 diagnosis_* 컬럼)
 *   - workshop_purchases 결제 권한
 *   - schema_assessment·parts_integration 등 다른 step 데이터 (있다면)
 */

const path = require('path');
const fs = require('fs');

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
const email = process.env.RESET_EMAIL;
const dryRun = process.env.DRY_RUN === '1';
const workshopType = process.env.WORKSHOP_TYPE || 'achievement-addiction';

if (!url || !serviceRoleKey || !email) {
  console.error('필요한 환경 변수 누락:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL');
  console.error('  SUPABASE_SERVICE_ROLE_KEY');
  console.error('  RESET_EMAIL');
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, serviceRoleKey);

async function main() {
  console.log(`▸ 대상: ${email}`);
  console.log(`▸ 워크북 타입: ${workshopType}`);
  console.log(`▸ DRY_RUN: ${dryRun ? 'yes (실제 변경 없음)' : 'no (실제 리셋 실행)'}`);
  console.log('');

  // 1) 사용자 찾기
  let user = null;
  let page = 1;
  while (!user) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) {
      console.error('사용자 목록 조회 실패:', error.message);
      process.exit(1);
    }
    user =
      data.users.find(
        (u) => u.email && u.email.toLowerCase() === email.toLowerCase()
      ) || null;
    if (user) break;
    if (!data.users.length || data.users.length < 1000) break;
    page += 1;
  }

  if (!user) {
    console.error(`✗ 사용자를 찾을 수 없습니다: ${email}`);
    process.exit(1);
  }
  console.log(`✓ 사용자 발견: id=${user.id}`);

  // 2) workshop_progress 현재 상태 조회
  const { data: existingProgress, error: progressSelectError } = await supabase
    .from('workshop_progress')
    .select('id, current_step, status, parts_discovery, mechanism_analysis')
    .eq('user_id', user.id)
    .eq('workshop_type', workshopType)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (progressSelectError) {
    console.error('workshop_progress 조회 실패:', progressSelectError.message);
    process.exit(1);
  }

  if (!existingProgress) {
    console.error(`✗ workshop_progress 레코드 없음. 먼저 진단을 시작해야 해요.`);
    process.exit(1);
  }

  console.log('');
  console.log('• 현재 상태:');
  console.log(`  id=${existingProgress.id}`);
  console.log(`  current_step=${existingProgress.current_step}`);
  console.log(`  status=${existingProgress.status}`);
  console.log(
    `  parts_discovery: ${existingProgress.parts_discovery ? '있음' : '없음'}`
  );
  console.log(
    `  mechanism_analysis: ${existingProgress.mechanism_analysis ? '있음' : '없음'}`
  );

  console.log('');
  console.log('• 적용할 변경:');
  console.log('  parts_discovery   → NULL');
  console.log('  mechanism_analysis → NULL');
  console.log('  current_step      → 3');
  console.log('  status            → in_progress');

  if (dryRun) {
    console.log('');
    console.log('▶ DRY_RUN=1 이므로 실제로는 변경하지 않습니다.');
    return;
  }

  const { error: updateError } = await supabase
    .from('workshop_progress')
    .update({
      parts_discovery: null,
      mechanism_analysis: null,
      current_step: 3,
      status: 'in_progress',
      updated_at: new Date().toISOString(),
    })
    .eq('id', existingProgress.id);

  if (updateError) {
    console.error('workshop_progress 리셋 실패:', updateError.message);
    process.exit(1);
  }

  console.log('');
  console.log('✓ workshop_progress Step 3 데이터 리셋 완료');
  console.log('');
  console.log(
    '🎉 완료. /dashboard/self-workshop/step/3 에 진입하면 처음부터 다시 시작합니다.'
  );
}

main().catch((err) => {
  console.error('스크립트 오류:', err);
  process.exit(1);
});
