# Analysis Pipeline - To Be Implemented in Cursor

This directory contains the core analysis logic for the husband-match feature.

## Files to Implement

### 1. `categorize-channels.ts`
- **Purpose**: Classify YouTube channels into 10 categories using OpenAI
- **Input**: Array of { channel_title, channel_description }
- **Output**: ChannelCategories object with counts per category
- **LLM**: Use OpenAI GPT-4
- **Prompt**: See documentation section 2-2

### 2. `calculate-tci.ts`
- **Purpose**: Calculate TCI 7-dimensional scores from category distribution
- **Input**: ChannelCategories
- **Output**: TCIScores { NS, HA, RD, P, SD, CO, ST }
- **Formula**: See documentation section 2-3

### 3. `estimate-enneagram.ts`
- **Purpose**: Estimate Enneagram center scores and type
- **Input**: TCIScores, ChannelCategories
- **Output**: { center: EnneagramCenter, type: 1-9 }
- **Logic**: See documentation section 2-4

### 4. `estimate-mbti.ts`
- **Purpose**: Estimate MBTI 4-axis scores and type
- **Input**: TCIScores, ChannelCategories
- **Output**: { scores: MBTIScores, type: "INFP" }
- **Logic**: See documentation section 2-5

### 5. `create-vector.ts`
- **Purpose**: Create 18-dimensional unified vector
- **Input**: TCIScores, EnneagramCenter, ChannelCategories (normalized)
- **Output**: number[18]
- **Structure**: [TCI(7) + Enneagram(3) + Content(8)]

### 6. `match-husband-type.ts`
- **Purpose**: Find best matching husband type using hybrid algorithm
- **Input**: UserVector, MBTIScores, EnneagramType
- **Output**: { type: HusbandType, score: number, method: string }
- **Algorithm**:
  - 60% cosine similarity (vector)
  - 20% Enneagram match
  - 20% MBTI match

## Implementation Notes

- Use OpenAI API (not Claude)
- Environment variable: OPENAI_API_KEY
- Model: gpt-4-turbo or gpt-4
- All functions should be async
- Export as named exports
- Include error handling
- Add TypeScript types

## Example Usage

```typescript
import { categorizeChannels } from './categorize-channels';
import { calculateTCI } from './calculate-tci';
import { estimateEnneagram } from './estimate-enneagram';
import { estimateMBTI } from './estimate-mbti';
import { createVector } from './create-vector';
import { matchHusbandType } from './match-husband-type';

const channels = [...]; // From YouTube API
const categories = await categorizeChannels(channels);
const tci = calculateTCI(categories);
const { center, type: enneagramType } = estimateEnneagram(tci, categories);
const { scores: mbtiScores, type: mbtiType } = estimateMBTI(tci, categories);
const vector = createVector(tci, center, categories);
const match = matchHusbandType(vector, mbtiScores, enneagramType);
```
