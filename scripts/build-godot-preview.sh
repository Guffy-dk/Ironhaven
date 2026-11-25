#!/usr/bin/env bash
# Builds the Godot preview for Windows and Linux: Blender models, CC0 assets, import, export, package.
# Env: GODOT (editor binary), BLENDER (blender binary), DOTNET (dotnet). Outputs release/Ironhaven-Preview-*.
set -euo pipefail
project="$(cd "$(dirname "$0")/.." && pwd)"
version="$(node -p "require('$project/godot/preview-version.json').version")"
release="$project/release"; mkdir -p "$release"
export AVALONIA_TELEMETRY_OPTOUT=1 DOTNET_CLI_TELEMETRY_OPTOUT=1 DOTNET_NOLOGO=1
cd "$project"
node scripts/fetch-assets.mjs
mkdir -p godot/assets/models
rm -rf godot/assets/textures godot/assets/sky
cp -R assets-cache/textures assets-cache/sky godot/assets/
"$BLENDER" -b --python scripts/blender/build_summer_harbour.py -- assets-cache godot/assets/models
cd godot
"$DOTNET" run --project tests/SliceTests.csproj
"$DOTNET" build Ironhaven.csproj -c Release
timeout 1800 "$GODOT" --headless --path . --import || true
rm -rf export
for preset in Linux Windows; do mkdir -p "export/$(echo $preset | tr A-Z a-z)/Ironhaven"; timeout 1800 "$GODOT" --headless --path . --export-release "$preset"; done
test -x export/linux/Ironhaven/Ironhaven && test -f export/windows/Ironhaven/Ironhaven.exe
# Start the exported Linux build headlessly long enough to load the scene and its assemblies.
timeout 300 export/linux/Ironhaven/Ironhaven --headless --quit-after 120 2>&1 | tee "$release/godot-preview-startup.log" | grep -v -i audio | tail -n 5
! grep -E "SCRIPT ERROR|Unhandled exception|Failed to load" "$release/godot-preview-startup.log"
for dir in linux windows; do cp "$project/docs/LICENSING.md" "$project/release/THIRD-PARTY-NOTICES.txt" export/$dir/Ironhaven/ 2>/dev/null || true; done
tar -czf "$release/Ironhaven-Preview-Linux-x64.tar.gz" -C export/linux Ironhaven
(cd export/windows && zip -qr "$release/Ironhaven-Preview-Windows-x64.zip" Ironhaven)
for platform in Linux Windows; do
  file="$release/Ironhaven-Preview-$platform-x64.$([ $platform = Linux ] && echo tar.gz || echo zip)"
  node -e "const fs=require('fs'),c=require('crypto');const [f,o,v]=process.argv.slice(1);const d=fs.readFileSync(f);fs.writeFileSync(o,JSON.stringify({tag:'preview-v'+v,digest:'sha256:'+c.createHash('sha256').update(d).digest('hex'),size:d.length},null,2))" "$file" "$release/Ironhaven-Preview-$platform-manifest.json" "$version"
done
ls -la "$release"/Ironhaven-Preview-*
