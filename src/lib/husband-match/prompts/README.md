# LLM Prompts - To Be Implemented in Cursor

This directory contains all LLM prompt templates for generating report cards.

## Files to Implement

### 1. `system-prompt.ts`
- **Purpose**: Common system prompt for all card generation
- **Export**: `SYSTEM_PROMPT` string constant
- **Content**: See documentation section 5-2
  - Role definition
  - Tone and style guidelines
  - Output format requirements

### 2. `card-prompts.ts`
- **Purpose**: Individual prompts for each Phase 1 card (10 cards)
- **Export**: `PHASE1_CARD_PROMPTS` object
- **Structure**:
  ```typescript
  {
    card_01_intro: (data) => string,
    card_02_personality: (data) => string,
    // ... up to card_10
  }
  ```
- **Input**: Analysis results (TCI, MBTI, Enneagram, matched type, etc.)
- **Output**: Formatted prompt string

### 3. `phase2-prompts.ts`
- **Purpose**: Prompts for Phase 2 deep analysis cards (8 cards)
- **Export**: `PHASE2_CARD_PROMPTS` object
- **Features**:
  - Cross-validation insights
  - Metaphor generation
  - Deeper psychological analysis
  - YouTube vs Survey discrepancies

### 4. `metaphor-generator.ts`
- **Purpose**: Generate creative metaphors for personality insights
- **Export**: `generateMetaphor(context: string)` async function
- **Input**: Context about the user's personality
- **Output**: Creative metaphor string

## Card Types (Phase 1 - 10 cards)

1. **인트로 카드**: Welcome and overview
2. **성격 프로필**: TCI summary
3. **애니어그램 분석**: Enneagram type and center
4. **MBTI 추정**: MBTI type explanation
5. **콘텐츠 취향**: YouTube consumption patterns
6. **가치관 분석**: Inferred values from content
7. **관계 스타일**: Relationship tendencies
8. **남편상 매칭 결과**: The matched husband type
9. **비유와 인사이트**: Metaphor-based understanding
10. **Phase 2 안내**: CTA for deep analysis

## Card Types (Phase 2 - 8 cards)

1. **교차검증 서론**: Intro to cross-validation
2. **숨겨진 욕구**: Hidden desires from discrepancies
3. **진짜 vs 이상**: YouTube (real) vs Survey (ideal) gap
4. **심층 가치관**: Deep values analysis
5. **관계 패턴**: Relationship patterns
6. **성장 포인트**: Growth opportunities
7. **최종 남편상**: Refined husband type match
8. **액션 플랜**: Practical next steps

## Implementation Guidelines

- Use OpenAI GPT-4
- Keep prompts under 1500 tokens when possible
- Include examples in prompts for better output
- Use structured output when needed
- Test with real data
- Iterate on prompt quality

## Example Prompt Structure

```typescript
export function getCard01Prompt(data: {
  userName: string;
  totalChannels: number;
  topCategories: string[];
}) {
  return `
${SYSTEM_PROMPT}

사용자 정보:
- 이름: ${data.userName}
- 구독 채널 수: ${data.totalChannels}개
- 주요 관심사: ${data.topCategories.join(', ')}

다음 형식으로 인트로 카드를 작성하세요:

제목: [환영 메시지]
내용: [2-3 문단으로 사용자를 환영하고, 분석 과정 소개]
  `.trim();
}
```
