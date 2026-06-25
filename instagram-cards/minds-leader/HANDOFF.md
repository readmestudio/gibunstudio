# MINDS · 리더 단독 카드뉴스 — 작업 인수인계 (HANDOFF)

> 다른 에이전트가 이어받기 위한 현재 상태 + 남은 작업 + 이미지 기획 정리.
> 마지막 갱신: 2026-06-24

---

## 0. 작업 규칙 (반드시 지킬 것)

1. **이미지(힉스필드) 생성 전, 텍스트 + 이미지 기획을 먼저 사용자에게 컨펌받는다.** 바로 생성하지 말 것.
   (단, 이 문서의 06번 이미지는 이미 사용자 컨펌 완료 — 아래 2번 참고)
2. **표지(첫 장)는 공감형 "문제 인식" 프레이밍.**
3. 부드러운/비판단적 용어 우선 (예: "반박/부수기" 대신 "다시 보기/알아차리기").
4. 메모리 참고: `feedback_cardnews_workflow.md`, `feedback_workbook_soft_language.md`.

---

## 1. 현재 상태 — 카드 7장 (텍스트 전부 완성)

폴더: `instagram-cards/minds-leader/`
공통 CSS: `../shared.css` + `./leader.css` (villain.css 복사본)
미리보기: `preview.html` (7장 그리드), 1080×1350 / 다크 모노톤

| # | 파일 | 역할 | 이미지(배경) | 상태 |
|---|------|------|------|------|
| 01 | `01-cover.html` | 표지 | `../minds-cast/illustrations/leader-stage.png` | ✅ 완성 |
| 02 | `02-intro.html` | 리더 정의/개념 | 없음(텍스트) | ✅ 완성 |
| 03 | `03-examples.html` | 매일 바뀐다 | 없음(체크리스트) | ✅ 완성 |
| 04 | `04-behavior.html` | 리더의 행동(장면 예시 포함) | 없음(텍스트) | ✅ 완성 |
| 05 | `05-thoughts.html` | 자주 하는 생각(인용) | 없음(텍스트) | ✅ 완성 |
| 06 | `06-understand.html` | 한 명의 배역(리프레임) | **현재 leader-stage 재사용 → 새 이미지로 교체 예정** | ⏳ 이미지 교체 대기 |
| 07 | `07-cta.html` | CTA | `../minds-cast/illustrations/leader-stage.png` (북엔드 재사용) | ✅ 완성 |

### 카드별 핵심 카피 (현재 반영된 것)

- **01 표지**: 라벨 `다섯 가지 배역 · 리더편` / 제목 `아무도 뭐라고 하지 않는데 / 스스로를 [몰아붙이는] / 사람들의 특징` / 서브 `내 기분을 결정하는 내 마음 속 리더 찾기`
- **02 리더란?**: 헤드라인 `리더는 지금 내 무대를 끌고 가는 '주연'` / 본문: 내 안엔 여러 '배역'이 살고, 그중 지금 앞에 나서 하루를 이끄는 마음이 리더 → 흔히 '그냥 내 성격'이라 착각.
- **04 리더의 행동(`리더는 이런 장면에서 움직여요`)**: 번호 행동 3개 + 각 장면 예시
  1. 기뻐하고 무너질 기준을 정한다 — 팀장 칭찬 한마디에 하루가 붕 뜨고, 반응 없으면 종일 가라앉음.
  2. 다른 마음의 목소리를 덮는다 — '좀 쉬자'가 올라와도 '아직 멀었어'로 눌러버림.
  3. '원래 나'라며 자리를 굳힌다 — "난 원래 쉬면 불안한 사람이야" → 성격으로 굳어짐.
- **06 한 명의 배역**: 헤드라인 `리더는 '나의 전부'가 아니라 [한 명의 배역]이에요` / 지금의 리더는 미워할 필요 없는 힘, 다만 '한 배역일 뿐'이라 알아차리는 순간 주도권이 돌아옴.
- **07 CTA**: 제목 `지금 내 무대의 리더는 [누구]일까요?` / 서브 `5가지 배역 중, 오늘 당신을 끌고 가는 마음` / 버튼 `지금 무료로 테스트해보세요 →`

