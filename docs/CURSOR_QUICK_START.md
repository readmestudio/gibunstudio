# Cursor 빠른 시작 가이드 - 남편상 분석 파이프라인 구현

이 문서는 Cursor에서 남편상 분석 파이프라인을 구현하기 위한 빠른 시작 가이드입니다.

---

## 🎯 목표

Claude Code가 UI/API 통합을 완료했습니다. 이제 **핵심 분석 로직**을 구현할 차례입니다:

1. ✅ 48개 남편상 유형 정의
2. ✅ YouTube 채널 분류 (LLM)
3. ✅ TCI/MBTI/애니어그램 계산
4. ✅ 매칭 알고리즘
5. ✅ LLM 프롬프트 (카드 생성)

---

## 📂 구현할 파일 목록

### 우선순위 1: 데이터 정의
```
src/lib/husband-match/data/husband-types.ts
```
- **현재**: 2개 예시만 작성됨
- **목표**: 48개 전체 유형 정의
- **필요 정보**:
  - 각 유형의 이름, 설명
  - 18차원 ideal vector
  - E/I 변형 비유

### 우선순위 2: 분석 파이프라인
```
src/lib/husband-match/analysis/
├── categorize-channels.ts    # LLM 채널 분류
├── calculate-tci.ts           # TCI 7차원 계산
├── estimate-enneagram.ts      # 애니어그램 추정
├── estimate-mbti.ts           # MBTI 추정
├── create-vector.ts           # 18차원 벡터 생성
└── match-husband-type.ts      # 매칭 알고리즘
```

### 우선순위 3: LLM 프롬프트
```
src/lib/husband-match/prompts/
├── system-prompt.ts           # 공통 시스템 프롬프트
├── card-prompts.ts            # Phase 1 10장 프롬프트
├── phase2-prompts.ts          # Phase 2 8장 프롬프트
└── metaphor-generator.ts      # 비유 생성
```

---

## 🚀 단계별 구현 가이드

### Step 1: 환경 변수 설정

`.env.local` 파일에 OpenAI API 키 추가:
```env
OPENAI_API_KEY=sk-...
```

### Step 2: OpenAI 헬퍼 함수 생성

먼저 공통 OpenAI 클라이언트를 만드세요:

```typescript
// src/lib/openai-client.ts
import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function chatCompletion(
  messages: Array<{ role: string; content: string }>,
  options?: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
  }
) {
  const response = await openai.chat.completions.create({
    model: options?.model || 'gpt-4-turbo',
    messages,
    temperature: options?.temperature || 0.7,
    max_tokens: options?.max_tokens || 2000,
  });

  return response.choices[0].message.content;
}
```

### Step 3: 채널 분류 구현 (LLM 사용)

```typescript
// src/lib/husband-match/analysis/categorize-channels.ts
import { chatCompletion } from '@/lib/openai-client';
import { ChannelData, ChannelCategories } from '../types';
import { getAllCategories } from '../data/categories';

export async function categorizeChannels(
  channels: ChannelData[]
): Promise<ChannelCategories> {
  const categories = getAllCategories();

  const prompt = `
다음 YouTube 채널들을 10개 카테고리로 분류해주세요.

카테고리:
${categories.map(c => `- ${c.name}: ${c.description}`).join('\n')}

채널 목록:
${channels.map(ch => `- ${ch.channel_title}: ${ch.channel_description}`).join('\n')}

각 채널을 가장 적합한 카테고리 하나에 배정하고,
다음 형식으로 JSON을 반환해주세요:
{
  "music": 5,
  "reading": 3,
  ...
}
`;

  const response = await chatCompletion([
    { role: 'system', content: 'You are a YouTube channel categorization expert.' },
    { role: 'user', content: prompt },
  ]);

  // Parse JSON response
  const result = JSON.parse(response || '{}');

  // Ensure all categories are present
  const categoryCounts: ChannelCategories = {
    music: result.music || 0,
    reading: result.reading || 0,
    sports: result.sports || 0,
    cooking: result.cooking || 0,
    travel: result.travel || 0,
    gaming: result.gaming || 0,
    tech: result.tech || 0,
    art: result.art || 0,
    education: result.education || 0,
    entertainment: result.entertainment || 0,
  };

  return categoryCounts;
}
```

