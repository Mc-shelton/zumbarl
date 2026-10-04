#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
FRONTEND_DIR=$(dirname -- "$SCRIPT_DIR")
REPOSITORY_DIR=$(dirname -- "$FRONTEND_DIR")
BACKEND_DIR="$REPOSITORY_DIR/zumbarl_backend"
COMPOSE_FILE="$BACKEND_DIR/docker-compose.test.yml"

cleanup() {
  docker compose -f "$COMPOSE_FILE" down --volumes --remove-orphans
}

trap cleanup EXIT INT TERM

docker compose -f "$COMPOSE_FILE" up -d --wait

export NODE_ENV=development
export NODE_TLS_REJECT_UNAUTHORIZED=1
export DATABASE_URL='postgresql://zumbarl:zumbarl@127.0.0.1:55433/zumbarl_test?schema=public'
export REDIS_URL='redis://127.0.0.1:56380'

npm --prefix "$BACKEND_DIR" run db:migrate:deploy
npm --prefix "$BACKEND_DIR" run demo:seed

cd "$FRONTEND_DIR"
npx playwright test e2e/core-demo.spec.js "$@"
