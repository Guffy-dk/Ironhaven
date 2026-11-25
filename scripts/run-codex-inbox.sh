#!/usr/bin/env bash
# The workflow grants only this job a GitHub identity. Keep it out of agent commands.
set -euo pipefail

umask 077
auth_dir=$(mktemp -d "$RUNNER_TEMP/codex-identity-XXXXXXXX")
token_file="$auth_dir/github-oidc.jwt"
refresh_pid=''
cleanup() {
  if [[ -n "$refresh_pid" ]]; then
    kill "$refresh_pid" 2>/dev/null || true
    wait "$refresh_pid" 2>/dev/null || true
  fi
  rm -rf "$auth_dir"
}
trap cleanup EXIT

audience='ironhaven-codex-inbox'
refresh_identity() {
  local token
  token=$(curl --silent --show-error --fail --retry 2 --max-time 20 \
    --header "Authorization: bearer $ACTIONS_ID_TOKEN_REQUEST_TOKEN" \
    --get --data-urlencode "audience=$audience" "$ACTIONS_ID_TOKEN_REQUEST_URL" |
    jq -er '.value | select(type == "string" and length > 0)') || return
  printf '%s' "$token" > "$token_file.new"
  mv -f "$token_file.new" "$token_file"
}

refresh_identity
parent_pid=$BASHPID
(
  while sleep 60 && kill -0 "$parent_pid" 2>/dev/null; do
    refresh_identity || echo "::warning::Could not refresh GitHub identity."
  done
) &
refresh_pid=$!

export CODEX_HOME="$auth_dir"
export OPENAI_IDENTITY_TOKEN_FILE="$token_file"

cat > "$CODEX_HOME/config.toml" <<CONFIG
approval_policy = "never"
default_permissions = "ironhaven-inbox"

[permissions.ironhaven-inbox]
extends = ":workspace"

[permissions.ironhaven-inbox.filesystem]
"$RUNNER_TEMP" = "deny"
"/proc" = "deny"

[permissions.ironhaven-inbox.network]
enabled = false

[shell_environment_policy]
inherit = "core"
CONFIG

env -u ACTIONS_ID_TOKEN_REQUEST_URL -u ACTIONS_ID_TOKEN_REQUEST_TOKEN \
  codex exec --ephemeral --strict-config \
  --output-last-message "$RUNNER_TEMP/codex-inbox/result.md" - \
  < "$RUNNER_TEMP/codex-inbox/prompt.md"