### Step 4: TCI 계산 구현

```typescript
// src/lib/husband-match/analysis/calculate-tci.ts
import { ChannelCategories, TCIScores } from '../types';

export function calculateTCI(categories: ChannelCategories): TCIScores {
  const total = Object.values(categories).reduce((sum, count) => sum + count, 0);
  if (total === 0) {
    // Return neutral scores
    return { NS: 50, HA: 50, RD: 50, P: 50, SD: 50, CO: 50, ST: 50 };
  }

  // Normalize to percentages
  const norm = {
    music: (categories.music / total) * 100,
    reading: (categories.reading / total) * 100,
    sports: (categories.sports / total) * 100,
    cooking: (categories.cooking / total) * 100,
    travel: (categories.travel / total) * 100,
    gaming: (categories.gaming / total) * 100,
    tech: (categories.tech / total) * 100,
    art: (categories.art / total) * 100,
    education: (categories.education / total) * 100,
    entertainment: (categories.entertainment / total) * 100,
  };

  // TCI formulas (based on content preferences)
  // These are heuristic mappings - adjust based on psychological research
  const NS = Math.min(100, Math.max(0,
    40 + norm.travel * 0.8 + norm.gaming * 0.5 + norm.entertainment * 0.3 - norm.reading * 0.2
  ));

  const HA = Math.min(100, Math.max(0,
    60 - norm.sports * 0.5 - norm.travel * 0.4 + norm.reading * 0.3
  ));

  const RD = Math.min(100, Math.max(0,
    50 + norm.music * 0.5 + norm.cooking * 0.4 + norm.entertainment * 0.3
  ));

  const P = Math.min(100, Math.max(0,
    50 + norm.education * 0.7 + norm.reading * 0.5 + norm.sports * 0.3
  ));

  const SD = Math.min(100, Math.max(0,
    50 + norm.education * 0.5 + norm.tech * 0.4 + norm.reading * 0.3
  ));

  const CO = Math.min(100, Math.max(0,
    50 + norm.cooking * 0.5 + norm.music * 0.3 + norm.entertainment * 0.4
  ));

  const ST = Math.min(100, Math.max(0,
    50 + norm.art * 0.7 + norm.music * 0.5 + norm.reading * 0.3
  ));

  return {
    NS: Math.round(NS),
    HA: Math.round(HA),
    RD: Math.round(RD),
    P: Math.round(P),
    SD: Math.round(SD),
    CO: Math.round(CO),
    ST: Math.round(ST),
  };
}
```

### Step 5: API 라우트 연결

분석 함수를 구현한 후, API 라우트에서 사용:

```typescript
// src/app/api/analyze/phase1/route.ts
import { categorizeChannels } from '@/lib/husband-match/analysis/categorize-channels';
import { calculateTCI } from '@/lib/husband-match/analysis/calculate-tci';
// ... 다른 import

// TODO 주석 제거하고 실제 함수 호출
const categories = await categorizeChannels(subscriptions);
const tci = calculateTCI(categories);
// ...
```

---

## 📝 Cursor 프롬프트 예시

### 프롬프트 1: 남편상 유형 정의

```
/src/lib/husband-match/data/husband-types.ts 파일을 완성해주세요.

현재 2개 예시만 있습니다. 48개 전체 유형을 정의해야 합니다:
- 6개 카테고리 (성장파트너형, 안정추구형, 모험가형, 감성교감형, 리더십형, 자유영혼형)
- 각 카테고리당 4개 서브타입
- 각 서브타입마다 E/I 변형 2개 = 총 48개

각 유형마다 다음을 포함:
1. name: 유형 이름
2. description: 설명 (2-3문장)
3. idealVector: 18차원 벡터 (TCI 7 + 애니어그램 3 + 콘텐츠 8)
4. metaphor_e / metaphor_i: E/I 변형 비유

참고: 기존 예시 (growth_adventurer_e, growth_adventurer_i)를 보고 나머지를 작성하세요.
```

