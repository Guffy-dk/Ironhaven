#!/bin/sh
# Starts Ironhaven on Linux with Chromium's process sandbox whenever the system allows it.
# Chromium needs either unprivileged user namespaces or a root-owned setuid chrome-sandbox.
# Some distributions (for example Ubuntu 24.04 with AppArmor) block both for unpacked apps;
# only then is the OS sandbox disabled. The game still runs with context isolation, no Node
# access in the page, a strict content security policy and only its own packaged content.
here="$(cd "$(dirname "$0")" && pwd)"
sandbox_flag=""
helper="$here/chrome-sandbox"
setuid_ready=false
if [ -u "$helper" ] && [ "$(stat -c %u "$helper" 2>/dev/null)" = 0 ]; then setuid_ready=true; fi
userns_ready=true
if [ "$(cat /proc/sys/kernel/unprivileged_userns_clone 2>/dev/null || echo 1)" = 0 ]; then userns_ready=false; fi
if [ "$(cat /proc/sys/kernel/apparmor_restrict_unprivileged_userns 2>/dev/null || echo 0)" = 1 ]; then userns_ready=false; fi
if [ "$(id -u)" = 0 ] || { [ "$setuid_ready" = false ] && [ "$userns_ready" = false ]; }; then
  sandbox_flag="--no-sandbox"
fi
exec "$here/Ironhaven" $sandbox_flag "$@"
