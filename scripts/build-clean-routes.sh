#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
routes=(
  "Queer-Kneipe"
  "Das-Labor"
  "Punk-Kneipe"
  "Info-Kneipe"
  "Kunst-Kneipe"
  "Spieleabend"
  "mitglied"
  "Kontakt"
)

for route in "${routes[@]}"; do
  route_dir="$project_dir/$route"
  mkdir -p "$route_dir"
  cp "$project_dir/index.html" "$route_dir/index.html"
  sed -i '/<head>/a\\  <base href="../">' "$route_dir/index.html"
  sed -i "s|href=\"#main-content\"|href=\"./$route/#main-content\"|" "$route_dir/index.html"
done
