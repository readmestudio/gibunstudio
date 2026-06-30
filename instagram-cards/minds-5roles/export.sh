#!/bin/bash
# 1080×1350 PNG 내보내기 (인스타 4:5)
set -e
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
DIR="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$DIR/export"
for f in 01-cover 02-concept 03-lineup 04-bridge 05-imbalance 06-imbalance-rake 07-result-cta; do
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --window-size=1080,1370 --virtual-time-budget=6000 \
    --screenshot="$DIR/export/$f.png" "file://$DIR/$f.html"
  sips -c 1350 1080 "$DIR/export/$f.png" >/dev/null
done
echo "done → $DIR/export"
