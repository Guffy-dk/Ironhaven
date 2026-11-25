#!/usr/bin/env bash
# Tests and publishes the Linux patcher (.NET 8, self-contained single file).
# When the Linux game package exists, it is installed through the patcher code and started once.
set -euo pipefail
project="$(cd "$(dirname "$0")/.." && pwd)"
release="$project/release"
dotnet="${DOTNET:-dotnet}"
export DOTNET_CLI_TELEMETRY_OPTOUT=1 DOTNET_NOLOGO=1
cd "$project/desktop/patcher/linux"
"$dotnet" run --project tests -c Release
"$dotnet" publish IronhavenPatcher.csproj -c Release -o "$release/linux-patcher"
cp "$release/linux-patcher/Ironhaven-Patcher" "$release/Ironhaven-Patcher-Linux"
chmod 755 "$release/Ironhaven-Patcher-Linux"
if [[ -f "$release/Ironhaven-Linux-x64.tar.gz" ]]; then
  output="$("$dotnet" run --project tests -c Release -- --local "$release/Ironhaven-Linux-x64.tar.gz" "$release/Ironhaven-Linux-manifest.json")"
  echo "$output"
  game="${output##* to }"
  folder="$(dirname "$game")"
  timeout 200 xvfb-run -a -s '-screen 0 1280x800x24' "$folder/ironhaven.sh" --mod-smoke-test > "$release/linux-patched-startup.log" 2>&1 || { tail -n 60 "$release/linux-patched-startup.log" >&2; echo 'Patched Linux game did not start.' >&2; exit 1; }
  grep "smoke\]" "$release/linux-patched-startup.log" | tail -n 3 || true
  rm -rf "$(dirname "$(dirname "$(dirname "$folder")")")"
fi
echo "Built $release/Ironhaven-Patcher-Linux"
