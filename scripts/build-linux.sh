#!/usr/bin/env bash
# Builds the Linux x64 desktop package, runs the packaged startup smoke tests and writes the patcher manifest.
# Mirrors scripts/build-windows.ps1. Set IRONHAVEN_SKIP_SMOKE=1 only for local packaging without a display server.
set -euo pipefail

project="$(cd "$(dirname "$0")/.." && pwd)"
release="$project/release"
runtime_version='45.3.3'
runtime_hash='0a63ce0e2b6a69d6ced7194949934b8414a6dadeca82910f88dc8720a1433269'
runtime_name="electron-v$runtime_version-linux-x64.zip"
cache="$release/linux-cache"
archive="$cache/$runtime_name"
game_version="$(node -p "require('$project/package.json').version")"
package_root="$release/linux-$game_version"
game_folder="$package_root/Ironhaven"
bundle="$release/Ironhaven-Linux-x64.tar.gz"

cd "$project"
node scripts/build.mjs

mkdir -p "$cache"
if [[ ! -f "$archive" ]] || ! echo "$runtime_hash  $archive" | sha256sum -c --status; then
  curl -fsSL "https://github.com/electron/electron/releases/download/v$runtime_version/$runtime_name" -o "$archive"
fi
echo "$runtime_hash  $archive" | sha256sum -c --status || { echo 'Electron runtime checksum mismatch.' >&2; exit 1; }

rm -rf "$package_root"
mkdir -p "$game_folder"
unzip -q "$archive" -d "$game_folder"
mv "$game_folder/electron" "$game_folder/Ironhaven"
rm -f "$game_folder/resources/default_app.asar"
app="$game_folder/resources/app"
mkdir -p "$app"
cp desktop/game.cjs desktop/mod-loader.cjs release/Ironhaven.html release/Studio-Intro.html release/mod-base.json release/mod-worker.cjs "$app/"
cp release/THIRD_PARTY_ASSETS.txt release/FENGARI-LICENSE.txt release/FONT-LICENSES.txt "$game_folder/"
cp desktop/linux/ironhaven.sh "$game_folder/ironhaven.sh"
chmod 755 "$game_folder/ironhaven.sh" "$game_folder/Ironhaven"
mkdir -p "$game_folder/Modding"
cp docs/MODDING.md "$game_folder/Modding/"
cp -R examples/mods "$game_folder/Modding/"
node -e "require('fs').writeFileSync(process.argv[1],JSON.stringify({name:'ironhaven',productName:'Ironhaven',version:process.argv[2],main:'game.cjs'},null,2))" "$app/package.json" "$game_version"

if [[ "${IRONHAVEN_SKIP_SMOKE:-0}" != 1 ]]; then
  node scripts/windows-smoke-world.mjs "$app/smoke-world.json"
  # Software rendering on a virtual display, exactly like the hosted Windows runners.
  run_smoke() {
    local flag="$1" log="$2" limit="$3"
    if ! timeout "$limit" xvfb-run -a -s '-screen 0 1280x800x24' "$game_folder/ironhaven.sh" "$flag" 2> "$log"; then
      tail -n 80 "$log" >&2
      echo "Linux desktop smoke test $flag failed." >&2
      exit 1
    fi
    cat "$log"
  }
  run_smoke --smoke-test "$package_root/startup-test.log" 300
  run_smoke --mod-smoke-test "$package_root/mod-startup-test.log" 180
  rm -f "$app/smoke-world.json"
fi

tar -czf "$bundle" -C "$package_root" Ironhaven
node -e "
const fs=require('fs'),crypto=require('crypto');
const [file,out,version]=process.argv.slice(1);
const data=fs.readFileSync(file);
fs.writeFileSync(out,JSON.stringify({tag:'v'+version,digest:'sha256:'+crypto.createHash('sha256').update(data).digest('hex'),size:data.length},null,2));
" "$bundle" "$release/Ironhaven-Linux-manifest.json" "$game_version"
echo "Built $bundle"
