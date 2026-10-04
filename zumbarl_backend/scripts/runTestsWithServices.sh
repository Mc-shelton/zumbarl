#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
BACKEND_DIR=$(dirname -- "$SCRIPT_DIR")
COMPOSE_FILE="$BACKEND_DIR/docker-compose.test.yml"

cleanup() {
  docker compose -f "$COMPOSE_FILE" down --volumes --remove-orphans
}

trap cleanup EXIT INT TERM

docker compose -f "$COMPOSE_FILE" up -d --wait

export DATABASE_URL='postgresql://zumbarl:zumbarl@127.0.0.1:55433/zumbarl_test?schema=public'
export REDIS_URL='redis://127.0.0.1:56380'

cd "$BACKEND_DIR"
npm run db:migrate:deploy
npm test
