/**
 * Supabase 특정 사용자 비밀번호 변경 (Admin API)
 * 한 번 실행 후 비밀번호 변경되면 RESET_EMAIL/RESET_PASSWORD는 .env.local에서 제거 권장.
 *
 * 사용법:
 *   1. .env.local에 추가:
 *      SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
 *      RESET_EMAIL=fibillionwave@gmail.com
 *      RESET_PASSWORD=mj918273!!
 *   2. 프로젝트 루트에서: node scripts/set-user-password.js
 *
 * 또는 한 줄로:
 *   NEXT_PUBLIC_SUPABASE_URL=xxx SUPABASE_SERVICE_ROLE_KEY=xxx RESET_EMAIL=fibillionwave@gmail.com RESET_PASSWORD=mj918273!! node scripts/set-user-password.js
 */

const path = require('path');
const fs = require('fs');

// .env.local 로드 (dotenv 사용, 여러 경로 시도)
try {
  const { config } = require('dotenv');
  const candidates = [
    path.join(__dirname, '..', '.env.local'),
    path.join(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '.env.local'),
  ];
  for (const envPath of candidates) {
    if (fs.existsSync(envPath)) {
      config({ path: envPath });
      break;
    }
  }
} catch (_) {
  // dotenv 없으면 수동 파싱
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
const newPassword = process.env.RESET_PASSWORD;

if (!url || !serviceRoleKey || !email || !newPassword) {
  console.error('필요한 환경 변수가 없습니다.');
  console.error('  NEXT_PUBLIC_SUPABASE_URL (또는 SUPABASE_URL)');
  console.error('  SUPABASE_SERVICE_ROLE_KEY  (Supabase Dashboard > Settings > API > service_role)');
  console.error('  RESET_EMAIL=변경할_이메일');
  console.error('  RESET_PASSWORD=새_비밀번호');
  console.error('');
  console.error('예: RESET_EMAIL=fibillionwave@gmail.com RESET_PASSWORD=mj918273!! node scripts/set-user-password.js');
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(url, serviceRoleKey);

async function main() {
  const {
    data: { users },
    error: listError,
  } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });

  if (listError) {
    console.error('사용자 목록 조회 실패:', listError.message);
    process.exit(1);
  }

  const user = users.find((u) => u.email && u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    console.error('해당 이메일 사용자를 찾을 수 없습니다:', email);
    process.exit(1);
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
    password: newPassword,
  });

  if (updateError) {
    console.error('비밀번호 변경 실패:', updateError.message);
    process.exit(1);
  }

  console.log('비밀번호가 변경되었습니다:', email);
  console.log('이제 해당 이메일과 새 비밀번호로 로그인할 수 있습니다.');
}

main();
