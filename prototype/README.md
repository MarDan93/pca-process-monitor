# Mould Studio — AI and geometry demo

An executable browser-AI integration and CAD-style workbench extend the existing local demo. This is a partial P1/B04 experiment, not the complete online platform. See [actual status](../docs/product/IMPLEMENTATION_STATUS.md) and [components, licences and AI limitations](OPEN_SOURCE.md).

## Try it

Use the [delivery page](../demo/README.md), extract the ZIP and open `Mould-Studio.html` in a recent browser. WebGL2 is required for 3D. The interface defaults to English and offers Italian, French and Spanish; preferences are separate from project data.

Select **AI → Load AI model**. First use needs internet and downloads about 800 MB. After **Ready**, choose **Conversation** to discuss requirements, or **Propose changes** to request field updates. A tested update is: `Set annual_volume to 80000 and market to Appliances. Reply briefly in English.` Review the response and select **Apply AI proposal** if correct. Inspect customer fields or export JSON to see accepted values and model provenance. A small model may return an unstructured answer; no fields change in that case. Ask a shorter, specific request.

Real inference uses Qwen2.5-0.5B-Instruct/q4 through Transformers.js 3.7.2 and ONNX Runtime Web in a worker. No API key, paid inference or account is needed. No prompts are sent to an inference server by this code. Actual browser WASM inference and proposal application have passed with self-hosted model/runtime assets. The remote-download test is blocked by Chromium’s cloud proxy certificate trust, despite successful system-trusted file downloads. See [the exact blocker and test](OPEN_SOURCE.md#verification-and-environment-access).

The CAD workbench follows FreeCAD conventions and uses actual Lucide SVG icons. Tree, properties, standard views, fit, wireframe, grid, explosion and transparency are available. It does not embed FreeCAD or implement arbitrary CAD generation. The reference shells are example geometry, not a generic-product restriction of the target platform.

Geometry/forms/commands work without network in the packaged HTML. AI needs its remote runtime and model files; do not assume first-use or cached AI works offline. Chat is session-only. Language switching preserves pending messages, values and validation state.

## Development and checks

From `prototype`, with Node 22+, npm, Python and Chromium:

```bash
npm ci --ignore-scripts
npm start
```

Native ONNX/sharp dependency install scripts are unnecessary for this browser target. Lockfile integrity and TLS verification remain enabled. Python serves port 4173 for local development; the cloud onboarding UI does not expose loopback previews.

```bash
npm test
npm run test:browser
npm run build:standalone
npm run test:standalone
npm run test:ai-real        # remote-host route; cloud Chromium certificate limitation
npm run test:ai-model       # real model via native CPU; Node 24+
npm run prepare:ai-assets
npm run test:ai-local       # real browser WASM with self-hosted files
npm run package:demo
```

Core browser tests use an isolated Chromium profile (`CHROMIUM_BINARY` may override the binary). The standalone test serves the single HTML internally, disconnects networking for interactions and verifies no external requests. Direct `file://` navigation is blocked by cloud browser policy and is not directly tested here. Real-model tests are separate: the same-origin browser path passes inference; the remote-host path is blocked by the managed Chromium certificate store. See OPEN_SOURCE.md for evidence and static-host setup. Artefacts are under `.cache/ux`.

## Scope and storage

- Local commercial/technical forms, press catalogue, wall candidates, JSON export and browser persistence.
- Real browser model integration with typed proposals, review/apply, provenance, stale-revision rejection and atomic geometry checks. No simulated AI replies.
- Reference shell geometry/volume and OBJ export in millimetres; final wall selection stays separate from preview variants.
- Offline **Commands** parser in EN/IT/FR/ES with preview/apply/undo; it is not AI.
- OBJ/STL meshes with explicit units/bounds (12 MB/100,000 triangles); JPG/PNG/WebP references (8 MB/25 MP). Files remain in session memory; JSON contains metadata, not files. Bounds are adopted only on request. Mesh solidity/material/volume are not inferred.
- No backend/server persistence, STEP kernel, automatic photo reconstruction, generic CAD generator, mould/cell model, process engine, cost calculation or application PCA/PLS integration.

Storage uses `injection-moulding-brief-v1`, schema v4, with an example backup. Additive market/commercial-unit fields preserve old data. Unreadable storage is preserved; unavailable storage falls back to memory with export guidance. JSON import is not implemented. User content is excluded from interface translation.

Unit and browser checks verify software behaviour, not manufacturing accuracy or completion of a platform acceptance milestone.
