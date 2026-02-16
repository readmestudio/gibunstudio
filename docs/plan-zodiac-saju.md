# 별자리 분석 통합 + 사주 정확성 개선

## Context

현재 카드 3-8의 성격 분석은 **사주 일간(10종) x 부족오행(5종) = 50가지 조합**에 기반합니다. 여기에 두 가지 개선을 적용합니다:

1. **별자리 분석 추가**: 생년월일에서 서양 별자리를 도출하고, 사주와 겹치지 않는 4개 차원(사랑의 언어, 소통 방식, 숨겨진 두려움, 직관적 끌림)의 인사이트를 추가합니다. 별자리라는 사실은 유저에게 절대 노출하지 않습니다 — 사주와 동일한 방식으로 "내부 엔진"으로만 활용.

2. **사주 정확성 개선**: 현재 사용하지 않는 사주 정보(일지 배우자궁, 십신 분포)를 활용하여 관계 분석의 깊이를 높입니다.

**개선 전**: 50 조합 → **개선 후**: ~7,200+ 조합 (10 일간 x 5 부족오행 x 12 별자리 x 12 일지)

---

## 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/lib/husband-match/analysis/saju-calculator.ts` | 별자리 계산 + 별자리 인사이트 데이터 + 일지 배우자궁 + 십신 분포 + `getSajuRelationshipInsights()` 확장 |
| `src/lib/husband-match/prompts/system-prompt.ts` | 별자리 용어 금지 추가 |
| `src/app/api/analyze/phase1/run-from-channels.ts` | `ExtendedCardData`에 `birthInfo` 추가 + `buildPersonalityContext()` 호출 업데이트 |
| `test-cards-custom.ts` | `getSajuRelationshipInsights()` 호출에 `birthInfo` 전달 |

---

## Step 1: 별자리 계산 함수 (`saju-calculator.ts`)

### 1-1. `getZodiacSign(month, day)` 함수 추가

```typescript
type ZodiacSign = 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo'
  | 'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';

function getZodiacSign(month: number, day: number): ZodiacSign {
  // 표준 서양 별자리 날짜 범위 매핑
  // 양자리 3/21-4/19, 황소 4/20-5/20, ... 물고기 2/19-3/20
}
```

기존 `BirthInfo.month`와 `BirthInfo.day`만 사용 — 추가 사용자 입력 불필요.

### 1-2. `ZODIAC_INSIGHTS` 데이터 (12별자리 x 4차원)

**사주와 겹치지 않는 4개 새 차원:**

| 차원 | 설명 | 사주 기존 차원과의 차이 |
|------|------|----------------------|
| `loveLanguage` | 사랑을 표현/수신하는 방식 | 사주 `partnerNeed`는 "결핍"에 초점, 이것은 "능동적 표현" |
| `communicationStyle` | 가까운 관계에서의 소통 패턴 | 사주 `stressResponse`는 행동적, 이것은 언어적 |
| `hiddenFear` | 무의식적 두려움 | 사주 `innerConflict`는 의식적 갈등, 이것은 무의식적 |
| `attractionPattern` | 직관적으로 끌리는 에너지/분위기 | 남편타입 매칭은 계산 기반, 이것은 감각/직관 기반 |

```typescript
const ZODIAC_INSIGHTS: Record<ZodiacSign, {
  loveLanguage: string;       // 2-4문장
  communicationStyle: string; // 2-4문장
  hiddenFear: string;         // 2-3문장
  attractionPattern: string;  // 2-3문장
}> = {
  aries: { ... }, taurus: { ... }, // ... 12개
};
```

모든 텍스트는 별자리 용어 없이 일상 한국어로 작성. 약 48개 텍스트 엔트리.

---

## Step 2: 사주 정확성 개선 (`saju-calculator.ts`)

### 2-1. 일지(日支) 배우자궁 분석 — HIGH IMPACT

**개념**: `fourPillars.day`의 두 번째 글자(지지)가 "배우자궁"으로, 관계 역학에 직접적 영향.

