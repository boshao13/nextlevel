#!/usr/bin/env bash
set -eo pipefail

SRC_DIR="/Users/boshao/projects/nextlevel/public/videos.backup"
OUT_DIR="/Users/boshao/projects/nextlevel/public/videos"
LOG="/tmp/nextlevel-compress-$(date +%s).log"

echo "Source:  $SRC_DIR" | tee "$LOG"
echo "Output:  $OUT_DIR" | tee -a "$LOG"
echo "Started: $(date)"  | tee -a "$LOG"
echo ""        | tee -a "$LOG"

# WebM (VP9) - CRF 33, strip audio (videos are autoplay+muted)
for f in "$SRC_DIR"/*.webm; do
  name=$(basename "$f")
  size_before=$(stat -f%z "$f")
  ffmpeg -y -hide_banner -loglevel error \
    -i "$f" \
    -c:v libvpx-vp9 -crf 33 -b:v 0 -row-mt 1 -threads 0 \
    -an \
    "$OUT_DIR/$name"
  size_after=$(stat -f%z "$OUT_DIR/$name")
  printf "  %-32s %6.1fM -> %5.1fM\n" "$name" \
    "$(echo "$size_before/1048576" | bc -l)" \
    "$(echo "$size_after/1048576" | bc -l)" | tee -a "$LOG"
done

# MP4 (H.264) - CRF 26, slow preset, strip audio, faststart for streaming
for f in "$SRC_DIR"/*.mp4; do
  name=$(basename "$f")
  size_before=$(stat -f%z "$f")
  ffmpeg -y -hide_banner -loglevel error \
    -i "$f" \
    -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p \
    -movflags +faststart \
    -an \
    "$OUT_DIR/$name"
  size_after=$(stat -f%z "$OUT_DIR/$name")
  printf "  %-32s %6.1fM -> %5.1fM\n" "$name" \
    "$(echo "$size_before/1048576" | bc -l)" \
    "$(echo "$size_after/1048576" | bc -l)" | tee -a "$LOG"
done

echo "" | tee -a "$LOG"
echo "Total before: $(du -sh "$SRC_DIR" | cut -f1)" | tee -a "$LOG"
echo "Total after:  $(du -sh "$OUT_DIR" | cut -f1)" | tee -a "$LOG"
echo "Finished: $(date)" | tee -a "$LOG"