---

## 2. 남은 작업 ① — 06번 새 이미지 생성 (사용자 컨펌 완료)

**문제**: `leader-stage.png`가 01·06·07 3번 반복됨.
**확정안**:
- 01 표지 = `leader-stage.png` 유지
- 06 = 🆕 **새 이미지 1장 생성** (아래 프롬프트)
- 07 = `leader-stage.png` 재사용 (표지와 멀리 떨어진 마지막 장 = 북엔드, 인접 반복 없음)

### 힉스필드 생성 파라미터 (그대로 사용)
- 도구: `mcp__claude_ai_higgs__generate_image`
- model: `recraft-v4-1`
- aspect_ratio: `4:5`
- count: 1
- background_color: `#0e0e10`
- colors(palette rgb): `[239,230,214]`, `[232,93,58]`, `[14,14,16]`
- **prompt**:
  > Ancient cave-wall mural meets Picasso line art. Four or five bold symbolic human figures of different postures standing together across a dark stage — one figure slightly forward and lit by a soft beam, the others quieter and dimmer around it — suggesting an ensemble cast of many inner selves where the leader is just one of them. Thick confident hand-brushed outline strokes, minimal interior detail, abstracted cubist side-profile faces, lots of negative space. Bone-white and warm amber pigment lines on a deep matte near-black stone wall. Balanced composition, timeless, no text, no border.

### ⚠️ 생성 실패 이력 (중요)
- 2026-06-24, 약 35분간 `generate_image` 호출이 모두 **"claude-opus-4-8 is temporarily unavailable, so auto mode cannot determine the safety…"** 에러로 거부됨. 이미지 모델이 아니라 **안전성 분류기(메인 모델) 일시 장애**가 원인. 코드/파라미터 문제 아님.
- 복구되면 위 파라미터로 그대로 재시도하면 됨.

### 생성 후 처리 절차
1. `job_status`로 결과 URL 확보 → `illustrations/leader-ensemble.png`로 저장
   (저장 위치 후보: `instagram-cards/minds-leader/illustrations/` 신설 또는 `../minds-cast/illustrations/`)
2. `06-understand.html`의 `<div class="illu-bg"><img src="...leader-stage.png" />`를 새 파일 경로로 교체.
3. preview.html로 7장 확인.

---

## 3. 남은 작업 ② — PNG 내보내기 (필요 시)

확정 후 1080×1350 PNG 추출 파이프라인:
```
headless Chrome 창 1080×1370 캡처
→ sips -c 1350 1080 (상하 10px body padding 제거 → 정확히 1080×1350)
```
- Chrome 헤드리스 배치(3장 이상)는 2분 타임아웃 위험 → **장당 개별 export** + `--virtual-time-budget=3000` 권장.
- 타임아웃 시: `pkill -f "Google Chrome.*headless"` 후 재시도.
- 산출물 폴더: `instagram-cards/minds-leader/export/`

---

## 4. 디자인/CSS 참고

- `leader.css` 주요 클래스: `.card.illu`, `.illu-bg`, `.illu-scrim`, `.illu-layer`(.brand/.title/.subtitle, .category/.headline/.stext/.foot), `.band/.btn/.arrow`.
- 풀블리드(full-bleed) 카드에서 `.band`가 카드 밖으로 밀리는 버그 → 07번처럼 `.illu-layer`에 인라인 `style="height:auto; flex:1 1 auto; padding-bottom:48px;"` 적용.
- 표지 고정 포맷 규칙: `instagram-cards/minds-cast/README.md` 참조.
- 다크 모노톤: bg `#0e0e10`, accent orange `#e85d3a`, Pretendard, 그라데이션 금지.

---

## 5. 시리즈 맥락

- 메인 8장 캐러셀: `instagram-cards/minds-cast/` (전체 5배역 소개)
- 빌런 단독 7장: `instagram-cards/minds-villain/` (완성)
- 리더 단독 7장: `instagram-cards/minds-leader/` (← 이 문서, 06 이미지만 남음)
- 향후 다른 배역(중재자/관리자/추방자)도 같은 7장 포맷으로 단독 발행 가능.
