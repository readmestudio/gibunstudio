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

function die(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

if (!SUPABASE_URL || !SERVICE_KEY) die('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 없습니다.');
if (!LEAD_ID) die('LEAD_ID 를 지정하세요. 예: LEAD_ID=<uuid> REPORT_FILE=./report.json node scripts/put-en-manual-report.js');
if (!REPORT_FILE) die('REPORT_FILE 을 지정하세요(ManualReport JSON 경로).');

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

async function main() {
  const report = JSON.parse(fs.readFileSync(REPORT_FILE, 'utf8'));

  const errs = validate(report);
  if (errs.length) die(`원고 형식 오류:\n   - ${errs.join('\n   - ')}`);

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

  console.log(`📇 리드: ${row.email || '(이메일 없음)'} / ${LEAD_ID}`);
  console.log(`   유형: ${report.child_name} (${report.schema_id})`);
  console.log(`   섹션: ${report.sections.length}개 · 블록 ${report.sections.reduce((n, s) => n + s.blocks.length, 0)}개`);
  console.log(`   기존 원고: ${partsMap.manual_report ? '있음 → 덮어씀' : '없음 → 신규'}`);
  console.log(`   무료 블롭 보존: ${partsMap.free_report ? 'free_report ✅' : '(없음)'} / ${partsMap.score_result ? 'score_result ✅' : '(없음)'}`);

  if (DRY_RUN) {
    console.log('\n🔍 DRY_RUN — 저장하지 않았습니다.');
    return;
  }

  // 2) manual_report 만 병합해 되돌린다.
  const next = { ...partsMap, manual_report: report };
  const patch = await fetch(`${SUPABASE_URL}/rest/v1/minds_leads?id=eq.${LEAD_ID}`, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify({ parts_map: next }),
  });
  if (!patch.ok) die(`저장 실패 (${patch.status}): ${await patch.text()}`);

  console.log('\n✅ 저장 완료');
  console.log(`🔗 https://gibunstudio.com/inner-child/en/full/${LEAD_ID}`);
}

main().catch((e) => die(e.message));
