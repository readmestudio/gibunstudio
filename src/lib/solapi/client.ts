import crypto from "crypto";

/**
 * 솔라피(Solapi) 카카오 알림톡 발송 클라이언트.
 *
 * 이 프로젝트의 NicePay 연동(`src/lib/nicepay/approve.ts`)과 동일하게, 별도 SDK 없이
 * REST API를 `fetch` 로 직접 호출한다. 인증은 솔라피의 HMAC-SHA256 방식이며 Node 내장
 * `crypto` 만으로 서명하므로 추가 의존성이 필요 없다.
 *
 * 필요한 환경변수(.env.local):
 *   SOLAPI_API_KEY     — 솔라피 API 키
 *   SOLAPI_API_SECRET  — 솔라피 API 시크릿(서명 키, 절대 노출 금지)
 *   SOLAPI_PF_ID       — 카카오 비즈니스 채널 발신프로필 ID(솔라피 콘솔에 등록된 pfId)
 *   SOLAPI_SENDER      — 등록된 발신번호(알림톡 실패 시 SMS 대체발송용 발신자, 숫자만)
 *
 * 넷 중 하나라도 없으면 발송을 시도하지 않고 조용히 건너뛴다(개발/미설정 환경 보호).
 */

const SOLAPI_SEND_URL = "https://api.solapi.com/messages/v4/send";

interface SolapiConfig {
  apiKey: string;
  apiSecret: string;
  pfId: string;
  sender: string;
}

function getConfig(): SolapiConfig | null {
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const pfId = process.env.SOLAPI_PF_ID;
  const sender = process.env.SOLAPI_SENDER;
  if (!apiKey || !apiSecret || !pfId || !sender) return null;
  return { apiKey, apiSecret, pfId, sender };
}

/** 알림톡 발송에 필요한 환경변수가 모두 설정되어 있는지 */
export function isSolapiEnabled(): boolean {
  return getConfig() !== null;
}

/**
 * 솔라피 HMAC-SHA256 인증 헤더 생성.
 *
 * signature = HMAC-SHA256(secret=apiSecret, data=date+salt) 의 hex.
 * date 는 ISO8601, salt 는 매 요청마다 새로 만드는 랜덤 문자열(재사용 공격 방지).
 */
function buildAuthHeader(apiKey: string, apiSecret: string): string {
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(32).toString("hex");
  const signature = crypto
    .createHmac("sha256", apiSecret)
    .update(date + salt)
    .digest("hex");
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

/**
 * 수신번호 정규화 — 하이픈·공백 제거 후 국제표기(+82)를 국내표기(0)로 통일한다.
 * 솔라피는 하이픈 없는 국내번호 형식을 기대한다.
 * (카카오가 주는 `+82 10-1234-5678` 형태도 이 함수로 `01012345678` 이 된다.)
 */
export function normalizePhone(raw: string): string {
  let p = (raw || "").replace(/[^0-9]/g, "");
  if (p.startsWith("82")) p = "0" + p.slice(2);
  return p;
}

/** 한국 휴대폰 번호(010… 등) 형식인지 대략 검증 */
export function isValidKrMobile(raw: string): boolean {
  return /^01\d{8,9}$/.test(normalizePhone(raw));
}

export interface AlimtalkResult {
  success: boolean;
  /** 실패 사유(로그/디버깅용). 성공 시 undefined */
  reason?: string;
  raw?: unknown;
}

/**
 * 카카오 알림톡 1건 발송.
 *
 * 실패해도 예외를 던지지 않고 { success:false, reason } 를 반환한다 —
 * 결제/가입 같은 핵심 플로우에 곁다리로 붙는 알림이므로, 발송 실패가 본 흐름을
 * 절대 깨뜨리면 안 된다. 호출부는 fire-and-forget(after)로 감싸는 것을 권장한다.
 *
 * @param variables 템플릿 본문의 `#{변수명}` → 값. 키는 `#{...}` 형태 그대로 넣는다.
 *                  예) { "#{고객명}": "홍길동", "#{링크}": "https://..." }
 */
export async function sendAlimtalk(params: {
  to: string;
  templateId: string;
  variables?: Record<string, string>;
  /** true 면 알림톡 실패해도 SMS 대체발송을 하지 않음(기본 false: 대체발송 허용) */
  disableSms?: boolean;
}): Promise<AlimtalkResult> {
  const config = getConfig();
  if (!config) return { success: false, reason: "solapi_not_configured" };

  const to = normalizePhone(params.to);
  if (!/^0\d{9,10}$/.test(to)) return { success: false, reason: "invalid_phone" };

  const body = {
    message: {
      to,
      from: normalizePhone(config.sender),
      kakaoOptions: {
        pfId: config.pfId,
        templateId: params.templateId,
        variables: params.variables ?? {},
        disableSms: params.disableSms ?? false,
      },
    },
  };

  try {
    const res = await fetch(SOLAPI_SEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: buildAuthHeader(config.apiKey, config.apiSecret),
      },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as {
      statusCode?: string;
      statusMessage?: string;
      failedMessageList?: unknown[];
    };

    // 솔라피 단건 접수 성공 코드는 "2000". HTTP 4xx/5xx 또는 접수 실패 목록이 있으면 실패로 본다.
    const accepted =
      res.ok &&
      (!data.statusCode || data.statusCode === "2000") &&
      (!data.failedMessageList || data.failedMessageList.length === 0);

    if (!accepted) {
      return {
        success: false,
        reason: data.statusMessage || `http_${res.status}`,
        raw: data,
      };
    }
    return { success: true, raw: data };
  } catch (err) {
    return { success: false, reason: (err as Error).message };
  }
}
