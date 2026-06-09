#!/bin/sh
set -eu

CONFIG_DIR="/usr/share/nginx/html/assets/config"
CONFIG_FILE="${CONFIG_DIR}/app-config.js"
API_BASE_URL="${API_BASE_URL:-}"

mkdir -p "${CONFIG_DIR}"

ESCAPED_API_BASE_URL="$(printf '%s' "${API_BASE_URL}" | sed 's/\\/\\\\/g; s/"/\\"/g')"

cat > "${CONFIG_FILE}" <<EOF
window.__HUSARIA_CONFIG__ = {
  apiBaseUrl: "${ESCAPED_API_BASE_URL}"
};
EOF
