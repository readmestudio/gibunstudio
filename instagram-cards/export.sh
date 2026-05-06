#!/bin/bash
# 인스타그램 카드 PNG 내보내기
# 사용: bash export.sh
# 출력: instagram-cards/export/01-cover.png ... 08-reflect.png

set -e

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
ROOT="$(cd "$(dirname "$0")" && pwd)"
CARDS_DIR="$ROOT/cards"
OUT_DIR="$ROOT/export"
TMP_DIR="$ROOT/.tmp-export"

mkdir -p "$OUT_DIR" "$TMP_DIR"

# 캡처 대상 카드 (preview.html 제외)
CARDS=(
  "01-cover"
  "02-voices"
  "03-question"
  "04-hidden"
  "05-loop"
  "06-moment"
  "07-steps"
  "08-reflect"
)

echo "🎨 인스타그램 카드 PNG 내보내기 시작..."
echo "   해상도: 1080 × 1350 (4:5 비율)"
echo "   출력 폴더: $OUT_DIR"
echo ""

for name in "${CARDS[@]}"; do
  HTML="$CARDS_DIR/$name.html"
  RAW="$TMP_DIR/$name-raw.png"
  FINAL="$OUT_DIR/$name.png"

  if [ ! -f "$HTML" ]; then
    echo "⚠️  $HTML 없음 — 건너뜁니다"
    continue
  fi

  echo "📸 [$name] 렌더링 중..."

  # 1. Chrome 헤드리스로 1080×1370 영역 캡처 (body padding 10px 위/아래 포함)
  #    --virtual-time-budget: 폰트(Pretendard CDN) 로드 대기 (15초)
  #    --hide-scrollbars: 스크롤바 제거
  #    --force-device-scale-factor=1: 픽셀 1:1 매칭
  "$CHROME" \
    --headless=new \
    --disable-gpu \
    --hide-scrollbars \
    --force-device-scale-factor=1 \
    --window-size=1080,1370 \
    --virtual-time-budget=15000 \
    --default-background-color=00000000 \
    --screenshot="$RAW" \
    "file://$HTML" \
    > /dev/null 2>&1

  if [ ! -f "$RAW" ]; then
    echo "   ❌ 캡처 실패"
    continue
  fi

  # 2. 정확히 1080×1350으로 크롭 (위/아래 10px 패딩 제거)
  #    sips -c <height> <width>: 중앙 기준 크롭
  sips -c 1350 1080 "$RAW" --out "$FINAL" > /dev/null 2>&1

  # 3. 결과 확인
  DIMS=$(sips -g pixelWidth -g pixelHeight "$FINAL" | grep pixel | awk '{print $2}' | paste -sd 'x' -)
  SIZE=$(du -h "$FINAL" | cut -f1)
  echo "   ✅ $FINAL ($DIMS, $SIZE)"
done

# 임시 파일 정리
rm -rf "$TMP_DIR"

echo ""
echo "🎉 완료! Finder에서 열어보세요:"
echo "   open \"$OUT_DIR\""
