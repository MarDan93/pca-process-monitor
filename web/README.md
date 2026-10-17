# Mould Studio workspace

**Product direction: the current application is to be used online in a browser, with server storage and no end-user installation.** The [managed hosted configuration](../docs/deployment/MANAGED_WEB.md) contains the full frontend/backend, private owner sign-in and persistent disk. Hosting is pending owner account activation; no public service URL is claimed. The local commands below remain developer verification tools.

This is the runnable **local development increment I01a / part of I01b**, replacing neither the original PCA library nor the earlier `prototype/` demo. It implements an original CAD-style workspace inspired by common engineering conventions: ribbon/tool icons, ten-module left rail, contextual properties, a persistent central Three.js scene and a right AI copilot. No proprietary competitor assets are included.

## Developer setup from the repository

Requirements: Python 3.12+, Node.js 22.12+ (Node 24 recommended) and npm. Use the existing checkout; no worktree is needed.

From the repository root:

```sh
python scripts/run_workspace.py --setup
```

This installs the isolated, hash-locked `.venv-app`, installs both npm lockfiles without lifecycle scripts, builds the workspace and starts the local server. Stop with Ctrl+C. On subsequent starts:

```sh
python scripts/run_workspace.py --open
```

`--open` opens your computer's browser after a successful health request. Omit it in cloud automation. `--port 8124` selects an alternative port. The launcher always binds to loopback. This cloud onboarding interface cannot expose a live browser preview; screenshots and a prebuilt local review package are supplied separately. No hosted service has been published.

Projects and original mesh bytes are stored in `.cache/workspace/projects.sqlite3` (with SQLite WAL sidecars while running). Back up the database with SQLite's backup API; do not assume copying a live database alone is a verified backup. Set `MOULD_WORKSPACE_DB` to use a different local database. No legacy browser project is silently migrated.

## Try the implemented flow

1. **New project:** choose any name. All commercial values and geometry start unknown.
2. **Customer brief:** enter customer, market, commercial unit, demand, lots, programme duration and optional prices/budget/currency. Preview, inspect before/after values, then approve. Undo appends a new revision and remains available after reopening when no intervening edit exists.
3. **Product:** import an OBJ/STL up to 12 MiB with explicit source units (`mm`, `cm`, `m`, `in`), or load the optional original synthetic flange. The flange is a visual test fixture, not a validated mouldable design. Original file bytes/units/hash survive server restart; display bounds do not imply solid volume.
4. Rotate/zoom/select components; use isometric/top/side/fit, wireframe, transparency and grid. Switch modules without losing the scene, camera, selection or copilot draft. Panels collapse and resize on desktop (drag or arrow keys on separators); smaller screens use toggleable panels.
5. Load the AI model explicitly. Choose **Propose changes**, then try `Set annual demand to 80000 and market to Appliances.` Inspect the server preview and approve. Conversation mode cannot modify data. Revisions record request, pinned model identity and operation ID.

The app defaults to English, with Italian, French and Spanish available. Repository/source documentation remains English. User content is not translated. Technical server/model error details may be in English.

## AI runtime and limits

The existing Transformers.js worker runs pinned Qwen2.5-0.5B-Instruct ONNX q4 in the browser. No paid API key is required; hardware, downloads and any future hosting still have costs. First model load is approximately 800 MB and inference is opt-in. The current cloud CPU browser takes roughly 34 seconds for the tested short commercial proposal, not an interactive engineering solver guarantee. Small-model accuracy and all-language domain quality remain unvalidated. Every proposal is untrusted input and needs review.

The commercial execution adapter rejects unsupported product/geometry fields. The existing model contract proposes monetary values in EUR; other currencies can be edited through properties. No automatic conversion occurs. Model inference does not directly call endpoints or execute generated code.

If exact pinned same-origin assets were prepared using `prototype`'s `prepare:ai-assets`, the server exposes those assets and the app configures the worker automatically. Otherwise the browser uses upstream HTTPS hosts. Keep TLS verification enabled. Model weights are excluded from source, review ZIPs and browser bundles. See [runtime provenance and limitations](../prototype/OPEN_SOURCE.md); upstream/conversion redistribution review remains separate.

## Checks

From the repository root:

```sh
PYTHONPATH=server .venv-app/bin/python -m unittest discover -s server/tests -v
cd web
npm run build
npm run test:browser
npm run test:browser -- --ai-real
```

The real-AI check requires the verified same-origin model/runtime cache, Chromium and sufficient memory. Browser tests own an isolated temporary database/profile and stop their own processes. The core check does not load a model. Screenshots and optional inference results are written under `.cache/ux/workspace/`. Existing `prototype` tests remain separate regressions. For frontend development, first build the worker, start the API on port 8123, then run `npm run dev` in `web`; the Vite proxy forwards API/model routes to that local service.

## Deliberate boundaries

The other eight module entries describe their planned engines. There is no enabled mould generator, STEP/B-rep kernel, photo reconstruction, robot motion solver, cooling/flow solver, L0 cycle engine or cost calculation in this increment. The bottom drawer shows actual revision history; playback is disabled because no run exists. The optional flange and mesh views are actual 3D geometry, not simulation results.

The backend uses a server-supplied local development principal, loopback peer/host checks, same-origin mutation rules, a session write token, strict schemas, bounded request/asset parsing and SQLite transactions. In local developer mode these controls are **not production authentication**; the separate hosted mode adds a real single-owner session boundary as recorded in the deployment guide. It is not a completed multi-user identity platform. Do not proxy or bind this build to the public network or store private industrial data in a shared local deployment. Identity/ACL, encrypted hosting, recovery/quotas, dependency/security review and explicit publication approval precede an online pilot. See [the increment evidence](../docs/verification/WORKSPACE_2026-10-17.md) and [roadmap](../docs/product/ROADMAP.md).
