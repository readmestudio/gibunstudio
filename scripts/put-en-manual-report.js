/**
 * 영문 유료(베타) 리포트 원고를 DB 에 등록한다 — /inner-child/en/full/[id] 가 이걸 읽는다.
 *
 * 원고는 특정 개인의 심리검사 응답을 인용한 개인정보다. 저장소가 공개이므로 **코드에 두지 않고**
 * minds_leads.parts_map.manual_report(jsonb) 에 넣는다. parts_map 은 이미 jsonb 라 마이그레이션이
 * 필요 없고, 기존 무료 리포트 블롭(test_version/score_result/free_report)은 그대로 보존한다.
 *
 * 사용법:
 *   LEAD_ID=<uuid> REPORT_FILE=./report.json node scripts/put-en-manual-report.js
 *   LEAD_ID=<uuid> REPORT_FILE=./report.json DRY_RUN=1 node scripts/put-en-manual-report.js
 *   LEAD_ID=<uuid> REPORT_FILE=./report.json EXPIRES_DAYS=14 node ...   # 기본 7일
 *   LEAD_ID=<uuid> EXTEND_ONLY=1 node ...                              # 만료만 연장(원고 유지)
 *   LEAD_ID=<uuid> REPORT_FILE=./report.json SEND_EMAIL=1 node ...     # 저장 + 링크 메일 발송
 *
 * 메일: Resend(도메인 gibunstudio.com 인증 완료). From 은 `jian@gibunstudio.com`,
 * Reply-To 는 회사 지메일 — 답장이 회사 계정으로 오게 한다. gmail.com 주소로는 SPF/DKIM 인증이
 * 불가능해 자동 발송을 못 한다(그래서 Reply-To 로 우회).
 *
 * 만료: 고객에게 "7일 후 만료"라고 안내하므로 **실제로 닫아야 한다**(안내만 하고 열어두면
 * 거짓말이 된다). expires_at 을 넣으면 페이지가 만료 화면을 띄운다. 재발급 요청이 오면
 * EXTEND_ONLY=1 로 다시 실행한다.
 *
 * REPORT_FILE 형식(ManualReport — src/lib/minds/inner-child/en/manual-reports.ts):
 *   {
 *     "schema_id": "defectiveness_shame",
 *     "child_name": "The Child Who Went into Hiding",
 *     "hook": "...",
 *     "intro": ["..."],
 *     "sections": [{ "n": "01", "title": "...", "blocks": [{ "kind": "p", "text": "..." }] }],
 *     "closing": ["..."]
 *   }
 *
 * 블록 kind: p | quote(본인이 쓴 문장) | callout{label,text} | steps{items:[{title,text}]} | line
 *
 * 절차 전체(응답 조회 → 원고 작성 → 등록 → 회신 템플릿): docs/EN_REPORT_DELIVERY.md
 */

const path = require('path');
const fs = require('fs');

