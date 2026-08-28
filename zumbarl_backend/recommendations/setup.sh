#!/usr/bin/env sh
set -eu

if [ ! -x ".venv-recommendations/bin/python" ]; then
  python3 -m venv .venv-recommendations
fi

recommendation_python=".venv-recommendations/bin/python"

# LightFM 1.17 predates mandatory PEP 517 builds. pip 25.3+ attempts an
# isolated build that fails in LightFM's setup.py, so use the last supported
# legacy-build toolchain until LightFM publishes a corrected release.
"$recommendation_python" -m pip install "pip==24.3.1" "setuptools==70.3.0" "wheel==0.44.0"
"$recommendation_python" -m pip install --no-use-pep517 -r recommendations/requirements.txt
