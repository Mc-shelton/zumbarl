#!/usr/bin/env bash
set -Eeuo pipefail

read -r action first second extra <<< "${SSH_ORIGINAL_COMMAND:-}"

if [[ -n "${extra:-}" ]]; then
  echo "Unsupported deployment command." >&2
  exit 64
fi

case "$action" in
  registry-login)
    if [[ ! "${first:-}" =~ ^[A-Za-z0-9_-]+$ || -n "${second:-}" ]]; then
      echo "Invalid registry identity." >&2
      exit 64
    fi
    exec docker login ghcr.io -u "$first" --password-stdin
    ;;
  registry-logout)
    if [[ -n "${first:-}" || -n "${second:-}" ]]; then
      echo "Unsupported deployment command." >&2
      exit 64
    fi
    exec docker logout ghcr.io
    ;;
  deploy)
    if [[ ! "${first:-}" =~ ^[0-9a-f]{40}$ ]]; then
      echo "Invalid release SHA." >&2
      exit 64
    fi
    if [[ ! "${second:-}" =~ ^ghcr\.io/[a-z0-9._-]+/[a-z0-9._/-]+$ ]]; then
      echo "Invalid image namespace." >&2
      exit 64
    fi
    exec /opt/zumbarl/infrastructure/oracle-demo/deploy-gitops.sh "$first" "$second"
    ;;
  *)
    echo "This key is restricted to Zumbarl GitOps deployment commands." >&2
    exit 64
    ;;
esac
