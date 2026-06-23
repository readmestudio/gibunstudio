#!/usr/bin/env bash
# 워크북 대기신청 페이드 12종 → 1080×1350 PNG 추출
# 사용: bash export.sh
set -e
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
DIR="$(cd "$(dirname "$0")" && pwd)"
OUT="$DIR/export"
mkdir -p "$OUT"
for n in 01 02 03 04 05 06 07 08 09 10 11 12 13; do
  "$CHROME" --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --window-size=1080,1370 --screenshot="$OUT/raw-$n.png" "file://$DIR/$n.html" >/dev/null 2>&1
  sips -c 1350 1080 "$OUT/raw-$n.png" --out "$OUT/$n.png" >/dev/null 2>&1
  rm -f "$OUT/raw-$n.png"
  echo "exported $n.png"
done
echo "완료: $OUT 에 12종 PNG"