```typescript
function getDayBranch(dayPillar: string): EarthlyBranch {
  return dayPillar[1] as EarthlyBranch; // "무신" → "신"
}

const SPOUSE_PALACE_INSIGHTS: Record<EarthlyBranch, {
  partnerDynamic: string;        // 파트너와의 관계 역학
  relationshipStrength: string;  // 관계에서의 강점
  relationshipChallenge: string; // 관계에서의 도전
}> = {
  '자': { ... }, '축': { ... }, // ... 12개
};
```

12 지지 × 3 차원 = **36개 텍스트 엔트리**. 모든 텍스트 사주 용어 없이 서술.

### 2-2. 십신(十神) 분포 분석 — MEDIUM IMPACT

**개념**: 일간과 다른 글자들의 오행 관계에서 십신을 도출, 5대 그룹으로 분류하여 관계 에너지 패턴을 파악.

```typescript
interface TenGodsGroup {
  independence: number;  // 비견+겁재 (비겁): 자립심, 경쟁심
  expression: number;    // 식신+상관 (식상): 표현력, 창의성
  wealth: number;        // 정재+편재 (재성): 현실감각, 물질적 관심
  authority: number;     // 정관+편관 (관성): 구조, 규율 선호
  resource: number;      // 정인+편인 (인성): 학습, 보살핌 욕구
}

function calculateTenGodsGroup(result: SajuResult): TenGodsGroup
```

계산 로직:
1. 일간의 오행/음양 확인
2. 사주 내 다른 천간·지지의 오행 파악
3. 오행 상생상극 관계로 십신 분류: 내가 생하는 것(식상), 내가 극하는 것(재성), 나를 극하는 것(관성), 나를 생하는 것(인성), 나와 같은 것(비겁)
4. 5대 그룹별 합산 → 우세 그룹으로 1문단 인사이트

```typescript
function getTenGodsInsight(group: TenGodsGroup): string
// 우세 그룹별 관계 에너지 패턴 서술 (5가지 패턴)
```

### 2-3. SajuResult 확장

```typescript
export interface SajuResult {
  // 기존 필드 (변경 없음)
  fourPillars: { year: string; month: string; day: string; hour: string | null; };
  dayMaster: string;
  dayMasterElement: string;
  fiveElements: { wood: number; fire: number; earth: number; metal: number; water: number; };
  dominantElement: string;
  weakElement: string;
  personality: string;

  // 새 필드
  dayBranch: string;                // 일지 (항상 도출 가능)
  tenGodsGroup?: TenGodsGroup;      // 십신 분포 (optional)
}
```

`calculateSaju()` 함수에서 `dayBranch`와 `tenGodsGroup` 산출하여 반환.

---

## Step 3: `getSajuRelationshipInsights()` 확장

함수 시그니처 변경:

```typescript
export function getSajuRelationshipInsights(
  result: SajuResult,
  birthInfo?: BirthInfo  // 별자리 계산용
): string
```

**최종 출력 구조 (14개 섹션):**

```markdown
### 성격 심화 분석 (⚠️ 내부 분석 엔진 — 방법론 언급 금지)

#### 근본 정체성          ← 기존 (일간)
#### 내면의 모순          ← 기존 (일간)
#### 스트레스 반응        ← 기존 (일간)
#### 혼자 있을 때의 습관   ← 기존 (일간)
#### 감정 표현 패턴       ← 기존 (부족 오행)
#### 파트너에게서 채워지길 바라는 것  ← 기존 (부족 오행)
#### 관계 역학            ← NEW (일지 배우자궁)
#### 관계에서의 강점       ← NEW (일지 배우자궁)
#### 관계에서의 도전       ← NEW (일지 배우자궁)
#### 관계 에너지 패턴      ← NEW (십신 분포)
#### 사랑의 언어          ← NEW (별자리)
#### 소통 방식            ← NEW (별자리)
#### 숨겨진 두려움        ← NEW (별자리)
#### 직관적 끌림          ← NEW (별자리)
```

---

