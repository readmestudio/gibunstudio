# Handoff: 성취 중독 카드뉴스 — 시안 3 (Mono Bold)

## Overview
인스타그램 카드뉴스 템플릿. **성취 중독자를 위한 심리 컨텐츠** 시리즈의 첫 장(Cover)과 본문 장(Body)을 다루는 두 종류의 슬라이드 템플릿. 쉬지 못하는 마음, 끊임없이 무언가를 해내야 한다는 압박감을 느끼는 독자를 위한 시리즈로, 차분하고 지적인 에세이 톤을 다크 모드 + 강한 액센트 컬러로 시각화함.

## About the Design Files
이 패키지의 HTML/JSX 파일들은 **디자인 레퍼런스**입니다. 즉, 의도된 룩앤필과 동작을 보여주는 프로토타입이며, 그대로 production 코드로 복사할 코드가 아닙니다. 작업 목표는 이 디자인을 타겟 코드베이스의 환경 (React/Vue/Next.js 등)에서 그곳의 패턴과 라이브러리를 사용해 **다시 구현**하는 것입니다. 환경이 아직 없다면, 프로젝트 성격에 가장 알맞은 프레임워크를 선택해 구현하세요. 최종 산출물은 1080×1350 크기의 PNG 또는 인스타그램 캐러셀에 업로드 가능한 이미지/슬라이드여야 합니다.

## Fidelity
**High-fidelity (hifi)** — 모든 컬러, 타이포그래피, 스페이싱, 본문 카피가 확정된 픽셀에 가까운 시안입니다. 개발자는 디자인 토큰을 정확히 그대로 사용해 재현해야 합니다.

## Canvas / Output Size
- **출력 캔버스: 1080 × 1350 px (인스타그램 세로형 4:5 비율)**
- 이 핸드오프의 모든 좌표/크기 값은 1080×1350 기준으로 표기됩니다.
- 원본 프로토타입은 540×540 디스플레이로 작업되었으니, **모든 px 값을 단순 스케일(×2)** 하지 말고 1080×1350 비율에 맞게 본문 카피, 캐릭터, 타이틀이 자연스럽게 배치되도록 본 문서 값을 기준으로 재배치하세요.

---

## Screens / Views

### Screen 1 — Cover (첫 장)

**Purpose**
캐러셀의 첫 장. 호기심을 자극하는 큰 타이틀로 사용자가 슬라이드를 넘기게 만든다.

