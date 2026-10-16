# Implementation status

Updated 2026-10-16. **P0 is documented; P1 is incomplete. A browser-AI integration is implemented as a demo experiment; browser inference is verified with self-hosted assets.** Current work is on the development branch `demo/progettazione-stampi-2026-10-15`, not on `main`. This file is the status reference; the [roadmap](ROADMAP.md) describes target deliveries.

| Area | Available | Still required |
| --- | --- | --- |
| Customer brief | Local forms, market/commercial-unit fields, AI chat/proposal wiring, export, press catalogue | Generic empty projects, complete commercial home and server persistence |
| Product | Example shell, OBJ/STL viewer with units/bounds, photo references | Generic model, STEP solids, extensible features and assisted reconstruction |
| Mould | Example requirements only | Cavities, geometry, ejection, cooling and alternatives |
| Cell | Candidate press records | Press/mould/Cartesian robot/end-effector/conveyor/auxiliary layout and kinematics |
| Process | No complete time-based engine | Events, material flow, parameters, animation and L0/L1/L2 models |
| Data/ML | Original Python PCA library and notebook | Verification/correction, PLS and application integration |
| Distribution | Local HTML demo and development sources | Hosted application, persistence and project access |
| AI | Transformers.js + Qwen browser-worker integration, review/apply, typed fields, provenance and stale-request checks | Broader model evaluation, server orchestration and module tools |
| Languages | English source/documentation; demo EN/IT/FR/ES with English default | Reuse this policy in the P1 application |

The original PCA Q-limit normalisation issue found during onboarding must be reproduced and corrected before production recommendations.

## Current increment: browser AI and CAD-style demo

This contributes an experimental client-side slice of P1/B04. It verifies browser inference for one commercial update, but does not pass B04 as a whole or complete P1: B01 generic projects, B02 server data and B03 commercial application remain outstanding. Existing shell defaults are demo limitations, not the platform specification.

The AI is an actual model pipeline, not the deterministic Commands parser. No hosted inference key is needed. Loading is explicit, and failed loading is shown honestly. Structured changes require review/apply, current project revision and valid geometry. Accepted values retain model provenance. Chat is session-only.

FreeCAD 1.1.4 was researched as an open-source UI reference. The new light workbench includes an explorer, contextual properties, standard views, real wireframe/grid/fit controls and Lucide SVG icons. FreeCAD code/kernel/assets are not embedded. Supported geometry is unchanged.

Verification: 28 unit checks pass, covering geometry/import/localisation plus strict AI proposals, atomic application, provenance, stale revisions and worker state handling. Worker unit checks use a test double and do not demonstrate model inference. Core Chromium development and standalone checks cover four languages, user/pending input, actual WebGL and files; packaged core interactions run with networking disconnected. The real self-hosted-assets check passes actual Chromium WASM inference, review/apply and persistence. The remote-host route is blocked by the cloud Chromium certificate store; this is distinct from the successful same-origin test. See [precise evidence and access requirements](../../prototype/OPEN_SOURCE.md).

The ZIP and preview are refreshed on the development branch; main is unchanged. Delivery links and remote archive bytes are checked when publishing the increment. This is not a hosted platform release.

The legacy schema and example are documented in [archive/DEMO_02_SPECIFICATION.md](archive/DEMO_02_SPECIFICATION.md) and [REFERENCE_CASE.md](REFERENCE_CASE.md). Neither defines mandatory fields for new platform projects.

## Next implementation

P1/B01–B04: generic project data → API/server storage → commercial chat UI → evaluated open-source AI tools, reusing the browser experiment where appropriate. The completion evidence is A01–A05 and A14 from [BACKLOG.md](BACKLOG.md). Hosting decisions follow a concrete runnable deployment.