## Step 4: 시스템 프롬프트 수정 (`system-prompt.ts`)

`용어 금지` 섹션에 추가:

```
- 별자리 용어(양자리, 황소자리, 쌍둥이자리, 게자리, 사자자리, 처녀자리, 천칭자리, 전갈자리, 사수자리, 염소자리, 물병자리, 물고기자리)와 "별자리", "zodiac", "horoscope", "성좌" 등을 카드 텍스트에 절대 쓰지 마세요. 성격 분석에서 유추한 내용은 일상 언어로만 서술합니다.
```

---

## Step 5: 프로덕션 코드 수정 (`run-from-channels.ts`)

### 5-1. `ExtendedCardData`에 `birthInfo` 추가

```typescript
interface ExtendedCardData extends Phase1CardData {
  // ... 기존 필드
  sajuResult?: SajuResult;
  birthInfo?: BirthInfo;  // NEW
}
```

### 5-2. `extendedCardData` 생성 시 birthInfo 전달 (line ~890)

```typescript
const extendedCardData: ExtendedCardData = {
  // ... 기존
  sajuResult,
  birthInfo,  // NEW — 이미 스코프에 존재
};
```

### 5-3. `buildPersonalityContext()` 내 호출 변경 (line 221)

```typescript
// Before:
const sajuInsights = data.sajuResult ? getSajuRelationshipInsights(data.sajuResult) : '';
// After:
const sajuInsights = data.sajuResult ? getSajuRelationshipInsights(data.sajuResult, data.birthInfo) : '';
```

---

## Step 6: 테스트 스크립트 수정 (`test-cards-custom.ts`)

`getSajuRelationshipInsights()` 호출에 `TEST_BIRTH_INFO` 전달:

```typescript
// Before:
const sajuInsights = getSajuRelationshipInsights(sajuResult);
// After:
const sajuInsights = getSajuRelationshipInsights(sajuResult, TEST_BIRTH_INFO);
```

---

## 작업 데이터 분량

| 데이터 | 엔트리 수 | 설명 |
|--------|-----------|------|
| ZODIAC_INSIGHTS | 12 × 4 = 48개 | 별자리별 성격 텍스트 |
| SPOUSE_PALACE_INSIGHTS | 12 × 3 = 36개 | 일지별 관계 텍스트 |
| getTenGodsInsight | 5개 패턴 | 우세 십신 그룹별 텍스트 |
| **합계** | **~89개** | 모두 사주/별자리 용어 없이 한국어로 |

---

## 검증

1. `npx tsx -r tsconfig-paths/register test-cards-custom.ts` 실행
2. 체크리스트:
   - [ ] 카드 3-8에서 별자리 용어(양자리, 물병자리 등) 0회 출현
   - [ ] 카드 3-8에서 사주 용어(오행, 일간, 천간, 지지 등) 0회 출현 (기존 유지)
   - [ ] 새 인사이트 섹션(사랑의 언어, 소통 방식 등)이 카드 내용에 자연스럽게 반영
   - [ ] 1991.2.18 테스트 케이스: 물병자리(2/18) + 무토 일간 + 신(申) 일지 확인
   - [ ] `getSajuRelationshipInsights()` 출력이 14개 섹션 모두 포함
3. 별자리 변경 테스트: 3/25 생일(양자리) vs 7/15 생일(게자리)로 인사이트 차이 확인

---

## 구현 순서 (권장)

1. **Step 1**: 별자리 계산 + 인사이트 데이터 (12 × 4 = 48개 텍스트)
2. **Step 2-1**: 일지 배우자궁 인사이트 (12 × 3 = 36개 텍스트)
3. **Step 2-2**: 십신 분포 계산 + 인사이트 (계산 로직 + 5개 텍스트)
4. **Step 3**: `getSajuRelationshipInsights()` 확장 (시그니처 변경 + 8섹션 추가)
5. **Step 4-6**: 시스템 프롬프트 + 프로덕션 코드 + 테스트 스크립트 동기화
6. **검증**: 테스트 실행 + 체크리스트 확인