### 프롬프트 2: 분석 파이프라인

```
/src/lib/husband-match/analysis/ 디렉토리의 모든 분석 함수를 구현해주세요.

필요한 파일:
1. categorize-channels.ts - OpenAI로 채널 분류
2. calculate-tci.ts - TCI 7차원 계산
3. estimate-enneagram.ts - 애니어그램 추정
4. estimate-mbti.ts - MBTI 추정
5. create-vector.ts - 18차원 벡터 생성
6. match-husband-type.ts - 코사인 유사도 매칭

README.md 파일에 상세 설명이 있습니다.
타입은 /src/lib/husband-match/types.ts를 참조하세요.
```

### 프롬프트 3: LLM 프롬프트

```
Phase 1 리포트 카드 10장을 생성하는 프롬프트를 작성해주세요.

파일: /src/lib/husband-match/prompts/card-prompts.ts

각 카드별로 함수를 만들고, 필요한 데이터를 받아 OpenAI 프롬프트를 반환하세요.

카드 목록:
1. 인트로 - 환영 메시지
2. 성격 프로필 - TCI 요약
3. 애니어그램 분석 - 3대 중심 + 유형
4. MBTI 추정 - 4축 설명
5. 콘텐츠 취향 - YouTube 패턴
6. 가치관 분석 - 추론된 가치관
7. 관계 스타일 - 연애/결혼 성향
8. 남편상 매칭 - 최종 결과
9. 비유와 인사이트 - 메타포
10. Phase 2 안내 - CTA

각 프롬프트는 분석 데이터(TCI, MBTI 등)를 입력받아 2-3문단의 카드 내용을 생성해야 합니다.
```

---

## ✅ 구현 체크리스트

### 데이터
- [ ] husband-types.ts - 48개 유형 완성

### 분석 파이프라인
- [ ] categorize-channels.ts
- [ ] calculate-tci.ts
- [ ] estimate-enneagram.ts
- [ ] estimate-mbti.ts
- [ ] create-vector.ts
- [ ] match-husband-type.ts

### 프롬프트
- [ ] system-prompt.ts
- [ ] card-prompts.ts (10개 함수)
- [ ] phase2-prompts.ts (8개 함수)
- [ ] metaphor-generator.ts

### 통합
- [ ] Phase 1 API에 파이프라인 연결
- [ ] Phase 2 API에 교차검증 로직 추가

---

## 🧪 테스트 방법

### 로컬 테스트 (Mock 데이터)

```typescript
// test.ts
import { categorizeChannels } from './src/lib/husband-match/analysis/categorize-channels';

const mockChannels = [
  { channel_id: '1', channel_title: '1theK', channel_description: 'K-pop music' },
  { channel_id: '2', channel_title: 'Ted-Ed', channel_description: 'Education' },
  // ... more
];

const result = await categorizeChannels(mockChannels);
console.log(result);
```

### API 테스트

1. 로컬 서버 실행: `npm run dev`
2. `/husband-match/onboarding` 접속
3. Google 로그인
4. 분석 결과 확인

---

## 📚 참고 자료

- 프롬프트 PDF 문서 (상세 로직 포함)
- OpenAI API: https://platform.openai.com/docs
- 기존 타입 정의: `/src/lib/husband-match/types.ts`
- 카테고리 정의: `/src/lib/husband-match/data/categories.ts`

---

## 💡 팁

1. **단계적 구현**: 데이터 → 파이프라인 → 프롬프트 순서로
2. **타입 안전성**: TypeScript 타입을 철저히 활용
3. **에러 처리**: try-catch로 LLM 호출 보호
4. **비용 최적화**: 개발 중에는 GPT-3.5-turbo 사용 고려
5. **프롬프트 튜닝**: 결과 확인 후 반복 개선

---

**작성자**: Claude Code
**날짜**: 2026-02-01
