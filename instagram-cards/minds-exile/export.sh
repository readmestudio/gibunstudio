#!/usr/bin/env bash
# 추방자 카드뉴스 7장 → 1080×1350 PNG 내보내기
set -e
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
DIR="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$DIR/export"
for f in 01-cover 02-intro 03-examples 04-behavior 05-thoughts 06-understand 07-cta; do
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --window-size=1080,1370 --virtual-time-budget=6000 \
    --screenshot="$DIR/export/$f.png" "file://$DIR/$f.html"
  sips -c 1350 1080 "$DIR/export/$f.png"   # 상하 패딩 제거 → 정확히 1080×1350
done
echo "완료: $DIR/export/*.png"
