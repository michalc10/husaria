#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env.server}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_PATH="${REPO_ROOT}/${ENV_FILE}"

if [ ! -f "${ENV_PATH}" ]; then
  if [ -f "${REPO_ROOT}/.env.server.example" ]; then
    cp "${REPO_ROOT}/.env.server.example" "${ENV_PATH}"
  fi

  echo "Uzupelnij sekrety w ${ENV_PATH} i uruchom skrypt ponownie." >&2
  exit 1
fi

if ! docker version >/dev/null 2>&1; then
  echo "Docker nie dziala albo nie jest zainstalowany." >&2
  exit 1
fi

cd "${REPO_ROOT}"
docker compose --env-file "${ENV_PATH}" up -d --build
docker compose --env-file "${ENV_PATH}" ps
