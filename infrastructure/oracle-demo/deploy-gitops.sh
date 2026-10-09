#!/usr/bin/env bash
set -Eeuo pipefail

release_sha="${1:?release SHA is required}"
image_prefix="${2:?container image prefix is required}"
deployment_dir="${DEPLOYMENT_DIR:-/opt/zumbarl/infrastructure/oracle-demo}"
compose_file="$deployment_dir/compose.bootstrap.yml"
runtime_env="$deployment_dir/.env.bootstrap"
release_env="$deployment_dir/.env.release"
previous_release_env="$deployment_dir/.env.release.previous"

if [[ ! "$release_sha" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Release SHA must be a full Git commit SHA." >&2
  exit 2
fi

if [[ ! -s "$runtime_env" ]]; then
  echo "Missing production runtime environment: $runtime_env" >&2
  exit 2
fi

cd "$deployment_dir"

if [[ -s "$release_env" ]]; then
  cp "$release_env" "$previous_release_env"
fi

umask 077
{
  printf 'RELEASE_SHA=%s\n' "$release_sha"
  printf 'BACKEND_IMAGE=%s-backend:%s\n' "$image_prefix" "$release_sha"
  printf 'MIGRATION_IMAGE=%s-migration:%s\n' "$image_prefix" "$release_sha"
  printf 'FRONTEND_IMAGE=%s-frontend:%s\n' "$image_prefix" "$release_sha"
} > "$release_env"

compose() {
  docker compose \
    --env-file "$runtime_env" \
    --env-file "$release_env" \
    -f "$compose_file" \
    "$@"
}

rollback() {
  local exit_code=$?
  if [[ -s "$previous_release_env" ]]; then
    echo "Deployment failed; restoring the previous application images." >&2
    cp "$previous_release_env" "$release_env"
    compose up -d --no-build backend worker frontend edge || true
  else
    echo "Deployment failed and no prior GitOps release metadata exists." >&2
  fi
  exit "$exit_code"
}
trap rollback ERR

compose --profile release pull migrate backend worker frontend
compose --profile release run --rm migrate
compose up -d --no-build --remove-orphans backend worker frontend edge

for attempt in $(seq 1 24); do
  backend_status="$(compose ps --format json backend 2>/dev/null || true)"
  frontend_status="$(compose ps --format json frontend 2>/dev/null || true)"
  if [[ "$backend_status" == *'"Health":"healthy"'* && "$frontend_status" == *'"Health":"healthy"'* ]]; then
    trap - ERR
    compose ps
    echo "Release $release_sha is healthy."
    exit 0
  fi
  sleep 5
done

echo "Application containers did not become healthy within 120 seconds." >&2
compose ps >&2
compose logs --tail=100 backend worker frontend >&2
false
