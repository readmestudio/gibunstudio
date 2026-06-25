# MINDS · THE CAST — "내 안의 마음" 카드뉴스

`/minds` 자가테스트(성취중독·내면의 부분들)를 인스타 캐러셀로 옮긴 **8장** 시리즈.
다크 모노톤(`#0e0e10` + 오렌지 `#e85d3a`) — `instagram-cards/shared.css` 시스템 재사용.

## 구성 (8장)

| # | 파일 | 슬롯 | 핵심 |
|---|------|------|------|
| 01 | `01-cover.html` | COVER | 내 기분을 결정하는 내 마음 속 **다섯 가지 배역** (5배역 일러스트 타일 배경) |
| 02 | `02-concept.html` | TEXT | 왜 맨날 이랬다 저랬다 할까? + 5배역(리더·빌런·난봉꾼·관리자·추방자) 예고 |
| 03 | `03-leader.html` | ROLE | **리더** — 살아남기 위한 주특기 |
| 04 | `04-villain.html` | ROLE | **빌런** — 내가 무너지지 않게 하는 것 |
| 05 | `05-rake.html` | ROLE | **난봉꾼** — 한계에 닿으면 눌리는 비상 버튼 |
| 06 | `06-manager.html` | ROLE | **관리자** — 길목을 지키는 경비원 |
| 07 | `07-exile.html` | ROLE(top) | **추방자** — 가장 보호가 필요한 자리 |
| 08 | `08-result-cta.html` | RESULT+CTA | 캡쳐 타일 + 「무료」 도장 + "테스트하러 가기" |

## 표지(COVER) 고정 포맷 ⭐ — 게시 포맷 기준 (앞으로 모든 첫장 동일)

> **실제 게시물 룩이 기준.** 텍스트 블록은 하단 정렬, 브랜드 라벨 → 제목 → 서브 순. (`01-cover.html` = 레퍼런스)

**캔버스 / 레이아웃**
- 프레임: **1080 × 1350** · 좌우 패딩 **80px** (콘텐츠 폭 920px)
- 텍스트 블록은 **하단 정렬** (아래 패딩 **150px**)
- 배경: 다크 + 일러스트 + 스크림(하단 텍스트존을 어둡게). 본 시리즈는 **5배역 일러스트 타일 모자이크**.

**브랜드 라벨** (제목 위)
- 텍스트 **"기분 스튜디오"** · Pretendard Medium(500) · **30px** · 회색(tertiary) · 라벨↔제목 **24px**

**제목**
- Pretendard **Bold(700)** · **82px** · line-height **1.18**
- 2~3줄 · 강조어 **1곳만 오렌지**(`#e85d3a`)
- 제목 ↔ 서브 간격 **34px**

**서브카피**
- Pretendard **Regular(400)** · **40px** · line-height **1.4** · **1줄** · 회색(secondary)

**색상**
- 텍스트 색은 **배경 대비에 맞춰 고정.** 다크 배경 → 흰 제목 + 회색 서브. (밝은 템플릿이면 `#222222`)

**계정**
- 인스타 핸들 `@gibun.psych.studio` (카드 안에는 **"기분 스튜디오"** 라벨로 표기)

## 배역 카드(03~07) 디자인

- **풀블리드 일러스트 배경** + 스크림 + **역할 이름이 가장 큰 요소**(168px)
- 스타일: `roles.css`. 그림 배경색이 카드 배경(#0e0e10)과 같아 자연스럽게 합쳐짐
- 추방자(07)는 인물이 좌하단에 작아 `.role.top`(상단 텍스트 + 상단 스크림) 사용

## 에셋

- 배역 일러스트: `illustrations/{leader,villain,rake,manager,exile}.png`
  - 힉스필드 **Recraft 4.1** 생성 · *고대 벽화 / 피카소풍 굵은 선* · 본화이트+앰버 on near-black · 4:5
- 08장 배경: `captures/1~4.png` (마음카드 캡쳐 — 완벽주의여사/쉬고싶어氏/중재가/Mr.다그쳐)
- 표지·개념 도들: `/public/doodles/*.svg` (검정 선화 → `filter: invert(1)`)
- 스타일: `../shared.css` + `minds.css`(01·02) / `roles.css`(03~07) / `../paid-workbook/waitlist-12/card.css`(08)

## 미리보기 / 내보내기

- 미리보기: `preview.html` (8장 0.42배 그리드)
- PNG 재내보내기 (1080×1350 정확 크롭):

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
DIR="$(pwd)"; mkdir -p export
for f in 01-cover 02-concept 03-leader 04-villain 05-rake 06-manager 07-exile 08-result-cta; do
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --window-size=1080,1370 --virtual-time-budget=5000 \
    --screenshot="export/$f.png" "file://$DIR/$f.html"
  sips -c 1350 1080 "export/$f.png"   # 상하 10px 패딩 제거 → 정확히 1080×1350
done
```

완성본: `export/*.png` (인스타 4:5 그대로 업로드 가능)
