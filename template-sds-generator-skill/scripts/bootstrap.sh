#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

suggest_python_runtime_packages() {
  cat >&2 <<'EOF'
Unable to provision pip inside .venv.
Install a Python runtime with venv/pip support first.

Debian/Ubuntu example:
  apt-get install -y python3-venv python3-pip

Then rerun:
  bash scripts/run_openclaw_skill.sh ...
EOF
}

require_python_runtime_support() {
  if ! command -v python3 >/dev/null 2>&1; then
    suggest_python_runtime_packages
    exit 1
  fi

  if ! python3 -m venv --help >/dev/null 2>&1; then
    suggest_python_runtime_packages
    exit 1
  fi
}

create_or_repair_venv() {
  if [ -x .venv/bin/python ] && [ -f .venv/bin/activate ]; then
    return 0
  fi

  if ! python3 -m venv .venv --clear >/dev/null 2>&1; then
    suggest_python_runtime_packages
    exit 1
  fi
}

require_python_runtime_support
create_or_repair_venv

if [ ! -x .venv/bin/python ] || [ ! -f .venv/bin/activate ]; then
  suggest_python_runtime_packages
  exit 1
fi

if ! .venv/bin/python -m pip --version >/dev/null 2>&1; then
  .venv/bin/python -m ensurepip --upgrade >/dev/null 2>&1 || true
fi

if ! .venv/bin/python -m pip --version >/dev/null 2>&1; then
  suggest_python_runtime_packages
  exit 1
fi

.venv/bin/python -m pip install --upgrade pip

if ! .venv/bin/python - <<'PY' >/dev/null 2>&1
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
then
  .venv/bin/python -m pip install -r requirements.lock
fi

if [ ! -f assets/templates/sds_base.docx ]; then
  .venv/bin/python scripts/build_base_template.py
fi
