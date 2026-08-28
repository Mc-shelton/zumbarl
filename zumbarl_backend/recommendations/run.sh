#!/usr/bin/env sh
set -eu

if [ -x ".venv-recommendations/bin/python" ]; then
  exec .venv-recommendations/bin/python recommendations/train.py "$@"
fi

exec python3 recommendations/train.py "$@"
