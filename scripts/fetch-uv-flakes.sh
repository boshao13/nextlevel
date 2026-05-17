#!/usr/bin/env bash
set -eo pipefail

OUT_DIR="/Users/boshao/projects/nextlevel/src/images/uv-flakes"
mkdir -p "$OUT_DIR"

# format: filename|original_120_url
URLS=(
"veranda|https://assets.torginol.com/uploads/Products/Flake/UV-flake/_120x120_crop_center-center_none_ns/UVFB-1027_VERANDA_1.8.jpg"
"courtyard|https://assets.torginol.com/uploads/Products/Flake/UV-flake/_120x120_crop_center-center_none_ns/UVFB-1028_COURTYARD_1.8.jpg"
"chalet|https://assets.torginol.com/uploads/Products/Flake/UV-flake/_120x120_crop_center-center_none_ns/UVFB-1007_Chalet_1.8.jpg"
"saltbox|https://assets.torginol.com/uploads/Products/Flake/UV-flake/_120x120_crop_center-center_none_ns/UVFB-012_SALTBOX_1.8.jpg"
"rooftop|https://assets.torginol.com/uploads/Products/Flake/UV-flake/_120x120_crop_center-center_none_ns/UVFB-1025_ROOFTOP_1.8.jpg"
"homestead|https://assets.torginol.com/uploads/Products/Flake/UV-flake/_120x120_crop_center-center_none_ns/UVFB-1009_Homestead_1.8.jpg"
"cottage|https://assets.torginol.com/uploads/Products/Flake/UV-flake/_120x120_crop_center-center_none_ns/UVFB-1006_Cottage_1.8.jpg"
"townhome|https://assets.torginol.com/uploads/Products/Flake/UV-flake/_120x120_crop_center-center_none_ns/UVFB-1003_Townhome_1.8.jpg"
"villa|https://assets.torginol.com/uploads/Products/Flake/UV-flake/_120x120_crop_center-center_none_ns/UVFB-1005_Villa_1.8.jpg"
"pueblo|https://assets.torginol.com/uploads/Products/Flake/UV-flake/_120x120_crop_center-center_none_ns/UVFB-1001_Pueblo_1.8.jpg"
"beach-house|https://assets.torginol.com/uploads/Products/Flake/UV-flake/_120x120_crop_center-center_none_ns/UVFB-1021_BEACH-HOUSE_1.8.jpg"
"loft|https://assets.torginol.com/uploads/Products/Flake/UV-flake/_120x120_crop_center-center_none_ns/UVFB-1022_LOFT_1.8.jpg"
"ranch|https://assets.torginol.com/uploads/Products/Flake/UV-flake/_120x120_crop_center-center_none_ns/UVFB-1011_Ranch_1.8.jpg"
"bower|https://assets.torginol.com/uploads/Products/Flake/UV-flake/_120x120_crop_center-center_none_ns/UVFB-1019_BOWER_PILE.jpg"
"chateau|https://assets.torginol.com/uploads/Products/Flake/UV-flake/_120x120_crop_center-center_none_ns/UVFB-1004_Chateau_1.8.jpg"
"midcentury|https://assets.torginol.com/uploads/Products/Flake/UV-flake/_120x120_crop_center-center_none_ns/UVFB-1002_Midcentury_1.8.jpg"
"bungalow|https://assets.torginol.com/uploads/Products/Flake/UV-flake/_120x120_crop_center-center_none_ns/UVFB-1010_Bungalow_1.8.jpg"
"manor|https://assets.torginol.com/uploads/Products/Flake/UV-flake/_120x120_crop_center-center_none_ns/UVFB-1023_MANOR_1.8.jpg"
"ironwork|https://assets.torginol.com/uploads/Products/Flake/UV-flake/_120x120_crop_center-center_none_ns/UVFB-1024_IRONWORK_1.8.jpg"
"rowhouse|https://assets.torginol.com/uploads/Products/Flake/UV-flake/_120x120_crop_center-center_none_ns/UVFB-1026_ROWHOUSE_1.8.jpg"
"castle|https://assets.torginol.com/uploads/Products/Flake/UV-flake/_120x120_crop_center-center_none_ns/UVFB-1030_CASTLE_1.8.jpg"
"terrace|https://assets.torginol.com/uploads/Products/Flake/UV-flake/_120x120_crop_center-center_none_ns/UVFB-1029_TERRACE_1.8.jpg"
"tudor|https://assets.torginol.com/uploads/Products/Flake/UV-flake/_120x120_crop_center-center_none_ns/UVFB-1012_Tudor_1.8.jpg"
"brownstone|https://assets.torginol.com/uploads/Products/Flake/UV-flake/_120x120_crop_center-center_none_ns/UVFB-1020_BROWNSTONE_1.8.jpg"
"canopy|https://assets.torginol.com/uploads/Products/Flake/UV-flake/_120x120_crop_center-center_none_ns/UVFB-2001_CANOPY_HYBRID.jpg"
"woodshed|https://assets.torginol.com/uploads/Products/Flake/UV-flake/_120x120_crop_center-center_none_ns/UVFB-2002_WOODSHED_HYBRID.jpg"
"coach-house|https://assets.torginol.com/uploads/Products/Flake/UV-flake/_120x120_crop_center-center_none_ns/UVFB-2003_COACH_HOUSE_HYBRID.jpg"
"pergola|https://assets.torginol.com/uploads/Products/Flake/UV-flake/_120x120_crop_center-center_none_ns/UVFB-2004_PERGOLA_HYBRID.jpg"
"gazebo|https://assets.torginol.com/uploads/Products/Flake/UV-flake/_120x120_crop_center-center_none_ns/UVFB-2005_GAZEBO_HYBRID.jpg"
"lodge|https://assets.torginol.com/uploads/Products/Flake/UV-flake/_120x120_crop_center-center_none_ns/UVFB-2006_LODGE_HYBRID.jpg"
"sunroom|https://assets.torginol.com/uploads/Products/Flake/UV-flake/_120x120_crop_center-center_none_ns/UVFB-2007_SUNROOM_HYBRID.jpg"
"croft|https://assets.torginol.com/uploads/Products/Flake/UV-flake/_120x120_crop_center-center_none_ns/UVFB-2008_CROFT_HYBRID.jpg"
"atrium|https://assets.torginol.com/uploads/Products/Flake/UV-flake/_120x120_crop_center-center_none_ns/UVFB-2009_ATRIUM_HYBRID.jpg"
"arbor|https://assets.torginol.com/uploads/Products/Flake/UV-flake/_120x120_crop_center-center_none_ns/UVFB-2010_ARBOR_HYBRID.jpg"
"patio|https://assets.torginol.com/uploads/Products/Flake/UV-flake/_120x120_crop_center-center_none_ns/UVFB-2011_PATIO_HYBRID.jpg"
"igloo|https://assets.torginol.com/uploads/Products/Flake/UV-flake/_120x120_crop_center-center_none_ns/UVFB-2012_IGLOO_HYBRID.jpg"
)

# Try increasingly aggressive sizes; first one that returns 200 wins.
SIZES=("_600x600_crop_center-center_none_ns" "_400x400_crop_center-center_none_ns" "_300x300_crop_center-center_none_ns" "_120x120_crop_center-center_none_ns")

for entry in "${URLS[@]}"; do
  name="${entry%%|*}"
  url120="${entry##*|}"
  out="$OUT_DIR/$name.jpg"

  got=""
  for size in "${SIZES[@]}"; do
    test_url="${url120/_120x120_crop_center-center_none_ns/$size}"
    code=$(curl -sS -o /dev/null -w "%{http_code}" -L "$test_url" || echo "000")
    if [ "$code" = "200" ]; then
      curl -sS -L "$test_url" -o "$out"
      got="$size"
      break
    fi
  done

  if [ -z "$got" ]; then
    echo "  ✗ $name (no size worked)"
  else
    size_kb=$(($(stat -f%z "$out") / 1024))
    printf "  ✓ %-14s %s  (%dKB)\n" "$name" "${got%%_crop*}" "$size_kb"
  fi
done

echo ""
echo "Total: $(ls -1 "$OUT_DIR" | wc -l | tr -d ' ') files, $(du -sh "$OUT_DIR" | cut -f1)"
