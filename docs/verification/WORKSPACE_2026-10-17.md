# Runnable local workspace — 17 October 2026

Subsequent to AUD-2026-10-17, the user requested generation of the application with a professional CAD-style ribbon/icons, the accepted vertical module rail and AI chat on the right. This implements **I01a and a bounded part of I01b** from that plan. Baseline Git HEAD remains `0fe5efe3e626edf7c93138efa83be821bfcea8a0`; source/docs are uncommitted local changes on the existing development branch. No push, merge, public deployment, release publication or licence change was performed.

## Observable result

- An original dark React/TypeScript workspace with ten-module left rail, ribbon/view icons, persistent Three.js scene, contextual commercial/product properties, right copilot and a revision drawer. Panels collapse and resize on desktop; small screens use overlays. No competitor artwork is embedded.
- Generic server projects start with no shell/material/PCB/quantity/price defaults. Two independent synthetic flange/bracket projects are exercised with different source units and commercial units/currencies.
- A strict FastAPI/SQLite boundary provides durable commercial values, integer revisions, exact Decimal quote strings, source/request/model provenance, exact-effect digests, expiring one-use approvals, idempotent execution and compensating undo. Manual properties and AI changes use the same operation. Undo remains available after reopen when no intervening edit exists.
- Supported OBJ/STL imports retain original bytes/units/hash. Existing Three.js parsing runs in a terminable worker (8 seconds, 12 MiB input, 100,000 triangles); source bounds and display offset are recoverable from the original. Imported mesh bounds do not imply solid volume. The optional original flange is clearly synthetic.
- The existing pinned browser Qwen worker proposes an actual commercial update, the server validates/previews it, the user approves, and the new revision persists. Conversation mode does not mutate. Unsupported AI product/geometry changes are rejected, not silently executed.
- English is the default; IT/FR/ES are selectable. User data is unchanged on language switches. Raw technical error details may remain English.

Actual application capture: [desktop](../design/WORKSPACE_0_2_0.png). This is a running application, separate from the earlier schematic design board.

## Executed checks

| Check | Result |
| --- | --- |
| Python environment install and `pip check` | Passed; isolated `.venv-app`, 17 exact packages; official artifact hashes locked |
| `PYTHONPATH=server .venv-app/bin/python -m unittest discover -s server/tests -v` | **12 passed** |
| `web: npm run build` | TypeScript and production build passed |
| `web: npm run test:browser -- --ai-real` | Passed on the final code: all core checks plus actual model generation, server approval and non-mutating conversation |
| Browser persistence | Two independent projects, exact original bytes/source units and commercial values survive actual API process restart and page reload |
| Viewer ownership | Same WebGL canvas, camera and selection across all ten modules; unsent copilot draft retained |
| UI | Four languages, resize/collapse controls, component selection, actual mesh rendering and mobile no-overflow checks passed; zero uncaught browser exceptions |
| Existing prototype `npm test` | **28 passed** after shared module changes |
| Existing prototype `npm run test:browser` | Passed: source-language/import/viewer/legacy behaviour and mobile workflows |
| New `web` full `npm audit` | Zero advisories; legacy/native graph findings remain open |
| One-command source setup/start | `python scripts/run_workspace.py --setup --port 8124` passed; health, HTML, actual worker and runtime notices return HTTP 200 |
| Prebuilt local ZIP | All per-file hashes verified; fresh hash-verified Python install and create/preview/approve/execute/reopen passed from the extracted package, without Node.js |
| Reusable cloud configuration | `install_script` and `start_skill` saved in the existing environment draft; existing network/credential/repository fields preserved. Saving is not application or publication |

The actual final pinned Qwen2.5-0.5B ONNX q4 generation took **32,659 ms** in the cloud CPU/WASM browser for `Set annual demand to 80000 and market to Appliances.` Before approval the project is unchanged; afterward only those commercial fields change, with exact model revision recorded. A subsequent polymer-information question creates no proposal and changes no stored value. [Machine-readable inference evidence](WORKSPACE_AI_2026-10-17.json) contains the synthetic answer and measured time. This is one bounded software/inference check, not domain/language accuracy validation.

The API tests cover null versus zero, integer/decimal/currency validation, unsupported/unknown fields, exact-effect/token binding, expiry/stale revisions, replay/idempotency, owner/project/origin/Host/write-token boundaries, request limits, original asset persistence, concurrent writers, injected storage failure/rollback/retry and undo/history preservation. Synthetic identifiers/data only are used.

Known non-failing diagnostics: Vite reports a roughly 928 kB main bundle (about 262 kB gzip, including the shared 3D runtime and locale catalogues); this is not yet a performance budget. The separate AI worker is approximately 859 kB and the optional weights are approximately 786 MB. Starlette reports deprecation of its httpx test adapter. No TLS checks or package integrity were disabled.

## Reproduce and review

Use [the source launcher and guide](../../web/README.md) or generate the prebuilt **local review** ZIP using `python scripts/package_workspace.py`. The ZIP has its own SHA-256 and per-file manifest, includes browser licence texts, and excludes virtual environments, private projects, model weights and node_modules. It needs Python 3.12+ and Internet for separately installed, hash-locked Python dependencies; the prebuilt package needs no Node.js. Start with `python scripts/run_workspace.py --setup --open` on your computer. Source checks used Linux; Windows/macOS launcher paths are provided but have not been executed on those operating systems.

## Remaining gates

I01b is not universally complete: legacy-v4 project migration, new-workspace photo/reference flow, richer geometric/frame/technical requirement tools and wider model evaluation remain. The first online pilot additionally requires production identity/ACL/isolation, verified recovery/quotas and release-specific security/licence review. Local principal/loopback/write-token controls are not production authentication; no public URL was created.

I02 mould layout/envelope/declared press checks is next. I03 L0 event/resource/material flow/robot poses and I04 shared-clock playback/capacity/cost accounting remain unimplemented. STEP/B-rep, general image-to-CAD, cooling/flow/warpage physics, L1/L2 and application PCA/PLS are unavailable. The original PCA correctness findings and blocked public-data admission remain open. Unimplemented module panels say so; no enabled play button or fabricated plot/physics field implies a solver ran.
