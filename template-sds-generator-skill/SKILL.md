---
name: template-sds-generator
description: Use this skill for deterministic, template-preserving SDS/MSDS generation from 1 layout template DOCX, 1 prompt/rule file, and 1-3 source SDS/MSDS evidence files, producing DOCX, PDF, JSON, provenance CSV, and review checklist outputs without inventing safety-critical data.
---

Use this skill when a user needs a traceable 16-section SDS package that must preserve a supplied Word template.

## Inputs

- 1 template file in `.docx`
- 1 prompt or rule file in `.txt` or `.md`
- 1-3 SDS/MSDS evidence files in `.pdf`, `.docx`, or `.txt`

## Workflow

1. Before production use, replace the placeholder company block in `config/fixed_company.yml` with the owning company's approved supplier information.
2. Run `bash scripts/run_openclaw_skill.sh --template-docx <template.docx> --prompt-file <rules.txt> --sources <source1> [<source2> <source3>] --outdir <target> --mode draft [--enable-ocr] [--issue-date YYYY-MM-DD] [--revision-date YYYY-MM-DD] [--version N]`.
3. Use `--enable-ocr` only for scanned PDFs. If no OCR backend is available, the run fails clearly.
4. If the runtime looks incomplete, run `bash scripts/runtime_doctor.sh` first.
5. Return the generated files from `outputs/runs/.../final` and inspect `outputs/runs/.../audit` when provenance or review details matter.

## Release guardrails

- Preserve the supplied template layout. Do not clear the document body when the user provides a client template.
- Do not invent safety-critical values such as GHS classifications, UN numbers, packing groups, flash points, LD50 values, or regulatory identifiers.
- Treat `structured_data.json`, `field_source_map.csv`, and `review_checklist.md` as first-class deliverables alongside the DOCX/PDF.
