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

print_status() {
  local label="$1"
  local status="$2"
  local detail="${3:-}"
  printf '%-18s %s' "$label" "$status"
  if [ -n "$detail" ]; then
    printf '  %s' "$detail"
  fi
  printf '\n'
}

report_python_runtime() {
  local label="$1"
  local python_bin="$2"

  if [ ! -x "$python_bin" ] && ! command -v "$python_bin" >/dev/null 2>&1; then
    print_status "$label" "missing"
    return
  fi

  local version
  version="$("$python_bin" --version 2>/dev/null || true)"
  if have_runtime "$python_bin"; then
    print_status "$label" "ok" "$version"
  else
    print_status "$label" "incomplete" "$version"
  fi

  if "$python_bin" -m pip --version >/dev/null 2>&1; then
    print_status "${label} pip" "ok" "$("$python_bin" -m pip --version 2>/dev/null | head -n 1)"
  else
    print_status "${label} pip" "missing"
  fi
}

report_binary() {
  local label="$1"
  local binary="$2"
  local version_args="${3:---version}"
  if ! command -v "$binary" >/dev/null 2>&1; then
    print_status "$label" "missing"
    return
  fi
  local path version
  path="$(command -v "$binary")"
  version="$("$binary" $version_args 2>/dev/null | head -n 1 || true)"
  print_status "$label" "ok" "$path ${version:+($version)}"
}

echo "sds-generator runtime doctor"
echo
report_python_runtime "system python3" "python3"
report_python_runtime "project .venv" ".venv/bin/python"
echo
report_binary "OCR backend" "tesseract"
report_binary "PDF engine" "soffice"
if ! command -v soffice >/dev/null 2>&1; then
  report_binary "PDF engine alt" "libreoffice"
fi
echo
echo "Notes:"
echo "- OCR is optional. If you pass --enable-ocr, tesseract must be available."
echo "- PDF delivery requires soffice or libreoffice on PATH."
echo "- Debian/Ubuntu runtime packages: python3-venv python3-pip tesseract-ocr tesseract-ocr-eng tesseract-ocr-osd libreoffice-core libreoffice-writer"