// .env.local 로드
try {
  const envPath = path.join(__dirname, '..', '.env.local');
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
} catch {
  // env 파일 없음 — 환경변수로 직접 넘겼을 수 있다.
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LEAD_ID = process.env.LEAD_ID;
const REPORT_FILE = process.env.REPORT_FILE;
const DRY_RUN = process.env.DRY_RUN === '1';
const EXTEND_ONLY = process.env.EXTEND_ONLY === '1';
const EXPIRES_DAYS = Number(process.env.EXPIRES_DAYS || 7);
const SEND_EMAIL = process.env.SEND_EMAIL === '1';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const REPORT_FROM = process.env.EN_REPORT_FROM || 'Jian (GIBUN Studio) <jian@gibunstudio.com>';
const REPORT_REPLY_TO = process.env.EN_REPORT_REPLY_TO || 'allhandslounge@gmail.com';
const SITE_URL = 'https://gibunstudio.com';

function die(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

if (!SUPABASE_URL || !SERVICE_KEY) die('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 없습니다.');
if (!LEAD_ID) die('LEAD_ID 를 지정하세요. 예: LEAD_ID=<uuid> REPORT_FILE=./report.json node scripts/put-en-manual-report.js');
if (!REPORT_FILE && !EXTEND_ONLY) die('REPORT_FILE 을 지정하세요(ManualReport JSON 경로). 만료만 연장하려면 EXTEND_ONLY=1.');
if (!Number.isFinite(EXPIRES_DAYS) || EXPIRES_DAYS <= 0) die(`EXPIRES_DAYS 가 잘못됐습니다: ${process.env.EXPIRES_DAYS}`);

/** 페이지의 readManualReport 와 같은 최소 불변식 — 여기서 먼저 막아 깨진 원고가 들어가지 않게 한다. */
function validate(r) {
  const errs = [];
  if (!r || typeof r !== 'object') return ['JSON 객체가 아닙니다.'];
  if (typeof r.schema_id !== 'string' || !r.schema_id) errs.push('schema_id 누락');
  if (typeof r.child_name !== 'string' || !r.child_name) errs.push('child_name 누락');
  if (!Array.isArray(r.sections) || r.sections.length === 0) errs.push('sections 가 비어 있음');
  const KINDS = ['p', 'quote', 'callout', 'steps', 'line'];
  (r.sections || []).forEach((s, i) => {
    if (!s.n || !s.title) errs.push(`sections[${i}] 에 n/title 누락`);
    if (!Array.isArray(s.blocks) || s.blocks.length === 0) {
      errs.push(`sections[${i}] 에 blocks 가 없음`);
      return;
    }
    s.blocks.forEach((b, j) => {
      if (!KINDS.includes(b.kind)) errs.push(`sections[${i}].blocks[${j}] kind=${b.kind} 는 알 수 없음`);
      if (b.kind === 'callout' && (!b.label || !b.text)) errs.push(`sections[${i}].blocks[${j}] callout 에 label/text 누락`);
      if (b.kind === 'steps' && !Array.isArray(b.items)) errs.push(`sections[${i}].blocks[${j}] steps 에 items 누락`);
    });
  });
  return errs;
}

/**
 * 링크 안내 메일 본문. 만료 문구는 **실제 expires_at 에서 만들어** 안내와 동작이 어긋나지 않게 한다
 * (직접 날짜를 적으면 EXPIRES_DAYS 를 바꿨을 때 조용히 거짓말이 된다).
 */
function buildEmail({ link, childName, expiresAt }) {
  const until = expiresAt.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
  const days = Math.round((expiresAt.getTime() - Date.now()) / 86400000);

  const subject = `Your Inner Child report is ready — ${childName}`;

  const text = `Hi,

Your full report is written and waiting here:

${link}

As promised, you're in as a beta reader — no charge, no card, the $9.90 is on us.

A few things worth knowing before you open it:

It's yours, not a template. I wrote it by hand from your answers and the sentences you finished. Every quote in it is something you actually wrote, and I left the numbers in so you can check my work.

It's not a diagnosis. Nothing in there says something is wrong with you. Every pattern in it was, at some point, a good idea.

The link is yours alone — nobody finds it without it. It stays open for ${days} days (until ${until}); if you need more time, just reply and I'll reopen it.

If any of it misses, just reply and tell me which part. Beta readers are the only reason the English version will get better, and a "that's not me" is more useful to me than a thank-you.

Take care of that kid,

Jian
GIBUN Studio`;

  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#1a1a1a;max-width:560px">
<p>Hi,</p>
<p>Your full report is written and waiting here:</p>
<p style="margin:22px 0"><a href="${link}" style="display:inline-block;background:#FF5A1F;color:#fff;text-decoration:none;font-weight:700;padding:13px 22px;border-radius:999px">Read your full report →</a></p>
<p style="font-size:13px;color:#666;margin:-8px 0 22px">Or paste this in: <a href="${link}" style="color:#666">${link}</a></p>
<p>As promised, you're in as a beta reader — no charge, no card, the $9.90 is on us.</p>
<p>A few things worth knowing before you open it:</p>
<p><b>It's yours, not a template.</b> I wrote it by hand from your answers and the sentences you finished. Every quote in it is something you actually wrote, and I left the numbers in so you can check my work.</p>
<p><b>It's not a diagnosis.</b> Nothing in there says something is wrong with you. Every pattern in it was, at some point, a good idea.</p>
<p>The link is yours alone — nobody finds it without it. It stays open for ${days} days (until ${until}); if you need more time, just reply and I'll reopen it.</p>
<p>If any of it misses, just reply and tell me which part. Beta readers are the only reason the English version will get better, and a "that's not me" is more useful to me than a thank-you.</p>
<p style="margin-top:26px">Take care of that kid,</p>
<p style="margin-top:0">Jian<br><span style="color:#666">GIBUN Studio</span></p>
</div>`;

  return { subject, text, html };
}

/** Resend 발송. 실패해도 저장은 이미 끝났으므로 링크를 알려주고 수동 발송으로 넘긴다. */
async function sendReportEmail({ to, link, childName, expiresAt }) {
  if (!RESEND_API_KEY) return die('SEND_EMAIL=1 인데 RESEND_API_KEY 가 없습니다.');
  if (!to) return die('SEND_EMAIL=1 인데 리드에 이메일이 없습니다(요청 전 리드).');

  const { subject, text, html } = buildEmail({ link, childName, expiresAt });
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: REPORT_FROM, to: [to], reply_to: REPORT_REPLY_TO, subject, text, html }),
  });
  const body = await res.json();
  if (!res.ok || !body.id) {
    console.error(`\n❌ 메일 발송 실패: ${JSON.stringify(body)}`);
    console.error(`   원고는 이미 저장됐습니다. 아래 링크로 직접 보내세요:\n   ${link}`);
    process.exit(1);
  }
  console.log(`\n📧 발송 완료 → ${to}  (id: ${body.id})`);
  console.log(`   From: ${REPORT_FROM} · Reply-To: ${REPORT_REPLY_TO}`);
}

async function main() {
  const headers = {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
  };

  // 1) 기존 parts_map 을 읽는다 — 무료 리포트 블롭을 덮어쓰면 안 된다.
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/minds_leads?id=eq.${LEAD_ID}&select=email,parts_map`,
    { headers },
  );
  const rows = await res.json();
  if (!Array.isArray(rows) || !rows[0]) die(`리드를 찾을 수 없습니다: ${LEAD_ID}`);

  const row = rows[0];
  const partsMap = row.parts_map && typeof row.parts_map === 'object' ? row.parts_map : {};
  const existing = partsMap.manual_report;

  // 2) 원고 결정 — EXTEND_ONLY 면 기존 원고를 그대로 두고 만료만 민다.
  let report;
  if (EXTEND_ONLY) {
    if (!existing) die('EXTEND_ONLY 인데 기존 원고가 없습니다. REPORT_FILE 로 먼저 등록하세요.');
    report = { ...existing };
  } else {
    report = JSON.parse(fs.readFileSync(REPORT_FILE, 'utf8'));
    const errs = validate(report);
    if (errs.length) die(`원고 형식 오류:\n   - ${errs.join('\n   - ')}`);
  }

  // 3) 만료 — 고객 안내("7일 후 만료")와 실제 동작을 일치시킨다.
  const expiresAt = new Date(Date.now() + EXPIRES_DAYS * 24 * 60 * 60 * 1000);
  report.expires_at = expiresAt.toISOString();

  console.log(`📇 리드: ${row.email || '(이메일 없음)'} / ${LEAD_ID}`);
  console.log(`   유형: ${report.child_name} (${report.schema_id})`);
  console.log(`   섹션: ${report.sections.length}개 · 블록 ${report.sections.reduce((n, s) => n + s.blocks.length, 0)}개`);
  console.log(`   원고: ${EXTEND_ONLY ? '기존 유지(만료만 연장)' : existing ? '있음 → 덮어씀' : '없음 → 신규'}`);
  if (existing?.expires_at) console.log(`   기존 만료: ${existing.expires_at}`);
  console.log(`   새 만료: ${report.expires_at} (${EXPIRES_DAYS}일 뒤 · KST ${expiresAt.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })})`);
  console.log(`   무료 블롭 보존: ${partsMap.free_report ? 'free_report ✅' : '(없음)'} / ${partsMap.score_result ? 'score_result ✅' : '(없음)'}`);

  console.log(`   메일: ${SEND_EMAIL ? `발송함 → ${row.email || '(이메일 없음 — 실패함)'}` : '발송 안 함(SEND_EMAIL=1 로 켜기)'}`);

  if (DRY_RUN) {
    console.log('\n🔍 DRY_RUN — 저장하지 않았습니다(메일도 보내지 않음).');
    return;
  }

  // 4) manual_report 만 병합해 되돌린다.
  const next = { ...partsMap, manual_report: report };
  const patch = await fetch(`${SUPABASE_URL}/rest/v1/minds_leads?id=eq.${LEAD_ID}`, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify({ parts_map: next }),
  });
  if (!patch.ok) die(`저장 실패 (${patch.status}): ${await patch.text()}`);

  const link = `${SITE_URL}/inner-child/en/full/${LEAD_ID}`;
  console.log('\n✅ 저장 완료');
  console.log(`🔗 ${link}`);

  if (SEND_EMAIL) {
    await sendReportEmail({
      to: row.email,
      link,
      childName: report.child_name,
      expiresAt,
    });
  }
}

main().catch((e) => die(e.message));
