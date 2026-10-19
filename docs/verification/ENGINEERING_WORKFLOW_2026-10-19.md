# Connected engineering increment — 19 October 2026

Scope: reusable data, a preliminary product/plate-envelope/press link, synchronized L0 traces, and grounded server-assistant workflow. This is not completion of V1 or a validated mould/physics solver.

## Executed checks

| Check | Result |
| --- | --- |
| `PYTHONPATH=server .venv-app/bin/python -m unittest discover -s server/tests -q` | **28 passed**: 24 existing plus four engineering/library/grounding regressions |
| `npm --prefix prototype test` | **28 passed** |
| `npm --prefix web run build` | Passed TypeScript and production build; existing large-chunk warning remains (~1.02 MB main JS, ~289 kB gzip) |
| `npm --prefix web run test:browser -- --server-ai --engineering` | Passed with actual Chromium/WebGL/API replacement, real compact CPU inference and zero uncaught runtime exceptions |
| `.venv-app/bin/python scripts/evaluate_workspace_ai.py` | Three real compact-model cases passed: reported Italian press-comparison request, contextual follow-up and explicit process extraction; ~8.6, 12.4 and 8.0 s in this development environment |
| `MOULD_AI_PROFILE=advisor .venv-app/bin/python scripts/evaluate_workspace_ai.py` | **FAILED stricter first-request routing assertion**. Earlier execution/containment-only probes completed (~25.0/34.2/19.0 s); the 1.5B model produced unsupported action/value objects and inferred total demand. Validator rejected them. Not promoted; default remains compact |
| `.venv-app/bin/python scripts/test_codespaces.py` | Passed actual launcher in synthetic Codespaces variables: rewritten-origin owner login/CSRF, actual CPU inference, approved process update/rerun, safe restart, session/result persistence and logout |

Browser assertions cover: original project/mesh/commercial persistence; unchanged camera/canvas/selection through ten modules; four languages and mobile overflow; manual machine entry with exact hourly cost; CSV validation without mutation then import; mesh-bound approved layout and copied library records; linked run with current asset ID; time-series robot X at 450 mm matching mid-transfer and chart/3D cursor equality; unavailable pressure has no numerical trace. Source snapshots, approval/undo and subsequent edits stay explicit.

Independent backend fixtures check: `4000 mm² × 40 MPa × 2 × 1.2 / 1000 = 384 kN`; `44 g × 1000 / 800 kg/m³ = 55 cm³`; required rectangular envelope sizes; fail/incomplete states; mismatched cavities; same bytes re-imported with different declared units invalidate the layout; prior immutable run remains intact; foreign owner isolation; atomic invalid/NaN/unknown-unit CSV rejection; exact decimal costs; reported invented names/prices and ambiguous annual-volume proposals rejected.

## Investigated failures

The original assistant showed hallucinated unrelated names and amounts. It also received only the most recent message. The server now sends bounded history, accepts only an action vocabulary for Conversation, renders checked localized workflow advice, labels fallback routing, and validates explicit update evidence before typed preview. The first integration check also exposed fenced JSON action arrays rather than the requested object wrapper. Both representations now pass the same closed action-vocabulary validation; arbitrary prose/unknown actions still trigger labelled guided templates. The regression demonstrates containment and actionable missing-data questions, **not** accurate general engineering reasoning.

During new browser development, an integer cavity input had an invalid HTML step/min alignment, preventing form submission. Corrected to an integer minimum and reran the complete workflow successfully. A CDP harness attempted to serialize a DOM reference; fixed the harness to avoid returning the element. No production assertions were removed to pass these tests.

## Evidence and external limits

Local screenshots: `.cache/ux/workspace/engineering-layout.png`, `engineering-linked-process.png`; model cases: `.cache/ai/evaluation-compact.json`; launcher record: `.cache/verification/codespaces-process.json`. These generated paths are not committed or exposed as hosted URLs. Representative screenshots are copied under `docs/design/` for review.

The owner is using an actual external Codespace; this agent cannot access/manage that instance. Source publication and local/synthetic-launcher tests do not establish that the owner has pulled/rebuilt/restarted this revision. Existing credentials/database must be preserved; no credentials, databases, caches, weight files or native dependency bundles are published.

All attempted official machine/material source accesses were blocked (HTTP proxy tunnel 403), so independently verified OEM numerical coverage remains zero. Source links/status and manual/CSV facilities are implemented; a complete catalogue across manufacturers/tonnages is outstanding. Draft domain additions do not establish runtime access.

No scientific validation of thermal/filling/plasticisation/drying/cooling models, geometric collision/reach solver, finished mould creation, full cost model, STEP/photo reconstruction or integrated corrected PCA/PLS has been performed. Those engines remain unimplemented. Full physics signals are visibly unavailable rather than interpolated from recipes. Existing dependency/licensing/security findings remain open; no security or production-readiness certification is implied.

Optional 1.5B preparation verified revision `d54957e3af1be04546436e874a60fe386041b244`, 1,787,566,590-byte weight and SHA-256 `70c24509f760fed9a8f50391165c46a87660197028a42c4547763f1c173ddea6`. Peak child RSS in this evaluation: 5506980 KiB. Upstream Qwen metadata declares Apache-2.0; the conversion README identifies that base model but does not add licence metadata. Weights are downloaded separately and not redistributed in Git. Broader accuracy/rights/dependency review remains open.

Latest compact evaluation: the first request used validated AI action routing; the contextual follow-up used labelled guided fallback; explicit process extraction passed. The stricter optional 1.5B routing failure is a model/integration capability finding, not an environment installation failure. Raw diagnostic `.cache/ai/raw-advisor-route.json` confirms unrequested `value` fields; they were rejected rather than coerced into project facts. The default browser/launcher/compact workflow and 28 backend contracts pass.
