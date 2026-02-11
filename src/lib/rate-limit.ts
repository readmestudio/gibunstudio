import { NextRequest, NextResponse } from 'next/server';

/**
 * 인메모리 슬라이딩 윈도우 Rate Limiter
 *
 * 작동 원리:
 * - IP별로 요청 타임스탬프 배열을 저장
 * - 새 요청이 올 때마다 윈도우(예: 60초) 밖의 오래된 기록을 제거
 * - 윈도우 안에 남은 요청 수가 limit 이상이면 429 반환
 *
 * 주의: 인메모리이므로 서버 재시작 시 초기화됨.
 * 수평 확장(멀티 인스턴스) 시 Redis 기반으로 교체 필요.
 */

interface RateLimitEntry {
  timestamps: number[];
}

// IP별 요청 기록을 저장하는 Map
const rateLimitStore = new Map<string, RateLimitEntry>();

// 10분마다 오래된 엔트리 정리 (메모리 누수 방지)
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleEntries(maxWindowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;

  lastCleanup = now;
  const cutoff = now - maxWindowMs;
  for (const [key, entry] of rateLimitStore) {
    // 가장 최근 요청이 윈도우 밖이면 삭제
    if (entry.timestamps.length === 0 || entry.timestamps[entry.timestamps.length - 1] < cutoff) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Rate Limit 설정 타입
 */
interface RateLimitConfig {
  /** 윈도우 내 최대 요청 수 */
  limit: number;
  /** 윈도우 크기 (초 단위) */
  windowSeconds: number;
}

/**
 * 미리 정의된 Rate Limit 프리셋
 *
 * - general: 일반 API (IP당 60회/분)
 * - ai: AI 생성 API (IP당 5회/분) - OpenAI 호출이 비싸므로 엄격
 * - auth: 인증 API (IP당 5회/5분) - 브루트포스 방지
 */
export const RATE_LIMITS = {
  general: { limit: 60, windowSeconds: 60 } as RateLimitConfig,
  ai: { limit: 5, windowSeconds: 60 } as RateLimitConfig,
  auth: { limit: 5, windowSeconds: 300 } as RateLimitConfig,
} as const;

/**
 * 요청에서 클라이언트 IP를 추출
 *
 * Next.js에서는 프록시/로드밸런서 뒤에 있을 수 있으므로
 * x-forwarded-for 헤더를 우선 확인함
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for는 "client, proxy1, proxy2" 형태일 수 있음
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  // fallback: 알 수 없는 경우 (로컬 개발 등)
  return '127.0.0.1';
}

/**
 * Rate Limit 체크 함수
 *
 * API 라우트 핸들러 최상단에서 호출.
 * limit 초과 시 429 응답을 반환하고, 통과하면 null을 반환.
 *
 * @example
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const rateLimitResponse = checkRateLimit(request, RATE_LIMITS.ai);
 *   if (rateLimitResponse) return rateLimitResponse;
 *   // ... 나머지 로직
 * }
 * ```
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): NextResponse | null {
  const ip = getClientIp(request);
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  // 오래된 엔트리 주기적 정리
  cleanupStaleEntries(windowMs);

  // 라우트 경로를 키에 포함하여 API별로 독립적인 제한 적용
  // 예: "192.168.1.1:/api/analyze/phase1"
  const key = `${ip}:${request.nextUrl.pathname}`;

  const entry = rateLimitStore.get(key) || { timestamps: [] };

  // 윈도우 밖의 오래된 타임스탬프 제거 (슬라이딩 윈도우)
  const windowStart = now - windowMs;
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  if (entry.timestamps.length >= config.limit) {
    // 가장 오래된 요청이 빠질 때까지 남은 시간 계산
    const oldestInWindow = entry.timestamps[0];
    const retryAfterSeconds = Math.ceil((oldestInWindow + windowMs - now) / 1000);

    return NextResponse.json(
      {
        error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
        retryAfter: retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSeconds),
          'X-RateLimit-Limit': String(config.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil((oldestInWindow + windowMs) / 1000)),
        },
      }
    );
  }

  // 요청 허용 - 타임스탬프 기록
  entry.timestamps.push(now);
  rateLimitStore.set(key, entry);

  return null; // null = 통과, 계속 진행
}
