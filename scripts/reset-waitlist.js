/**
 * 특정 이메일의 워크북 대기신청(workbook_waitlist) 기록을 삭제하여
 * 처음부터 다시 대기자 등록 테스트를 할 수 있게 한다.
 *
 * 대기자 등록은 로그인이 필요 없고 email UNIQUE 제약도 없으므로,
 * "초기화" = 해당 이메일로 쌓인 기존 신청 row 들을 제거하는 것을 의미한다.
 *
 * 사용법:
 *   RESET_EMAIL=mingle22@hanmail.net DRY_RUN=1 node scripts/reset-waitlist.js  # 조회만
 *   RESET_EMAIL=mingle22@hanmail.net node scripts/reset-waitlist.js            # 실제 삭제
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
const rawEmail = process.env.RESET_EMAIL;
const dryRun = process.env.DRY_RUN === '1';

if (!url || !serviceRoleKey || !rawEmail) {
  console.error('필요한 환경 변수 누락:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL');
  console.error('  SUPABASE_SERVICE_ROLE_KEY');
  console.error('  RESET_EMAIL');
  process.exit(1);
}

// signup API 가 email 을 trim+lowercase 로 저장하므로 동일하게 정규화.
const email = rawEmail.trim().toLowerCase();

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, serviceRoleKey);

async function main() {
  console.log(`▸ 대상 이메일: ${email}`);
  console.log(`▸ DRY_RUN: ${dryRun ? 'yes (조회만)' : 'no (실제 삭제)'}`);
  console.log('');

  // 1) 기존 신청 row 조회
  const { data: rows, error: selectError } = await supabase
    .from('workbook_waitlist')
    .select('id, email, name, workbooks, source, created_at')
    .eq('email', email)
    .order('created_at', { ascending: false });

  if (selectError) {
    console.error('workbook_waitlist 조회 실패:', selectError.message);
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.log('• 기존 대기신청 기록 없음 — 이미 깨끗한 상태입니다.');
    console.log('  바로 대기자 등록 테스트를 진행할 수 있어요.');
    return;
  }

  console.log(`• 기존 대기신청 ${rows.length}건 발견:`);
  rows.forEach((r, idx) => {
    console.log(
      `  [${idx + 1}] id=${r.id} | workbooks=${JSON.stringify(r.workbooks)} | ` +
        `source=${r.source ?? '-'} | created=${r.created_at}`
    );
  });

  if (dryRun) {
    console.log('');
    console.log('▶ DRY_RUN=1 이므로 실제로는 삭제하지 않습니다.');
    return;
  }

  // 2) 삭제
  const { error: deleteError } = await supabase
    .from('workbook_waitlist')
    .delete()
    .eq('email', email);

  if (deleteError) {
    console.error('workbook_waitlist 삭제 실패:', deleteError.message);
    process.exit(1);
  }

  console.log('');
  console.log(`✓ ${rows.length}건 삭제 완료 — 깨끗한 상태로 초기화되었습니다.`);
  console.log('🎉 이제 /waitlist 에서 대기자 등록 테스트를 진행할 수 있어요.');
}

main().catch((err) => {
  console.error('스크립트 오류:', err);
  process.exit(1);
});
