#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

have_runtime() {
  local python_bin="$1"
  "$python_bin" - <<'PY' >/dev/null 2>&1
import fitz
import jsonschema
import lxml
import pdfplumber
import PIL
import pydantic
import rapidfuzz
import yaml
from docx import Document
PY
}

resolve_runtime() {
  if [ -x .venv/bin/python ] && have_runtime .venv/bin/python; then
    printf '%s\n' ".venv/bin/python"
    return 0
  fi

  if command -v python3 >/dev/null 2>&1 && have_runtime python3; then
    printf '%s\n' "python3"
    return 0
  fi

  return 1
}

runtime=""
if ! runtime="$(resolve_runtime)"; then
  if ! bash scripts/bootstrap.sh; then
    echo "Unable to provision a usable Python runtime for sds-generator. Run bash scripts/runtime_doctor.sh for detailed checks." >&2
    exit 1
  fi
  runtime="$(resolve_runtime || true)"
fi

if [ -z "$runtime" ]; then
  echo "No usable Python runtime found for sds-generator. Run bash scripts/runtime_doctor.sh for detailed checks." >&2
  exit 1
fi

if [ ! -f assets/templates/sds_base.docx ]; then
  "$runtime" scripts/build_base_template.py
fi

exec "$runtime" scripts/generate_sds.py "$@"
