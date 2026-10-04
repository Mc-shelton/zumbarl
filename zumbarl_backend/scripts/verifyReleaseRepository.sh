#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPOSITORY_DIR=$(dirname -- "$(dirname -- "$SCRIPT_DIR")")

dirty_count=$(git -C "$REPOSITORY_DIR" status --porcelain --untracked-files=all | wc -l | tr -d ' ')
if [ "$dirty_count" -ne 0 ]; then
  echo "Release blocked: the repository has $dirty_count uncommitted or untracked paths." >&2
  exit 1
fi

historical_runtime_file_count=$(
  git -C "$REPOSITORY_DIR" rev-list --objects --all \
    | awk 'NF > 1 { print $2 }' \
    | awk '/^zumbarl_backend\/bucket\// && $0 !~ /\/\.gitkeep$/ { count++ } END { print count + 0 }'
)
if [ "$historical_runtime_file_count" -ne 0 ]; then
  echo "Release blocked: Git history contains $historical_runtime_file_count backend runtime/private bucket paths." >&2
  echo "Complete the reviewed history-cleanup procedure before releasing." >&2
  exit 1
fi

echo "Release repository check passed."