**Layout (1080 × 1350)**
- 배경: 풀 다크 (#0e0e10) + 도트 그리드 패턴
  - `radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)`
  - `background-size: 28px 28px` (1080 기준; 540 → 14px의 2배)
- 패딩: top/bottom 72px, left/right 80px
- 세로 3-band 레이아웃:
  1. **상단 메타 바** (top 72px)
  2. **중앙 타이틀 블록** (수직 중앙)
  3. **하단 메타 바** (bottom 64px)

**Components**

1. **상단 메타 바** — flex `space-between`, `align-items: center`
   - 좌측: `MIND · GUIDE / 01`
     - color: `rgba(255,255,255,0.5)`
     - font-size: 22px / weight 700 / letter-spacing: 0.22em
   - 우측: 8×16px 원형 도트
     - background: `#e85d3a` (액센트 오렌지)
     - 1080 캔버스에서는 16px 원

2. **중앙 타이틀 블록** — 수직 중앙 정렬
   - 서브타이틀: `쉬지 못하는 마음을 위한 가이드`
     - font-size: 26px / weight 500 / color: `rgba(255,255,255,0.55)` / letter-spacing: 0.04em
     - margin-bottom: 44px
   - 메인 타이틀 (3줄):
     ```
     성취 중독,
     혹시
     나도?
     ```
     - font-size: 100px / weight 800 / color: `#fff`
     - line-height: 1.15 / letter-spacing: -0.04em
     - 콤마(`,`) 글자만 `#e85d3a` 액센트
     - margin-bottom: 72px
   - 화살표 `→`
     - font-size: 44px / color: `#e85d3a` / weight 700

3. **하단 메타 바** — flex `space-between`, color: `rgba(255,255,255,0.4)`, font-size 22px
   - 좌측: `@brand_handle` (실제 계정 핸들로 교체)
   - 우측: `SWIPE →` / letter-spacing: 0.1em

---

### Screen 2 — Body (본문 장)

**Purpose**
캐러셀 두 번째 이후 슬라이드. 정의/설명 본문을 짧게 전달한다. 같은 템플릿을 N번 반복 사용하므로 반드시 **재사용 가능한 컴포넌트 형태**로 구현할 것.

**Layout (1080 × 1350)**
- 배경: 동일 다크 (#0e0e10), 도트 패턴 없음(또는 동일 적용 — 디자이너 선호: cover에만 도트)
- 패딩: top/bottom 96px, left/right 88px
- 세로 흐름: `flex-direction: column`

**Components**

1. **카테고리 라벨** — 도트 + 텍스트, 가로 정렬
   - 도트: 12×12px / `border-radius: 50%` / background `#e85d3a`
   - gap: 20px
   - 텍스트: `DEFINITION`
     - font-size: 26px / weight 700 / color: `rgba(255,255,255,0.55)` / letter-spacing: 0.22em
   - margin-bottom: 72px

2. **메인 카피** (2줄)
   ```
   멈추는 순간
   불안해지는 마음.
   ```
   - font-size: 76px / weight 800 / color: `#fff` / line-height: 1.28 / letter-spacing: -0.035em
   - "불안해지는" 만 color `#e85d3a`
   - margin-bottom: 76px

3. **구분선**
   - height: 2px / background: `rgba(255,255,255,0.1)` / margin-bottom: 56px

4. **본문 텍스트** (단일 단락, br로 줄바꿈 1회)
   ```
   무언가를 끊임없이 해내야만 자신을 괜찮다고 느끼는 상태.
   도착해도 곧바로 다음 목표로 도망치는 패턴이에요.
   ```
   - font-size: 38px / line-height: 1.85 / color: `rgba(255,255,255,0.82)`
   - letter-spacing: -0.01em / weight 400 / `text-wrap: pretty`
   - "해내야만" 만 color `#fff` weight 700 (강조)
   - **줄바꿈은 두 문장 사이 `<br>` 한 번만** (한 줄 띄움 — 빈 줄 X)

5. **하단 푸터** — `margin-top: auto`, flex `space-between`
   - 좌측: `02 / 08` (현재/총 페이지) / color: `rgba(255,255,255,0.4)` / font-size: 22px
   - 우측: `NEXT →` / color: `#e85d3a` / weight 700 / font-size: 22px

---

## Interactions & Behavior
정적 이미지 출력물이라 인터랙션 없음. 다만 구현 시 다음을 권장:
- 본문 텍스트를 prop으로 받아 N개의 본문 슬라이드를 자동 생성하는 컴포넌트로 만들 것 (`<BodySlide category="DEFINITION" highlight="불안해지는" title="..." body="..." pageIndex={2} totalPages={8} />`)
- 페이지 인디케이터(`02 / 08`)는 자동 계산.

## Design Tokens

### Colors
| Token | Value | 사용처 |
|---|---|---|
| `--bg-dark` | `#0e0e10` | 메인 배경 |
| `--text-primary` | `#ffffff` | 강조 텍스트, 메인 타이틀 |
| `--text-secondary` | `rgba(255,255,255,0.82)` | 본문 |
| `--text-tertiary` | `rgba(255,255,255,0.55)` | 라벨, 서브타이틀 |
| `--text-muted` | `rgba(255,255,255,0.4)` | 푸터 |
| `--accent` | `#e85d3a` | 강조색 (오렌지) |
| `--divider` | `rgba(255,255,255,0.1)` | 구분선 |
| `--dot-pattern` | `rgba(255,255,255,0.05)` | 배경 도트 |

### Typography
- **Font family**: `Pretendard` (Korean) / fallback: `-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`
- **Weights used**: 400 (regular), 500 (medium), 700 (bold), 800 (extra-bold)
- Font import (Pretendard CDN):
  ```html
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css">
  ```

### Type Scale (1080×1350 기준)
| Token | Size | Weight | Line | Letter-spacing |
|---|---|---|---|---|
| `display` | 100px | 800 | 1.15 | -0.04em |
| `headline` | 76px | 800 | 1.28 | -0.035em |
| `body-lg` | 38px | 400 | 1.85 | -0.01em |
| `subtitle` | 26px | 500 | 1.4 | 0.04em |
| `label` | 26px | 700 | 1 | 0.22em |
| `meta` | 22px | 500–700 | 1 | 0.05–0.1em |

### Spacing
컨테이너 패딩 88px, 섹션 간격 56–76px 사용. 캐릭터적 큰 호흡감이 핵심.

---

## Assets
이미지 에셋 없음. 모든 시각 요소는 CSS/SVG 기반.

## Files
- `cover.html` — 첫 장 단독 1080×1350 정적 HTML
- `body.html` — 본문 장 단독 1080×1350 정적 HTML
- `preview.html` — 두 장을 캐러셀처럼 나란히 보여주는 미리보기

## Implementation Notes

1. **줄바꿈 규칙**: 본문 텍스트의 두 문장은 `<br>` 한 번으로만 분리하세요. 빈 줄(`<br><br>`)을 사용하면 안 됩니다.

2. **출력 시 권장 방식**:
   - HTML → `html-to-image` / `dom-to-image` 또는 Puppeteer 스크린샷으로 1080×1350 PNG 추출.
   - 또는 React 컴포넌트로 만들고 Storybook에서 PNG 스냅샷 + Figma 플러그인으로 export.

3. **확장성**: 본문 카드는 시리즈 내 N번 재사용. props 화 필수: `category`, `title`(2줄), `highlightWord`, `bodyText`, `pageIndex`, `totalPages`.
